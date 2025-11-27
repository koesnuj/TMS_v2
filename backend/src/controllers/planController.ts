import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

// 플랜 생성
export async function createPlan(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { name, description, testCaseIds, assignee } = req.body;

    if (!name || !testCaseIds || !Array.isArray(testCaseIds) || testCaseIds.length === 0) {
      res.status(400).json({ success: false, message: '플랜 이름과 테스트케이스 선택은 필수입니다.' });
      return;
    }

    const createdBy = req.user?.email || 'Unknown';

    const plan = await prisma.$transaction(async (tx) => {
      const newPlan = await tx.plan.create({
        data: {
          name,
          description,
          createdBy,
          status: 'ACTIVE',
        }
      });

      const planItemsData = testCaseIds.map((tcId: string) => ({
        planId: newPlan.id,
        testCaseId: tcId,
        assignee: assignee || null,
        result: 'NOT_RUN'
      }));

      await tx.planItem.createMany({
        data: planItemsData
      });

      return newPlan;
    });

    res.status(201).json({ success: true, data: plan });
  } catch (error) {
    console.error('Create plan error:', error);
    res.status(500).json({ success: false, message: '플랜 생성 중 오류가 발생했습니다.' });
  }
}

// 플랜 목록 조회
export async function getPlans(req: Request, res: Response): Promise<void> {
  try {
    const { status } = req.query;
    const where = status ? { status: String(status) } : {};

    const plans = await prisma.plan.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          select: { result: true }
        }
      }
    });

    const data = plans.map(plan => {
      const total = plan.items.length;
      const pass = plan.items.filter(i => i.result === 'PASS').length;
      const fail = plan.items.filter(i => i.result === 'FAIL').length;
      const block = plan.items.filter(i => i.result === 'BLOCK').length;
      const notRun = plan.items.filter(i => i.result === 'NOT_RUN').length;
      
      // 진행률: (전체 - 미실행) / 전체
      const runCount = total - notRun;
      const progress = total > 0 ? Math.round((runCount / total) * 100) : 0;

      // items 배열은 응답에서 제외하거나 간소화
      const { items, ...planInfo } = plan;

      return {
        ...planInfo,
        stats: { total, pass, fail, block, notRun, progress }
      };
    });

    res.json({ success: true, data });
  } catch (error) {
    console.error('Get plans error:', error);
    res.status(500).json({ success: false, message: '플랜 목록을 불러오는데 실패했습니다.' });
  }
}

// 플랜 상세 조회
export async function getPlanDetail(req: Request, res: Response): Promise<void> {
  try {
    const { planId } = req.params;

    const plan = await prisma.plan.findUnique({
      where: { id: planId },
      include: {
        items: {
          include: {
            testCase: true
          },
          // 정렬: 테스트케이스의 sequence 순
          orderBy: { testCase: { sequence: 'asc' } } 
        }
      }
    });

    if (!plan) {
      res.status(404).json({ success: false, message: '플랜을 찾을 수 없습니다.' });
      return;
    }

    res.json({ success: true, data: plan });
  } catch (error) {
    console.error('Get plan detail error:', error);
    res.status(500).json({ success: false, message: '플랜 상세 정보를 불러오는데 실패했습니다.' });
  }
}

// PlanItem 개별 업데이트
export async function updatePlanItem(req: Request, res: Response): Promise<void> {
  try {
    const { planId, itemId } = req.params;
    const { result, comment } = req.body;

    const item = await prisma.planItem.findUnique({
      where: { id: itemId }
    });

    if (!item) {
      res.status(404).json({ success: false, message: 'PlanItem을 찾을 수 없습니다.' });
      return;
    }

    // Update data preparation
    const updateData: any = {};
    if (result !== undefined) {
      updateData.result = result;
      // If result is not NOT_RUN, update executedAt
      if (result !== 'NOT_RUN') {
        updateData.executedAt = new Date();
      }
    }
    if (comment !== undefined) {
      updateData.comment = comment;
    }

    const updatedItem = await prisma.planItem.update({
      where: { id: itemId },
      data: updateData
    });

    res.json({ success: true, data: updatedItem });
  } catch (error) {
    console.error('Update plan item error:', error);
    res.status(500).json({ success: false, message: '테스트 결과 업데이트 중 오류가 발생했습니다.' });
  }
}

// PlanItem 벌크 업데이트
export async function bulkUpdatePlanItems(req: Request, res: Response): Promise<void> {
  try {
    const { planId } = req.params;
    const { items, result, comment } = req.body; // items: array of planItemIds

    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ success: false, message: '변경할 항목을 선택해주세요.' });
      return;
    }

    if (!result) {
       res.status(400).json({ success: false, message: '변경할 결과를 선택해주세요.' });
       return;
    }

    const updateData: any = {
      result
    };

    if (result !== 'NOT_RUN') {
      updateData.executedAt = new Date();
    }

    if (comment !== undefined) {
      updateData.comment = comment;
    }

    // Transaction is not strictly necessary for updateMany but good for consistency if we needed more complex logic.
    // updateMany is sufficient here.
    const updateResult = await prisma.planItem.updateMany({
      where: {
        id: { in: items },
        planId: planId // Ensure items belong to this plan
      },
      data: updateData
    });

    res.json({ 
      success: true, 
      data: { 
        count: updateResult.count,
        message: `${updateResult.count}개 항목이 업데이트되었습니다.` 
      } 
    });
  } catch (error) {
    console.error('Bulk update plan items error:', error);
    res.status(500).json({ success: false, message: '일괄 업데이트 중 오류가 발생했습니다.' });
  }
}

