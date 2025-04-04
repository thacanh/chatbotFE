import {
    MessageCircle,
    FileText,
    FileSpreadsheet,
    Menu,
    Send,
    ChevronRight,
    BookOpen,
    Briefcase,
    Scale,
  } from "lucide-react";
  
  const navItems = [
    {
      id: "chat",
      name: "Tư Vấn Pháp Luật",
      icon: <Scale className="h-5 w-5" />,
      description: "Đặt câu hỏi về các vấn đề liên quan đến Luật Lao động",
    },
    {
      id: "templates",
      name: "Mẫu Văn Bản",
      icon: <FileSpreadsheet className="h-5 w-5" />,
      description: "Điền thông tin vào các mẫu văn bản hành chính có sẵn",
    },
    {
      id: "generator",
      name: "Tạo Văn Bản",
      icon: <FileText className="h-5 w-5" />,
      description: "Tạo văn bản hành chính theo yêu cầu của bạn",
    },
  ];
  
  export default navItems;