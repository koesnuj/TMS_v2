import api from './axios';
import { TestCase } from './testcase';

export type TestResult = 'NOT_RUN' | 'PASS' | 'FAIL' | 'BLOCK';

export interface PlanStats {
  total: number;
  pass: number;
  fail: number;
  block: number;
  notRun: number;
  progress: number;
}

export interface Plan {
  id: string;
  name: string;
  description?: string;
  status: 'ACTIVE' | 'ARCHIVED';
  createdBy: string;
  createdAt: string;
  stats?: PlanStats; // 목록 조회 시 포함
}

export interface PlanItem {
  id: string;
  planId: string;
  testCaseId: string;
  testCase: TestCase;
  assignee?: string;
  result: TestResult;
  comment?: string;
  executedAt?: string;
}

export interface PlanDetail extends Plan {
  items: PlanItem[];
}

export const getPlans = async (status = 'ACTIVE') => {
  const response = await api.get<{ success: boolean; data: Plan[] }>('/plans', { params: { status } });
  return response.data;
};

export const createPlan = async (data: { name: string; description?: string; testCaseIds: string[] }) => {
  const response = await api.post<{ success: boolean; data: Plan }>('/plans', data);
  return response.data;
};

export const getPlanDetail = async (planId: string) => {
  const response = await api.get<{ success: boolean; data: PlanDetail }>(`/plans/${planId}`);
  return response.data;
};

export const updatePlanItem = async (
  planId: string, 
  itemId: string, 
  data: { result?: TestResult; comment?: string }
) => {
  const response = await api.patch<{ success: boolean; data: PlanItem }>(
    `/plans/${planId}/items/${itemId}`, 
    data
  );
  return response.data;
};

export const bulkUpdatePlanItems = async (
  planId: string,
  data: { items: string[]; result: TestResult; comment?: string }
) => {
  const response = await api.patch<{ success: boolean; data: { count: number; message: string } }>(
    `/plans/${planId}/items/bulk`,
    data
  );
  return response.data;
};
