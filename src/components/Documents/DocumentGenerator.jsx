import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Send } from "lucide-react";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { ScrollArea } from "../ui/ScrollArea";
import { v4 as uuidv4 } from "uuid";
import DocumentEditor from "./DocumentEditor";

function DocumentGenerator() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showDocumentEditor, setShowDocumentEditor] = useState(false);
  const [documentTitle, setDocumentTitle] = useState("Văn bản mới");
  const [templateLink, setTemplateLink] = useState(null);
  const messagesEndRef = useRef(null);

  const handleInputChange = (e) => {
    setInput(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!input.trim()) return;
    
    // Add user message
    const userMessage = {
      id: uuidv4(),
      role: "user",
      content: input,
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    
    try {
      const response = await fetch('http://localhost:8000/api/documents/analyze-document-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_request: input
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze document request');
      }

      const data = await response.json();
      console.log('API Response:', data);
      
      // Add bot message
      const botMessage = {
        id: uuidv4(),
        role: "bot",
        content: "Tôi đã tìm thấy mẫu văn bản phù hợp với yêu cầu của bạn.",
        isDocument: true,
      };
      
      setMessages((prev) => [...prev, botMessage]);
      
      // Set template link
      setTemplateLink(data.template_link);
      
      // Show document editor
      setShowDocumentEditor(true);
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = {
        id: uuidv4(),
        role: "bot",
        content: "Xin lỗi, có lỗi xảy ra khi xử lý yêu cầu của bạn. Vui lòng thử lại.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full">
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
                  Hãy nhập yêu cầu để tạo văn bản:
                </p>
              </motion.div>
            ) : (
              <div className="space-y-4 py-4">
                <AnimatePresence initial={false}>
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
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
                        <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce"></div>
                        <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "150ms" }}></div>
                        <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "300ms" }}></div>
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
            docxFile={templateLink}
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
    </div>
  );
}

export default DocumentGenerator;
