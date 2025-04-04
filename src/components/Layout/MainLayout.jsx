import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Menu, ChevronRight, BookOpen, Briefcase } from "lucide-react";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Sheet, SheetContent, SheetTrigger } from "../ui/Sheet";
import { ScrollArea } from "../ui/ScrollArea";
import navItems from "../../constants/navItems";
import { cn } from "../../utils/cn";
import ChatInterface from "../Chat/ChatInterface";
import DocumentTemplates from "../Documents/DocumentTemplates";
import DocumentGenerator from "../Documents/DocumentGenerator";

function MainLayout() {
  const [activeTab, setActiveTab] = useState("chat");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Set initial value
    checkIfMobile();
    
    // Add event listener
    window.addEventListener("resize", checkIfMobile);
    
    // Clean up
    return () => {
      window.removeEventListener("resize", checkIfMobile);
    };
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case "chat":
        return <ChatInterface />;
      case "templates":
        return <DocumentTemplates />;
      case "generator":
        return <DocumentGenerator />;
      default:
        return null;
    }
  };

  const SidebarContent = () => (
    <div className="h-full flex flex-col">
      <div className="px-3 py-6 border-b">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Briefcase className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-primary">Tư Vấn Luật Lao Động</h2>
        </div>
        <p className="text-sm text-muted-foreground">Hỗ trợ tư vấn và soạn thảo văn bản pháp lý</p>
      </div>
      <ScrollArea className="flex-1">
        <div className="px-1 py-4">
          <nav className="space-y-1">
            {navItems.map((item) => (
              <motion.button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  if (isMobile) setSidebarOpen(false);
                }}
                whileHover={{ x: 5 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  "w-full flex items-center gap-3 rounded-md px-3 py-3 text-sm transition-all",
                  activeTab === item.id
                    ? "bg-primary text-primary-foreground font-medium"
                    : "hover:bg-primary/5 text-muted-foreground hover:text-foreground",
                )}
              >
                {item.icon}
                <span>{item.name}</span>
                {activeTab === item.id && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="ml-auto"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </motion.div>
                )}
              </motion.button>
            ))}
          </nav>
        </div>
      </ScrollArea>
      <div className="mt-auto p-4 border-t">
        <div className="bg-primary/5 rounded-lg p-3 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="h-4 w-4 text-primary" />
            <h4 className="font-medium text-sm">Tài liệu tham khảo</h4>
          </div>
          <p className="text-xs text-muted-foreground">
            Thông tin được cung cấp dựa trên Bộ luật Lao động Việt Nam 2019 (Luật số 45/2019/QH14)
          </p>
        </div>
        <p className="text-xs text-center text-muted-foreground">
          © {new Date().getFullYear()} Tư Vấn Luật Lao Động
          <br />
          <span className="text-xs">Thông tin chỉ mang tính chất tham khảo</span>
        </p>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <motion.div
        initial={false}
        animate={{ width: sidebarOpen ? 280 : 0 }}
        className="hidden md:block border-r bg-card overflow-hidden"
      >
        {sidebarOpen && <SidebarContent />}
      </motion.div>

      {/* Mobile Sidebar */}
      <Sheet open={isMobile && sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="p-0 w-72">
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="border-b bg-card py-3 px-4 flex items-center gap-3">
          {isMobile ? (
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)} className="text-primary">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
          ) : (
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)} className="text-primary">
              <Menu className="h-5 w-5" />
            </Button>
          )}
          <div>
            <h1 className="text-lg font-semibold">
              {navItems.find((item) => item.id === activeTab)?.name || "Tư Vấn Luật Lao Động"}
            </h1>
            <p className="text-xs text-muted-foreground">
              {navItems.find((item) => item.id === activeTab)?.description}
            </p>
          </div>
        </header>

        <main className="flex-1 overflow-hidden p-4 bg-gray-50/50">
          <Card className="h-full overflow-hidden border rounded-lg shadow-sm">
            <div className="p-4 h-full">{renderContent()}</div>
          </Card>
        </main>
      </div>
    </div>
  );
}

export default MainLayout;