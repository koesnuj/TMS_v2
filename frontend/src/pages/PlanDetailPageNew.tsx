import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getPlanDetail, PlanDetail, updatePlanItem, TestResult, PlanItem } from '../api/plan';
import { getAllUsers } from '../api/admin';
import { User } from '../api/types';
import { ArrowLeft, PlayCircle, Filter, Search } from 'lucide-react';
import { TestCaseDetailPanel } from '../components/TestCaseDetailPanel';
import { Badge } from '../components/ui/Badge';

/**
 * PlanDetailPage - 3단 레이아웃 구조
 * 
 * [좌측 패널]       [중앙 테이블]              [우측 디테일 패널]
 * Test Runs List  → Selected Test Cases  →  Case Detail (slide-in)
 * 
 * 주요 기능:
 * 1. 좌측: Test Run 정보 및 통계
 * 2. 중앙: 테스트 케이스 테이블 (클릭 가능한 행)
 * 3. 우측: 선택된 케이스의 상세 정보 (슬라이드 패널)
 * 4. 상호작용: 행 클릭 → 패널 열림, ESC/배경 클릭 → 패널 닫힘
 * 5. 실시간 업데이트: 패널에서 변경 → 테이블 즉시 반영
 */
const PlanDetailPageNew: React.FC = () => {
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();
  
  const [plan, setPlan] = useState<PlanDetail | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<PlanItem | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<TestResult | 'ALL'>('ALL');

  useEffect(() => {
    if (planId) {
      loadPlanDetail(planId);
      loadUsers();
    }
  }, [planId]);

  const loadPlanDetail = async (id: string) => {
    try {
      setIsLoading(true);
      const response = await getPlanDetail(id);
      if (response.success) {
        setPlan(response.data);
      }
    } catch (error) {
      console.error('Failed to load plan detail', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await getAllUsers();
      if (response.success) {
        setUsers(response.users.filter(u => u.status === 'ACTIVE'));
      }
    } catch (error) {
      console.error('Failed to load users', error);
    }
  };

  // 행 클릭 핸들러: 디테일 패널 열기
  const handleRowClick = (item: PlanItem) => {
    setSelectedItem(item);
    setIsPanelOpen(true);
  };

  // 패널에서 업데이트 → API 호출 → 테이블 즉시 반영
  const handlePanelUpdate = async (itemId: string, updates: { result?: TestResult; assignee?: string; comment?: string }) => {
    if (!planId) return;
    
    try {
      await updatePlanItem(planId, itemId, updates);
      // 로컬 상태 업데이트 (테이블 즉시 반영)
      setPlan(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          items: prev.items.map(item => 
            item.id === itemId 
              ? { 
                  ...item, 
                  ...updates,
                  executedAt: new Date().toISOString() 
                }
              : item
          )
        };
      });
      // 선택된 아이템도 업데이트
      setSelectedItem(prev => {
        if (!prev || prev.id !== itemId) return prev;
        return { ...prev, ...updates, executedAt: new Date().toISOString() };
      });
    } catch (error) {
      console.error('Failed to update plan item', error);
      alert('Update failed');
    }
  };

  if (isLoading && !plan) {
    return <div className="flex justify-center items-center h-screen text-slate-500">Loading...</div>;
  }

  if (!plan) {
    return <div className="flex justify-center items-center h-screen text-slate-500">Plan not found.</div>;
  }

  // 통계 계산
  const totalItems = plan.items.length;
  const passCount = plan.items.filter(i => i.result === 'PASS').length;
  const failCount = plan.items.filter(i => i.result === 'FAIL').length;
  const blockCount = plan.items.filter(i => i.result === 'BLOCK').length;
  const inProgressCount = plan.items.filter(i => i.result === 'IN_PROGRESS').length;
  const notRunCount = plan.items.filter(i => i.result === 'NOT_RUN').length;
  const progress = totalItems > 0 ? Math.round(((totalItems - notRunCount) / totalItems) * 100) : 0;

  // 필터링된 아이템
  const filteredItems = plan.items.filter(item => {
    const matchesSearch = searchQuery === '' || 
      item.testCase.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.testCaseId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'ALL' || item.result === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Status별 색상
  const getStatusColor = (status: TestResult) => {
    switch (status) {
      case 'PASS':
        return 'bg-emerald-500 text-white';
      case 'FAIL':
        return 'bg-red-500 text-white';
      case 'BLOCK':
        return 'bg-gray-600 text-white';
      case 'IN_PROGRESS':
        return 'bg-amber-500 text-white';
      case 'NOT_RUN':
      default:
        return 'bg-gray-400 text-white';
    }
  };

  const getStatusLabel = (status: TestResult) => {
    switch (status) {
      case 'NOT_RUN':
        return 'NOT STARTED';
      case 'IN_PROGRESS':
        return 'IN PROGRESS';
      case 'BLOCK':
        return 'BLOCKED';
      default:
        return status;
    }
  };

  return (
    <div className="flex h-full overflow-hidden">
      {/* 좌측 패널: Test Run 정보 */}
      <div className="w-80 bg-slate-50 border-r border-slate-200 flex flex-col flex-shrink-0 overflow-y-auto">
        {/* Back Button */}
        <div className="p-4 border-b border-slate-200 bg-white">
          <button 
            onClick={() => navigate('/plans')}
            className="flex items-center text-slate-600 hover:text-slate-900 transition-colors text-sm"
          >
            <ArrowLeft size={16} className="mr-2" /> Back to Plans
          </button>
        </div>

        {/* Test Run Header */}
        <div className="p-6 border-b border-slate-200 bg-white">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-indigo-100 p-2 rounded-lg">
              <PlayCircle size={20} className="text-indigo-600" />
            </div>
            <Badge variant={plan.status === 'ACTIVE' ? 'success' : 'neutral'} className="text-[10px]">
              {plan.status}
            </Badge>
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-2 line-clamp-2">
            {plan.name}
          </h2>
          <p className="text-xs text-slate-500 line-clamp-3">
            {plan.description || 'No description provided.'}
          </p>
          <div className="mt-4 text-xs text-slate-500 space-y-1">
            <div>Created by <span className="font-medium text-slate-700">{plan.createdBy}</span></div>
            <div>{new Date(plan.createdAt).toLocaleDateString()}</div>
          </div>
        </div>

        {/* Progress Summary */}
        <div className="p-6 bg-white border-b border-slate-200">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold text-slate-700">Overall Progress</span>
            <span className="text-xl font-bold text-indigo-600">{progress}%</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-3 mb-4">
            <div 
              className={`h-3 rounded-full transition-all duration-500 ${
                progress === 100 ? 'bg-emerald-500' : 'bg-indigo-600'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center p-2 bg-slate-50 rounded-md">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                <span className="text-slate-600">Passed</span>
              </div>
              <span className="font-bold text-emerald-600">{passCount}</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-slate-50 rounded-md">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                <span className="text-slate-600">Failed</span>
              </div>
              <span className="font-bold text-red-600">{failCount}</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-slate-50 rounded-md">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                <span className="text-slate-600">In Progress</span>
              </div>
              <span className="font-bold text-amber-600">{inProgressCount}</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-slate-50 rounded-md">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-gray-600"></div>
                <span className="text-slate-600">Blocked</span>
              </div>
              <span className="font-bold text-gray-600">{blockCount}</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-slate-50 rounded-md">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                <span className="text-slate-600">Untested</span>
              </div>
              <span className="font-bold text-gray-400">{notRunCount}</span>
            </div>
          </div>
        </div>

        {/* Filter Section */}
        <div className="p-4 bg-slate-50">
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            <Filter size={12} className="inline mr-1" />
            Filter by Status
          </label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as TestResult | 'ALL')}
            className="w-full text-xs border-slate-300 rounded-md py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
          >
            <option value="ALL">All ({totalItems})</option>
            <option value="NOT_RUN">Not Started ({notRunCount})</option>
            <option value="IN_PROGRESS">In Progress ({inProgressCount})</option>
            <option value="PASS">Passed ({passCount})</option>
            <option value="FAIL">Failed ({failCount})</option>
            <option value="BLOCK">Blocked ({blockCount})</option>
          </select>
        </div>
      </div>

      {/* 중앙 패널: 테스트 케이스 테이블 */}
      <div className="flex-1 flex flex-col bg-white min-w-0 overflow-hidden">
        {/* Toolbar */}
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-white">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Test Cases</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {filteredItems.length} of {totalItems} test cases
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by title or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-80"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          <table className="min-w-full">
            <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-24">ID</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Title</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-40">Assignee</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-36">Result</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {filteredItems.map((item) => (
                <tr 
                  key={item.id}
                  onClick={() => handleRowClick(item)}
                  className={`cursor-pointer transition-colors hover:bg-indigo-50/50 ${
                    selectedItem?.id === item.id ? 'bg-indigo-50 border-l-4 border-indigo-500' : ''
                  }`}
                >
                  <td className="px-6 py-4 text-xs font-mono text-slate-500">
                    {item.testCaseId.substring(0, 8).toUpperCase()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-slate-900 line-clamp-1">
                          {item.testCase.title}
                        </div>
                        {item.comment && (
                          <div className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                            {item.comment}
                          </div>
                        )}
                      </div>
                      <Badge
                        variant={
                          item.testCase.priority === 'HIGH' ? 'error' :
                          item.testCase.priority === 'MEDIUM' ? 'warning' : 'info'
                        }
                        className="text-[9px] font-semibold uppercase flex-shrink-0"
                      >
                        {item.testCase.priority}
                      </Badge>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-700">
                    {item.assignee ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
                        {item.assignee}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">Unassigned</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wide ${getStatusColor(item.result)}`}>
                      {getStatusLabel(item.result)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredItems.length === 0 && (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
              <Search size={48} className="mb-4" />
              <p className="text-sm">No test cases found</p>
            </div>
          )}
        </div>
      </div>

      {/* 우측 디테일 패널 (슬라이드) */}
      <TestCaseDetailPanel
        planItem={selectedItem}
        users={users}
        isOpen={isPanelOpen}
        onClose={() => {
          setIsPanelOpen(false);
          // 패널이 닫힐 때 선택 상태는 유지 (다시 클릭하면 바로 열림)
        }}
        onUpdate={handlePanelUpdate}
      />
    </div>
  );
};

export default PlanDetailPageNew;

