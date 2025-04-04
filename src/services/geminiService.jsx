// Dịch vụ kết nối với API Google Gemini

const API_KEY = "";
const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

export const generateChatResponse = async (messages) => {
  try {
    // Chuẩn bị tin nhắn cho định dạng gemini
    const formattedMessages = messages.map(msg => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }]
    }));

    const response = await fetch(`${API_URL}?key=${API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: formattedMessages,
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1000,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      return data.candidates[0].content.parts[0].text;
    }
    
    throw new Error("Không nhận được phản hồi hợp lệ từ API");
  } catch (error) {
    console.error("Lỗi khi gọi API Gemini:", error);
    return "Đã xảy ra lỗi khi xử lý yêu cầu của bạn. Vui lòng thử lại sau.";
  }
};

// Prompt hướng dẫn cho Gemini về chủ đề Luật Lao động
export const initializeGeminiContext = async () => {
  const systemPrompt = `Bạn là một trợ lý tư vấn pháp luật chuyên về Luật Lao động Việt Nam. 
Nhiệm vụ của bạn là giúp người dùng hiểu rõ các quy định trong Bộ luật Lao động 2019 (Luật số 45/2019/QH14).
Khi trả lời:
- Luôn dẫn chiếu đến điều khoản cụ thể trong Bộ luật Lao động 
- Giải thích ngắn gọn, rõ ràng và dễ hiểu cho người không chuyên về luật
- Đưa ra ví dụ minh họa nếu cần thiết
- Nếu không chắc chắn, hãy nói rõ và đề xuất người dùng tham khảo ý kiến luật sư chuyên nghiệp
- Không đưa ra tư vấn cá nhân hoặc ý kiến chủ quan

Các chủ đề chính bao gồm:
- Hợp đồng lao động và thử việc
- Tiền lương, thưởng và phụ cấp
- Thời giờ làm việc và nghỉ ngơi
- An toàn lao động và vệ sinh lao động
- Bảo hiểm xã hội và bảo hiểm y tế
- Kỷ luật lao động
- Tranh chấp lao động
- Chấm dứt hợp đồng lao động và trợ cấp thôi việc

Hãy trả lời với thái độ chuyên nghiệp, tôn trọng và hữu ích.`;

  try {
    const response = await fetch(`${API_URL}?key=${API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: systemPrompt }]
          }
        ],
        generationConfig: {
          temperature: 0.1,
        }
      }),
    });

    if (!response.ok) {
      console.error("Không thể khởi tạo ngữ cảnh Gemini");
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Lỗi khi khởi tạo ngữ cảnh Gemini:", error);
    return false;
  }
};