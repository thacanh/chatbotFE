export async function POST(req) {
    try {
      const { documentType, requirements } = await req.json()
  
      // In a real application, you would call an AI service here
      // This is a simple mock response
  
      // Simulate streaming with a delay
      await new Promise((resolve) => setTimeout(resolve, 2000))
  
      let response = ""
  
      if (documentType.toLowerCase().includes("hợp đồng")) {
        response = `# HỢP ĐỒNG LAO ĐỘNG
  
  Hôm nay, ngày ${new Date().toLocaleDateString("vi-VN")}, tại [Địa điểm]
  
  ## BÊN A: NGƯỜI SỬ DỤNG LAO ĐỘNG
  - Tên đơn vị: [Tên công ty]
  - Địa chỉ: [Địa chỉ công ty]
  - Đại diện bởi: [Người đại diện]
  - Chức vụ: [Chức vụ]
  
  ## BÊN B: NGƯỜI LAO ĐỘNG
  - Họ và tên: [Họ tên người lao động]
  - Ngày sinh: [Ngày sinh]
  - Số CMND/CCCD: [Số CMND/CCCD]
  - Địa chỉ: [Địa chỉ]
  
  Hai bên thỏa thuận ký kết hợp đồng lao động với các điều khoản sau:
  
  ### Điều 1: Công việc, địa điểm làm việc
  - Vị trí công việc: [Vị trí công việc]
  - Mô tả công việc: ${requirements}
  - Địa điểm làm việc: [Địa điểm làm việc]
  
  ### Điều 2: Thời hạn hợp đồng
  - Loại hợp đồng: [Loại hợp đồng]
  - Từ ngày: [Ngày bắt đầu]
  - Đến ngày: [Ngày kết thúc] (nếu có)
  
  ### Điều 3: Lương, phụ cấp và các khoản bổ sung khác
  - Mức lương chính: [Mức lương] VNĐ/tháng
  - Hình thức trả lương: [Hình thức trả lương]
  - Thời gian trả lương: [Thời gian trả lương]
  - Phụ cấp (nếu có): [Các khoản phụ cấp]
  
  ### Điều 4: Thời giờ làm việc, thời giờ nghỉ ngơi
  - Số giờ làm việc: [Số giờ] giờ/ngày, [Số ngày] ngày/tuần
  - Thời gian làm việc: [Thời gian làm việc]
  
  ### Điều 5: Bảo hiểm xã hội và bảo hiểm y tế
  - Người sử dụng lao động và người lao động phải đóng bảo hiểm xã hội, bảo hiểm y tế và bảo hiểm thất nghiệp theo quy định của pháp luật.
  
  ### Điều 6: Đào tạo, bồi dưỡng, nâng cao trình độ kỹ năng nghề
  - [Nội dung về đào tạo, bồi dưỡng]
  
  ### Điều 7: Chế độ nâng lương
  - [Nội dung về chế độ nâng lương]
  
  ### Điều 8: An toàn lao động, vệ sinh lao động
  - [Nội dung về an toàn lao động, vệ sinh lao động]
  
  ### Điều 9: Các thỏa thuận khác
  - [Các thỏa thuận khác]
  
  ### Điều 10: Hiệu lực hợp đồng
  - Hợp đồng lao động này có hiệu lực kể từ ngày [Ngày có hiệu lực]
  - Hợp đồng được lập thành 02 bản có giá trị pháp lý như nhau, mỗi bên giữ 01 bản.
  
  BÊN A                                                                                  BÊN B
  (Ký, ghi rõ họ tên)                                                              (Ký, ghi rõ họ tên)`
      } else if (documentType.toLowerCase().includes("đơn xin")) {
        response = `# ĐƠN XIN ${documentType.toUpperCase()}
  
  Kính gửi: - Ban Giám đốc [Tên công ty]
         - Phòng Nhân sự
         - Trưởng phòng [Tên phòng/ban]
  
  Tôi tên là: [Họ tên người lao động]
  Hiện đang công tác tại phòng/ban: [Tên phòng/ban]
  Vị trí: [Vị trí công việc]
  
  ${requirements}
  
  Trân trọng cảm ơn!
  
  [Địa điểm], ngày ... tháng ... năm ...
  Người làm đơn
  
  [Họ tên người lao động]`
      } else {
        response = `# ${documentType.toUpperCase()}
  
  ${requirements}
  
  [Nội dung văn bản được tạo theo yêu cầu của bạn]
  
  [Địa điểm], ngày ... tháng ... năm ...
  
  [Người ký tên]`
      }
  
      return new Response(response, {
        headers: {
          "Content-Type": "text/plain",
        },
      })
    } catch (error) {
      return new Response("Đã xảy ra lỗi khi tạo văn bản", {
        status: 500,
        headers: {
          "Content-Type": "text/plain",
        },
      })
    }
  }
  
  