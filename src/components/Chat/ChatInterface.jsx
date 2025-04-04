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
  
  const handleSubmit = (e) => {
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
    
    // Simulate bot response after a short delay
    setTimeout(() => {
      const botMessage = {
        id: uuidv4(),
        role: "bot",
        content: generateBotResponse(input),
      };
      
      setMessages((prev) => [...prev, botMessage]);
      setIsLoading(false);
    }, 1000);
  };
  
  // Very simple bot response generator
  const generateBotResponse = (userInput) => {
    const input = userInput.toLowerCase();
    
    if (input.includes("thử việc")) {
      return "Theo Điều 24 Bộ luật Lao động 2019, thời gian thử việc không quá 180 ngày đối với công việc của người quản lý doanh nghiệp, không quá 60 ngày đối với công việc có chức danh nghề cần trình độ chuyên môn từ cao đẳng trở lên, không quá 30 ngày đối với công việc có chức danh nghề cần trình độ chuyên môn trung cấp và không quá 6 ngày làm việc đối với công việc khác.";
    } else if (input.includes("nghỉ phép") || input.includes("phép năm")) {
      return "Theo Điều 113 Bộ luật Lao động 2019, người lao động được nghỉ hằng năm, hưởng nguyên lương theo hợp đồng lao động như sau: 12 ngày làm việc đối với người làm việc từ đủ 12 tháng đến dưới 5 năm; 13 ngày làm việc đối với người làm việc từ đủ 5 năm đến dưới 10 năm; 14 ngày làm việc đối với người làm việc từ đủ 10 năm đến dưới 20 năm; 16 ngày làm việc đối với người làm việc từ đủ 20 năm trở lên.";
    } else if (input.includes("trợ cấp thôi việc")) {
      return "Theo Điều 46 Bộ luật Lao động 2019, trợ cấp thôi việc được tính bằng 1/2 tháng tiền lương bình quân cho mỗi năm làm việc. Tiền lương làm căn cứ tính trợ cấp là tiền lương bình quân theo hợp đồng lao động của 6 tháng liền kề trước khi người lao động thôi việc.";
    } else if (input.includes("làm thêm giờ")) {
      return "Theo Điều 107 Bộ luật Lao động 2019, số giờ làm thêm không quá 50% số giờ làm việc bình thường trong 1 ngày; trường hợp áp dụng quy định giờ làm việc bình thường theo tuần thì tổng số giờ làm việc bình thường và số giờ làm thêm không quá 12 giờ trong 1 ngày; không quá 40 giờ trong 1 tháng và tổng số không quá 200 giờ trong 1 năm.";
    } else {
      return "Cảm ơn câu hỏi của bạn. Đây là thông tin dựa trên Bộ luật Lao động 2019. Để biết thêm chi tiết cụ thể về vấn đề này, bạn có thể tham khảo Bộ luật Lao động hoặc hỏi thêm câu hỏi cụ thể hơn.";
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
              <h3 className="text-xl font-medium text-gray-800 mb-2">Chào mừng đến với Tư Vấn Luật Lao Động</h3>
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
                      className={`max-w-[80%] rounded-lg p-3 ${
                        message.role === "user"
                          ? "bg-primary text-primary-foreground rounded-tr-none"
                          : "bg-gray-100 text-gray-800 rounded-tl-none"
                      }`}
                    >
                      {message.content}
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