import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface JwtPayload {
  [key: string]: any;
}

export function verifyJWT(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing or invalid authorization header' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error('JWT_SECRET is not defined in environment');
      return res.status(500).json({ message: 'Internal server error' });
    }
    const payload = jwt.verify(token, secret) as JwtPayload;
    // Gắn payload lên request để sử dụng ở các middleware/route sau
    (req as any).user = payload;
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
} 