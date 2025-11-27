import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

// 폴더 트리 조회 (전체 폴더를 가져와서 메모리에서 트리 구성)
export async function getFolderTree(req: Request, res: Response): Promise<void> {
  try {
    const folders = await prisma.folder.findMany({
      orderBy: { name: 'asc' }
    });

    const folderMap = new Map();
    const rootFolders: any[] = [];

    // 1. 모든 폴더를 Map에 저장하고 children 배열 초기화
    folders.forEach(folder => {
      folderMap.set(folder.id, { ...folder, children: [] });
    });

    // 2. 부모-자식 관계 연결
    folders.forEach(folder => {
      if (folder.parentId) {
        const parent = folderMap.get(folder.parentId);
        if (parent) {
          parent.children.push(folderMap.get(folder.id));
        }
      } else {
        rootFolders.push(folderMap.get(folder.id));
      }
    });

    res.json({ success: true, data: rootFolders });
  } catch (error) {
    console.error('Get folder tree error:', error);
    res.status(500).json({ success: false, message: '폴더 트리를 불러오는데 실패했습니다.' });
  }
}

// 폴더 생성
export async function createFolder(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { name, parentId } = req.body;

    if (!name) {
      res.status(400).json({ success: false, message: '폴더 이름은 필수입니다.' });
      return;
    }

    const folder = await prisma.folder.create({
      data: {
        name,
        parentId: parentId || null
      }
    });

    res.status(201).json({ success: true, data: folder });
  } catch (error) {
    console.error('Create folder error:', error);
    res.status(500).json({ success: false, message: '폴더 생성 중 오류가 발생했습니다.' });
  }
}

// 폴더별 테스트케이스 조회
export async function getTestCasesByFolder(req: Request, res: Response): Promise<void> {
  try {
    const { folderId } = req.params;

    const testCases = await prisma.testCase.findMany({
      where: { folderId },
      orderBy: { sequence: 'asc' }
    });

    res.json({ success: true, data: testCases });
  } catch (error) {
    console.error('Get folder testcases error:', error);
    res.status(500).json({ success: false, message: '테스트케이스 목록을 불러오는데 실패했습니다.' });
  }
}

