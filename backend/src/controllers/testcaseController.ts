import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';
import { parse } from 'csv-parse/sync';
import fs from 'fs';

// 폴더 경로 조회 헬퍼 함수
async function getFolderPath(folderId: string | null): Promise<{ id: string; name: string }[]> {
  if (!folderId) return [];
  
  const path: { id: string; name: string }[] = [];
  let currentId: string | null = folderId;
  
  while (currentId) {
    const folder: { id: string; name: string; parentId: string | null } | null = await prisma.folder.findUnique({
      where: { id: currentId },
      select: { id: true, name: true, parentId: true }
    });
    if (!folder) break;
    path.unshift({ id: folder.id, name: folder.name });
    currentId = folder.parentId;
  }
  
  return path;
}

// 폴더와 모든 하위 폴더 ID 조회
async function getAllDescendantFolderIds(folderId: string): Promise<string[]> {
  const folderIds: string[] = [folderId];
  
  async function getChildFolderIds(parentId: string): Promise<void> {
    const children = await prisma.folder.findMany({
      where: { parentId },
      select: { id: true }
    });
    
    for (const child of children) {
      folderIds.push(child.id);
      await getChildFolderIds(child.id);
    }
  }
  
  await getChildFolderIds(folderId);
  return folderIds;
}

// 테스트케이스 목록 조회
export async function getTestCases(req: Request, res: Response): Promise<void> {
  try {
    const { folderId } = req.query;
    
    let where: any = {};
    
    if (folderId) {
      // 선택된 폴더와 모든 하위 폴더의 ID 가져오기
      const allFolderIds = await getAllDescendantFolderIds(String(folderId));
      where = { folderId: { in: allFolderIds } };
    }

    const testCases = await prisma.testCase.findMany({
      where,
      include: {
        folder: {
          select: { id: true, name: true, parentId: true }
        }
      },
      orderBy: { sequence: 'asc' }
    });

    // 각 테스트케이스에 폴더 경로 추가
    const testCasesWithPath = await Promise.all(
      testCases.map(async (tc) => {
        const folderPath = await getFolderPath(tc.folderId);
        return {
          ...tc,
          folderPath
        };
      })
    );

    res.json({ success: true, data: testCasesWithPath });
  } catch (error) {
    console.error('Get testcases error:', error);
    res.status(500).json({ success: false, message: '테스트케이스 조회 실패' });
  }
}

// 다음 caseNumber 가져오기 (OVDR 형식 ID용)
async function getNextCaseNumber(): Promise<number> {
  const lastCase = await prisma.testCase.findFirst({
    orderBy: { caseNumber: 'desc' }
  });
  return (lastCase?.caseNumber || 0) + 1;
}

// 테스트케이스 생성
export async function createTestCase(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { title, description, precondition, steps, expectedResult, priority, automationType, folderId } = req.body;

    if (!title) {
      res.status(400).json({ success: false, message: '제목은 필수입니다.' });
      return;
    }

    // 같은 폴더 내의 마지막 sequence 조회
    const lastCase = await prisma.testCase.findFirst({
      where: { folderId: folderId || null },
      orderBy: { sequence: 'desc' }
    });
    const nextSequence = (lastCase?.sequence || 0) + 1;

    // 다음 caseNumber 가져오기
    const nextCaseNumber = await getNextCaseNumber();

    const testCase = await prisma.testCase.create({
      data: {
        caseNumber: nextCaseNumber,
        title,
        description,
        precondition,
        steps,
        expectedResult,
        priority: priority || 'MEDIUM',
        automationType: automationType || 'MANUAL',
        folderId: folderId || null,
        sequence: nextSequence
      }
    });

    res.status(201).json({ success: true, data: testCase });
  } catch (error) {
    console.error('Create testcase error:', error);
    res.status(500).json({ success: false, message: '테스트케이스 생성 실패' });
  }
}

// CSV Import
export async function importTestCases(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, message: 'CSV 파일이 필요합니다.' });
      return;
    }

    const { folderId, mapping } = req.body;
    const headerMapping = mapping ? JSON.parse(mapping) : {};

    const fileContent = fs.readFileSync(req.file.path, 'utf-8');
    
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    }) as any[];

    let successCount = 0;
    let failureCount = 0;
    const failures: any[] = [];

    const lastCase = await prisma.testCase.findFirst({
      where: { folderId: folderId || null },
      orderBy: { sequence: 'desc' }
    });
    let currentSequence = (lastCase?.sequence || 0);

    // 현재 최대 caseNumber 가져오기
    let currentCaseNumber = await getNextCaseNumber() - 1;

    const testCasesToCreate = [];

    for (const [index, row] of records.entries()) {
      try {
        const testCaseData: any = {
          folderId: folderId || null,
          priority: 'MEDIUM',
          automationType: 'MANUAL'
        };

        const dbFields = ['title', 'description', 'precondition', 'steps', 'expectedResult', 'priority', 'automationType'];
        
        if (Object.keys(headerMapping).length > 0) {
           for (const [csvHeader, dbField] of Object.entries(headerMapping)) {
             if (row[csvHeader]) {
               testCaseData[dbField as string] = row[csvHeader];
             }
           }
        } else {
          for (const field of dbFields) {
            if (row[field]) testCaseData[field] = row[field];
          }
        }

        if (!testCaseData.title) {
          throw new Error('제목(title)이 누락되었습니다.');
        }

        currentSequence += 1;
        currentCaseNumber += 1;
        testCaseData.sequence = currentSequence;
        testCaseData.caseNumber = currentCaseNumber;
        
        testCasesToCreate.push(testCaseData);
        successCount++;
      } catch (err: any) {
        failureCount++;
        failures.push({ row: index + 2, message: err.message, data: row });
      }
    }

    if (testCasesToCreate.length > 0) {
      await prisma.testCase.createMany({
        data: testCasesToCreate
      });
    }

    fs.unlinkSync(req.file.path);

    res.json({
      success: true,
      data: {
        successCount,
        failureCount,
        failures
      }
    });

  } catch (error) {
    console.error('Import CSV error:', error);
    res.status(500).json({ success: false, message: 'CSV Import 실패' });
  }
}

// 테스트케이스 수정
export async function updateTestCase(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { title, description, precondition, steps, expectedResult, priority, automationType } = req.body;

    const existingCase = await prisma.testCase.findUnique({ where: { id } });
    if (!existingCase) {
      res.status(404).json({ success: false, message: '테스트케이스를 찾을 수 없습니다.' });
      return;
    }

    const updatedCase = await prisma.testCase.update({
      where: { id },
      data: {
        title,
        description,
        precondition,
        steps,
        expectedResult,
        priority,
        automationType
      }
    });

    res.json({ success: true, data: updatedCase });
  } catch (error) {
    console.error('Update testcase error:', error);
    res.status(500).json({ success: false, message: '테스트케이스 수정 실패' });
  }
}

// 테스트케이스 삭제
export async function deleteTestCase(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const existingCase = await prisma.testCase.findUnique({ where: { id } });
    if (!existingCase) {
      res.status(404).json({ success: false, message: '테스트케이스를 찾을 수 없습니다.' });
      return;
    }

    await prisma.$transaction([
      prisma.planItem.deleteMany({ where: { testCaseId: id } }),
      prisma.testCase.delete({ where: { id } })
    ]);

    res.json({ success: true, message: '테스트케이스가 삭제되었습니다.' });
  } catch (error) {
    console.error('Delete testcase error:', error);
    res.status(500).json({ success: false, message: '테스트케이스 삭제 실패' });
  }
}

// 테스트케이스 순서 변경 (드래그 앤 드롭)
export async function reorderTestCases(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { folderId } = req.query;
    const { orderedIds } = req.body; // 새로운 순서대로 정렬된 ID 배열

    if (!orderedIds || !Array.isArray(orderedIds) || orderedIds.length === 0) {
      res.status(400).json({ success: false, message: '순서 변경할 테스트케이스 ID 목록이 필요합니다.' });
      return;
    }

    // 트랜잭션으로 모든 sequence 업데이트
    await prisma.$transaction(
      orderedIds.map((id: string, index: number) =>
        prisma.testCase.update({
          where: { id },
          data: { sequence: index + 1 }
        })
      )
    );

    // 업데이트된 목록 반환
    const where = folderId ? { folderId: String(folderId) } : {};
    const testCases = await prisma.testCase.findMany({
      where,
      orderBy: { sequence: 'asc' }
    });

    res.json({ success: true, data: testCases });
  } catch (error) {
    console.error('Reorder testcases error:', error);
    res.status(500).json({ success: false, message: '테스트케이스 순서 변경 실패' });
  }
}

// 테스트케이스 일괄 수정 (Bulk Update)
export async function bulkUpdateTestCases(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { ids, priority, automationType } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      res.status(400).json({ success: false, message: '수정할 테스트케이스 ID 목록이 필요합니다.' });
      return;
    }

    if (!priority && !automationType) {
      res.status(400).json({ success: false, message: '변경할 내용(priority 또는 automationType)을 선택해주세요.' });
      return;
    }

    // 업데이트할 데이터 구성
    const updateData: { priority?: string; automationType?: string } = {};
    if (priority) updateData.priority = priority;
    if (automationType) updateData.automationType = automationType;

    // 일괄 업데이트
    const updateResult = await prisma.testCase.updateMany({
      where: { id: { in: ids } },
      data: updateData
    });

    res.json({
      success: true,
      data: {
        count: updateResult.count,
        message: `${updateResult.count}개 테스트케이스가 수정되었습니다.`
      }
    });
  } catch (error) {
    console.error('Bulk update testcases error:', error);
    res.status(500).json({ success: false, message: '테스트케이스 일괄 수정 실패' });
  }
}

// 테스트케이스 일괄 삭제 (Bulk Delete)
export async function bulkDeleteTestCases(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      res.status(400).json({ success: false, message: '삭제할 테스트케이스 ID 목록이 필요합니다.' });
      return;
    }

    // 트랜잭션으로 관련 PlanItem 삭제 후 TestCase 삭제
    await prisma.$transaction([
      prisma.planItem.deleteMany({ where: { testCaseId: { in: ids } } }),
      prisma.testCase.deleteMany({ where: { id: { in: ids } } })
    ]);

    res.json({
      success: true,
      data: {
        count: ids.length,
        message: `${ids.length}개 테스트케이스가 삭제되었습니다.`
      }
    });
  } catch (error) {
    console.error('Bulk delete testcases error:', error);
    res.status(500).json({ success: false, message: '테스트케이스 일괄 삭제 실패' });
  }
}

// 테스트케이스 폴더 이동 (Bulk Move to Folder)
export async function moveTestCasesToFolder(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { ids, targetFolderId } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      res.status(400).json({ success: false, message: '이동할 테스트케이스 ID 목록이 필요합니다.' });
      return;
    }

    // targetFolderId가 null이면 루트로 이동, 아니면 해당 폴더로 이동
    const folderId = targetFolderId || null;

    // 대상 폴더가 존재하는지 확인 (null이 아닌 경우)
    if (folderId) {
      const folder = await prisma.folder.findUnique({ where: { id: folderId } });
      if (!folder) {
        res.status(404).json({ success: false, message: '대상 폴더를 찾을 수 없습니다.' });
        return;
      }
    }

    // 대상 폴더의 마지막 sequence 조회
    const lastCase = await prisma.testCase.findFirst({
      where: { folderId },
      orderBy: { sequence: 'desc' }
    });
    let nextSequence = (lastCase?.sequence || 0);

    // 각 테스트케이스를 순차적으로 이동 (sequence 부여)
    await prisma.$transaction(
      ids.map((id: string, index: number) =>
        prisma.testCase.update({
          where: { id },
          data: { 
            folderId,
            sequence: nextSequence + index + 1
          }
        })
      )
    );

    res.json({
      success: true,
      data: {
        count: ids.length,
        message: `${ids.length}개 테스트케이스가 이동되었습니다.`
      }
    });
  } catch (error) {
    console.error('Move testcases to folder error:', error);
    res.status(500).json({ success: false, message: '테스트케이스 폴더 이동 실패' });
  }
}