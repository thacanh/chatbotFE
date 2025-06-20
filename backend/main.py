import os
from typing import List, Dict, Optional, Any
import re
from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import uvicorn
from functools import lru_cache
import time

# Import configurations
from config import (
    validate_env_vars, NEO4J_URI, NEO4J_USERNAME, NEO4J_PASSWORD,
    GEMINI_API_KEY, GEMINI_MODEL, GEMINI_EMBEDDING_MODEL, DEBUG, PORT
)

# Import necessary langchain components
from langchain_core.runnables import (
    RunnableBranch,
    RunnableLambda,
    RunnableParallel,
    RunnablePassthrough,
)
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.pydantic_v1 import BaseModel as LCBaseModel, Field
from typing import Tuple, List, Optional
from langchain_core.messages import AIMessage, HumanMessage
from langchain_core.output_parsers import StrOutputParser
from langchain_community.graphs import Neo4jGraph
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_experimental.graph_transformers import LLMGraphTransformer
from langchain_community.vectorstores import Neo4jVector
from langchain_google_genai import GoogleGenerativeAIEmbeddings
import logging
import sys

# Import document API router
from document_api import router as document_router

# Set up logging with UTF-8
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('app.log', encoding='utf-8')
    ]
)
logger = logging.getLogger(__name__)
logging.getLogger("neo4j.notifications").setLevel(logging.ERROR)

# FastAPI app
app = FastAPI(
    title="Legal Chatbot API",
    description="API for Vietnamese Labor Law Chatbot using LangChain and Neo4j",
    version="1.0.0",
    debug=DEBUG,
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include document API router
app.include_router(document_router, prefix="/api/documents", tags=["documents"])

# Connect to Neo4j
graph = None
vector_index = None
llm = None
chain = None

# Pydantic models for API
class Message(BaseModel):
    role: str
    content: str

class ChatHistory(BaseModel):
    messages: List[Message] = []

class ChatRequest(BaseModel):
    question: str
    chat_history: Optional[List[Tuple[str, str]]] = []

class ChatResponse(BaseModel):
    answer: str
    processing_time: float = 0.0

class ErrorResponse(BaseModel):
    detail: str
    status_code: int

class HealthResponse(BaseModel):
    status: str
    components: Dict[str, bool]

# Define LangChain models - SIMPLIFIED
class QuestionAnalysis(LCBaseModel):
    """Phân tích câu hỏi đầu vào - KHÔNG tạo factual questions."""
    original_question: str = Field(..., description="Câu hỏi gốc từ người dùng")
    is_situational: bool = Field(..., description="Đây có phải là câu hỏi tình huống không?")
    key_legal_concepts: List[str] = Field(..., description="Các khái niệm pháp lý chính liên quan đến câu hỏi")

class Entities(LCBaseModel):
    """Thông tin nhận diện về các thực thể."""
    names: List[str] = Field(
        ...,
        description="Tất cả các thực thể là người, khái niệm thời gian, tổ chức, doanh nghiệp hoặc khái niệm pháp lý "
        "xuất hiện trong văn bản",
    )

def initialize_components():
    global graph, vector_index, llm, chain

    # Initialize Neo4j Graph
    graph = Neo4jGraph()

    # Initialize LLM
    llm = ChatGoogleGenerativeAI(
        model=GEMINI_MODEL,
        google_api_key=GEMINI_API_KEY,
        temperature=0.0,
        top_p=0.95,
        top_k=40
    )

    # Initialize graph transformer
    llm_transformer = LLMGraphTransformer(llm=llm)

    # Initialize embeddings
    embedding = GoogleGenerativeAIEmbeddings(
        model=GEMINI_EMBEDDING_MODEL,
        google_api_key=GEMINI_API_KEY
    )

    # Connect Neo4j Vector from existing graph
    vector_index = Neo4jVector.from_existing_graph(
        embedding=embedding,
        search_type="hybrid",
        node_label="Document",
        text_node_properties=["text"],
        embedding_node_property="embedding"
    )

    # Create fulltext index
    graph.query(
        "CREATE FULLTEXT INDEX entity IF NOT EXISTS FOR (e:__Entity__) ON EACH [e.id]")

    # Set up the chain
    setup_chain()

    logger.info("Components initialized successfully")

def setup_chain():
    global chain

    # SIMPLIFIED Question analysis prompt - NO factual questions
    question_analysis_prompt = ChatPromptTemplate.from_messages([
        (
            "system",
            """Bạn là một chuyên gia phân tích câu hỏi pháp luật lao động.
            Nhiệm vụ của bạn là phân tích câu hỏi của người dùng và xác định:
            1. Đây có phải là câu hỏi tình huống hay không
            2. Các khái niệm pháp lý chính trong câu hỏi

            Câu hỏi tình huống là câu hỏi mô tả một tình huống cụ thể và hỏi về hậu quả pháp lý hoặc quyền lợi.
            Ví dụ: "Nếu tôi bị buộc làm việc không lương, tôi có thể làm gì?"

            KHÔNG cần tạo các câu hỏi con hay factual questions.
            """
        ),
        ("human", "Phân tích câu hỏi sau: {question}")
    ])

    question_analyzer = question_analysis_prompt | llm.with_structured_output(QuestionAnalysis)

    # Entity prompt
    entity_prompt = ChatPromptTemplate.from_messages([
        (
            "system",
            """Bạn là một hệ thống trích xuất thực thể từ văn bản về luật lao động Việt Nam.
            Nhiệm vụ của bạn là nhận diện tên người, tổ chức, doanh nghiệp, khái niệm thời gian và các khái niệm pháp lý quan trọng.

            Đặc biệt chú ý đến các khái niệm quan trọng như:
            - Thời giờ làm việc, làm thêm giờ, nghỉ ngơi
            - Tiền lương, tiền thưởng, phụ cấp
            - Bảo hiểm xã hội, bảo hiểm y tế
            - Hợp đồng lao động, chấm dứt hợp đồng
            - Vi phạm pháp luật, xử phạt, bồi thường
            - Quyền và nghĩa vụ của người lao động và người sử dụng lao động
            """
        ),
        ("human", "Sử dụng định dạng cho trước để trích xuất thông tin từ đầu vào sau: {question}")
    ])

    entity_chain = entity_prompt | llm.with_structured_output(Entities)

    # Condense question prompt for handling chat history
    condense_question_prompt = ChatPromptTemplate.from_messages([
        (
            "system",
            """Dựa vào lịch sử trò chuyện và câu hỏi mới nhất, hãy tạo ra một câu hỏi độc lập 
            bao gồm tất cả thông tin cần thiết để trả lời.
            """
        ),
        ("human", "Lịch sử trò chuyện: {chat_history}\nCâu hỏi mới: {question}"),
    ])

    # Format chat history
    def _format_chat_history(chat_history: List[Tuple[str, str]]) -> List:
        buffer = []
        for human, ai in chat_history:
            buffer.append(HumanMessage(content=human))
            buffer.append(AIMessage(content=ai))
        return buffer

    # Process the next question based on history
    _search_query = RunnableBranch(
        (
            RunnableLambda(lambda x: bool(x.get("chat_history"))).with_config(
                run_name="HasChatHistoryCheck"
            ),
            RunnablePassthrough.assign(
                chat_history=lambda x: _format_chat_history(x["chat_history"])
            )
            | condense_question_prompt
            | ChatGoogleGenerativeAI(
                model="gemini-2.0-flash",
                google_api_key=GEMINI_API_KEY,
                temperature=0.0
            )
            | StrOutputParser(),
        ),
        RunnableLambda(lambda x: x["question"]),
    )

    # Functions for retrieving information
    def remove_lucene_chars(input_str):
        """Remove Lucene special characters from search string"""
        lucene_special_chars = r'[+\-&|!(){}[\]^"~*?:\\]'
        return re.sub(lucene_special_chars, ' ', input_str)

    def generate_full_text_query(input: str) -> str:
        """Generate full text search query for an input string."""
        full_text_query = ""
        words = [el for el in remove_lucene_chars(input).split() if el]

        # Basic synonym dictionary for labor law terms
        synonyms = {
            "lao động": ["người lao động", "nhân viên", "công nhân", "người làm công"],
            "thời giờ": ["thời gian", "giờ", "số giờ"],
            "giờ làm": ["giờ", "số giờ"],
            "làm việc": ["công việc", "lao động"],
            "tối đa": ["nhiều nhất", "cao nhất", "không quá"],
            "lương": ["tiền lương", "tiền công", "thù lao"],
            "không lương": ["không trả lương", "không trả công", "miễn phí"],
            "vi phạm": ["phạm luật", "trái pháp luật", "trái luật"],
            "phạt": ["xử phạt", "chế tài", "chế tài xử phạt", "hình phạt"],
            "khiếu nại": ["khiếu kiện", "tố cáo", "tố giác", "khởi kiện"]
        }

        # Expand query with synonyms
        expanded_words = []
        for word in words:
            expanded_words.append(word)
            for key, values in synonyms.items():
                if word.lower() in key or key in word.lower():
                    expanded_words.extend(values)

        # Remove duplicates
        expanded_words = list(set(expanded_words))

        # Build query
        if len(expanded_words) > 1:
            for word in expanded_words[:-1]:
                full_text_query += f" {word}~2 OR"
            full_text_query += f" {expanded_words[-1]}~2"
        else:
            full_text_query = f"{expanded_words[0]}~2"

        return full_text_query.strip()

    def structured_retriever(question: str, analysis=None) -> str:
        """
        Retrieve information about entities mentioned in the question 
        and adjacent nodes in the knowledge graph
        """
        result = ""

        # Use analysis if available
        if analysis:
            entities_from_analysis = entity_chain.invoke({"question": question}).names
            # Add legal concepts from analysis
            all_entities = entities_from_analysis + analysis.key_legal_concepts
        else:
            # Use old method if no analysis
            entities = entity_chain.invoke({"question": question})
            all_entities = entities.names

        # Add keywords related to labor law
        labor_keywords = [
            "thời giờ", "làm việc", "lao động", "giờ làm", "nghỉ phép", "nghỉ lễ",
            "lương", "không lương", "vi phạm", "phạt", "chế tài", "khiếu nại",
            "quyền lợi", "bảo hiểm", "hợp đồng", "chấm dứt hợp đồng"
        ]

        additional_entities = []
        # Check if question contains any keywords
        for keyword in labor_keywords:
            if keyword in question.lower():
                additional_entities.append(keyword)

        # Combine both detected entities and keywords
        all_entities = list(set(all_entities + additional_entities))

        for entity in all_entities:
            response = graph.query(
                """CALL db.index.fulltext.queryNodes('entity', $query, {limit:5})
                YIELD node,score
                CALL {
                  WITH node
                  MATCH (node)-[r:!MENTIONS]->(neighbor)
                  RETURN node.id + ' - ' + type(r) + ' -> ' + neighbor.id AS output
                  UNION ALL
                  WITH node
                  MATCH (node)<-[r:!MENTIONS]-(neighbor)
                  RETURN neighbor.id + ' - ' + type(r) + ' -> ' +  node.id AS output
                }
                RETURN output LIMIT 50
                """,
                {"query": generate_full_text_query(entity)},
            )
            result += "\n".join([el['output'] for el in response])
        return result

    def enhanced_retriever(question: str):
        """Enhanced retriever - NO factual questions generation"""
        logger.info(f"Search query: {question[:100]}...")

        # Analyze question with Gemini - ONLY for situational detection and key concepts
        analysis = question_analyzer.invoke({"question": question})
        logger.info(f"Question analysis: situational={analysis.is_situational}, concepts={analysis.key_legal_concepts}")

        # Structured query with analysis information
        structured_data = structured_retriever(question, analysis)

        # Vector search for the original question ONLY
        unstructured_data = [el.page_content for el in vector_index.similarity_search(question)]

        # NO additional searches for factual questions - this was the bottleneck!

        final_data = f"""Câu hỏi gốc: {question}

Phân tích:
- Câu hỏi tình huống: {"Có" if analysis.is_situational else "Không"}
- Khái niệm pháp lý liên quan: {", ".join(analysis.key_legal_concepts)}

Dữ liệu có cấu trúc:
{structured_data}

Dữ liệu không cấu trúc:
{"#Document ".join(unstructured_data)}
        """
        return final_data

    # RAG template
    template = """Trả lời câu hỏi dựa trên ngữ cảnh được cung cấp dưới đây:
    {context}

    Câu hỏi: {question}

    Hãy coi mình như một vị Luật sư chuyên về luật lao động và trả lời đầy đủ câu hỏi.

    Nếu đây là câu hỏi tình huống:
    1. Xác định và trích dẫn các điều luật cụ thể liên quan đến tình huống
    2. Phân tích tình huống dựa trên các quy định pháp luật
    3. Nêu rõ các hành vi vi phạm (nếu có) và hậu quả pháp lý
    4. Đưa ra hướng dẫn về quyền lợi và các bước người lao động có thể thực hiện
    5. Trích dẫn các mức xử phạt hoặc chế tài theo quy định (nếu có)

    Hãy trả lời dưới dạng "Theo Điều ... của bộ Luật Lao Động..." và trích dẫn cụ thể các quy định pháp luật.
    Nếu không có đủ thông tin để trả lời, hãy nói rõ là không tìm thấy thông tin trong dữ liệu.

    Trả lời:"""

    prompt = ChatPromptTemplate.from_template(template)

    # Output processing template
    output_processing_template = """Bạn là một chuyên gia pháp lý về luật lao động Việt Nam.
    Bạn đã được cung cấp một câu hỏi và một bản phân tích sơ bộ dựa trên dữ liệu pháp lý.
    Nhiệm vụ của bạn là đánh giá phân tích này và tạo ra một câu trả lời cuối cùng rõ ràng,
    chính xác và giải quyết được câu hỏi của người dùng.

    Câu hỏi ban đầu: {question}

    Phân tích sơ bộ:
    {initial_response}

    Yêu cầu:
    1. Đưa ra câu trả lời trực tiếp và rõ ràng cho câu hỏi (Có/Không/Phụ thuộc vào...) nếu có thể
    2. Viện dẫn điều khoản luật cụ thể từ phân tích sơ bộ (nếu có)
    3. Giải thích mức độ vi phạm pháp luật và hậu quả pháp lý (nếu có liên quan đến vi phạm pháp luật)
    4. Đề xuất cách thức người lao động có thể bảo vệ quyền lợi của mình (nếu cần)
    5. Tóm tắt kết luận cuối cùng

    Trả lời cuối cùng:"""

    output_processing_prompt = ChatPromptTemplate.from_template(output_processing_template)

    # Output processing component
    def process_output(inputs):
        question = inputs["question"]
        initial_response = inputs["initial_response"]

        return {
            "question": question,
            "initial_response": initial_response
        }

    # Define initial chain
    initial_chain = (
        RunnableParallel(
            {
                "context": _search_query | enhanced_retriever,
                "question": RunnablePassthrough(),
            }
        )
        | prompt
        | llm
        | StrOutputParser()
    )

    # Complete chain with output processing
    chain = (
        RunnableParallel(
            {
                "question": RunnablePassthrough(),
                "initial_response": initial_chain,
            }
        )
        | RunnableLambda(process_output)
        | output_processing_prompt
        | ChatGoogleGenerativeAI(
            model="gemini-2.0-flash",
            google_api_key=GEMINI_API_KEY,
            temperature=0.3
        )
        | StrOutputParser()
    )

@app.on_event("startup")
async def startup_event():
    """Initialize components on startup"""
    try:
        if not validate_env_vars():
            logger.error("Failed to validate environment variables")
            return
        
        initialize_components()
        logger.info("Application started successfully")
    except Exception as e:
        logger.error(f"Error initializing components: {str(e)}")

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Legal Chatbot API is running",
        "docs_url": "/docs",
        "redoc_url": "/redoc",
        "version": "1.0.0"
    }

@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    """Custom HTTP exception handler"""
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail, "status_code": exc.status_code},
    )

@app.get("/system-info")
async def system_info():
    """Get system information"""
    return {
        "neo4j_connected": graph is not None,
        "vector_search_enabled": vector_index is not None,
        "llm_model": GEMINI_MODEL,
        "embedding_model": GEMINI_EMBEDDING_MODEL
    }

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """Chat with the legal advisor bot"""
    try:
        start_time = time.time()
        
        if not request.question.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail="Question cannot be empty"
            )
            
        answer = chain.invoke({"question": request.question, "chat_history": request.chat_history})
        
        processing_time = time.time() - start_time
        
        return ChatResponse(answer=answer, processing_time=processing_time)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing chat request: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail=f"Error processing request: {str(e)}"
        )

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    components_status = {
        "graph": graph is not None,
        "vector_index": vector_index is not None,
        "llm": llm is not None,
        "chain": chain is not None
    }
    
    all_healthy = all(components_status.values())
    
    if not all_healthy:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "status": "unhealthy",
                "components": components_status
            }
        )
    
    return HealthResponse(status="healthy", components=components_status)

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=PORT, reload=DEBUG)
