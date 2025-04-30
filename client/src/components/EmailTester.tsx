import React, { useState } from 'react';

const EmailTester: React.FC = () => {
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('tuans2@gmail.com');

  const sendTestEmail = async () => {
    try {
      setSending(true);
      setResult(null);
      setError(null);

      console.log('Sending test email to:', email);
      
      // Get device info
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      console.log('Device type:', isMobile ? 'mobile' : 'desktop');
      
      // First try the regular endpoint
      try {
        const response = await fetch('/api/test-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            toEmail: email,
            isMobile: isMobile
          }),
          cache: 'no-cache',
        });
        
        const data = await response.json();
        
        if (data.success) {
          setResult(`Email sent successfully using standard method! Provider: ${data.provider || 'unknown'}`);
          setSending(false);
          return;
        } else {
          console.warn('Standard method failed, trying mobile-specific endpoint');
        }
      } catch (err) {
        console.error('Error with standard endpoint:', err);
      }
      
      // Luôn thử cả phương thức tiêu chuẩn và phương thức dành cho thiết bị di động
      try {
        console.log('Thử sử dụng endpoint dành riêng cho di động...');
        // Mở rộng phát hiện thiết bị di động
        const isMobile = /iPhone|iPad|iPod|Android|Mobile|webOS|BlackBerry/i.test(navigator.userAgent);
        
        // Thêm timestamp để ngăn cache
        const timestamp = new Date().getTime();
        const mobileResponse = await fetch(`/api/mobile-test-email?_=${timestamp}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Device-Type': isMobile ? 'mobile' : 'desktop',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          },
          body: JSON.stringify({
            toEmail: email,
            timestamp: timestamp,
            deviceInfo: navigator.userAgent
          }),
          cache: 'no-cache',
          credentials: 'same-origin',
          keepalive: true // Duy trì kết nối ngay cả khi chuyển trang
        });
        
        const mobileData = await mobileResponse.json();
        
        if (mobileData.success) {
          setResult(`Email đang được xử lý qua endpoint tối ưu hóa cho ${isMobile ? 'di động' : 'desktop'}! Vui lòng kiểm tra hộp thư sau vài giây.`);
          
          // Gửi thông báo đến console để kiểm tra
          console.log(`Đã gửi yêu cầu thành công đến ${isMobile ? 'mobile' : 'desktop'} endpoint.`);
          console.log('Response:', mobileData);
        } else {
          throw new Error(mobileData.error || 'Lỗi không xác định với endpoint di động');
        }
      } catch (mobileErr: any) {
        console.error('Chi tiết lỗi mobile endpoint:', mobileErr);
        setError(`Không thể gửi email: ${mobileErr?.message || 'Lỗi không xác định'}`);
      }
      
      setSending(false);
    } catch (err: any) {
      console.error('Error sending test email:', err);
      setError(`Error: ${err?.message || 'Unknown error'}`);
      setSending(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg shadow-md bg-white max-w-md mx-auto mt-4">
      <h2 className="text-xl font-bold mb-4 text-primary">Kiểm tra Email trên Di động</h2>
      
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Email người nhận:</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 border rounded focus:ring-2 focus:ring-primary"
          placeholder="example@gmail.com"
        />
      </div>

      <button
        onClick={sendTestEmail}
        disabled={sending}
        className={`w-full p-3 rounded font-medium text-white ${
          sending ? 'bg-gray-400' : 'bg-primary hover:bg-primary/90'
        }`}
      >
        {sending ? 'Đang gửi...' : 'Gửi Email Kiểm tra'}
      </button>

      {result && (
        <div className="mt-4 p-3 bg-green-100 text-green-800 rounded">
          {result}
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 bg-red-100 text-red-800 rounded">
          {error}
        </div>
      )}
      
      <div className="mt-4 text-sm text-gray-500">
        <p>
          * Công cụ này giúp kiểm tra việc gửi email trên thiết bị di động.
          Nếu phương thức tiêu chuẩn không hoạt động, hệ thống sẽ tự động thử
          phương thức tối ưu hóa cho di động.
        </p>
      </div>
    </div>
  );
};

export default EmailTester;