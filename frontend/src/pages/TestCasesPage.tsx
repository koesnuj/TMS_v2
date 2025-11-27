import React, { useState, useEffect } from 'react';
import { FolderTree } from '../components/FolderTree';
import { CsvImportModal } from '../components/CsvImportModal';
import { CreateTestCaseModal } from '../components/CreateTestCaseModal';
import Navbar from '../components/Navbar';
import { getFolderTree, createFolder, FolderTreeItem } from '../api/folder';
import { getTestCases, TestCase } from '../api/testcase';
import { Plus, Upload, FileText, FolderPlus } from 'lucide-react';

const TestCasesPage: React.FC = () => {
  const [folders, setFolders] = useState<FolderTreeItem[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // 폴더 트리 로드
  const loadFolderTree = async () => {
    try {
      const response = await getFolderTree();
      if (response.success) {
        setFolders(response.data);
      }
    } catch (error) {
      console.error('Failed to load folders', error);
    }
  };

  // 테스트케이스 로드
  const loadTestCases = async (folderId: string | null) => {
    try {
      setIsLoading(true);
      const response = await getTestCases(folderId || undefined);
      if (response.success) {
        setTestCases(response.data);
      }
    } catch (error) {
      console.error('Failed to load test cases', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFolderTree();
    loadTestCases(null); // 초기엔 전체 혹은 루트
  }, []);

  const handleSelectFolder = (folderId: string) => {
    setSelectedFolderId(folderId);
    loadTestCases(folderId);
  };

  const handleAddFolder = async (parentId: string | null) => {
    const name = prompt('폴더 이름을 입력하세요:');
    if (name) {
      try {
        await createFolder(name, parentId);
        loadFolderTree();
      } catch (error) {
        alert('폴더 생성 실패');
      }
    }
  };

  const handleImportSuccess = () => {
    loadTestCases(selectedFolderId);
  };

  return (
    <div className="flex flex-col h-screen bg-[#f2f4f6]">
      <Navbar />
      
      <div className="flex flex-1 overflow-hidden">
        {/* 좌측 사이드바 (폴더 트리) */}
        <div className="w-80 bg-white border-r border-gray-300 flex flex-col shadow-[2px_0_5px_rgba(0,0,0,0.03)] z-10">
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
            <span className="font-bold text-gray-700 text-xs uppercase tracking-wider">
              Folders
            </span>
            <button 
              onClick={() => handleAddFolder(null)}
              className="text-gray-500 hover:text-blue-600 p-1 rounded hover:bg-gray-200 transition-colors"
              title="최상위 폴더 추가"
            >
              <FolderPlus size={16} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
            <FolderTree
              folders={folders}
              selectedFolderId={selectedFolderId}
              onSelectFolder={handleSelectFolder}
              onAddFolder={handleAddFolder}
            />
          </div>
        </div>

        {/* 우측 메인 컨텐츠 */}
        <div className="flex-1 flex flex-col overflow-hidden bg-[#f2f4f6]">
          {/* 툴바 / 헤더 */}
          <div className="bg-white border-b border-gray-300 px-8 py-5 flex justify-between items-center shadow-sm">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                {selectedFolderId ? 'Test Cases' : 'All Test Cases'}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {testCases.length} cases found
              </p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => setIsImportModalOpen(true)}
                className="flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50 font-medium text-sm shadow-sm transition-colors"
              >
                <Upload size={16} className="mr-2 text-gray-500" />
                Import CSV
              </button>
              <button 
                onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium text-sm shadow-sm transition-colors"
              >
                <Plus size={16} className="mr-2" />
                Add Case
              </button>
            </div>
          </div>

          {/* 리스트 영역 */}
          <div className="flex-1 overflow-auto p-8">
            {isLoading ? (
              <div className="flex justify-center items-center h-64 text-gray-500">Loading...</div>
            ) : testCases.length === 0 ? (
              <div className="bg-white border border-gray-300 rounded-lg p-12 text-center shadow-sm">
                <FileText size={48} className="mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900">No test cases found</h3>
                <p className="text-gray-500 mt-2">Select a folder or create a new test case to get started.</p>
                <div className="mt-6">
                  <button 
                    onClick={() => setIsCreateModalOpen(true)}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium text-sm"
                  >
                    <Plus size={16} className="mr-2" />
                    Create First Case
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-gray-300 rounded shadow-sm overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-20 border-b border-gray-200">ID</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200">Title</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-32 border-b border-gray-200">Priority</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200">Preconditions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {testCases.map((tc, index) => (
                      <tr key={tc.id} className="hover:bg-blue-50/30 transition-colors cursor-pointer">
                        <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500 font-mono">
                          C{index + 1}
                        </td>
                        <td className="px-6 py-3 text-sm font-medium text-gray-900">
                          {tc.title}
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap">
                          <span className={`px-2.5 py-0.5 inline-flex text-xs font-bold rounded border
                            ${tc.priority === 'HIGH' ? 'bg-red-50 text-red-700 border-red-200' : 
                              tc.priority === 'MEDIUM' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 
                              'bg-green-50 text-green-700 border-green-200'}`}>
                            {tc.priority}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-500 truncate max-w-md">
                          {tc.precondition || <span className="text-gray-300">-</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <CsvImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        currentFolderId={selectedFolderId}
        onSuccess={handleImportSuccess}
      />

      <CreateTestCaseModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        folderId={selectedFolderId}
        onSuccess={handleImportSuccess}
      />
    </div>
  );
};

export default TestCasesPage;
