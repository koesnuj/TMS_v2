import React, { useEffect, useState } from 'react';
import { getAllUsers, approveUser, resetPassword } from '../api/admin';
import { User } from '../api/types';
import { Shield, Users, Key } from 'lucide-react';

const AdminPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await getAllUsers();
      if (response.success) {
        setUsers(response.users);
      }
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (email: string, action: 'approve' | 'reject') => {
    if (!confirm(`Are you sure you want to ${action} this user?`)) return;
    try {
      await approveUser({ email, action });
      loadUsers();
      setMessage(`User ${action}d successfully.`);
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      alert('Operation failed');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail || !newPassword) return;

    try {
      await resetPassword({ email: resetEmail, newPassword });
      setMessage('Password reset successfully.');
      setResetEmail('');
      setNewPassword('');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      alert('Password reset failed');
    }
  };

  const pendingUsers = users.filter((u) => u.status === 'PENDING');

  if (loading) return <div className="p-10 text-center text-gray-500">Loading...</div>;

  return (
    <div className="h-full">
      <div className="flex items-center gap-3 mb-6 border-b border-[#d8d8d8] pb-4">
        <div className="bg-[#2b73b7] p-2 rounded text-white">
          <Shield size={24} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-[#333]">Administration</h2>
          <p className="text-sm text-gray-500">Manage users, roles, and system settings.</p>
        </div>
      </div>

      {message && (
        <div className="mb-6 p-3 bg-green-50 border border-green-200 text-green-700 rounded text-sm font-medium">
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main User List */}
        <div className="lg:col-span-2 space-y-8">
          {/* Pending Approvals */}
          {pendingUsers.length > 0 && (
            <section className="bg-white">
              <h3 className="text-md font-bold text-[#333] mb-3 flex items-center gap-2">
                <Users size={18} className="text-[#2b73b7]" />
                Pending Approvals
                <span className="bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full">{pendingUsers.length}</span>
              </h3>
              <div className="border border-[#d8d8d8] rounded">
                <table className="w-full">
                  <thead className="bg-[#f0f0f0]">
                    <tr>
                      <th className="tr-table-header text-left">Name</th>
                      <th className="tr-table-header text-left">Email</th>
                      <th className="tr-table-header text-left">Date</th>
                      <th className="tr-table-header text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingUsers.map((user) => (
                      <tr key={user.id} className="tr-table-row">
                        <td className="tr-table-cell font-medium">{user.name}</td>
                        <td className="tr-table-cell text-gray-600">{user.email}</td>
                        <td className="tr-table-cell text-gray-500">{new Date(user.createdAt!).toLocaleDateString()}</td>
                        <td className="tr-table-cell text-right">
                          <button onClick={() => handleApprove(user.email, 'approve')} className="text-[#2b73b7] hover:underline font-bold mr-3 text-xs">Approve</button>
                          <button onClick={() => handleApprove(user.email, 'reject')} className="text-red-600 hover:underline font-bold text-xs">Reject</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* All Users */}
          <section>
            <h3 className="text-md font-bold text-[#333] mb-3">All Users</h3>
            <div className="border border-[#d8d8d8] rounded overflow-hidden">
              <table className="w-full">
                <thead className="bg-[#f0f0f0]">
                  <tr>
                    <th className="tr-table-header text-left">Name</th>
                    <th className="tr-table-header text-left">Email</th>
                    <th className="tr-table-header text-left">Role</th>
                    <th className="tr-table-header text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="tr-table-row">
                      <td className="tr-table-cell font-medium text-[#333]">{user.name}</td>
                      <td className="tr-table-cell text-gray-600">{user.email}</td>
                      <td className="tr-table-cell">
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${user.role === 'ADMIN' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-600'}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="tr-table-cell">
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                          user.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {user.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-[#f9f9f9] p-5 rounded border border-[#e0e0e0]">
            <h3 className="text-sm font-bold text-[#333] mb-4 flex items-center gap-2">
              <Key size={16} className="text-gray-500" />
              Password Reset
            </h3>
            <form onSubmit={handleResetPassword} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">User Email</label>
                <input
                  type="email"
                  className="w-full border border-[#ccc] rounded px-2 py-1.5 text-sm focus:border-[#2b73b7] outline-none"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="user@example.com"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">New Password</label>
                <input
                  type="password"
                  className="w-full border border-[#ccc] rounded px-2 py-1.5 text-sm focus:border-[#2b73b7] outline-none"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min. 6 chars"
                  required
                />
              </div>
              <button type="submit" className="btn-primary w-full text-xs py-2">
                Reset Password
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
