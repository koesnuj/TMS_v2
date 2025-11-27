import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';
import { parse } from 'csv-parse/sync';
import fs from 'fs';

// 테스트케이스 목록 조회
export async function getTestCases(req: Request, res: Response): Promise<void> {
  try {
    const { folderId } = req.query;
    const where = folderId ? { folderId: String(folderId) } : {};

    const testCases = await prisma.testCase.findMany({
      where,
      orderBy: { sequence: 'asc' }
    });

    res.json({ success: true, data: testCases });
  } catch (error) {
    console.error('Get testcases error:', error);
    res.status(500).json({ success: false, message: '테스트케이스 조회 실패' });
  }
}

// 테스트케이스 생성
export async function createTestCase(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { title, description, precondition, steps, expectedResult, priority, folderId } = req.body;

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

    const testCase = await prisma.testCase.create({
      data: {
        title,
        description,
        precondition,
        steps,
        expectedResult,
        priority: priority || 'MEDIUM',
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
    // mapping: JSON string "{\"제목\":\"title\", \"우선순위\":\"priority\"}"
    const headerMapping = mapping ? JSON.parse(mapping) : {};

    const fileContent = fs.readFileSync(req.file.path, 'utf-8');
    
    // CSV 파싱
    const records = parse(fileContent, {
      columns: true, // 첫 줄을 헤더로 사용
      skip_empty_lines: true,
      trim: true
    }) as any[];

    let successCount = 0;
    let failureCount = 0;
    const failures: any[] = [];

    // 트랜잭션 처리가 이상적이나, 부분 성공을 허용하기 위해 개별 처리 또는 createMany 사용
    // 여기서는 매핑 로직이 복잡하므로 반복문으로 처리
    
    // 같은 폴더 내 마지막 시퀀스 구하기
    const lastCase = await prisma.testCase.findFirst({
      where: { folderId: folderId || null },
      orderBy: { sequence: 'desc' }
    });
    let currentSequence = (lastCase?.sequence || 0);

    const testCasesToCreate = [];

    for (const [index, row] of records.entries()) {
      try {
        // 매핑 적용: row['CSV헤더'] -> data['DB필드']
        // headerMapping 예: { "CSV제목": "title", "CSV우선순위": "priority" }
        
        const testCaseData: any = {
          folderId: folderId || null,
          priority: 'MEDIUM' // 기본값
        };

        // 매핑된 필드 채우기
        // 만약 mapping 정보가 없으면, DB 필드명과 일치하는 CSV 헤더를 자동 매핑 (요구사항)
        const dbFields = ['title', 'description', 'precondition', 'steps', 'expectedResult', 'priority'];
        
        if (Object.keys(headerMapping).length > 0) {
           for (const [csvHeader, dbField] of Object.entries(headerMapping)) {
             if (row[csvHeader]) {
               testCaseData[dbField as string] = row[csvHeader];
             }
           }
        } else {
          // 자동 매핑
          for (const field of dbFields) {
            if (row[field]) testCaseData[field] = row[field];
          }
        }

        if (!testCaseData.title) {
          throw new Error('제목(title)이 누락되었습니다.');
        }

        currentSequence += 1;
        testCaseData.sequence = currentSequence;
        
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

    // 임시 파일 삭제
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

