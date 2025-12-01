import api from './axios';
import { PlanItem } from './plan';

export interface DashboardStats {
  totalTestCases: number;
  activePlans: number;
  totalPlanItems: number;
  myAssignedCount: number;
}

export interface DashboardActivity extends PlanItem {
  testCase: {
    title: string;
    priority?: string;
  };
  plan: {
    name: string;
    id: string;
  };
}

export const getDashboardStats = async () => {
  const response = await api.get<{ success: boolean; data: DashboardStats }>('/dashboard/stats');
  return response.data;
};

export const getMyAssignments = async () => {
  const response = await api.get<{ success: boolean; data: DashboardActivity[] }>('/dashboard/my-assignments');
  return response.data;
};

export const getRecentActivity = async () => {
  const response = await api.get<{ success: boolean; data: DashboardActivity[] }>('/dashboard/recent-activity');
  return response.data;
};

