import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPlan } from '../api/plan';
import { getTestCases, TestCase } from '../api/testcase';
import Navbar from '../components/Navbar';
import { ArrowLeft, Search } from 'lucide-react';

const CreatePlanPage: React.FC = () => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [filteredCases, setFilteredCases] = useState<TestCase[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadTestCases();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredCases(testCases);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredCases(testCases.filter(tc => 
        tc.title.toLowerCase().includes(query) || 
        (tc.precondition && tc.precondition.toLowerCase().includes(query))
      ));
    }
  }, [searchQuery, testCases]);

  const loadTestCases = async () => {
    try {
      const response = await getTestCases(); // 전체 조회
      if (response.success) {
        setTestCases(response.data);
        setFilteredCases(response.data);
      }
    } catch (error) {
      console.error('Failed to load test cases', error);
    }
  };

  const handleToggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredCases.length) {
      setSelectedIds(new Set());
    } else {
      const newSelected = new Set(selectedIds);
      filteredCases.forEach(tc => newSelected.add(tc.id));
      setSelectedIds(newSelected);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('플랜 이름을 입력해주세요.');
      return;
    }
    if (selectedIds.size === 0) {
      alert('최소 하나 이상의 테스트케이스를 선택해주세요.');
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await createPlan({
        name,
        description,
        testCaseIds: Array.from(selectedIds)
      });
      if (response.success) {
        navigate('/plans');
      }
    } catch (error) {
      alert('플랜 생성에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="container mx-auto mt-8 px-4 pb-20">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <button 
              onClick={() => navigate('/plans')}
              className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
            >
              <ArrowLeft size={20} className="mr-1" /> 취소하고 목록으로
            </button>
            <h1 className="text-2xl font-bold text-gray-900">새 테스트 플랜 생성</h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* 기본 정보 */}
            <div className="bg-white p-6 rounded-lg shadow border">
              <h2 className="text-lg font-semibold mb-4">기본 정보</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">플랜 이름</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full border rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="예: 2024 Q1 정기 배포 테스트"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">설명 (옵션)</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full border rounded-md p-2 h-24 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="테스트 플랜에 대한 설명을 입력하세요."
                  />
                </div>
              </div>
            </div>

            {/* 테스트케이스 선택 */}
            <div className="bg-white p-6 rounded-lg shadow border">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">
                  테스트케이스 선택 ({selectedIds.size}개 선택됨)
                </h2>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="제목 검색..."
                    className="pl-10 pr-4 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="border rounded-md overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 border-b flex items-center">
                  <input
                    type="checkbox"
                    checked={filteredCases.length > 0 && selectedIds.size === filteredCases.length}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-4 h-4 w-4"
                  />
                  <span className="text-sm font-medium text-gray-700">전체 선택</span>
                </div>
                <div className="max-h-96 overflow-y-auto divide-y divide-gray-100">
                  {filteredCases.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">검색 결과가 없습니다.</div>
                  ) : (
                    filteredCases.map((tc) => (
                      <div 
                        key={tc.id} 
                        className={`px-4 py-3 flex items-center hover:bg-gray-50 cursor-pointer ${selectedIds.has(tc.id) ? 'bg-blue-50' : ''}`}
                        onClick={() => handleToggleSelect(tc.id)}
                      >
                        <input
                          type="checkbox"
                          checked={selectedIds.has(tc.id)}
                          onChange={() => {}} // handled by parent div onClick
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-4 h-4 w-4"
                        />
                        <div className="flex-1">
                          <div className="flex items-center">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium mr-2 
                              ${tc.priority === 'HIGH' ? 'bg-red-100 text-red-800' : 
                                tc.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' : 
                                'bg-green-100 text-green-800'}`}>
                              {tc.priority}
                            </span>
                            <span className="text-sm font-medium text-gray-900">{tc.title}</span>
                          </div>
                          {tc.precondition && (
                            <p className="text-xs text-gray-500 mt-1 ml-10 truncate">{tc.precondition}</p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={() => navigate('/plans')}
                className="px-6 py-2 bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={isSubmitting || selectedIds.size === 0}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {isSubmitting ? '생성 중...' : '플랜 생성'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default CreatePlanPage;

