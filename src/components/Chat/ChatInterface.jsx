import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Send, Scale } from "lucide-react";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { ScrollArea } from "../ui/ScrollArea";
import { v4 as uuidv4 } from "uuid";

function ChatInterface() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const handleInputChange = (e) => {
    setInput(e.target.value);
  };

  // Function to format message content
  const formatMessage = (content) => {
    // First replace literal \n with actual newlines
    const contentWithNewlines = content.replace(/\\n/g, '\n');
    
    // Split by actual newlines and process each line
    return contentWithNewlines.split('\n').map((line, lineIndex) => {
      // Skip empty lines
      if (!line.trim()) {
        return <br key={lineIndex} />;
      }

      // Process bold text within each line
      const parts = line.split(/(\*\*.*?\*\*)/g).map((part, partIndex) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          // Remove ** and wrap in strong tag with custom styling
          const text = part.slice(2, -2);
          // Check if it's a numbered section (e.g., "1. Câu trả lời trực tiếp:")
          if (/^\d+\.\s/.test(text)) {
            return (
              <strong key={partIndex} className="text-lg text-gray-900 block mb-2">
                {text}
              </strong>
            );
          }
          // Check if it's a bullet point
          if (text.startsWith('*')) {
            return (
              <strong key={partIndex} className="text-gray-900">
                {text}
              </strong>
            );
          }
          // Regular bold text
          return (
            <strong key={partIndex} className="text-gray-900">
              {text}
            </strong>
          );
        }
        return part;
      });

      // Return line with its parts
      return (
        <div key={lineIndex} className="mb-2">
          {parts}
        </div>
      );
    });
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
      // Call the backend API
      const response = await fetch("http://localhost:8000/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: input,
          chat_history: messages.map(msg => [msg.role === "user" ? msg.content : null, msg.role === "bot" ? msg.content : null]).filter(([user, bot]) => user && bot)
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response from server");
      }

      const data = await response.json();
      
      // Add bot response
      const botMessage = {
        id: uuidv4(),
        role: "bot",
        content: data.answer,
      };
      
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Error:", error);
      // Add error message
      const errorMessage = {
        id: uuidv4(),
        role: "bot",
        content: "Xin lỗi, đã có lỗi xảy ra khi xử lý câu hỏi của bạn. Vui lòng thử lại sau.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full pr-4">
          {messages.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center justify-center h-full text-center p-8 text-gray-500"
            >
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <Scale className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-xl font-medium text-gray-800 mb-2">Chào mừng đến với LAB-Support</h3>
              <p className="text-gray-500 max-w-md">
                Hãy đặt câu hỏi về Luật Lao động để được hỗ trợ. Tôi có thể giúp bạn hiểu rõ về quyền lợi và nghĩa
                vụ của mình.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-8 w-full max-w-lg">
                {[
                  "Thời gian thử việc tối đa là bao lâu?",
                  "Quy định về nghỉ phép năm?",
                  "Cách tính trợ cấp thôi việc?",
                  "Quy định về làm thêm giờ?",
                ].map((suggestion, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="justify-start text-left h-auto py-3 px-4 border-primary/20 hover:border-primary hover:bg-primary/5"
                    onClick={() => {
                      handleInputChange({ target: { value: suggestion } });
                      handleSubmit({ preventDefault: () => {} });
                    }}
                  >
                    <MessageCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span className="truncate">{suggestion}</span>
                  </Button>
                ))}
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
                        <Scale className="h-4 w-4 text-primary" />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] rounded-lg p-4 ${
                        message.role === "user"
                          ? "bg-primary text-primary-foreground rounded-tr-none"
                          : "bg-gray-100 text-gray-800 rounded-tl-none"
                      }`}
                    >
                      {message.role === "user" ? message.content : formatMessage(message.content)}
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
                    <Scale className="h-4 w-4 text-primary" />
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
            </div>
          )}
        </ScrollArea>
      </div>
      <div className="border-t pt-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            placeholder="Nhập câu hỏi của bạn..."
            value={input}
            onChange={handleInputChange}
            className="flex-1 border-primary/20 focus-visible:ring-primary"
          />
          <Button
            type="submit"
            size="icon"
            disabled={isLoading}
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
}

export default ChatInterface;