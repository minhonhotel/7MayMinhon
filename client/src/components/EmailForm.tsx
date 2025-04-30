import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from '@/lib/queryClient';

interface EmailFormProps {
  summaryContent: string;
  serviceRequests: any[];
  roomNumber: string;
}

export function EmailForm({ summaryContent, serviceRequests, roomNumber }: EmailFormProps) {
  const [email, setEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      setError('Vui lòng nhập địa chỉ email hợp lệ');
      return;
    }
    
    setIsSending(true);
    setError(null);
    
    try {
      const requestData = {
        toEmail: email,
        callDetails: {
          roomNumber: roomNumber || 'Không xác định',
          timestamp: new Date(),
          duration: '0:00', // Có thể cập nhật từ trạng thái cuộc gọi
          summary: summaryContent,
          serviceRequests: serviceRequests.map(req => 
            `${req.serviceType}: ${req.requestText || 'Không có thông tin chi tiết'}`
          )
        }
      };
      
      const response = await apiRequest({
        url: '/api/send-call-summary-email',
        method: 'POST',
        body: requestData
      }) as any;
      
      if (response && response.success) {
        toast({
          title: 'Gửi email thành công',
          description: 'Tóm tắt cuộc gọi đã được gửi đến email của bạn.',
          variant: 'default',
        });
        setEmail(''); // Clear input after success
      } else {
        throw new Error('Không gửi được email');
      }
    } catch (err) {
      console.error('Lỗi khi gửi email:', err);
      setError('Không thể gửi email. Vui lòng thử lại sau.');
      toast({
        title: 'Lỗi',
        description: 'Không thể gửi email. Vui lòng thử lại sau.',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto mt-6">
      <CardHeader>
        <CardTitle>Gửi tóm tắt qua email</CardTitle>
        <CardDescription>
          Nhận bản ghi chi tiết của cuộc trò chuyện và các yêu cầu dịch vụ
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <div className="grid w-full items-center gap-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="email">Địa chỉ email</Label>
              <Input
                id="email"
                placeholder="khachhang@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                required
              />
            </div>
          </div>
          
          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <Button 
            className="w-full mt-4" 
            type="submit" 
            disabled={isSending || !email}
          >
            {isSending ? 'Đang gửi...' : 'Gửi email'}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center text-xs text-muted-foreground">
        Mi Nhon Hotel Mui Ne sẽ không lưu email của bạn cho mục đích tiếp thị.
      </CardFooter>
    </Card>
  );
}