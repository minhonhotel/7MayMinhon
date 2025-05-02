# Hướng dẫn cài đặt và cấu hình

## Yêu cầu hệ thống

- Node.js (v18 trở lên)
- PostgreSQL (v14 trở lên)
- Tài khoản OpenAI API
- Tài khoản Vapi.ai

## Các bước cài đặt

### 1. Cài đặt dependencies

```bash
npm install
```

### 2. Cấu hình môi trường

Tạo file `.env` ở thư mục gốc với các thông tin sau:

```
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/minhotel

# API Keys
VITE_OPENAI_API_KEY=your_openai_api_key
VITE_OPENAI_PROJECT_ID=your_openai_project_id
VITE_VAPI_PUBLIC_KEY=your_vapi_public_key
VITE_VAPI_ASSISTANT_ID=your_vapi_assistant_id

# Email (Microsoft 365)
MS365_EMAIL=your_microsoft365_email@example.com
MS365_PASSWORD=your_microsoft365_password
```

### 3. Cấu hình cơ sở dữ liệu

Tạo cơ sở dữ liệu PostgreSQL:

```bash
createdb minhotel
```

Push schema lên cơ sở dữ liệu:

```bash
npm run db:push
```

### 4. Cấu hình Vapi Assistant

1. Đăng ký tài khoản tại [Vapi.ai](https://vapi.ai)
2. Tạo một assistant mới
3. Cấu hình assistant với prompt phù hợp cho khách sạn Mi Nhon
4. Lấy Assistant ID và Public Key từ dashboard
5. Cập nhật các giá trị này trong file `.env`

### 5. Khởi chạy ứng dụng

Phát triển:
```bash
npm run dev
```

Sản phẩm:
```bash
npm run build
npm start
```

## Một số vấn đề thường gặp

### Lỗi kết nối database

Nếu gặp lỗi "Connection refused", hãy kiểm tra:
- PostgreSQL đã được cài đặt và đang chạy
- Thông tin kết nối trong DATABASE_URL chính xác
- Cơ sở dữ liệu đã được tạo

### Lỗi API key không hợp lệ

Nếu thấy lỗi về API key, hãy kiểm tra:
- OpenAI API key còn hiệu lực và có đủ credit
- Vapi public key và assistant ID chính xác
- Các biến môi trường đã được cài đặt đúng cách