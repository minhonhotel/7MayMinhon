import nodemailer from 'nodemailer';

// Tạo Gmail transporter - tối ưu cho cả mobile và desktop
export const createGmailTransporter = () => {
  console.log('Sử dụng Gmail SMTP để gửi email');
  
  try {
    // Tạo transporter sử dụng Gmail SMTP với cài đặt nâng cao
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'tuan.ctw@gmail.com', // Email gửi
        pass: process.env.GMAIL_APP_PASSWORD // App Password từ Google
      },
      tls: {
        rejectUnauthorized: false // Cho phép SSL tự ký trên môi trường dev
      },
      connectionTimeout: 10000, // Tăng timeout lên 10 giây cho kết nối chậm trên mobile
      greetingTimeout: 10000, // Tăng timeout chào hỏi
      socketTimeout: 15000, // Tăng timeout cho socket
      debug: true, // Bật debug để xem thông tin chi tiết
      logger: true // Ghi log chi tiết
    });
  } catch (error) {
    console.error('Lỗi khi tạo Gmail transporter:', error);
    // Trả về test transporter nếu có lỗi
    return createTestTransporter();
  }
};

// Tạo một transporter test luôn trả về thành công (cho môi trường phát triển)
export const createTestTransporter = () => {
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
        response: 'Test email success' 
      };
    }
  };
};

// Trả về transporter phù hợp dựa trên cấu hình
export const createTransporter = () => {
  // Nếu có Gmail app password, sử dụng Gmail
  if (process.env.GMAIL_APP_PASSWORD) {
    return createGmailTransporter();
  }
  
  console.log('Không có cấu hình email hợp lệ, sử dụng transporter test');
  return createTestTransporter();
};

// Gửi email xác nhận đặt dịch vụ
export const sendServiceConfirmation = async (
  toEmail: string,
  serviceDetails: {
    serviceType: string;
    roomNumber: string;
    timestamp: Date;
    details: string;
    orderReference?: string;
  }
) => {
  try {
    // Chuẩn bị nội dung email HTML
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
        <h2 style="color: #333; text-align: center;">Mi Nhon Hotel Mui Ne</h2>
        <p style="text-align: center;">Xác nhận yêu cầu dịch vụ của quý khách</p>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
        
        ${serviceDetails.orderReference ? `<p><strong>Order Reference:</strong> ${serviceDetails.orderReference}</p>` : ''}
        <p><strong>Loại dịch vụ:</strong> ${serviceDetails.serviceType}</p>
        <p><strong>Phòng:</strong> ${serviceDetails.roomNumber}</p>
        <p><strong>Thời gian yêu cầu:</strong> ${serviceDetails.timestamp.toLocaleString('en-US', {
          timeZone: 'Asia/Ho_Chi_Minh',
          year: 'numeric', month: 'numeric', day: 'numeric',
          hour: '2-digit', minute: '2-digit', second: '2-digit'
        })}</p>
        <p><strong>Chi tiết:</strong></p>
        <p style="padding: 10px; background-color: #f9f9f9; border-radius: 5px;">${serviceDetails.details}</p>
        
        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
        <p style="text-align: center; color: #777; font-size: 14px;">
          Cảm ơn quý khách đã lựa chọn Mi Nhon Hotel Mui Ne.<br>
          Nếu cần hỗ trợ, vui lòng liên hệ lễ tân hoặc gọi số nội bộ 0.
        </p>
      </div>
    `;

    console.log('Gửi email với Gmail');
    
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
    
    // Gửi email
    try {
      const transporter = createTransporter();
      
      // Thiết lập thông tin gửi
      const mailOptions = {
        from: '"Mi Nhon Hotel" <tuan.ctw@gmail.com>',
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
      console.error('Lỗi khi gửi email qua Gmail:', emailError);
      
      // Cập nhật log
      emailLog.status = 'failed';
      console.log('EMAIL LOG (thất bại):', JSON.stringify(emailLog, null, 2));
      
      // Lưu lỗi chi tiết
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
    orderReference?: string;
  }
) => {
  try {
    // Tạo danh sách dịch vụ được yêu cầu
    const serviceRequestsHtml = callDetails.serviceRequests.length 
      ? callDetails.serviceRequests.map(req => `<li>${req}</li>`).join('') 
      : '<li>Không có yêu cầu cụ thể</li>';

    // Chuẩn bị nội dung email HTML (theo layout Review & Confirm)
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width:600px; margin:0 auto; padding:20px;">
        <div style="background-color:#ebf8ff; border-radius:8px; padding:20px; box-shadow:0 2px 6px rgba(0,0,0,0.1);">
          <h2 style="margin:0; color:#1e40af; text-align:center;">Mi Nhon Hotel Mui Ne</h2>
          <p style="margin:8px 0 16px; text-align:center; font-size:16px; color:#1e3a8a;">Tóm tắt cuộc gọi với trợ lý ảo</p>
          ${callDetails.orderReference ? `<p><strong>Mã tham chiếu:</strong> ${callDetails.orderReference}</p>` : ''}
          <p><strong>Phòng:</strong> ${callDetails.roomNumber}</p>
          <p><strong>Thời gian:</strong> ${callDetails.timestamp.toLocaleString('en-US', {
            timeZone: 'Asia/Ho_Chi_Minh',
            year: 'numeric', month: 'numeric', day: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit'
          })}</p>
          <p><strong>Thời lượng cuộc gọi:</strong> ${callDetails.duration}</p>

          <div style="background-color:#e0f2fe; border-radius:6px; padding:15px; margin:20px 0; line-height:1.5;">
            <h3 style="margin-top:0; color:#1e3a8a; font-size:18px;">Conversation Summary</h3>
            <p style="white-space:pre-wrap; color:#1e293b;">${callDetails.summary}</p>
          </div>

          <p style="text-align:center; color:#475569; font-size:14px;">
            Cảm ơn quý khách đã lựa chọn Mi Nhon Hotel Mui Ne.<br>
            Nếu cần hỗ trợ, vui lòng liên hệ lễ tân hoặc gọi số nội bộ 0.
          </p>
        </div>
      </div>
    `;

    console.log('Gửi email tóm tắt cuộc gọi qua Gmail');
    
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
      // Sử dụng transporter được cấu hình
      const transporter = createTransporter();
      
      // Thiết lập thông tin gửi
      const mailOptions = {
        from: '"Mi Nhon Hotel" <tuan.ctw@gmail.com>',
        to: toEmail,
        subject: `Mi Nhon Hotel - Tóm tắt yêu cầu từ phòng ${callDetails.roomNumber}`,
        html: emailHtml,
        text: `Tóm tắt cuộc gọi từ phòng ${callDetails.roomNumber}:\n\n${callDetails.summary}`
      };

      const result = await transporter.sendMail(mailOptions);
      console.log('Email tóm tắt đã gửi thành công:', result.response);
      
      // Cập nhật log
      emailLog.status = 'sent';
      console.log('EMAIL LOG (cập nhật):', JSON.stringify(emailLog, null, 2));
      
      return { success: true, messageId: result.messageId };
    } catch (emailError: unknown) {
      console.error('Lỗi khi gửi email tóm tắt qua Gmail:', emailError);
      
      // Cập nhật log
      emailLog.status = 'failed';
      console.log('EMAIL LOG (thất bại):', JSON.stringify(emailLog, null, 2));
      
      // Lưu thông tin tóm tắt vào console để người dùng có thể xem
      console.log('============ THÔNG TIN TÓM TẮT CUỘC GỌI ============');
      console.log('Thời gian:', callDetails.timestamp.toLocaleString('en-US', {
        timeZone: 'Asia/Ho_Chi_Minh',
        year: 'numeric', month: 'numeric', day: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
      }));
      console.log('Phòng:', callDetails.roomNumber);
      console.log('Thời lượng:', callDetails.duration);
      console.log('Order Reference:', callDetails.orderReference || 'Không có');
      console.log('Tóm tắt nội dung:');
      console.log(callDetails.summary);
      console.log('===================================================');
      
      throw emailError;
    }
  } catch (error) {
    console.error('Lỗi khi gửi email tóm tắt:', error);
    return { success: false, error };
  }
};