import React, { useState } from "react";
import { motion } from "framer-motion";
import { FileSpreadsheet, Download, CheckCircle, Search } from "lucide-react";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { ScrollArea } from "../ui/ScrollArea";

const templatesList = [
  {
    id: 1,
    name: "Hợp đồng lao động có thời hạn",
    category: "Hợp đồng",
    description: "Mẫu hợp đồng lao động có thời hạn theo quy định mới nhất",
    downloadCount: 1254,
  },
  {
    id: 2,
    name: "Hợp đồng lao động không thời hạn",
    category: "Hợp đồng",
    description: "Mẫu hợp đồng lao động không thời hạn áp dụng cho mọi ngành nghề",
    downloadCount: 987,
  },
  {
    id: 3,
    name: "Đơn xin nghỉ phép",
    category: "Đơn từ",
    description: "Mẫu đơn xin nghỉ phép chuẩn dành cho người lao động",
    downloadCount: 2356,
  },
  {
    id: 4,
    name: "Quyết định tăng lương",
    category: "Quyết định",
    description: "Mẫu quyết định tăng lương cho nhân viên trong doanh nghiệp",
    downloadCount: 856,
  },
  {
    id: 5,
    name: "Đơn xin thôi việc",
    category: "Đơn từ",
    description: "Mẫu đơn xin thôi việc dành cho người lao động muốn chấm dứt HĐLĐ",
    downloadCount: 1823,
  },
  {
    id: 6,
    name: "Biên bản họp nhắc nhở nhân viên",
    category: "Biên bản",
    description: "Mẫu biên bản họp nhắc nhở đối với nhân viên vi phạm nội quy",
    downloadCount: 652,
  },
];

const categories = ["Tất cả", "Hợp đồng", "Đơn từ", "Quyết định", "Biên bản"];

function DocumentTemplates() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Tất cả");
  const [downloading, setDownloading] = useState(null);

  const handleDownload = (id) => {
    setDownloading(id);
    // Simulate download process
    setTimeout(() => {
      setDownloading(null);
    }, 1500);
  };

  const filteredTemplates = templatesList.filter((template) => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "Tất cả" || template.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Tìm kiếm mẫu văn bản..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className={selectedCategory === category ? "bg-primary" : ""}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 -mx-2 px-2">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.length > 0 ? (
            filteredTemplates.map((template) => (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                whileHover={{ y: -5 }}
              >
                <Card className="h-full flex flex-col overflow-hidden border hover:border-primary/50 hover:shadow-md transition-all">
                  <div className="p-5 flex-1">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <FileSpreadsheet className="h-5 w-5 text-primary" />
                    </div>
                    <div className="inline-block px-2 py-1 rounded-full bg-gray-100 text-xs text-gray-600 mb-2">
                      {template.category}
                    </div>
                    <h3 className="font-medium text-lg mb-2">{template.name}</h3>
                    <p className="text-sm text-gray-500 mb-4">{template.description}</p>
                    <div className="text-xs text-gray-400">
                      {template.downloadCount} lượt tải
                    </div>
                  </div>
                  <div className="p-4 border-t bg-gray-50">
                    <Button
                      onClick={() => handleDownload(template.id)}
                      className="w-full"
                      disabled={downloading === template.id}
                    >
                      {downloading === template.id ? (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Đã tải xuống
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4 mr-2" />
                          Tải mẫu
                        </>
                      )}
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full flex flex-col items-center justify-center py-10 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <FileSpreadsheet className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">Không tìm thấy mẫu văn bản</h3>
              <p className="text-gray-500 max-w-md">
                Không tìm thấy mẫu văn bản phù hợp với tìm kiếm của bạn. Vui lòng thử lại với từ khóa khác.
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

export default DocumentTemplates;