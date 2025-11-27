import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getPlanDetail, PlanDetail, updatePlanItem, bulkUpdatePlanItems, TestResult } from '../api/plan';
import Navbar from '../components/Navbar';
import { ArrowLeft, MessageSquare, CheckSquare, Square, PieChart, Clock, Calendar } from 'lucide-react';

// Auto Link Component
const AutoLinkText = ({ text }: { text?: string }) => {
  if (!text) return null;
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  return (
    <span>
      {parts.map((part, index) => {
        if (part.match(urlRegex)) {
          return (
            <a 
              key={index} 
              href={part} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-blue-600 hover:underline" 
              onClick={(e) => e.stopPropagation()}
            >
              {part}
            </a>
          );
        }
        return part;
      })}
    </span>
  );
};

// Comment Modal Component
interface CommentModalProps {
  isOpen: boolean;
  initialComment?: string;
  onClose: () => void;
  onSave: (comment: string) => void;
}

const CommentModal: React.FC<CommentModalProps> = ({ isOpen, initialComment, onClose, onSave }) => {
  const [comment, setComment] = useState(initialComment || '');

  useEffect(() => {
    setComment(initialComment || '');
  }, [initialComment, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg shadow-xl">
        <h3 className="text-lg font-bold mb-4 text-gray-800">Add Comment</h3>
        <textarea
          className="w-full border border-gray-300 rounded-md p-3 h-32 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Enter your comment here (URLs will be auto-linked)..."
        />
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(comment)}
            className="btn-primary"
          >
            Save Comment
          </button>
        </div>
      </div>
    </div>
  );
};

const PlanDetailPage: React.FC = () => {
  const { planId } = useParams<{ planId: string }>();
  const [plan, setPlan] = useState<PlanDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  
  // Comment Modal State
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingComment, setEditingComment] = useState<string>('');

  // Bulk Update State
  const [bulkResult, setBulkResult] = useState<TestResult | ''>('');
  
  const navigate = useNavigate();

  useEffect(() => {
    if (planId) {
      loadPlanDetail(planId);
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

  const handleToggleSelect = (itemId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  const handleSelectAll = () => {
    if (!plan) return;
    if (selectedItems.size === plan.items.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(plan.items.map(i => i.id)));
    }
  };

  const handleResultChange = async (itemId: string, newResult: TestResult) => {
    if (!planId) return;
    try {
      await updatePlanItem(planId, itemId, { result: newResult });
      loadPlanDetail(planId);
    } catch (error) {
      alert('Failed to update result');
    }
  };

  const openCommentModal = (itemId: string, currentComment?: string) => {
    setEditingItemId(itemId);
    setEditingComment(currentComment || '');
    setIsCommentModalOpen(true);
  };

  const handleSaveComment = async (comment: string) => {
    if (!planId || !editingItemId) return;
    try {
      await updatePlanItem(planId, editingItemId, { comment });
      setIsCommentModalOpen(false);
      loadPlanDetail(planId);
    } catch (error) {
      alert('Failed to save comment');
    }
  };

  const handleBulkUpdate = async () => {
    if (!planId || selectedItems.size === 0 || !bulkResult) return;
    if (!confirm(`Apply '${bulkResult}' to ${selectedItems.size} selected items?`)) return;

    try {
      await bulkUpdatePlanItems(planId, {
        items: Array.from(selectedItems),
        result: bulkResult as TestResult
      });
      setSelectedItems(new Set());
      setBulkResult('');
      loadPlanDetail(planId);
    } catch (error) {
      alert('Bulk update failed');
    }
  };

  if (isLoading && !plan) return <div className="flex justify-center items-center h-screen text-gray-500">Loading...</div>;
  if (!plan) return <div className="flex justify-center items-center h-screen text-gray-500">Plan not found.</div>;

  const totalItems = plan.items.length;
  const selectedCount = selectedItems.size;
  const notRunCount = plan.items.filter(i => i.result === 'NOT_RUN').length;
  const progress = totalItems > 0 ? Math.round(((totalItems - notRunCount) / totalItems) * 100) : 0;

  return (
    <div className="flex flex-col h-screen bg-[#f2f4f6]">
      <Navbar />
      <div className="flex-1 overflow-auto page-container">
        {/* Header Section */}
        <div className="mb-6">
          <button 
            onClick={() => navigate('/plans')}
            className="flex items-center text-gray-500 hover:text-blue-600 mb-3 transition-colors text-sm font-medium"
          >
            <ArrowLeft size={16} className="mr-1" /> Back to Plans
          </button>
          
          <div className="bg-white p-6 rounded-lg border border-gray-300 shadow-sm flex flex-col md:flex-row justify-between items-start gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                  <PieChart size={24} />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">{plan.name}</h1>
                <span className={`px-2 py-0.5 text-xs font-bold rounded uppercase ${plan.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                  {plan.status}
                </span>
              </div>
              <p className="text-gray-600 mb-4 max-w-2xl">{plan.description || 'No description provided.'}</p>
              
              <div className="flex gap-6 text-sm text-gray-500">
                <div className="flex items-center gap-1.5">
                  <Clock size={16} />
                  Created by <span className="font-medium text-gray-700">{plan.createdBy}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar size={16} />
                  {new Date(plan.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>

            {/* Stats Card */}
            <div className="w-full md:w-80 bg-gray-50 rounded border border-gray-200 p-4">
              <div className="flex justify-between text-sm mb-1.5">
                <span className="font-bold text-gray-700">Overall Progress</span>
                <span className="font-bold text-blue-600">{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                <div 
                  className={`h-3 rounded-full transition-all duration-500 ${progress === 100 ? 'bg-green-500' : 'bg-blue-600'}`}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex justify-between px-2 py-1 bg-white rounded border border-gray-200">
                  <span className="text-gray-500">Passed</span>
                  <span className="font-bold text-green-600">{plan.items.filter(i => i.result === 'PASS').length}</span>
                </div>
                <div className="flex justify-between px-2 py-1 bg-white rounded border border-gray-200">
                  <span className="text-gray-500">Failed</span>
                  <span className="font-bold text-red-600">{plan.items.filter(i => i.result === 'FAIL').length}</span>
                </div>
                <div className="flex justify-between px-2 py-1 bg-white rounded border border-gray-200">
                  <span className="text-gray-500">Blocked</span>
                  <span className="font-bold text-orange-600">{plan.items.filter(i => i.result === 'BLOCK').length}</span>
                </div>
                <div className="flex justify-between px-2 py-1 bg-white rounded border border-gray-200">
                  <span className="text-gray-500">Untested</span>
                  <span className="font-bold text-gray-600">{notRunCount}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bulk Action Bar */}
        {selectedCount > 0 && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md flex items-center gap-4 shadow-sm animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2 px-2">
              <CheckSquare size={18} className="text-blue-600" />
              <span className="font-bold text-blue-800 text-sm">{selectedCount} selected</span>
            </div>
            <div className="h-6 w-px bg-blue-200"></div>
            <div className="flex items-center gap-2">
              <select
                value={bulkResult}
                onChange={(e) => setBulkResult(e.target.value as TestResult)}
                className="border-gray-300 rounded text-sm py-1.5 pl-2 pr-8 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Set status to...</option>
                <option value="PASS">PASS</option>
                <option value="FAIL">FAIL</option>
                <option value="BLOCK">BLOCK</option>
                <option value="NOT_RUN">NOT_RUN</option>
              </select>
              <button
                onClick={handleBulkUpdate}
                disabled={!bulkResult}
                className="px-4 py-1.5 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                Apply
              </button>
            </div>
          </div>
        )}

        {/* Items Table */}
        <div className="bg-white rounded border border-gray-300 shadow-sm overflow-hidden mb-10">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 w-12 text-center border-b border-gray-200">
                  <button 
                    onClick={handleSelectAll}
                    className="text-gray-500 hover:text-gray-700 focus:outline-none transition-colors"
                    title={selectedItems.size === totalItems ? "Deselect All" : "Select All"}
                  >
                    {selectedItems.size > 0 && selectedItems.size === totalItems ? 
                      <CheckSquare size={20} className="text-blue-600" /> : <Square size={20} />
                    }
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200 w-32">Status</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200 w-24">ID</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200">Title</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200 w-24">Priority</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200 w-32">Assignee</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200">Comment</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200 w-40">Executed</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {plan.items.map((item) => (
                <tr key={item.id} className={`hover:bg-blue-50/30 transition-colors ${selectedItems.has(item.id) ? 'bg-blue-50/50' : ''}`}>
                  <td className="px-4 py-3 text-center align-middle">
                    <input
                      type="checkbox"
                      checked={selectedItems.has(item.id)}
                      onChange={() => handleToggleSelect(item.id)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                    />
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap align-middle">
                    <select
                      value={item.result}
                      onChange={(e) => handleResultChange(item.id, e.target.value as TestResult)}
                      className={`text-xs font-bold rounded px-2 py-1 border-0 cursor-pointer focus:ring-2 focus:ring-offset-1 w-full text-center appearance-none
                        ${item.result === 'PASS' ? 'bg-green-100 text-green-700 hover:bg-green-200' : 
                          item.result === 'FAIL' ? 'bg-red-100 text-red-700 hover:bg-red-200' : 
                          item.result === 'BLOCK' ? 'bg-orange-100 text-orange-700 hover:bg-orange-200' : 
                          'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                      <option value="NOT_RUN">UNTESTED</option>
                      <option value="PASS">PASS</option>
                      <option value="FAIL">FAIL</option>
                      <option value="BLOCK">BLOCK</option>
                    </select>
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-500 font-mono align-middle">
                    {item.testCaseId.substring(0, 6).toUpperCase()}
                  </td>
                  <td className="px-6 py-3 align-middle">
                    <div className="text-sm font-medium text-gray-900">{item.testCase.title}</div>
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap align-middle">
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold border
                      ${item.testCase.priority === 'HIGH' ? 'bg-red-50 text-red-700 border-red-200' :
                        item.testCase.priority === 'MEDIUM' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                        'bg-green-50 text-green-700 border-green-200'}`}>
                      {item.testCase.priority}
                    </span>
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500 align-middle">
                    {item.assignee || <span className="text-gray-300">-</span>}
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-500 align-middle">
                    <div className="flex items-center gap-2 group">
                       <button 
                        onClick={() => openCommentModal(item.id, item.comment)}
                        className={`p-1.5 rounded-full hover:bg-gray-100 transition-colors ${item.comment ? 'text-blue-600 bg-blue-50' : 'text-gray-300 group-hover:text-gray-500'}`}
                        title={item.comment ? "Edit Comment" : "Add Comment"}
                      >
                        <MessageSquare size={16} />
                      </button>
                      {item.comment && (
                        <div className="line-clamp-1 break-all text-xs text-gray-600 max-w-xs">
                          <AutoLinkText text={item.comment} />
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500 text-xs align-middle">
                    {item.executedAt ? (
                      <div className="flex flex-col">
                        <span>{new Date(item.executedAt).toLocaleDateString()}</span>
                        <span className="text-gray-400">{new Date(item.executedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      </div>
                    ) : <span className="text-gray-300">-</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Comment Modal */}
      <CommentModal
        isOpen={isCommentModalOpen}
        initialComment={editingComment}
        onClose={() => setIsCommentModalOpen(false)}
        onSave={handleSaveComment}
      />
    </div>
  );
};

export default PlanDetailPage;
