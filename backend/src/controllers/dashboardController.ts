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

// 새로운 Overview 통계 API
export async function getOverviewStats(req: AuthRequest, res: Response) {
  try {
    const [activePlansCount, manualCases, automatedCases] = await prisma.$transaction([
      prisma.plan.count({ where: { status: 'ACTIVE' } }),
      prisma.testCase.count({ where: { automationType: 'MANUAL' } }),
      prisma.testCase.count({ where: { automationType: 'AUTOMATED' } })
    ]);

    const totalCases = manualCases + automatedCases;
    const manualRatio = totalCases > 0 ? Math.round((manualCases / totalCases) * 100) : 0;
    const automatedRatio = totalCases > 0 ? Math.round((automatedCases / totalCases) * 100) : 0;

    res.json({
      success: true,
      data: {
        activePlans: activePlansCount,
        manualCases,
        automatedCases,
        ratio: {
          manual: manualRatio,
          automated: automatedRatio
        }
      }
    });
  } catch (error) {
    console.error('Overview stats error:', error);
    res.status(500).json({ success: false, message: 'Overview 통계 조회 실패' });
  }
}

// Active Test Plans 카드 데이터 API
export async function getActivePlans(req: AuthRequest, res: Response) {
  try {
    const activePlans = await prisma.plan.findMany({
      where: { status: 'ACTIVE' },
      include: {
        items: {
          select: {
            id: true,
            result: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const planCards = activePlans.map(plan => {
      const items = plan.items;
      const totalItems = items.length;
      
      // Status counts 계산
      const statusCounts = {
        pass: items.filter(item => item.result === 'PASS').length,
        fail: items.filter(item => item.result === 'FAIL').length,
        block: items.filter(item => item.result === 'BLOCK').length,
        untested: items.filter(item => item.result === 'NOT_RUN').length,
        inProgress: items.filter(item => item.result === 'IN_PROGRESS').length
      };

      // Progress 계산 (PASS + FAIL + BLOCK을 완료된 것으로 간주)
      const completedCount = statusCounts.pass + statusCounts.fail + statusCounts.block;
      const progress = totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0;

      return {
        id: plan.id,
        title: plan.name,
        description: plan.description || '',
        caseCount: totalItems,
        statusCounts,
        progress,
        createdBy: plan.createdBy,
        createdAt: plan.createdAt
      };
    });

    res.json({
      success: true,
      data: planCards
    });
  } catch (error) {
    console.error('Active plans error:', error);
    res.status(500).json({ success: false, message: 'Active Plans 조회 실패' });
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




