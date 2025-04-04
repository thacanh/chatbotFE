import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Send, FileUp } from "lucide-react";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { ScrollArea } from "../ui/ScrollArea";
import { v4 as uuidv4 } from "uuid";
import DocumentEditor from "./DocumentEditor";
// import sampleDocxPath from "../../assets/sample.docx"; // Đường dẫn đến file DOCX mẫu


function DocumentGenerator() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showDocumentEditor, setShowDocumentEditor] = useState(false);
  const [documentTitle, setDocumentTitle] = useState("Giấy nghỉ phép");
  const [docxFile, setDocxFile] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Cuộn xuống tin nhắn mới nhất
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Xử lý tải lên file DOCX
  const handleUploadDocx = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Xử lý khi file được chọn
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file && file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      setDocxFile(file);
      
      // Thêm tin nhắn người dùng
      const userMessage = {
        id: uuidv4(),
        role: "user",
        content: "Tôi đã tải lên một file DOCX.",
      };
      
      setMessages((prev) => [...prev, userMessage]);
      setInput("");
      setIsLoading(true);
      
      // Thêm tin nhắn phản hồi
      setTimeout(() => {
        const botMessage = {
          id: uuidv4(),
          role: "bot",
          content: "Đã nhận được file DOCX của bạn. Bạn có thể xem và chỉnh sửa trực tiếp tài liệu:",
          isDocument: true,
        };
        
        setMessages((prev) => [...prev, botMessage]);
        setIsLoading(false);
        
        // Tự động mở trình soạn thảo
        setTimeout(() => {
          setShowDocumentEditor(true);
        }, 500);
      }, 1000);
    } else {
      alert("Vui lòng chọn file DOCX hợp lệ");
    }
  };
  
  // Tải file mẫu
  // const loadSampleDocx = async () => {
  //   try {
  //     const response = await fetch(sampleDocxPath);
  //     const blob = await response.blob();
  //     const file = new File([blob], "sample.docx", { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
  //     setDocxFile(file);
  //     return file;
  //   } catch (error) {
  //     console.error("Lỗi khi tải file mẫu:", error);
  //     return null;
  //   }
  // };

  const handleInputChange = (e) => {
    setInput(e.target.value);
  };

  // Xử lý khi người dùng gửi tin nhắn
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!input.trim()) return;
    
    // Thêm tin nhắn người dùng
    const userMessage = {
      id: uuidv4(),
      role: "user",
      content: input,
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    
    // Giả lập độ trễ phản hồi
    setTimeout(async () => {
      // Thêm tin nhắn phản hồi
      const botMessage = {
        id: uuidv4(),
        role: "bot",
        content: "Dưới đây là mẫu đơn xin việc theo yêu cầu của bạn. Bạn có thể xem và chỉnh sửa trực tiếp:",
        isDocument: true,
      };
      
      setMessages((prev) => [...prev, botMessage]);
      setIsLoading(false);
      
      // Tải file DOCX mẫu nếu không có file được tải lên
      // if (!docxFile) {
      //   const sampleFile = await loadSampleDocx();
      //   if (sampleFile) {
      //     setDocxFile(sampleFile);
      //   }
      // }
      
      // Tự động mở trình soạn thảo
      setTimeout(() => {
        setShowDocumentEditor(true);
      }, 500);
    }, 1000);
  };

  // Render khu vực trò chuyện
  const renderChatArea = () => (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-hidden relative">
        <ScrollArea className="h-full pr-4">
          {messages.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center justify-center h-full text-center p-8 text-gray-500"
            >
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <FileText className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-xl font-medium text-gray-800 mb-2">Tạo Văn Bản Theo Yêu Cầu</h3>
              <p className="text-gray-500 max-w-md mb-8">
                Hãy nhập yêu cầu để tạo văn bản hoặc tải lên file DOCX có sẵn:
              </p>

              <div className="grid grid-cols-1 gap-3 mt-4 w-full max-w-md">
                {/* <Button
                  variant="outline"
                  className="justify-start text-left h-auto py-3 px-4 border-primary/20 hover:border-primary hover:bg-primary/5"
                  onClick={() => {
                    setInput("Tôi cần nghỉ phép vài ngày, hãy giúp tôi viết một văn bản xin nghỉ phép.");
                    handleSubmit({ preventDefault: () => {} });
                  }}
                >
                  <FileText className="h-4 w-4 mr-2 flex-shrink-0" />
                  {/* <span className="truncate">Viết giúp tôi một lá thư xin việc</span> */}
                {/* </Button> */}
                
                <Button
                  variant="outline"
                  className="justify-start text-left h-auto py-3 px-4 border-primary/20 hover:border-primary hover:bg-primary/5"
                  onClick={handleUploadDocx}
                >
                  <FileUp className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span className="truncate">Tải lên file DOCX của bạn</span>
                </Button>
                <input 
                  type="file" 
                  ref={fileInputRef}
                  className="hidden" 
                  accept=".docx" 
                  onChange={handleFileChange}
                />
              </div>
            </motion.div>
          ) : (
            <div className="space-y-4 py-4">
              <AnimatePresence initial={false}>
                {messages.map((message, index) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {message.role !== "user" && (
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-2 flex-shrink-0">
                        <FileText className="h-4 w-4 text-primary" />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        message.role === "user"
                          ? "bg-primary text-primary-foreground rounded-tr-none"
                          : "bg-gray-100 text-gray-800 rounded-tl-none"
                      }`}
                    >
                      {message.content}
                      {message.isDocument && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <Button 
                            size="sm" 
                            className="w-full"
                            onClick={() => setShowDocumentEditor(true)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Xem và chỉnh sửa văn bản
                          </Button>
                        </div>
                      )}
                    </div>
                    {message.role === "user" && (
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center ml-2 flex-shrink-0">
                        <span className="text-xs font-medium text-white">Bạn</span>
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
              {isLoading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-2 flex-shrink-0">
                    <FileText className="h-4 w-4 text-primary" />
                  </div>
                  <div className="bg-gray-100 text-gray-800 rounded-lg rounded-tl-none p-3">
                    <div className="flex space-x-2">
                      <div
                        className="w-2 h-2 rounded-full bg-primary/60 animate-bounce"
                        style={{ animationDelay: "0ms" }}
                      ></div>
                      <div
                        className="w-2 h-2 rounded-full bg-primary/60 animate-bounce"
                        style={{ animationDelay: "150ms" }}
                      ></div>
                      <div
                        className="w-2 h-2 rounded-full bg-primary/60 animate-bounce"
                        style={{ animationDelay: "300ms" }}
                      ></div>
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>
      </div>
      
      {showDocumentEditor && (
        <DocumentEditor 
          docxFile={docxFile}
          documentTitle={documentTitle}
          onClose={() => setShowDocumentEditor(false)}
          onTitleChange={(newTitle) => setDocumentTitle(newTitle)}
        />
      )}
      
      <div className="border-t pt-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            placeholder="Nhập yêu cầu tạo văn bản của bạn..."
            value={input}
            onChange={handleInputChange}
            className="flex-1 border-primary/20 focus-visible:ring-primary"
            disabled={isLoading}
          />
          <Button
            type="submit"
            size="icon"
            disabled={isLoading || !input.trim()}
            className="bg-primary hover:bg-primary/90 transition-colors"
          >
            {isLoading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="h-full">
      {renderChatArea()}
    </div>
  );
}

// Component Eye
const Eye = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

// Component Send
// const Send = (props) => (
//   <svg
//     {...props}
//     xmlns="http://www.w3.org/2000/svg"
//     width="24"
//     height="24"
//     viewBox="0 0 24 24"
//     fill="none"
//     stroke="currentColor"
//     strokeWidth="2"
//     strokeLinecap="round"
//     strokeLinejoin="round"
//   >
//     <path d="m22 2-7 20-4-9-9-4Z" />
//     <path d="M22 2 11 13" />
//   </svg>
// );

export default DocumentGenerator;
