import React, { useState, useEffect } from 'react';
import { createTestCase, updateTestCase, TestCase } from '../api/testcase';
import { getFolderTree, FolderTreeItem } from '../api/folder';
import { X } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';

interface TestCaseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  folderId: string | null;
  onSuccess: () => void;
  initialData?: TestCase | null;
}

export const TestCaseFormModal: React.FC<TestCaseFormModalProps> = ({
  isOpen,
  onClose,
  folderId,
  onSuccess,
  initialData
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
  const [precondition, setPrecondition] = useState('');
  const [steps, setSteps] = useState('');
  const [expectedResult, setExpectedResult] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [folders, setFolders] = useState<FolderTreeItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 폴더 목록 가져오기
  useEffect(() => {
    if (isOpen) {
      const fetchFolders = async () => {
        try {
          const response = await getFolderTree();
          if (response.success) {
            setFolders(response.data);
          }
        } catch (error) {
          console.error('Failed to load folders', error);
        }
      };
      fetchFolders();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setTitle(initialData.title);
        setDescription(initialData.description || '');
        setPriority(initialData.priority);
        setPrecondition(initialData.precondition || '');
        setSteps(initialData.steps || '');
        setExpectedResult(initialData.expectedResult || '');
        setSelectedFolderId(initialData.folderId || null);
      } else {
        setTitle('');
        setDescription('');
        setPriority('MEDIUM');
        setPrecondition('');
        setSteps('');
        setExpectedResult('');
        setSelectedFolderId(folderId);
      }
    }
  }, [isOpen, initialData, folderId]);

  if (!isOpen) return null;

  // 폴더 트리를 평탄화하여 드롭다운 옵션으로 변환
  const flattenFolders = (items: FolderTreeItem[], depth = 0): { id: string; name: string; depth: number }[] => {
    return items.reduce((acc, item) => {
      acc.push({ id: item.id, name: item.name, depth });
      if (item.children && item.children.length > 0) {
        acc.push(...flattenFolders(item.children, depth + 1));
      }
      return acc;
    }, [] as { id: string; name: string; depth: number }[]);
  };

  const folderOptions = flattenFolders(folders);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      setIsSubmitting(true);
      const data = {
        title,
        description,
        priority,
        precondition,
        steps,
        expectedResult,
        folderId: selectedFolderId || undefined
      };

      if (initialData) {
        await updateTestCase(initialData.id, data);
      } else {
        await createTestCase(data);
      }
      
      onSuccess();
      onClose();
    } catch (error) {
      alert(initialData ? '테스트케이스 수정 실패' : '테스트케이스 생성 실패');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isEdit = !!initialData;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-0 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h2 className="text-lg font-bold text-slate-800">
            {isEdit ? 'Edit Test Case' : 'New Test Case'}
          </h2>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1">
          <form id="testcase-form" onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-12 gap-4">
              {/* Title - Full Width */}
              <div className="col-span-12">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Title <span className="text-red-500">*</span>
                </label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter test case title"
                  required
                  className="w-full"
                />
              </div>

              {/* Priority - 4 Cols */}
              <div className="col-span-12 sm:col-span-6">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Priority</label>
                <div className="relative">
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full appearance-none bg-white border border-slate-200 text-slate-700 py-2.5 px-3 pr-8 rounded-md leading-tight focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 sm:text-sm transition-colors"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Folder - 6 Cols */}
              <div className="col-span-12 sm:col-span-6">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Folder</label>
                <div className="relative">
                  <select
                    value={selectedFolderId || ''}
                    onChange={(e) => setSelectedFolderId(e.target.value || null)}
                    className="w-full appearance-none bg-white border border-slate-200 text-slate-700 py-2.5 px-3 pr-8 rounded-md leading-tight focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 sm:text-sm transition-colors"
                  >
                    <option value="">최상위 (Root)</option>
                    {folderOptions.map((folder) => (
                      <option key={folder.id} value={folder.id}>
                        {'\u00A0\u00A0'.repeat(folder.depth)}{folder.name}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Precondition - Full Width */}
              <div className="col-span-12">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Preconditions</label>
                <Input
                  value={precondition}
                  onChange={(e) => setPrecondition(e.target.value)}
                  placeholder="e.g. User must be logged in"
                  className="w-full"
                />
              </div>

              {/* Steps - Full Width */}
              <div className="col-span-12">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Steps</label>
                <textarea
                  value={steps}
                  onChange={(e) => setSteps(e.target.value)}
                  className="w-full min-h-[100px] border border-slate-200 rounded-md py-2.5 px-3 text-sm text-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none resize-y transition-colors placeholder:text-slate-400"
                  placeholder="1. Step one&#10;2. Step two&#10;3. Step three"
                />
              </div>

              {/* Expected Result - Full Width */}
              <div className="col-span-12">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Expected Result</label>
                <textarea
                  value={expectedResult}
                  onChange={(e) => setExpectedResult(e.target.value)}
                  className="w-full min-h-[80px] border border-slate-200 rounded-md py-2.5 px-3 text-sm text-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none resize-y transition-colors placeholder:text-slate-400"
                  placeholder="Describe the expected outcome..."
                />
              </div>

              {/* Description - Full Width */}
              <div className="col-span-12">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full min-h-[80px] border border-slate-200 rounded-md py-2.5 px-3 text-sm text-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none resize-y transition-colors placeholder:text-slate-400"
                  placeholder="Additional details..."
                />
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            type="submit" 
            form="testcase-form"
            isLoading={isSubmitting}
            disabled={!title.trim()}
          >
            {isEdit ? 'Save Changes' : 'Create Test Case'}
          </Button>
        </div>
      </div>
    </div>
  );
};
