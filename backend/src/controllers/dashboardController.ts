import { Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

export async function getDashboardStats(req: AuthRequest, res: Response) {
  try {
    // 병렬로 통계 데이터 조회
    const [totalTestCases, activePlans, totalPlanItems, myAssignedCount] = await prisma.$transaction([
      prisma.testCase.count(),
      prisma.plan.count({ where: { status: 'ACTIVE' } }),
      prisma.planItem.count(),
      prisma.planItem.count({
        where: {
          assignee: req.user?.name, // Assignee는 이름으로 저장됨
          result: { in: ['NOT_RUN', 'IN_PROGRESS', 'BLOCK'] }
        }
      })
    ]);

    res.json({
      success: true,
      data: {
        totalTestCases,
        activePlans,
        totalPlanItems,
        myAssignedCount
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ success: false, message: '대시보드 통계 조회 실패' });
  }
}

export async function getMyAssignments(req: AuthRequest, res: Response) {
  try {
    const myAssignments = await prisma.planItem.findMany({
      where: {
        assignee: req.user?.name,
        result: { in: ['NOT_RUN', 'IN_PROGRESS', 'BLOCK'] }
      },
      include: {
        testCase: {
          select: { title: true, priority: true }
        },
        plan: {
          select: { name: true, id: true }
        }
      },
      orderBy: { updatedAt: 'desc' },
      take: 10
    });

    res.json({ success: true, data: myAssignments });
  } catch (error) {
    console.error('My assignments error:', error);
    res.status(500).json({ success: false, message: '내 할당 목록 조회 실패' });
  }
}

export async function getRecentActivity(req: AuthRequest, res: Response) {
  try {
    // 최근 실행된 테스트 결과 (PlanItem 업데이트 기준)
    const recentActivities = await prisma.planItem.findMany({
      where: {
        executedAt: { not: null }
      },
      include: {
        testCase: {
          select: { title: true }
        },
        plan: {
          select: { name: true, id: true }
        }
      },
      orderBy: { executedAt: 'desc' },
      take: 10
    });

    res.json({ success: true, data: recentActivities });
  } catch (error) {
    console.error('Recent activity error:', error);
    res.status(500).json({ success: false, message: '최근 활동 조회 실패' });
  }
}

