import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getPlanDetail, getPlans, PlanDetail, Plan, updatePlanItem, bulkUpdatePlanItems, TestResult, PlanItem } from '../api/plan';
import { getAllUsers } from '../api/admin';
import { User } from '../api/types';
import { ArrowLeft, Search, PlayCircle, CheckSquare, Square, Download, FileText, Table } from 'lucide-react';
import { TestCaseDetailColumn } from '../components/TestCaseDetailColumn';
import { RunSummary } from '../components/RunSummary';
import { StackedProgressBar } from '../components/StackedProgressBar';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { exportToPDF, exportToExcel } from '../utils/export';

/**
 * PlanDetailPage3Column - 3-컬럼 레이아웃
 * 
 * [좌측: Test Runs List]  [중앙: Test Cases Table]  [우측: Detail Column (선택 시)]
 *     260px 고정              flex-grow                  420px 고정
 * 
 * 우측 패널이 나타나면 중앙 테이블의 폭이 자동으로 줄어듦
 * 슬라이드 애니메이션 없이 컬럼이 추가되는 방식
 */
const PlanDetailPage3Column: React.FC = () => {
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();
  
  const [plans, setPlans] = useState<Plan[]>([]);
  const [plan, setPlan] = useState<PlanDetail | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<PlanItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Bulk select state
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  const [bulkAssignee, setBulkAssignee] = useState<string>('');
  const [bulkResult, setBulkResult] = useState<TestResult | ''>('');
  
  // Confirm modal state
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  useEffect(() => {
    loadPlans();
    loadUsers();
  }, []);

  useEffect(() => {
    if (planId) {
      loadPlanDetail(planId);
    }
  }, [planId]);

  // 사용자 프로필 업데이트 이벤트 리스너
  useEffect(() => {
    const handleProfileUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<{ oldName: string; newName: string }>;
      const { oldName, newName } = customEvent.detail;

      // 1. users 목록 업데이트
      setUsers(prevUsers => 
        prevUsers.map(u => u.name === oldName ? { ...u, name: newName } : u)
      );

      // 2. plan items의 assignee 업데이트
      setPlan(prevPlan => {
        if (!prevPlan) return null;
        return {
          ...prevPlan,
          items: prevPlan.items.map(item => 
            item.assignee === oldName ? { ...item, assignee: newName } : item
          )
        };
      });

      // 3. 선택된 아이템이 있다면 그것도 업데이트
      setSelectedItem(prevItem => {
        if (prevItem && prevItem.assignee === oldName) {
          return { ...prevItem, assignee: newName };
        }
        return prevItem;
      });
    };

    window.addEventListener('user-profile-updated', handleProfileUpdate);
    return () => {
      window.removeEventListener('user-profile-updated', handleProfileUpdate);
    };
  }, []);

  const loadPlans = async () => {
    try {
      const response = await getPlans('ACTIVE');
      if (response.success) {
        setPlans(response.data);
      }
    } catch (error) {
      console.error('Failed to load plans', error);
    }
  };

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

  // Export Handlers
  const handleExportPDF = () => {
    if (!plan) return;
    exportToPDF({ plan, items: filteredItems });
  };

  const handleExportExcel = () => {
    if (!plan) return;
    exportToExcel({ plan, items: filteredItems });
  };

  // 행 클릭 핸들러: 디테일 컬럼 표시
  const handleRowClick = (item: PlanItem) => {
    setSelectedItem(item);
  };

  // 디테일 컬럼에서 업데이트 → API 호출 → 테이블 즉시 반영
  const handleUpdate = async (itemId: string, updates: { result?: TestResult; assignee?: string; comment?: string }) => {
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

  // Bulk select 핸들러
  const handleToggleSelect = (itemId: string) => {
    setSelectedItemIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedItemIds.size === filteredItems.length && filteredItems.length > 0) {
      setSelectedItemIds(new Set());
    } else {
      setSelectedItemIds(new Set(filteredItems.map(item => item.id)));
    }
  };

  // Apply 버튼 클릭 시 확인 모달 열기
  const handleApplyClick = () => {
    if (!planId || selectedItemIds.size === 0) return;
    if (!bulkResult && !bulkAssignee) {
      alert('담당자 또는 상태를 선택해주세요.');
      return;
    }
    
    // 확인 모달 열기
    setIsConfirmModalOpen(true);
  };

  // 확인 모달에서 OK 클릭 시 실제 bulk update 실행
  const handleBulkUpdate = async () => {
    if (!planId || selectedItemIds.size === 0) return;

    try {
      const updates: { result?: TestResult; assignee?: string } = {};
      if (bulkResult) updates.result = bulkResult;
      if (bulkAssignee) updates.assignee = bulkAssignee;

      await bulkUpdatePlanItems(planId, {
        items: Array.from(selectedItemIds),
        ...updates,
      });

      // 선택 해제 및 입력값 초기화
      setSelectedItemIds(new Set());
      setBulkResult('');
      setBulkAssignee('');

      // 플랜 데이터 다시 로드 (Summary 및 프로그레스바 업데이트)
      loadPlanDetail(planId);
      
      // 좌측 Test Runs 목록도 다시 로드 (프로그레스바 업데이트)
      loadPlans();
    } catch (error) {
      alert('일괄 업데이트에 실패했습니다.');
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
    return matchesSearch;
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
    <div className="flex h-screen overflow-hidden">
      {/* 좌측+중앙 래퍼: 함께 스크롤 */}
      <div className="flex-1 flex overflow-y-auto overflow-x-hidden">
        {/* 좌측 컬럼: Test Runs List */}
        <div className="w-[260px] bg-slate-50 border-r border-slate-200 flex flex-col flex-shrink-0">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 bg-white">
          <button 
            onClick={() => navigate('/plans')}
            className="flex items-center text-slate-600 hover:text-slate-900 transition-colors text-xs mb-3"
          >
            <ArrowLeft size={14} className="mr-1" /> Back to Plans
          </button>
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Test Runs</h3>
        </div>

        {/* Test Runs List */}
        <div className="flex-1">
          {plans.map((p) => (
            <div
              key={p.id}
              onClick={() => {
                navigate(`/plans/${p.id}`);
                setSelectedItem(null); // 다른 플랜 선택 시 디테일 패널 닫기
              }}
              className={`p-4 border-b border-slate-200 cursor-pointer transition-colors ${
                p.id === planId 
                  ? 'bg-indigo-50 border-l-4 border-l-indigo-600' 
                  : 'hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <PlayCircle size={14} className={p.id === planId ? 'text-indigo-600' : 'text-slate-400'} />
                <h4 className={`text-sm font-medium line-clamp-2 ${p.id === planId ? 'text-indigo-900' : 'text-slate-900'}`}>
                  {p.name}
                </h4>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-slate-500">
                <span className="font-semibold">{p.stats?.progress}%</span>
                <StackedProgressBar
                  statusCounts={{
                    passed: p.stats?.pass || 0,
                    inProgress: 0, // API에서 제공하지 않으므로 0
                    failed: p.stats?.fail || 0,
                    blocked: p.stats?.block || 0,
                    notRun: p.stats?.notRun || 0,
                  }}
                  height="h-1.5"
                />
              </div>
            </div>
          ))}
        </div>
        </div>

        {/* 중앙 컬럼: Test Cases Table */}
        <div className="flex-1 flex flex-col bg-slate-50 min-w-0">
          {/* Summary 섹션 - 고정 높이, 스크롤 없음 */}
          <div className="p-6 flex-shrink-0">
            <RunSummary
              planName={plan.name}
              description={plan.description || ''}
              createdBy={plan.createdBy}
              createdAt={plan.createdAt}
              totalCases={totalItems}
              statusCounts={{
                passed: passCount,
                failed: failCount,
                blocked: blockCount,
                inProgress: inProgressCount,
                notRun: notRunCount,
              }}
              teamMembers={users.map(user => ({
                id: user.id,
                name: user.name,
                assignedCount: plan.items.filter(item => item.assignee === user.name).length,
              })).filter(member => member.assignedCount > 0)}
            />
          </div>

          {/* Test Cases Table Card - 스크롤 영역 */}
          <div className="px-6 pb-6 flex-1 flex flex-col min-h-0">
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden flex flex-col flex-1">
              {/* Toolbar */}
              <div className="px-6 py-3 border-b border-slate-200 flex justify-between items-center bg-slate-50 flex-shrink-0">
                <div className="flex items-center gap-4">
                  <div className="text-sm text-slate-600">
                    {selectedItemIds.size > 0 ? (
                      <span className="font-semibold text-indigo-600">
                        {selectedItemIds.size} selected
                      </span>
                    ) : (
                      <span>{filteredItems.length} of {totalItems} test cases</span>
                    )}
                  </div>
                  <div className="h-4 w-px bg-slate-300 mx-2"></div>
                  <div className="flex gap-2">
                    <button 
                      onClick={handleExportPDF}
                      className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-slate-600 bg-white border border-slate-300 rounded hover:bg-slate-50 hover:text-indigo-600 transition-colors"
                      title="Export as PDF"
                    >
                      <FileText size={14} /> PDF
                    </button>
                    <button 
                      onClick={handleExportExcel}
                      className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-slate-600 bg-white border border-slate-300 rounded hover:bg-slate-50 hover:text-emerald-600 transition-colors"
                      title="Export as Excel"
                    >
                      <Table size={14} /> Excel
                    </button>
                  </div>
                </div>
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-64 bg-white"
                  />
                </div>
              </div>

              {/* Bulk Actions Bar */}
              {selectedItemIds.size > 0 && (
                <div className="px-6 py-3 border-b border-slate-200 bg-indigo-50 flex items-center gap-4 flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <CheckSquare size={16} className="text-indigo-600" />
                    <span className="text-sm font-semibold text-indigo-900">
                      {selectedItemIds.size} test case{selectedItemIds.size > 1 ? 's' : ''} selected
                    </span>
                  </div>
                  <div className="h-5 w-px bg-indigo-200"></div>
                  <div className="flex items-center gap-3 flex-1">
                    <select
                      value={bulkAssignee}
                      onChange={(e) => setBulkAssignee(e.target.value)}
                      className="text-xs border-slate-300 rounded-md py-1.5 px-3 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                    >
                      <option value="">Set assignee...</option>
                      {users.map(user => (
                        <option key={user.id} value={user.name}>{user.name}</option>
                      ))}
                    </select>
                    <select
                      value={bulkResult}
                      onChange={(e) => setBulkResult(e.target.value as TestResult | '')}
                      className="text-xs border-slate-300 rounded-md py-1.5 px-3 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                    >
                      <option value="">Set status...</option>
                      <option value="NOT_RUN">NOT STARTED</option>
                      <option value="IN_PROGRESS">IN PROGRESS</option>
                      <option value="PASS">PASS</option>
                      <option value="FAIL">FAIL</option>
                      <option value="BLOCK">BLOCKED</option>
                    </select>
                    <Button
                      onClick={handleApplyClick}
                      disabled={!bulkResult && !bulkAssignee}
                      size="sm"
                    >
                      Apply
                    </Button>
                  </div>
                </div>
              )}

              {/* Table - 이 영역만 스크롤 */}
              <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <table className="min-w-full">
            <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-2 w-12 text-center">
                  <button
                    onClick={handleSelectAll}
                    className="text-slate-500 hover:text-slate-700 focus:outline-none transition-colors"
                    title={selectedItemIds.size === filteredItems.length && filteredItems.length > 0 ? "Deselect All" : "Select All"}
                  >
                    {selectedItemIds.size > 0 && selectedItemIds.size === filteredItems.length ? 
                      <CheckSquare size={16} className="text-indigo-600" /> : <Square size={16} />
                    }
                  </button>
                </th>
                <th className="px-4 py-2 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider w-20">ID</th>
                <th className="px-4 py-2 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Title</th>
                <th className="px-4 py-2 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider w-24">Priority</th>
                <th className="px-4 py-2 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider w-32">Assignee</th>
                <th className="px-4 py-2 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider w-32">Result</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {filteredItems.map((item) => (
                <tr 
                  key={item.id}
                  className={`transition-colors hover:bg-slate-50 ${
                    selectedItem?.id === item.id ? 'bg-indigo-50 border-l-4 border-indigo-600' : ''
                  } ${selectedItemIds.has(item.id) ? 'bg-indigo-50/30' : ''}`}
                >
                  <td className="px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={selectedItemIds.has(item.id)}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleToggleSelect(item.id);
                      }}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded cursor-pointer"
                    />
                  </td>
                  <td 
                    className="px-4 py-3 text-[11px] font-mono text-slate-500 cursor-pointer"
                    onClick={() => handleRowClick(item)}
                  >
                    {item.testCaseId.substring(0, 6).toUpperCase()}
                  </td>
                  <td 
                    className="px-4 py-3 cursor-pointer"
                    onClick={() => handleRowClick(item)}
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-slate-900 line-clamp-1">
                          {item.testCase.title}
                        </div>
                        {item.comment && (
                          <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                            {item.comment}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td 
                    className="px-4 py-3 cursor-pointer"
                    onClick={() => handleRowClick(item)}
                  >
                    <Badge
                      variant={
                        item.testCase.priority === 'HIGH' ? 'error' :
                        item.testCase.priority === 'MEDIUM' ? 'warning' : 'info'
                      }
                      className="text-[9px] font-semibold uppercase flex-shrink-0"
                    >
                      {item.testCase.priority}
                    </Badge>
                  </td>
                  <td 
                    className="px-4 py-3 text-xs text-slate-700"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <select
                      value={item.assignee || ''}
                      onChange={(e) => handleUpdate(item.id, { assignee: e.target.value })}
                      className={`text-xs border-transparent bg-transparent rounded px-2 py-1 cursor-pointer focus:ring-2 focus:ring-indigo-500 w-full max-w-[140px] truncate transition-colors hover:bg-slate-100 ${
                        !item.assignee ? 'text-slate-400' : 'text-slate-900 font-medium'
                      }`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <option value="">Unassigned</option>
                      {users.map(user => (
                        <option key={user.id} value={user.name}>{user.name}</option>
                      ))}
                    </select>
                  </td>
                  <td 
                    className="px-4 py-3"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="relative inline-block w-full">
                      <select
                        value={item.result}
                        onChange={(e) => handleUpdate(item.id, { result: e.target.value as TestResult })}
                        className={`text-[10px] font-semibold uppercase tracking-wide border-0 rounded-full pl-3 pr-7 py-1 cursor-pointer focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500 w-full appearance-none text-center transition-colors ${getStatusColor(item.result)}`}
                        onClick={(e) => e.stopPropagation()}
                        style={{ textAlignLast: 'center' }}
                      >
                        <option value="NOT_RUN" className="bg-white text-slate-900">NOT STARTED</option>
                        <option value="IN_PROGRESS" className="bg-white text-slate-900">IN PROGRESS</option>
                        <option value="PASS" className="bg-white text-slate-900">PASS</option>
                        <option value="FAIL" className="bg-white text-slate-900">FAIL</option>
                        <option value="BLOCK" className="bg-white text-slate-900">BLOCKED</option>
                      </select>
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-white/80">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M6 9l6 6 6-6"/>
                        </svg>
                      </div>
                    </div>
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
          </div>
        </div>
      </div>
      {/* 좌측+중앙 래퍼 종료 */}

      {/* 우측 컬럼: Detail Column (고정, 선택 시만 렌더링) */}
      {selectedItem && (
        <div className="sticky top-0 h-screen">
          <TestCaseDetailColumn
            planItem={selectedItem}
            users={users}
            onClose={() => setSelectedItem(null)}
            onUpdate={handleUpdate}
          />
        </div>
      )}

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleBulkUpdate}
        title="일괄 업데이트 확인"
        message={`선택한 ${selectedItemIds.size}개의 테스트 케이스를 업데이트하시겠습니까?${
          bulkResult ? ` 상태가 ${getStatusLabel(bulkResult)}(으)로 변경됩니다.` : ''
        }${
          bulkAssignee ? ` 담당자가 ${bulkAssignee}(으)로 설정됩니다.` : ''
        }`}
        confirmText="업데이트"
        cancelText="취소"
        variant="info"
      />
    </div>
  );
};

export default PlanDetailPage3Column;

