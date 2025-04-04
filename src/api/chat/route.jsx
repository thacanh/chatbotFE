export async function POST(req) {
    try {
      const { messages } = await req.json()
  
      // In a real application, you would call an AI service here
      // This is a simple mock response
      const lastMessage = messages[messages.length - 1]
  
      // Simulate streaming with a delay
      await new Promise((resolve) => setTimeout(resolve, 1000))
  
      let response = "Xin chào! Tôi là trợ lý tư vấn Luật Lao động. "
  
      if (lastMessage.content.includes("thử việc")) {
        response +=
          "Theo Điều 24 Bộ luật Lao động 2019, thời gian thử việc không quá 180 ngày đối với công việc của người quản lý doanh nghiệp, 60 ngày đối với công việc chuyên môn kỹ thuật cao và 30 ngày đối với công việc khác."
      } else if (lastMessage.content.includes("nghỉ phép")) {
        response +=
          "Theo Điều 113 Bộ luật Lao động 2019, người lao động làm việc đủ 12 tháng thì được nghỉ phép năm hưởng nguyên lương như sau: 12 ngày làm việc đối với người làm công việc bình thường, 14 ngày làm việc đối với người làm công việc nặng nhọc, độc hại, nguy hiểm."
      } else if (lastMessage.content.includes("trợ cấp thôi việc")) {
        response +=
          "Theo Điều 46 Bộ luật Lao động 2019, khi chấm dứt hợp đồng lao động, người sử dụng lao động có trách nhiệm chi trả trợ cấp thôi việc cho người lao động đã làm việc thường xuyên từ đủ 12 tháng trở lên, mỗi năm làm việc được trợ cấp một nửa tháng tiền lương."
      } else if (lastMessage.content.includes("làm thêm giờ")) {
        response +=
          "Theo Điều 107 Bộ luật Lao động 2019, số giờ làm thêm không quá 50% số giờ làm việc bình thường trong 1 ngày, tổng số giờ làm việc bình thường và làm thêm không quá 12 giờ trong 1 ngày, không quá 40 giờ trong 1 tháng và tổng số không quá 200 giờ trong 1 năm."
      } else {
        response +=
          "Bạn có thể đặt câu hỏi cụ thể về Luật Lao động để tôi hỗ trợ tốt hơn. Ví dụ: thời gian thử việc, nghỉ phép năm, trợ cấp thôi việc, làm thêm giờ, v.v."
      }
  
      return new Response(
        JSON.stringify({
          role: "assistant",
          content: response,
        }),
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      )
    } catch (error) {
      return new Response(JSON.stringify({ error: "Internal Server Error" }), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      })
    }
  }
  
  