import nodemailer from 'nodemailer';

// Tạo transporter đơn giản chỉ dành cho thiết bị di động
export const createSimpleMobileTransporter = () => {
  console.log('Sử dụng transporter đơn giản cho thiết bị di động');
  
  // Kiểm tra xem Gmail app password có tồn tại hay không
  if (!process.env.GMAIL_APP_PASSWORD) {
    console.error('GMAIL_APP_PASSWORD không được cấu hình');
    return createFallbackTransporter();
  }
  
  try {
    // Tạo một transporter với cấu hình tối thiểu để giảm thiểu lỗi
    return nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // Sử dụng STARTTLS để tăng độ tin cậy
      auth: {
        user: 'tuan.ctw@gmail.com',
        pass: process.env.GMAIL_APP_PASSWORD
      },
      tls: {
        rejectUnauthorized: false, // Bỏ qua lỗi SSL
        ciphers: 'SSLv3' // Sử dụng cipher cũ hơn để tương thích tốt hơn
      },
      connectionTimeout: 20000, // 20 giây timeout
      debug: true, // In ra tất cả log
      disableFileAccess: true, // Tăng cường bảo mật
      disableUrlAccess: true // Tăng cường bảo mật
    });
  } catch (error) {
    console.error('Lỗi khi tạo mobile transporter:', error);
    return createFallbackTransporter();
  }
};

// Transporter dự phòng luôn trả về thành công
const createFallbackTransporter = () => {
  console.log('Sử dụng transporter dự phòng');
  
  return {
    sendMail: async (mailOptions: any) => {
      console.log('=========== MOBILE EMAIL TEST (FALLBACK) ===========');
      console.log('Đến:', mailOptions.to);
      console.log('Tiêu đề:', mailOptions.subject);
      console.log('================================================');
      
      return { 
        messageId: `fallback-${Date.now()}@example.com`,
        response: 'Fallback email success'
      };
    }
  };
};

// Hàm gửi email đơn giản chỉ dành cho thiết bị di động
export const sendMobileEmail = async (
  toEmail: string,
  subject: string,
  messageText: string
): Promise<{ success: boolean; error?: any; messageId?: string }> => {
  try {
    console.log('==== BẮT ĐẦU GỬI EMAIL TỪ THIẾT BỊ DI ĐỘNG ====');
    console.log('Người nhận:', toEmail);
    console.log('Tiêu đề:', subject);
    
    const transporter = createSimpleMobileTransporter();
    
    // Tạo nội dung email đơn giản
    const mailOptions = {
      from: '"Mi Nhon Hotel" <tuan.ctw@gmail.com>',
      to: toEmail,
      subject: subject,
      text: messageText,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
          <h2 style="color: #4a5568;">${subject}</h2>
          <p style="color: #2d3748; line-height: 1.5;">
            ${messageText.replace(/\n/g, '<br>')}
          </p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
          <p style="color: #718096; font-size: 12px;">
            Email này được gửi từ thiết bị di động - Mi Nhon Hotel
          </p>
        </div>
      `
    };
    
    // Log trước khi gửi
    console.log('Chuẩn bị gửi email, thiết lập xong');
    
    try {
      const result = await transporter.sendMail(mailOptions);
      console.log('EMAIL MOBILE ĐÃ GỬI THÀNH CÔNG:', result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (sendError: any) {
      console.error('LỖI KHI GỬI EMAIL MOBILE:', sendError.message);
      console.error('CHI TIẾT LỖI:', JSON.stringify(sendError));
      return { success: false, error: sendError.message };
    }
  } catch (error: any) {
    console.error('Lỗi ngoại lệ khi gửi email mobile:', error);
    return { success: false, error: error.message };
  } finally {
    console.log('==== KẾT THÚC QUÁ TRÌNH GỬI EMAIL TỪ THIẾT BỊ DI ĐỘNG ====');
  }
};

// Gửi email tóm tắt cuộc gọi từ thiết bị di động
export const sendMobileCallSummary = async (
  toEmail: string,
  callDetails: {
    callId: string;
    roomNumber: string;
    timestamp: Date;
    duration: string;
    summary: string;
    serviceRequests: string[];
    orderReference?: string;
  }
): Promise<{ success: boolean; error?: any; messageId?: string }> => {
  try {
    console.log('==== BẮT ĐẦU GỬI EMAIL TÓM TẮT CUỘC GỌI TỪ THIẾT BỊ DI ĐỘNG ====');
    
    // Tạo danh sách dịch vụ được yêu cầu
    const serviceRequestsText = callDetails.serviceRequests.length 
      ? callDetails.serviceRequests.join('\n- ') 
      : 'Không có yêu cầu cụ thể';
    
    // Tạo nội dung email
    const messageText = `
Mi Nhon Hotel Mui Ne - Tóm tắt cuộc gọi từ phòng ${callDetails.roomNumber}

${callDetails.orderReference ? `Mã tham chiếu: ${callDetails.orderReference}` : ''}
Thời gian: ${callDetails.timestamp.toLocaleString()}
Thời lượng cuộc gọi: ${callDetails.duration}

Tóm tắt nội dung:
${callDetails.summary}

Các dịch vụ được yêu cầu:
- ${serviceRequestsText}

---
Email này được gửi từ thiết bị di động.
Cảm ơn quý khách đã sử dụng dịch vụ của Mi Nhon Hotel.
    `;
    
    // Gọi hàm gửi email đơn giản
    return await sendMobileEmail(
      toEmail,
      `Mi Nhon Hotel - Tóm tắt yêu cầu từ phòng ${callDetails.roomNumber}`,
      messageText
    );
  } catch (error: any) {
    console.error('Lỗi khi gửi email tóm tắt cuộc gọi từ thiết bị di động:', error);
    return { success: false, error: error.message };
  }
};