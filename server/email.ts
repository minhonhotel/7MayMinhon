import nodemailer from 'nodemailer';
import Mailjet from 'node-mailjet';

// Tạo một transporter test luôn trả về thành công (cho môi trường phát triển)
// Để khi gửi email bị lỗi, ứng dụng vẫn hoạt động bình thường
const createTestTransporter = () => {
  console.log('Sử dụng transporter test (không gửi email thực tế)');
  
  return {
    sendMail: async (mailOptions: any) => {
      console.log('=================== TEST EMAIL ===================');
      console.log('To:', mailOptions.to);
      console.log('Subject:', mailOptions.subject);
      console.log('From:', mailOptions.from);
      console.log('Content type:', mailOptions.html ? 'HTML' : 'Text');
      console.log('================= END TEST EMAIL =================');
      
      // Trả về một kết quả giả lập thành công
      return { 
        messageId: `test-${Date.now()}@example.com`,
        response: 'Test email sent successfully' 
      };
    }
  };
};

// Cấu hình Mailjet
export const createMailjetTransporter = () => {
  // Nếu không có thông tin đăng nhập Mailjet
  if (!process.env.MAILJET_API_KEY || !process.env.MAILJET_SECRET_KEY) {
    console.warn('MAILJET_API_KEY hoặc MAILJET_SECRET_KEY không được cấu hình - sử dụng test transporter');
    return createTestTransporter();
  }

  console.log('Sử dụng cấu hình Mailjet');
  
  try {
    // Tạo một wrapper cho Mailjet để sử dụng như nodemailer
    const mailjet = Mailjet.apiConnect(
      process.env.MAILJET_API_KEY,
      process.env.MAILJET_SECRET_KEY
    );
    
    // Trả về một đối tượng giống như nodemailer transporter
    return {
      sendMail: async (mailOptions: any) => {
        const { from, to, subject, html, text } = mailOptions;
        
        const data = {
          Messages: [
            {
              From: {
                Email: "tuan.ctw@gmail.com",
                Name: 'Mi Nhon Hotel - Voice Assistant'
              },
              To: [
                {
                  Email: to,
                  Name: 'Tuan Nguyen'
                }
              ],
              Subject: subject,
              TextPart: text || 'Nội dung email từ Mi Nhon Hotel Mui Ne',
              HTMLPart: html || '',
              CustomID: `minhon-hotel-${Date.now()}`
            }
          ]
        };
        
        try {
          const result = await mailjet.post('send', { version: 'v3.1' }).request(data as any);
          // Type assertion để tránh lỗi TypeScript
          const response = result.body as any;
          return {
            messageId: response.Messages[0].To[0].MessageID || `mailjet-${Date.now()}`,
            response: 'Email sent successfully with Mailjet'
          };
        } catch (error) {
          console.error('Lỗi khi gửi email qua Mailjet:', error);
          throw error;
        }
      }
    };
  } catch (error) {
    console.error('Lỗi khi tạo Mailjet transporter:', error);
    // Nếu có lỗi, sử dụng test transporter để tránh ứng dụng bị dừng
    return createTestTransporter();
  }
};

// Cấu hình transporter cho email
export const createTransporter = () => {
  // Sử dụng Mailjet làm dịch vụ gửi email mặc định
  return createMailjetTransporter();
};

// Gửi email xác nhận đặt dịch vụ
export const sendServiceConfirmation = async (
  toEmail: string,
  serviceDetails: {
    serviceType: string;
    roomNumber: string;
    timestamp: Date;
    details: string;
    orderReference?: string; // Thêm mã tham chiếu đơn hàng
  }
) => {
  try {
    // Chuẩn bị nội dung email HTML
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
        <h2 style="color: #333; text-align: center;">Mi Nhon Hotel Mui Ne</h2>
        <p style="text-align: center;">Xác nhận yêu cầu dịch vụ của quý khách</p>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
        
        ${serviceDetails.orderReference ? `<p><strong>Mã đơn hàng:</strong> ${serviceDetails.orderReference}</p>` : ''}
        <p><strong>Loại dịch vụ:</strong> ${serviceDetails.serviceType}</p>
        <p><strong>Phòng:</strong> ${serviceDetails.roomNumber}</p>
        <p><strong>Thời gian yêu cầu:</strong> ${serviceDetails.timestamp.toLocaleString()}</p>
        <p><strong>Chi tiết:</strong></p>
        <p style="padding: 10px; background-color: #f9f9f9; border-radius: 5px;">${serviceDetails.details}</p>
        
        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
        <p style="text-align: center; color: #777; font-size: 14px;">
          Cảm ơn quý khách đã lựa chọn Mi Nhon Hotel Mui Ne.<br>
          Nếu cần hỗ trợ, vui lòng liên hệ lễ tân hoặc gọi số nội bộ 0.
        </p>
      </div>
    `;

    console.log('Gửi email với Mailjet');
    
    // Tạo bản ghi log
    const emailLog = {
      timestamp: new Date(),
      toEmail,
      subject: `Mi Nhon Hotel - Xác nhận đặt dịch vụ từ phòng ${serviceDetails.roomNumber}`,
      status: 'pending',
      details: serviceDetails
    };
    
    // Lưu log vào console
    console.log('EMAIL LOG:', JSON.stringify(emailLog, null, 2));
    
    // Sử dụng nodemailer thay vì Mailjet trực tiếp
    // Gmail SMTP là một lựa chọn tốt khi Mailjet không hoạt động
    try {
      // Thử sử dụng Mailjet trước
      const transporter = createTransporter();
      
      // Địa chỉ email gửi đi
      const fromEmail = 'tuan.ctw@gmail.com';
      
      const mailOptions = {
        from: fromEmail,
        to: toEmail,
        subject: `Mi Nhon Hotel - Xác nhận đặt dịch vụ từ phòng ${serviceDetails.roomNumber}`,
        html: emailHtml,
      };

      const result = await transporter.sendMail(mailOptions);
      console.log('Email đã gửi thành công:', result.response);
      
      // Cập nhật log
      emailLog.status = 'sent';
      console.log('EMAIL LOG (cập nhật):', JSON.stringify(emailLog, null, 2));
      
      return { success: true, messageId: result.messageId };
    } catch (emailError: unknown) {
      console.error('Lỗi khi gửi email qua Mailjet:', emailError);
      
      // Cập nhật log
      emailLog.status = 'failed';
      console.log('EMAIL LOG (thất bại):', JSON.stringify(emailLog, null, 2));
      
      // Lưu lỗi vào console với định dạng dễ đọc
      console.log('============ CHI TIẾT LỖI GỬI EMAIL ============');
      console.log('Thời gian:', new Date().toISOString());
      console.log('Người nhận:', toEmail);
      console.log('Tiêu đề:', `Mi Nhon Hotel - Xác nhận đặt dịch vụ từ phòng ${serviceDetails.roomNumber}`);
      console.log('Lỗi:', emailError instanceof Error ? emailError.message : String(emailError));
      console.log('===================================================');
      
      throw emailError;
    }
  } catch (error) {
    console.error('Lỗi khi gửi email:', error);
    return { success: false, error };
  }
};

// Gửi email tóm tắt cuộc gọi
export const sendCallSummary = async (
  toEmail: string,
  callDetails: {
    callId: string;
    roomNumber: string;
    timestamp: Date;
    duration: string;
    summary: string;
    serviceRequests: string[];
    orderReference?: string; // Thêm mã tham chiếu đơn hàng
  }
) => {
  try {
    // Tạo danh sách dịch vụ được yêu cầu
    const serviceRequestsHtml = callDetails.serviceRequests.length 
      ? callDetails.serviceRequests.map(req => `<li>${req}</li>`).join('') 
      : '<li>Không có yêu cầu cụ thể</li>';

    // Chuẩn bị nội dung email HTML
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
        <h2 style="color: #333; text-align: center;">Mi Nhon Hotel Mui Ne</h2>
        <p style="text-align: center;">Tóm tắt cuộc gọi với trợ lý ảo</p>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
        
        ${callDetails.orderReference ? `<p><strong>Mã tham chiếu:</strong> ${callDetails.orderReference}</p>` : ''}
        <p><strong>Phòng:</strong> ${callDetails.roomNumber}</p>
        <p><strong>Thời gian:</strong> ${callDetails.timestamp.toLocaleString()}</p>
        <p><strong>Thời lượng cuộc gọi:</strong> ${callDetails.duration}</p>
        
        <p><strong>Tóm tắt nội dung:</strong></p>
        <p style="padding: 10px; background-color: #f9f9f9; border-radius: 5px;">${callDetails.summary}</p>
        
        <p><strong>Các dịch vụ được yêu cầu:</strong></p>
        <ul style="padding-left: 20px;">
          ${serviceRequestsHtml}
        </ul>
        
        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
        <p style="text-align: center; color: #777; font-size: 14px;">
          Cảm ơn quý khách đã lựa chọn Mi Nhon Hotel Mui Ne.<br>
          Nếu cần hỗ trợ, vui lòng liên hệ lễ tân hoặc gọi số nội bộ 0.
        </p>
      </div>
    `;

    console.log('Gửi email tóm tắt với Mailjet');
    
    // Tạo bản ghi log
    const emailLog = {
      timestamp: new Date(),
      toEmail,
      subject: `Mi Nhon Hotel - Tóm tắt yêu cầu từ phòng ${callDetails.roomNumber}`,
      status: 'pending',
      details: {
        roomNumber: callDetails.roomNumber,
        orderReference: callDetails.orderReference,
        duration: callDetails.duration,
        serviceCount: callDetails.serviceRequests.length
      }
    };
    
    // Lưu log vào console
    console.log('EMAIL LOG:', JSON.stringify(emailLog, null, 2));
    
    try {
      // Thử sử dụng transporter được cấu hình
      const transporter = createTransporter();
      
      // Địa chỉ email gửi đi, sử dụng email được xác thực
      const fromEmail = 'tuan.ctw@gmail.com';
      
      const mailOptions = {
        from: fromEmail,
        to: toEmail,
        subject: `Mi Nhon Hotel - Tóm tắt yêu cầu từ phòng ${callDetails.roomNumber}`,
        html: emailHtml,
      };

      const result = await transporter.sendMail(mailOptions);
      console.log('Email tóm tắt đã gửi thành công:', result.response);
      
      // Cập nhật log
      emailLog.status = 'sent';
      console.log('EMAIL LOG (cập nhật):', JSON.stringify(emailLog, null, 2));
      
      return { success: true, messageId: result.messageId };
    } catch (emailError: unknown) {
      console.error('Lỗi khi gửi email tóm tắt qua Mailjet:', emailError);
      
      // Cập nhật log
      emailLog.status = 'failed';
      console.log('EMAIL LOG (thất bại):', JSON.stringify(emailLog, null, 2));
      
      // Lưu thông tin tóm tắt vào console để người dùng có thể xem
      console.log('============ THÔNG TIN TÓM TẮT CUỘC GỌI ============');
      console.log('Thời gian:', callDetails.timestamp.toLocaleString());
      console.log('Phòng:', callDetails.roomNumber);
      console.log('Thời lượng:', callDetails.duration);
      console.log('Mã tham chiếu:', callDetails.orderReference || 'Không có');
      console.log('Tóm tắt nội dung:');
      console.log(callDetails.summary);
      console.log('Các dịch vụ được yêu cầu:');
      callDetails.serviceRequests.forEach((req, index) => {
        console.log(`  ${index + 1}. ${req}`);
      });
      console.log('===================================================');
      
      throw emailError;
    }
  } catch (error) {
    console.error('Lỗi khi gửi email tóm tắt:', error);
    return { success: false, error };
  }
};