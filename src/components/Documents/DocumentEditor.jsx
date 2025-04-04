import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  FileText, Download, Bold, Italic, Underline, Link,
  Copy, Printer, MessageSquare, Save, AlignLeft, AlignCenter, 
  AlignRight, List, ListOrdered, Redo, Undo, PenTool,
  ChevronDown, MoreHorizontal
} from "lucide-react";
import { Button } from "../ui/Button";
import toast from "react-hot-toast";
import { saveAs } from 'file-saver';

// Lịch sử thao tác để hỗ trợ undo/redo
const MAX_HISTORY = 50;

// Mẫu đơn xin việc
const SAMPLE_DOCUMENT = `
<div style="font-family: 'Times New Roman', Times, serif; max-width: 21cm; margin: 0 auto; padding: 1cm;">
    <div style="text-align: center; margin-bottom: 5px; font-size: 13px;">
        <div style="display: flex; justify-content: space-between; border: 0px solid #000; margin-bottom: 10px;">
            <div style="border-right: 0px solid #000; padding: 10px; width: 50%; text-align: center;">
                <p style="font-weight: bold; margin: 0;">TÊN CƠ QUAN, TỔ CHỨC<sup>1</sup></p>
                <p style="margin: 5px 0;">Số: .../GNP-...<sup>3</sup></p>
            </div>
            <div style="padding: 10px; width: 50%; text-align: center;">
                <p style="font-weight: bold; margin: 0;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
                <p style="margin: 0;">Độc lập - Tự do - Hạnh phúc</p>
                <p style="margin: 5px 0;">-------</p>
                <p style="margin: 5px 0;"><i>......, ngày ... tháng ... năm ......</i></p>
            </div>
        </div>
    </div>
    
    <div style="text-align: center; margin: 20px 0;">
        <h2 style="font-weight: bold; text-transform: uppercase; margin: 0;">GIẤY NGHỈ PHÉP</h2>
        <p style="margin: 5px 0;">-------</p>
    </div>
    
    <div style="text-align: left; margin-bottom: 20px; line-height: 1.5;">
        <p>Xét Đơn đề nghị nghỉ phép ngày................................ của ông (bà).............................</p>
        <p>............................................................<sup>2</sup>.................................................. cấp cho:</p>
        <p>Ông (bà):.............................................<sup>3</sup>....................................................</p>
        <p>Chức vụ: ...........................................................................................................</p>
        <p>Được nghỉ phép trong thời gian...................... kể từ ngày................... đến hết ngày........ tại <sup>6</sup></p>
        <p>Số ngày nghỉ phép nêu trên được tính vào thời gian .....................<sup>7</sup>......./</p>
    </div>
    
    <div style="display: flex; justify-content: space-between; border: 0px solid #000;">
        <div style="border-right: 0px solid #000; padding: 10px; width: 50%;">
            <p style="font-weight: bold; margin: 5px 0;">Nơi nhận:</p>
            <p style="margin: 0;">- .........<sup>8</sup></p>
            <p style="margin: 0;">- Lưu: VT, .....<sup>9</sup></p>
            <div style="margin-top: 20px;">
                <p style="font-style: italic; font-size: 12px; margin-bottom: 80px;">Xác nhận của cơ quan (tổ chức) hoặc chính quyền địa phương nơi nghỉ phép (nếu cần)</p>
                <p style="font-style: italic; font-size: 12px; text-align: center; margin: 0;">(Chữ ký, dấu)</p>
                <p style="margin-top: 50px; text-align: center;">Họ và tên</p>
            </div>
        </div>
        <div style="padding: 10px; width: 50%;">
            <p style="font-weight: bold; text-align: center; margin: 5px 0;">QUYỀN HẠN, CHỨC VỤ CỦA NGƯỜI KÝ</p>
            <p style="font-style: italic; font-size: 12px; text-align: center; margin: 0;">(Chữ ký của người có thẩm quyền, dấu/chữ ký số của cơ quan, tổ chức)</p>
            <p style="margin-top: 120px; text-align: center;">Họ và tên</p>
        </div>
    </div>
</div>
`;

const DocumentEditor = ({ 
  initialContent = SAMPLE_DOCUMENT, 
  documentTitle = "Giấy nghỉ phép", 
  onClose, 
  onTitleChange,
  docxFile = null 
}) => {
  const [isSaved, setIsSaved] = useState(true);
  const [title, setTitle] = useState(documentTitle);
  const [isStarred, setIsStarred] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Refs
  const editorRef = useRef(null);
  const hasSetInitialContent = useRef(false);
  const undoStack = useRef([]);
  const redoStack = useRef([]);
  const fileInputRef = useRef(null);

  // Khởi tạo nội dung ban đầu
  useEffect(() => {
    if (!hasSetInitialContent.current && editorRef.current) {
      // Sử dụng SAMPLE_DOCUMENT nếu không có initialContent
      const content = initialContent || SAMPLE_DOCUMENT;
      editorRef.current.innerHTML = content;
      undoStack.current = [content];
      hasSetInitialContent.current = true;
      console.log("Đã đặt nội dung ban đầu:", content.substring(0, 50) + "...");
    }
  }, [initialContent]);
  
  // Bắt sự kiện lựa chọn text
  useEffect(() => {
    const handleSelectionChange = () => {
      if (window.getSelection && editorRef.current) {
        const selection = window.getSelection();
        setSelectedText(selection.toString());
      }
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
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

  // Xử lý Input
  useEffect(() => {
    const handleInput = () => {
      saveToHistory();
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

  // Lưu nội dung đã chỉnh sửa từ editor
  const saveContent = () => {
    if (editorRef.current) {
      setIsSaved(true);
      toast.success("Đã lưu thay đổi!");
    }
  };

  // Xử lý định dạng văn bản
  const handleFormat = (command, value = null) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      editorRef.current.focus();
      setTimeout(saveToHistory, 10);
    }
  };

  // Xử lý undo
  const handleUndo = () => {
    if (undoStack.current.length <= 1) return;
    
    // Lấy nội dung hiện tại và lưu vào redoStack
    const currentContent = editorRef.current.innerHTML;
    redoStack.current.push(currentContent);
    
    // Lấy trạng thái trước đó từ undoStack
    undoStack.current.pop(); // Bỏ trạng thái hiện tại
    const previousContent = undoStack.current[undoStack.current.length - 1];
    
    // Cập nhật nội dung editor mà không làm mất focus
    editorRef.current.innerHTML = previousContent;
    editorRef.current.focus();
    
    setIsSaved(false);
  };

  // Xử lý redo
  const handleRedo = () => {
    if (redoStack.current.length === 0) return;
    
    // Lấy trạng thái tiếp theo từ redoStack
    const nextContent = redoStack.current.pop();
    
    // Lưu trạng thái hiện tại vào undoStack
    undoStack.current.push(nextContent);
    
    // Cập nhật nội dung editor mà không làm mất focus
    editorRef.current.innerHTML = nextContent;
    editorRef.current.focus();
    
    setIsSaved(false);
  };

  // Thêm link
  const handleAddLink = () => {
    const url = prompt("Nhập URL:", "https://");
    if (url) {
      handleFormat('createLink', url);
    }
  };

  // Xử lý tải xuống văn bản dạng DOCX
  const handleDownloadDocx = () => {
    // Tạo đối tượng Blob với nội dung HTML
    const htmlContent = editorRef.current ? editorRef.current.innerHTML : "";
    
    if (!htmlContent) {
      toast.error("Không có nội dung để tải xuống!");
      return;
    }
    
    // Tạo HTML đặc biệt cho MS Word với định dạng msonormal
    const blob = new Blob([
      `<html xmlns:o='urn:schemas-microsoft-com:office:office' 
             xmlns:w='urn:schemas-microsoft-com:office:word'
             xmlns:m='http://schemas.microsoft.com/office/2004/12/omml'
             xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
          <meta charset='utf-8'>
          <title>${title}</title>
          <style>
            @page {
              size: 21cm 29.7cm;
              margin: 2cm;
            }
            @font-face {
              font-family: 'Times New Roman';
              src: local('Times New Roman');
            }
            body {
              font-family: 'Times New Roman', Times, serif;
              font-size: 12pt;
              line-height: 1.5;
            }
            h1, h2, h3 { text-align: center; }
            p { margin: 8pt 0; }
            sup { font-size: 70%; vertical-align: super; }
            div.flex-container {
              display: table;
              width: 100%;
            }
            div.flex-row {
              display: table-row;
            }
            div.flex-cell {
              display: table-cell;
              vertical-align: top;
              width: 50%;
            }
            .center { text-align: center; }
            .right { text-align: right; }
            
            /* Các định dạng đặc biệt cho MS Word */
            .MsoNormal {
              margin-top: 0cm;
              margin-right: 0cm;
              margin-bottom: 8.0pt;
              margin-left: 0cm;
              line-height: 1.5;
              font-size: 12.0pt;
              font-family: 'Times New Roman', serif;
            }
            .MsoTitle {
              font-weight: bold;
              text-align: center;
              text-transform: uppercase;
            }
            .MsoHeader, .MsoFooter {
              font-size: 12.0pt;
              font-family: 'Times New Roman', serif;
            }
            table {
              border-collapse: collapse;
              width: 100%;
            }
          </style>
          
          <!--[if gte mso 9]>
          <xml>
            <w:WordDocument>
              <w:View>Print</w:View>
              <w:Zoom>100</w:Zoom>
              <w:DoNotOptimizeForBrowser/>
              <w:TrackMoves>false</w:TrackMoves>
              <w:TrackFormatting/>
              <w:ValidateAgainstSchemas/>
              <w:SaveIfXMLInvalid>false</w:SaveIfXMLInvalid>
              <w:IgnoreMixedContent>false</w:IgnoreMixedContent>
              <w:AlwaysShowPlaceholderText>false</w:AlwaysShowPlaceholderText>
              <w:DoNotPromoteQF/>
              <w:LidThemeOther>VI</w:LidThemeOther>
              <w:LidThemeAsian>X-NONE</w:LidThemeAsian>
              <w:LidThemeComplexScript>X-NONE</w:LidThemeComplexScript>
              <w:Compatibility>
                <w:BreakWrappedTables/>
                <w:SnapToGridInCell/>
                <w:WrapTextWithPunct/>
                <w:UseAsianBreakRules/>
                <w:DontGrowAutofit/>
                <w:SplitPgBreakAndParaMark/>
                <w:EnableOpenTypeKerning/>
                <w:DontFlipMirrorIndents/>
                <w:OverrideTableStyleHps/>
              </w:Compatibility>
              <w:BrowserLevel>MicrosoftInternetExplorer4</w:BrowserLevel>
              <m:mathPr>
                <m:mathFont m:val="Cambria Math"/>
                <m:brkBin m:val="before"/>
                <m:brkBinSub m:val="&#45;-"/>
                <m:smallFrac m:val="off"/>
                <m:dispDef/>
                <m:lMargin m:val="0"/>
                <m:rMargin m:val="0"/>
                <m:defJc m:val="centerGroup"/>
                <m:wrapIndent m:val="1440"/>
                <m:intLim m:val="subSup"/>
                <m:naryLim m:val="undOvr"/>
              </m:mathPr>
            </w:WordDocument>
          </xml>
          <![endif]-->
          
          <!--[if gte mso 10]>
          <style>
            /* Style definitions */
            table.MsoNormalTable {
              line-height: 115%;
              font-size: 11.0pt;
              font-family: "Calibri", sans-serif;
            }
          </style>
          <![endif]-->
        </head>
        <body>
          ${htmlContent}
        </body>
      </html>`
    ], { type: "application/vnd.ms-word;charset=utf-8" });
    
    saveAs(blob, `${title.toLowerCase().replace(/ /g, "_")}.docx`);
    toast.success("Đã tải xuống tài liệu DOCX!");
  };

  // Xử lý sao chép văn bản
  const handleCopy = () => {
    const content = editorRef.current ? editorRef.current.innerText : "";
    
    if (!content) {
      toast.error("Không có nội dung để sao chép!");
      return;
    }
    
    navigator.clipboard.writeText(content);
    toast.success("Đã sao chép văn bản vào clipboard!");
  };

  // Xử lý in văn bản
  const handlePrint = () => {
    const content = editorRef.current ? editorRef.current.innerHTML : "";
    
    if (!content) {
      toast.error("Không có nội dung để in!");
      return;
    }
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.5; }
            h1 { text-align: center; margin-bottom: 30px; }
          </style>
        </head>
        <body>
          <div>${content}</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  // Xử lý đổi tên văn bản
  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    if (onTitleChange) {
      onTitleChange(newTitle);
    }
  };

  // Xử lý khi đóng trình soạn thảo
  const handleClose = () => {
    if (!isSaved) {
      if (window.confirm("Bạn có muốn lưu thay đổi trước khi thoát không?")) {
        saveContent();
      }
    }
    if (onClose) {
      onClose();
    }
  };

  // Thêm bắt sự kiện phím tắt Ctrl+S để lưu
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Lưu khi nhấn Ctrl+S
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveContent();
      }
      
      // Undo khi nhấn Ctrl+Z
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
      
      // Redo khi nhấn Ctrl+Y hoặc Ctrl+Shift+Z
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
      {/* Thanh menu giống Google Docs */}
      <div className="flex items-center justify-between border-b p-2 bg-white">
        <div className="flex items-center">
          <div className="w-10 h-10 flex items-center justify-center">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div className="flex flex-col ml-1">
            <div className="flex items-center">
              <input
                type="text"
                value={title}
                onChange={handleTitleChange}
                onBlur={() => setIsSaved(false)}
                className="text-base font-medium focus:outline-none hover:bg-gray-100 rounded px-2 py-0.5"
              />
              <button
                className="ml-1 p-1 rounded-full hover:bg-gray-100"
                onClick={() => setIsStarred(!isStarred)}
              >
                {isStarred ? (
                  <Star className="h-4 w-4 text-yellow-400" />
                ) : (
                  <StarOff className="h-4 w-4 text-gray-400" />
                )}
              </button>
            </div>
          </div>
        </div>
        <div className="flex items-center">
          <Button 
            size="sm" 
            className="ml-2 h-8"
            onClick={handleClose}
          >
            <MessageSquare className="h-4 w-4 mr-1" />
            <span>Quay lại chat</span>
          </Button>
        </div>
      </div>

      {/* Thanh công cụ định dạng */}
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
        
        <div className="px-1">
          <select 
            className="h-8 rounded border text-sm px-2 bg-white"
            onChange={(e) => handleFormat('formatBlock', e.target.value)}
          >
            <option value="p">Đoạn văn</option>
            <option value="h1">Tiêu đề 1</option>
            <option value="h2">Tiêu đề 2</option>
            <option value="h3">Tiêu đề 3</option>
            <option value="h4">Tiêu đề 4</option>
            <option value="pre">Văn bản định dạng sẵn</option>
          </select>
        </div>
        
        <div className="px-1">
          <select 
            className="h-8 rounded border text-sm px-2 bg-white" 
            onChange={(e) => handleFormat('fontName', e.target.value)}
          >
            <option value="Arial">Arial</option>
            <option value="Times New Roman">Times New Roman</option>
            <option value="Courier New">Courier New</option>
            <option value="Georgia">Georgia</option>
            <option value="Verdana">Verdana</option>
          </select>
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
          <Button 
            size="sm" 
            variant="ghost" 
            className="h-8 w-8 p-0"
            onClick={handleAddLink}
          >
            <Link className="h-4 w-4" />
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
        
        <div className="w-px h-6 bg-gray-300" />
        
        <div className="flex items-center">
          <Button 
            size="sm" 
            variant="ghost" 
            className="h-8 w-8 p-0"
            onClick={() => handleFormat('insertUnorderedList')}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button 
            size="sm" 
            variant="ghost" 
            className="h-8 w-8 p-0"
            onClick={() => handleFormat('insertOrderedList')}
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="w-px h-6 bg-gray-300" />
        
        <div className="flex items-center">
          <input 
            type="color" 
            className="w-8 h-6 p-0 border-0 cursor-pointer"
            onChange={(e) => handleFormat('foreColor', e.target.value)}
          />
          <Button 
            size="sm" 
            variant="ghost" 
            className="h-8 w-8 p-0"
            onClick={() => {
              if (selectedText) {
                handleFormat('hiliteColor', '#ffff00');
              }
            }}
          >
            <PenTool className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex-1" />
        
        <div className="px-2">
          <Button 
            size="sm" 
            onClick={saveContent}
            disabled={isSaved}
            className={isSaved ? "bg-gray-400" : "bg-blue-600"}
          >
            <Save className="h-4 w-4 mr-2" /> Lưu
          </Button>
        </div>
      </div>
      
      {/* Phần soạn thảo chính */}
      <div className="flex-1 overflow-auto bg-gray-100">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            <p className="ml-3 text-primary font-medium">Đang tải tài liệu...</p>
          </div>
        ) : (
          <div className="mx-auto bg-white border shadow-sm my-6" style={{ width: '21cm', minHeight: '29.7cm' }}>
            <div
              ref={editorRef}
              className="py-12 px-16 prose max-w-none focus:outline-none min-h-full"
              contentEditable="true"
              style={{ lineHeight: 1.6 }}
            />
          </div>
        )}
      </div>
      
      {/* Thanh trạng thái */}
      <div className="flex items-center justify-between border-t py-1 px-4 text-xs text-gray-500 bg-gray-50">
        <div className="flex items-center">
          <div className="ml-2">{title}</div>
        </div>
        <div className="flex items-center">
          <div className="flex items-center mr-4">
            <Button size="sm" variant="ghost" className="h-6 px-2 text-xs">
              <span className="mr-1">Chế độ Chỉnh sửa</span>
              <ChevronDown className="h-3 w-3" />
            </Button>
          </div>
          <div className="flex items-center">
            <Button 
              size="sm" 
              variant="ghost" 
              className="h-6 px-2"
              onClick={handlePrint}
            >
              <Printer className="h-3 w-3 mr-1" />
              <span>In</span>
            </Button>
            <Button 
              size="sm" 
              variant="ghost" 
              className="h-6 px-2"
              onClick={handleDownloadDocx}
            >
              <Download className="h-3 w-3 mr-1" />
              <span>Tải .docx</span>
            </Button>
            <Button 
              size="sm" 
              variant="ghost" 
              className="h-6 px-2"
              onClick={handleCopy}
            >
              <Copy className="h-3 w-3 mr-1" />
              <span>Sao chép</span>
            </Button>
            <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Component Star
const Star = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="currentColor"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

// Component StarOff
const StarOff = (props) => (
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
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

export default DocumentEditor;
