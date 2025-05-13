import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  FileText, Download, Bold, Italic, Underline,
  Save, AlignLeft, AlignCenter, AlignRight, Redo, Undo
} from "lucide-react";
import { Button } from "../ui/Button";
import toast from "react-hot-toast";
import { saveAs } from 'file-saver';
import { renderAsync } from 'docx-preview';
import * as docx from 'docx';

const MAX_HISTORY = 50;

const DocumentEditor = ({ 
  documentTitle = "Biên bản", 
  onClose, 
  onTitleChange,
  docxFile = null 
}) => {
  const [isSaved, setIsSaved] = useState(true);
  const [title, setTitle] = useState(documentTitle);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [content, setContent] = useState('');
  
  const editorRef = useRef(null);
  const documentRef = useRef(null);
  const undoStack = useRef([]);
  const redoStack = useRef([]);

  // Biến để lưu trữ ArrayBuffer của file DOCX gốc
  const originalDocxArrayBuffer = useRef(null);

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .docx-wrapper-wrapper { 
        background: none !important; 
        padding: 30px !important; 
        padding-bottom: 0px !important; 
        display: flex !important; 
        flex-flow: column !important; 
        align-items: center !important; 
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Hàm tải tài liệu DOCX từ URL
  useEffect(() => {
    const loadDocxFile = async () => {
      try {
        if (!docxFile) return;
        
        // Chuyển đổi đường dẫn tương đối thành URL HTTP
        const fileUrl = process.env.PUBLIC_URL + '/assets/' + docxFile.split('/').pop();
        console.log('Loading file from:', fileUrl);
        
        const response = await fetch(fileUrl);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        originalDocxArrayBuffer.current = arrayBuffer;
        
        if (editorRef.current) {
          const tempDiv = document.createElement('div');
          await renderAsync(arrayBuffer, tempDiv, null, {
            className: 'docx-wrapper',
            inWrapper: true,
            ignoreWidth: false,
            ignoreHeight: false,
            ignoreFonts: false,
            breakPages: true,
            useBase64URL: true,
            useMathMLPolyfill: true,
            renderEndnotes: true,
            renderFootnotes: true,
            renderFooters: true,
            renderHeaders: true,
            pageWidth: 816,
            pageHeight: 1056,
            pageShadow: true,
            pageMargins: {
              top: 1440,
              right: 1440,
              bottom: 1440,
              left: 1440
            },
            backgroundColor: 'none'
          });

          setContent(tempDiv.innerHTML);
          undoStack.current = [tempDiv.innerHTML];
          setIsSaved(true);
        }
      } catch (error) {
        console.error('Error loading DOCX file:', error);
        toast.error('Không thể đọc file DOCX: ' + error.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadDocxFile();
  }, [docxFile]);

  // Xử lý Input
  useEffect(() => {
    const handleInput = (e) => {
      // Lưu vị trí con trỏ hiện tại
      const selection = window.getSelection();
      const range = selection.getRangeAt(0);
      const start = range.startOffset;
      const end = range.endOffset;
      
      // Lưu nội dung vào history
      saveToHistory();
      
      // Khôi phục vị trí con trỏ sau khi cập nhật
      requestAnimationFrame(() => {
        if (editorRef.current) {
          const newRange = document.createRange();
          const textNode = editorRef.current.firstChild || editorRef.current;
          const offset = Math.min(start, textNode.length);
          newRange.setStart(textNode, offset);
          newRange.setEnd(textNode, Math.min(end, textNode.length));
          
          selection.removeAllRanges();
          selection.addRange(newRange);
        }
      });
    };
    
    const editor = editorRef.current;
    if (editor) {
      editor.addEventListener('input', handleInput);
    }
    
    return () => {
      if (editor) {
        editor.removeEventListener('input', handleInput);
      }
    };
  }, []);

  // Lưu nội dung hiện tại vào undoStack
  const saveToHistory = () => {
    if (!editorRef.current) return;
    
    const currentContent = editorRef.current.innerHTML;
    const lastContent = undoStack.current[undoStack.current.length - 1];
    
    if (currentContent !== lastContent) {
      // Thêm trạng thái hiện tại vào undoStack
      undoStack.current.push(currentContent);
      
      // Giới hạn kích thước undoStack
      if (undoStack.current.length > MAX_HISTORY) {
        undoStack.current.shift();
      }
      
      // Xóa redoStack khi có thay đổi mới
      redoStack.current = [];
      
      setIsSaved(false);
    }
  };

  const handleUndo = () => {
    if (undoStack.current.length <= 1) return;
    
    const currentContent = content;
    redoStack.current.push(currentContent);
    
    undoStack.current.pop();
    const previousContent = undoStack.current[undoStack.current.length - 1];
    
    setContent(previousContent);
    setIsSaved(false);
  };

  const handleRedo = () => {
    if (redoStack.current.length === 0) return;
    
    const nextContent = redoStack.current.pop();
    undoStack.current.push(nextContent);
    
    setContent(nextContent);
    setIsSaved(false);
  };

  const handleFormat = (command, value = null) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      editorRef.current.focus();
      // Update content after formatting
      setContent(editorRef.current.innerHTML);
      saveToHistory();
    }
  };

  const saveContent = () => {
    setIsSaved(true);
    toast.success("Đã lưu thay đổi!");
  };

  // Hàm tạo tệp DOCX từ nội dung đã chỉnh sửa
  const handleDownloadDocx = async () => {
    if (!editorRef.current || !originalDocxArrayBuffer.current) return;
    
    try {
      setIsExporting(true);
      const doc = new docx.Document({
        sections: [
          {
            properties: {},
            children: [
              new docx.Paragraph({
                children: [
                  new docx.TextRun(editorRef.current.innerText),
                ],
              }),
            ],
          },
        ],
      });
      
      const buffer = await docx.Packer.toBuffer(doc);
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      saveAs(blob, `${title.toLowerCase().replace(/ /g, "_")}.docx`);
      toast.success("Đã tải xuống tài liệu DOCX!");
    } catch (error) {
      // console.error('Error saving DOCX:', error);
      // toast.error('Lỗi khi tải xuống file DOCX');
      try {
        const blob = new Blob([originalDocxArrayBuffer.current], { 
          type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
        });
        saveAs(blob, `${title.toLowerCase().replace(/ /g, "_")}_original.docx`);
        // toast.warning("Đã tải xuống phiên bản gốc của tài liệu vì có lỗi khi xuất file.");
      } catch (fallbackError) {
        // toast.error('Không thể tải xuống tài liệu.');
      }
    } finally {
      setIsExporting(false);
    }
  };

  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    if (onTitleChange) {
      onTitleChange(newTitle);
    }
  };

  const handleClose = () => {
    if (!isSaved) {
      if (window.confirm("Bạn có muốn lưu thay đổi trước khi thoát không?")) {
        saveToHistory();
      }
    }
    if (onClose) {
      onClose();
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveToHistory();
      }
      
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
      
      if (((e.ctrlKey || e.metaKey) && e.key === 'y') || 
          ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z')) {
        e.preventDefault();
        handleRedo();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="absolute inset-0 bg-white z-10 flex flex-col"
    >
      <div className="flex items-center justify-between border-b p-2 bg-white">
        <div className="flex items-center">
          <div className="w-10 h-10 flex items-center justify-center">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div className="flex flex-col ml-1">
            <input
              type="text"
              value={title}
              onChange={handleTitleChange}
              onBlur={() => setIsSaved(false)}
              className="text-base font-medium focus:outline-none hover:bg-gray-100 rounded px-2 py-0.5"
            />
          </div>
        </div>
        <div className="flex items-center">
          <Button 
            size="sm" 
            className="ml-2 h-8"
            onClick={handleClose}
          >
            Đóng
          </Button>
        </div>
      </div>

      <div className="flex items-center border-b bg-gray-50 p-1 space-x-1 overflow-x-auto">
        <div className="px-2 flex items-center">
          <Button 
            size="sm" 
            variant="ghost" 
            className="h-8 px-2"
            onClick={handleUndo}
            disabled={undoStack.current.length <= 1}
          >
            <Undo className="h-4 w-4" />
          </Button>
          <Button 
            size="sm" 
            variant="ghost" 
            className="h-8 px-2"
            onClick={handleRedo}
            disabled={redoStack.current.length === 0}
          >
            <Redo className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="w-px h-6 bg-gray-300" />
        
        <div className="flex items-center">
          <Button 
            size="sm" 
            variant="ghost" 
            className="h-8 w-8 p-0"
            onClick={() => handleFormat('bold')}
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button 
            size="sm" 
            variant="ghost" 
            className="h-8 w-8 p-0"
            onClick={() => handleFormat('italic')}
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button 
            size="sm" 
            variant="ghost" 
            className="h-8 w-8 p-0"
            onClick={() => handleFormat('underline')}
          >
            <Underline className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="w-px h-6 bg-gray-300" />
        
        <div className="flex items-center">
          <Button 
            size="sm" 
            variant="ghost" 
            className="h-8 w-8 p-0"
            onClick={() => handleFormat('justifyLeft')}
          >
            <AlignLeft className="h-4 w-4" />
          </Button>
          <Button 
            size="sm" 
            variant="ghost" 
            className="h-8 w-8 p-0"
            onClick={() => handleFormat('justifyCenter')}
          >
            <AlignCenter className="h-4 w-4" />
          </Button>
          <Button 
            size="sm" 
            variant="ghost" 
            className="h-8 w-8 p-0"
            onClick={() => handleFormat('justifyRight')}
          >
            <AlignRight className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex-1" />
        
        <div className="px-2">
          <Button 
            size="sm" 
            onClick={saveToHistory}
            disabled={isSaved}
            className={isSaved ? "bg-gray-400" : "bg-blue-600"}
          >
            <Save className="h-4 w-4 mr-2" /> Lưu
          </Button>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto bg-gray-100">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            <p className="ml-3 text-primary font-medium">Đang tải tài liệu...</p>
          </div>
        ) : (
          <div
            ref={editorRef}
            className="prose prose-sm md:prose-base lg:prose-lg max-w-none bg-white shadow-lg rounded-lg p-8 focus:outline-none min-h-[calc(100vh-200px)]"
            contentEditable="true"
            dangerouslySetInnerHTML={{ __html: content }}
            style={{ 
              lineHeight: 1.6,
              fontFamily: "'Times New Roman', Times, serif",
              fontSize: '12pt'
            }}
          />
        )}
      </div>
      
      <div className="flex items-center justify-between border-t py-1 px-4 text-xs text-gray-500 bg-gray-50">
        <div className="flex items-center">
          <div className="ml-2">{title}</div>
        </div>
        <div className="flex items-center">
          <Button 
            size="sm" 
            variant="ghost" 
            className="h-6 px-2"
            onClick={handleDownloadDocx}
            disabled={isExporting}
          >
            {isExporting ? (
              <>
                <div className="animate-spin rounded-full h-3 w-3 border-t-2 border-b-2 border-gray-500 mr-1"></div>
                <span>Đang tạo DOCX...</span>
              </>
            ) : (
              <>
                <Download className="h-3 w-3 mr-1" />
                <span>Tải .docx</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default DocumentEditor;