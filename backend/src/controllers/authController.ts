import { Request, Response } from 'express';
import { AuthService } from '../services/authService';

/**
 * 회원가입
 * POST /api/auth/register
 */
export async function register(req: Request, res: Response): Promise<void> {
  try {
    const result = await AuthService.register(req.body);
    res.status(result.status).json(result.body);
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: '회원가입 중 오류가 발생했습니다.',
    });
  }
}

/**
 * 로그인
 * POST /api/auth/login
 */
export async function login(req: Request, res: Response): Promise<void> {
  try {
    const result = await AuthService.login(req.body);
    res.status(result.status).json(result.body);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: '로그인 중 오류가 발생했습니다.',
    });
  }
}

/**
 * 내 정보 조회
 * GET /api/auth/me
 */
export async function getMe(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user?.userId;
    const result = await AuthService.getMe(userId);
    res.status(result.status).json(result.body);
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      message: '사용자 정보 조회 중 오류가 발생했습니다.',
    });
  }
}

/**
 * 프로필 업데이트
 * PATCH /api/auth/profile
 */
export async function updateProfile(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user?.userId;
    const result = await AuthService.updateProfile(userId, req.body);
    res.status(result.status).json(result.body);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: '프로필 업데이트 중 오류가 발생했습니다.',
    });
  }
}

/**
 * 비밀번호 변경
 * POST /api/auth/change-password
 */
export async function changePassword(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user?.userId;
    const result = await AuthService.changePassword(userId, req.body);
    res.status(result.status).json(result.body);
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: '비밀번호 변경 중 오류가 발생했습니다.',
    });
  }
}
