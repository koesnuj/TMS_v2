import React, { useState, useEffect } from 'react';
import { FolderTree } from '../components/FolderTree';
import { CsvImportModal } from '../components/CsvImportModal';
import { TestCaseFormModal } from '../components/TestCaseFormModal';
import { getFolderTree, createFolder, FolderTreeItem } from '../api/folder';
import { getTestCases, TestCase, deleteTestCase } from '../api/testcase';
import { Plus, Upload, FileText, MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { ConfirmModal } from '../components/ui/ConfirmModal';

const TestCasesPage: React.FC = () => {
  const [folders, setFolders] = useState<FolderTreeItem[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Edit/Create Modal State
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingTestCase, setEditingTestCase] = useState<TestCase | null>(null);
  
  // Delete Modal State
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [testCaseToDelete, setTestCaseToDelete] = useState<TestCase | null>(null);

  // Dropdown State
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setActiveDropdownId(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

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
    const name = prompt('Enter folder name:');
    if (name) {
      try {
        await createFolder(name, parentId);
        loadFolderTree();
      } catch (error) {
        alert('Failed to create folder');
      }
    }
  };

  const handleSuccess = () => {
    loadTestCases(selectedFolderId);
  };

  // Create
  const handleCreateClick = () => {
    setEditingTestCase(null);
    setIsFormModalOpen(true);
  };

  // Edit
  const handleEditClick = (tc: TestCase, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveDropdownId(null);
    setEditingTestCase(tc);
    setIsFormModalOpen(true);
  };

  // Delete
  const handleDeleteClick = (tc: TestCase, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveDropdownId(null);
    setTestCaseToDelete(tc);
    setIsConfirmModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!testCaseToDelete) return;
    try {
      await deleteTestCase(testCaseToDelete.id);
      loadTestCases(selectedFolderId);
      setTestCaseToDelete(null);
      setIsConfirmModalOpen(false);
    } catch (error) {
      alert('Failed to delete test case');
    }
  };

  const toggleDropdown = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveDropdownId(activeDropdownId === id ? null : id);
  };

  return (
    <div className="flex h-full">
      {/* Inner Sidebar: Folder Tree */}
      <div className="w-72 bg-slate-50 border-r border-slate-200 flex flex-col flex-shrink-0">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-white">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Folders</span>
          <button 
            onClick={() => handleAddFolder(null)}
            className="text-indigo-600 hover:bg-indigo-50 p-1 rounded transition-colors"
            title="New Folder"
          >
            <Plus size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
          <FolderTree
            folders={folders}
            selectedFolderId={selectedFolderId}
            onSelectFolder={handleSelectFolder}
            onAddFolder={handleAddFolder}
          />
        </div>
      </div>

      {/* Main Content: Table */}
      <div className="flex-1 flex flex-col bg-white min-w-0">
        {/* Toolbar */}
        <div className="px-8 py-5 border-b border-slate-200 flex justify-between items-end bg-white">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {selectedFolderId ? 'Test Cases' : 'All Test Cases'}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {testCases.length} cases found
            </p>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              icon={<Upload size={16} />} 
              onClick={() => setIsImportModalOpen(true)}
            >
              Import
            </Button>
            <Button 
              variant="primary" 
              icon={<Plus size={16} />} 
              onClick={handleCreateClick}
            >
              Add Case
            </Button>
          </div>
        </div>

        {/* Table Area */}
        <div className="flex-1 overflow-auto p-8 bg-slate-50/50">
          {isLoading ? (
            <div className="flex justify-center items-center h-64 text-slate-500">Loading...</div>
          ) : testCases.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-lg p-12 text-center shadow-sm">
              <FileText size={48} className="mx-auto mb-4 text-slate-300" />
              <h3 className="text-lg font-medium text-slate-900">No test cases found</h3>
              <p className="text-slate-500 mt-2">Select a folder or create a new test case to get started.</p>
              <div className="mt-6">
                <Button onClick={handleCreateClick} icon={<Plus size={16} />}>
                  Create First Case
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-visible pb-32"> {/* overflow-visible for dropdown, pb-32 for space */}
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-20">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Title</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-32">Priority</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Preconditions</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider w-16"></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {testCases.map((tc, index) => (
                    <tr 
                      key={tc.id} 
                      className="hover:bg-slate-50 transition-colors cursor-pointer group relative"
                      onClick={() => handleEditClick(tc, {} as any)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-mono">
                        C{index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-slate-900 group-hover:text-indigo-600 transition-colors">
                          {tc.title}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={
                          tc.priority === 'HIGH' ? 'error' : 
                          tc.priority === 'MEDIUM' ? 'warning' : 'success'
                        }>
                          {tc.priority}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 truncate max-w-md">
                        {tc.precondition || <span className="text-slate-300">-</span>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium relative">
                         <button 
                           onClick={(e) => toggleDropdown(tc.id, e)}
                           className="p-1 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
                         >
                           <MoreHorizontal className="w-4 h-4" />
                         </button>
                         
                         {/* Dropdown Menu */}
                         {activeDropdownId === tc.id && (
                           <div className="absolute right-0 mt-2 w-36 bg-white rounded-lg shadow-lg border border-slate-200 z-10 py-1">
                             <button
                               onClick={(e) => handleEditClick(tc, e)}
                               className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-indigo-600 flex items-center gap-2 transition-colors"
                             >
                               <Edit size={14} />
                               Edit
                             </button>
                             <button
                               onClick={(e) => handleDeleteClick(tc, e)}
                               className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                             >
                               <Trash2 size={14} />
                               Delete
                             </button>
                           </div>
                         )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <CsvImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        currentFolderId={selectedFolderId}
        onSuccess={handleSuccess}
      />

      <TestCaseFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        folderId={selectedFolderId}
        onSuccess={handleSuccess}
        initialData={editingTestCase}
      />

      {testCaseToDelete && (
        <ConfirmModal
          isOpen={isConfirmModalOpen}
          onClose={() => setIsConfirmModalOpen(false)}
          onConfirm={handleConfirmDelete}
          title="Delete Test Case"
          message={`Are you sure you want to delete "${testCaseToDelete.title}"? This action cannot be undone.`}
          confirmText="Delete"
          variant="danger"
        />
      )}
    </div>
  );
};

export default TestCasesPage;
