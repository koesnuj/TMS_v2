import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPlans, Plan } from '../api/plan';
import Navbar from '../components/Navbar';
import { Plus, PlayCircle, CheckCircle, XCircle, AlertCircle, Clock, FileText } from 'lucide-react';

const PlansPage: React.FC = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      setIsLoading(true);
      const response = await getPlans('ACTIVE');
      if (response.success) {
        setPlans(response.data);
      }
    } catch (error) {
      console.error('Failed to load plans', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#f2f4f6]">
      <Navbar />
      <div className="flex-1 overflow-auto page-container">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Test Plans & Runs</h1>
            <p className="text-gray-500 text-sm mt-1">Manage your test execution cycles.</p>
          </div>
          <button
            onClick={() => navigate('/plans/create')}
            className="btn-primary flex items-center shadow-sm"
          >
            <Plus size={16} className="mr-2" />
            Add Test Plan
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64 text-gray-500">Loading...</div>
        ) : plans.length === 0 ? (
          <div className="bg-white border border-gray-300 rounded-lg p-12 text-center shadow-sm">
            <PlayCircle size={48} className="mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900">No active test plans</h3>
            <p className="text-gray-500 mt-2">Create a test plan to start executing test cases.</p>
            <div className="mt-6">
              <button 
                onClick={() => navigate('/plans/create')}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium text-sm"
              >
                <Plus size={16} className="mr-2" />
                Create Plan
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-gray-300 rounded shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200 w-2/5">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200">Progress</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200">Stats</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200">Created</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {plans.map((plan) => (
                  <tr 
                    key={plan.id} 
                    className="hover:bg-blue-50/30 transition-colors cursor-pointer"
                    onClick={() => navigate(`/plans/${plan.id}`)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-start">
                        <FileText size={18} className="text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                        <div>
                          <div className="text-sm font-bold text-blue-700 hover:underline mb-1">
                            {plan.name}
                          </div>
                          <div className="text-xs text-gray-500 line-clamp-1">
                            {plan.description || 'No description provided.'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 align-middle">
                      <div className="w-full max-w-xs">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-semibold text-gray-700">{plan.stats?.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-500 ${
                              (plan.stats?.progress || 0) === 100 ? 'bg-green-500' : 'bg-blue-600'
                            }`}
                            style={{ width: `${plan.stats?.progress || 0}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-4 text-xs text-gray-600">
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-green-500"></div>
                          <span className="font-medium">{plan.stats?.pass}</span> Pass
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-red-500"></div>
                          <span className="font-medium">{plan.stats?.fail}</span> Fail
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                          <span className="font-medium">{plan.stats?.notRun}</span> Untested
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex flex-col">
                        <span>{new Date(plan.createdAt).toLocaleDateString()}</span>
                        <span className="text-xs text-gray-400">by {plan.createdBy}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlansPage;
