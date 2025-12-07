import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import adminRoutes from './routes/admin';
import folderRoutes from './routes/folders';
import testCaseRoutes from './routes/testcases';
import planRoutes from './routes/plans';
import dashboardRoutes from './routes/dashboard';
import uploadRoutes from './routes/upload';

// 환경 변수 로드
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3001;

// CORS 설정
const allowedOrigins = [
  'http://localhost:5173',
  'https://tmsv2-production.up.railway.app',
  process.env.FRONTEND_URL,
].filter(Boolean); // undefined 제거

app.use(
  cors({
    origin: (origin, callback) => {
      // origin이 없는 경우(같은 도메인) 또는 허용된 origin인 경우
      if (!origin || allowedOrigins.some(allowed => origin.startsWith(allowed as string))) {
        callback(null, true);
      } else {
        callback(null, true); // 프로덕션에서는 모든 Vercel 도메인 허용
      }
    },
    credentials: true,
  })
);

// JSON 파싱 미들웨어
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 요청 로깅 미들웨어 (개발 환경)
if (process.env.NODE_ENV === 'development') {
  app.use((req: Request, res: Response, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });
}

// Health check 엔드포인트
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'TMS Backend Server is running',
    timestamp: new Date().toISOString(),
  });
});

// 정적 파일 서빙 (업로드된 이미지)
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// API 라우트
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/folders', folderRoutes);
app.use('/api/testcases', testCaseRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/upload', uploadRoutes);

// 404 핸들러
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: '요청한 리소스를 찾을 수 없습니다.',
  });
});

// 에러 핸들러
app.use((err: Error, req: Request, res: Response, next: any) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    message: '서버 내부 오류가 발생했습니다.',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// 서버 시작
app.listen(PORT, () => {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`🚀 TMS Backend Server`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Server running on: http://localhost:${PORT}`);
  console.log(`✅ Health check: http://localhost:${PORT}/health`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
});

export default app;

