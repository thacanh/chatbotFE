from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from document_templates import DOCUMENT_TEMPLATES, get_template_by_id
import os
from dotenv import load_dotenv
from config import GEMINI_API_KEY, GEMINI_MODEL
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
import logging

# Set up logging with UTF-8 encoding
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    encoding='utf-8'
)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

router = APIRouter()

class DocumentRequest(BaseModel):
    user_request: str

class DocumentResponse(BaseModel):
    template_link: str

@router.post("/analyze-document-request", response_model=DocumentResponse)
async def analyze_document_request(request: DocumentRequest):
    try:
        # Khởi tạo LLM với cấu hình từ main.py
        llm = ChatGoogleGenerativeAI(
            model=GEMINI_MODEL,
            google_api_key=GEMINI_API_KEY,
            temperature=0.0,
            top_p=0.95,
            top_k=40
        )

        # Tạo prompt template
        prompt = ChatPromptTemplate.from_messages([
            (
                "system",
                """Bạn là một hệ thống phân tích và tìm kiếm mẫu văn bản phù hợp. 
                Nhiệm vụ của bạn là phân tích yêu cầu của người dùng và tìm mẫu văn bản phù hợp nhất từ danh sách có sẵn.

                Dưới đây là danh sách các mẫu văn bản có sẵn:
                {templates}

                Yêu cầu của người dùng: {user_request}

                Hãy phân tích yêu cầu và chọn mẫu văn bản phù hợp nhất từ danh sách trên.
                Chỉ trả về ID của mẫu phù hợp nhất, ví dụ: "10"

                Lưu ý:
                - Chỉ chọn từ các mẫu có sẵn trong danh sách
                - Chỉ trả về ID, không thêm text khác
                """
            ),
            ("human", "{user_request}")
        ])

        # Tạo chain
        chain = prompt | llm | StrOutputParser()

        # Thực thi chain
        template_id = chain.invoke({
            "templates": DOCUMENT_TEMPLATES,
            "user_request": request.user_request
        }).strip()

        # Lấy template từ ID
        template = get_template_by_id(template_id)
        if not template:
            raise ValueError(f"Invalid template_id: {template_id}")

        return DocumentResponse(
            template_link=template["link"]
        )

    except Exception as e:
        logger.error(f"Error processing request: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Lỗi xử lý yêu cầu: {str(e)}"
        )

@router.get("/templates")
async def get_templates():
    """Lấy danh sách tất cả các mẫu văn bản có sẵn"""
    return DOCUMENT_TEMPLATES 