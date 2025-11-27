import api from './axios';

export interface TestCase {
  id: string;
  title: string;
  description?: string;
  precondition?: string;
  steps?: string;
  expectedResult?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  sequence: number;
  folderId?: string;
  createdAt: string;
}

export const getTestCases = async (folderId?: string) => {
  const params = folderId ? { folderId } : {};
  const response = await api.get<{ success: boolean; data: TestCase[] }>('/testcases', { params });
  return response.data;
};

export const createTestCase = async (data: Partial<TestCase>) => {
  const response = await api.post<{ success: boolean; data: TestCase }>('/testcases', data);
  return response.data;
};

export const importTestCases = async (folderId: string | null, file: File, mapping: Record<string, string>) => {
  const formData = new FormData();
  formData.append('file', file);
  if (folderId) formData.append('folderId', folderId);
  formData.append('mapping', JSON.stringify(mapping));

  const response = await api.post('/testcases/import', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

