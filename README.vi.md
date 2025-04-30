# Mi Nhon Hotel Mui Ne - Trợ lý Giọng nói

Ứng dụng web hỗ trợ giọng nói cho Mi Nhon Hotel Mui Ne, được thiết kế để tối ưu hóa tương tác với khách hàng thông qua giao diện dịch vụ thông minh, tối giản với khả năng quản lý cuộc gọi nâng cao và trải nghiệm người dùng cá nhân hóa.

## Tính năng

- Giao diện giọng nói AI được hỗ trợ bởi Vapi.ai
- Ghi chép cuộc hội thoại theo thời gian thực
- Hỗ trợ nhiều ngôn ngữ (Tiếng Anh và Tiếng Việt)
- Phân loại yêu cầu dịch vụ tự động
- Giao diện người dùng trực quan, tối giản
- Lịch sử cuộc gọi và theo dõi đơn hàng
- Hỗ trợ nhiều yêu cầu dịch vụ trong một cuộc hội thoại

## Công nghệ sử dụng

- **Frontend**: React, TypeScript, TailwindCSS
- **Backend**: Express.js, Node.js
- **Cơ sở dữ liệu**: PostgreSQL với Drizzle ORM
- **Dịch vụ AI**: OpenAI GPT-4o, Vapi AI
- **Ngôn ngữ**: TypeScript/JavaScript

## Bắt đầu

### Yêu cầu hệ thống

- Node.js (v18 trở lên)
- PostgreSQL database
- OpenAI API key
- Vapi.ai API key và assistant ID

### Cài đặt

1. Clone repository
   ```bash
   git clone https://github.com/your-username/MiNhon-Hotel-MUiNe.git
   cd MiNhon-Hotel-MUiNe
   ```

2. Cài đặt dependencies
   ```bash
   npm install
   ```

3. Tạo file `.env` với các biến sau:
   ```
   DATABASE_URL=your_postgresql_connection_string
   OPENAI_API_KEY=your_openai_api_key
   VITE_VAPI_PUBLIC_KEY=your_vapi_public_key
   VITE_VAPI_ASSISTANT_ID=your_vapi_assistant_id
   MS365_EMAIL=your_email_address
   MS365_PASSWORD=your_email_app_password
   ```

4. Cập nhật schema cơ sở dữ liệu
   ```bash
   npm run db:push
   ```

5. Khởi động máy chủ development
   ```bash
   npm run dev
   ```

## Cách sử dụng

Ứng dụng cung cấp giao diện đơn giản cho khách sạn để:
- Yêu cầu dịch vụ phòng, dọn phòng, lễ tân, v.v.
- Nhận thông tin về tiện nghi khách sạn, điểm tham quan địa phương, và hơn thế nữa
- Tạo yêu cầu hoặc sắp xếp đặc biệt
- Xem tóm tắt cuộc trò chuyện bằng tiếng Anh hoặc tiếng Việt
- Gửi tóm tắt cuộc gọi qua email

## Giấy phép

Dự án này là tài sản riêng và bảo mật. Việc sao chép, phân phối hoặc sử dụng trái phép đều bị nghiêm cấm.

## Liên hệ

Mọi thắc mắc, vui lòng liên hệ: [tuan.ctw@gmail.com](mailto:tuan.ctw@gmail.com)