'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  LogOut, Check, X, Users, Link as LinkIcon, FileText,
  ExternalLink, Trash2, CheckSquare, Square, Plus, Search,
  ChevronLeft, ChevronRight
} from 'lucide-react';

export default function AdminDashboard() {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [subPage, setSubPage] = useState(1);
  const [subTotalPages, setSubTotalPages] = useState(1);
  const [subTotal, setSubTotal] = useState(0);
  const [receipts, setReceipts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('users');

  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [selectedSubmissions, setSelectedSubmissions] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);

  const [tokenInputs, setTokenInputs] = useState<Record<string, string>>({});
  const [addingTokens, setAddingTokens] = useState<string | null>(null);

  const [userSearch, setUserSearch] = useState('');
  const [subSearch, setSubSearch] = useState('');

  useEffect(() => { fetchData(1); }, []);

  const fetchData = async (page = 1) => {
    try {
      const [userRes, subRes, recRes] = await Promise.all([
        fetch('/api/admin/users'),
        fetch(`/api/admin/submissions?page=${page}`),
        fetch('/api/admin/receipts'),
      ]);

      if (userRes.ok && subRes.ok && recRes.ok) {
        const [ud, sd, rd] = await Promise.all([userRes.json(), subRes.json(), recRes.json()]);
        setUsers(ud.users);
        setSubmissions(sd.submissions);
        setSubPage(sd.page);
        setSubTotalPages(sd.totalPages);
        setSubTotal(sd.total);
        setReceipts(rd.receipts);
        setSelectedUsers(new Set());
        setSelectedSubmissions(new Set());
      } else {
        router.push('/dashboard');
      }
    } catch {
      toast.error('Error fetching admin data');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubmissionsPage = async (page: number) => {
    try {
      const res = await fetch(`/api/admin/submissions?page=${page}`);
      if (res.ok) {
        const sd = await res.json();
        setSubmissions(sd.submissions);
        setSubPage(sd.page);
        setSubTotalPages(sd.totalPages);
        setSubTotal(sd.total);
        setSelectedSubmissions(new Set());
      }
    } catch {
      toast.error('Error fetching submissions');
    }
  };

  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'POST' });
    router.push('/login');
  };

  // Filtered lists
  const filteredUsers = useMemo(() => {
    const q = userSearch.toLowerCase();
    return users.filter(u => u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q));
  }, [users, userSearch]);

  const filteredSubmissions = useMemo(() => {
    const q = subSearch.toLowerCase();
    return submissions.filter(s =>
      s.link?.toLowerCase().includes(q) ||
      s.userId?.name?.toLowerCase().includes(q) ||
      s.userId?.email?.toLowerCase().includes(q)
    );
  }, [submissions, subSearch]);

  // Selection helpers
  const toggleUser = (id: string) => setSelectedUsers(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAllUsers = () => setSelectedUsers(selectedUsers.size === filteredUsers.length ? new Set() : new Set(filteredUsers.map(u => u._id)));
  const toggleSubmission = (id: string) => setSelectedSubmissions(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAllSubmissions = () => setSelectedSubmissions(selectedSubmissions.size === filteredSubmissions.length ? new Set() : new Set(filteredSubmissions.map(s => s._id)));

  // Add tokens
  const handleAddTokens = async (userId: string) => {
    const amount = parseInt(tokenInputs[userId] || '0');
    if (!amount || amount <= 0) return toast.error('Enter a valid token amount');
    setAddingTokens(userId);
    try {
      const res = await fetch('/api/admin/add-tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, amount }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`${amount} tokens added! New balance: ${data.newTokens}`);
        setTokenInputs(prev => ({ ...prev, [userId]: '' }));
        setUsers(prev => prev.map(u => u._id === userId ? { ...u, tokens: data.newTokens } : u));
      } else {
        toast.error(data.error || 'Failed to add tokens');
      }
    } catch { toast.error('Error adding tokens'); }
    finally { setAddingTokens(null); }
  };

  // Delete users
  const handleDeleteUsers = async (ids: string[]) => {
    if (!confirm(`Delete ${ids.length} user(s)? Their submissions and receipts will also be removed.`)) return;
    setDeleting(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
      if (res.ok) { toast.success(`${ids.length} user(s) deleted.`); fetchData(); }
      else toast.error('Failed to delete users');
    } catch { toast.error('Error deleting users'); }
    finally { setDeleting(false); }
  };

  // Delete submissions
  const handleDeleteSubmissions = async (ids: string[]) => {
    if (!confirm(`Delete ${ids.length} submission(s)?`)) return;
    setDeleting(true);
    try {
      const res = await fetch('/api/admin/submissions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
      if (res.ok) { toast.success(`${ids.length} submission(s) deleted.`); fetchSubmissionsPage(subPage); }
      else toast.error('Failed to delete submissions');
    } catch { toast.error('Error deleting submissions'); }
    finally { setDeleting(false); }
  };

  // Approve / Reject receipt
  const handleReceiptAction = async (id: string, action: 'approve' | 'reject') => {
    try {
      const res = await fetch('/api/admin/approve-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiptId: id, action: action === 'reject' ? 'reject' : 'approve' }),
      });
      if (res.ok) {
        toast.success(action === 'approve' ? 'Approved! 1000 tokens added.' : 'Receipt rejected.');
        fetchData();
      } else {
        toast.error('Failed to process receipt');
      }
    } catch { toast.error('Error processing receipt'); }
  };

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-gray-500 font-medium">Loading Admin Panel...</div>
    </div>
  );

  const tabs = [
    { id: 'users', label: 'Users', icon: Users, count: users.length },
    { id: 'submissions', label: 'Submissions', icon: LinkIcon, count: subTotal || submissions.length },
    { id: 'receipts', label: 'Pending Receipts', icon: FileText, count: receipts.length },
  ];

  const allUsersSelected = filteredUsers.length > 0 && filteredUsers.every(u => selectedUsers.has(u._id));
  const allSubsSelected = filteredSubmissions.length > 0 && filteredSubmissions.every(s => selectedSubmissions.has(s._id));

  return (
    <div className="min-h-screen bg-white p-6 max-w-7xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-black">Admin Panel</h1>
            <p className="text-gray-400 text-xs">Manage users, submissions & receipts</p>
          </div>
        </div>
        <button onClick={handleLogout} className="text-gray-500 hover:text-red-500 hover:bg-red-50 px-4 py-2 rounded-xl transition-colors flex items-center gap-2 font-medium text-sm mt-4 md:mt-0 border border-gray-200">
          <LogOut className="w-4 h-4" /> Logout
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-xl font-semibold text-sm flex items-center gap-2 transition-all ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 hover:text-black hover:bg-gray-50'}`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

        {/* ── USERS ── */}
        {activeTab === 'users' && (
          <>
            {/* Search + bulk bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-6 py-4 border-b border-gray-50">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-300" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl text-black placeholder-gray-300 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                />
              </div>
              {selectedUsers.size > 0 && (
                <button
                  onClick={() => handleDeleteUsers(Array.from(selectedUsers))}
                  disabled={deleting}
                  className="flex items-center gap-1.5 bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-60 whitespace-nowrap"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete {selectedUsers.size} Selected
                </button>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-4 py-4 w-10">
                      <button onClick={toggleAllUsers} className="text-gray-400 hover:text-blue-600 transition-colors">
                        {allUsersSelected ? <CheckSquare className="w-4 h-4 text-blue-600" /> : <Square className="w-4 h-4" />}
                      </button>
                    </th>
                    <th className="px-4 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Name</th>
                    <th className="px-4 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Email</th>
                    <th className="px-4 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Tokens</th>
                    <th className="px-4 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Give Tokens</th>
                    <th className="px-4 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Joined</th>
                    <th className="px-4 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Delete</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredUsers.length === 0 ? (
                    <tr><td colSpan={7} className="px-6 py-10 text-center text-gray-400">No users found.</td></tr>
                  ) : filteredUsers.map(u => (
                    <tr key={u._id} className={`hover:bg-gray-50 transition-colors ${selectedUsers.has(u._id) ? 'bg-blue-50/40' : ''}`}>
                      <td className="px-4 py-4">
                        <button onClick={() => toggleUser(u._id)} className="text-gray-400 hover:text-blue-600 transition-colors">
                          {selectedUsers.has(u._id) ? <CheckSquare className="w-4 h-4 text-blue-600" /> : <Square className="w-4 h-4" />}
                        </button>
                      </td>
                      <td className="px-4 py-4 font-semibold text-black whitespace-nowrap">{u.name}</td>
                      <td className="px-4 py-4 text-gray-500">{u.email}</td>
                      <td className="px-4 py-4">
                        <span className="inline-flex items-center bg-blue-50 text-blue-700 font-bold px-2.5 py-1 rounded-lg text-xs">{u.tokens}</span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min="1"
                            placeholder="e.g. 500"
                            value={tokenInputs[u._id] || ''}
                            onChange={(e) => setTokenInputs(prev => ({ ...prev, [u._id]: e.target.value }))}
                            className="w-24 border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm text-black placeholder-gray-300 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                          />
                          <button
                            onClick={() => handleAddTokens(u._id)}
                            disabled={addingTokens === u._id || !tokenInputs[u._id]}
                            className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            {addingTokens === u._id ? '...' : 'Add'}
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-gray-400 text-xs whitespace-nowrap">{new Date(u.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-4">
                        <button
                          onClick={() => handleDeleteUsers([u._id])}
                          disabled={deleting}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ── SUBMISSIONS ── */}
        {activeTab === 'submissions' && (
          <>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-6 py-4 border-b border-gray-50">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-300" />
                <input
                  type="text"
                  placeholder="Search by user or URL..."
                  value={subSearch}
                  onChange={(e) => setSubSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl text-black placeholder-gray-300 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                />
              </div>
              {selectedSubmissions.size > 0 && (
                <button
                  onClick={() => handleDeleteSubmissions(Array.from(selectedSubmissions))}
                  disabled={deleting}
                  className="flex items-center gap-1.5 bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-60 whitespace-nowrap"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete {selectedSubmissions.size} Selected
                </button>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-4 py-4 w-10">
                      <button onClick={toggleAllSubmissions} className="text-gray-400 hover:text-blue-600 transition-colors">
                        {allSubsSelected ? <CheckSquare className="w-4 h-4 text-blue-600" /> : <Square className="w-4 h-4" />}
                      </button>
                    </th>
                    <th className="px-4 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">User</th>
                    <th className="px-4 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Link</th>
                    <th className="px-4 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Date</th>
                    <th className="px-4 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Delete</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredSubmissions.length === 0 ? (
                    <tr><td colSpan={5} className="px-6 py-10 text-center text-gray-400">No submissions found.</td></tr>
                  ) : filteredSubmissions.map(s => (
                    <tr key={s._id} className={`hover:bg-gray-50 transition-colors ${selectedSubmissions.has(s._id) ? 'bg-blue-50/40' : ''}`}>
                      <td className="px-4 py-4">
                        <button onClick={() => toggleSubmission(s._id)} className="text-gray-400 hover:text-blue-600 transition-colors">
                          {selectedSubmissions.has(s._id) ? <CheckSquare className="w-4 h-4 text-blue-600" /> : <Square className="w-4 h-4" />}
                        </button>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <p className="font-semibold text-black">{s.userId?.name || 'Unknown'}</p>
                        <p className="text-xs text-gray-400">{s.userId?.email}</p>
                      </td>
                      <td className="px-4 py-4 max-w-xs">
                        <a href={s.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1 text-sm">
                          <span className="truncate block max-w-[220px]">{s.link}</span>
                          <ExternalLink className="w-3 h-3 flex-shrink-0" />
                        </a>
                      </td>
                      <td className="px-4 py-4 text-gray-400 text-xs whitespace-nowrap">{new Date(s.createdAt).toLocaleString()}</td>
                      <td className="px-4 py-4">
                        <button
                          onClick={() => handleDeleteSubmissions([s._id])}
                          disabled={deleting}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {subTotalPages > 1 && !subSearch && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-50">
                <span className="text-xs text-gray-400">
                  Page {subPage} of {subTotalPages} &nbsp;·&nbsp; {subTotal} total
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => fetchSubmissionsPage(subPage - 1)}
                    disabled={subPage === 1}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" /> Prev
                  </button>
                  <button
                    onClick={() => fetchSubmissionsPage(subPage + 1)}
                    disabled={subPage === subTotalPages}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Next <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* ── RECEIPTS ── */}
        {activeTab === 'receipts' && (
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {receipts.length === 0 ? (
              <p className="text-gray-400 col-span-full py-10 text-center">No pending receipts.</p>
            ) : receipts.map(r => (
              <div key={r._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                <div className="p-4 border-b border-gray-50">
                  <p className="font-semibold text-black">{r.userId?.name}</p>
                  <p className="text-xs text-gray-400">{r.userId?.email}</p>
                  <p className="text-xs text-gray-300 mt-1">{new Date(r.createdAt).toLocaleString()}</p>
                </div>
                <div className="flex-1 p-4 bg-gray-50 flex items-center justify-center min-h-[160px]">
                  <img src={r.imageData} alt="Payment Receipt" className="max-h-48 w-full object-contain rounded-lg" />
                </div>
                <div className="p-4 flex gap-2">
                  <button
                    onClick={() => handleReceiptAction(r._id, 'approve')}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Check className="w-4 h-4" /> Approve
                  </button>
                  <button
                    onClick={() => handleReceiptAction(r._id, 'reject')}
                    className="flex-1 bg-red-50 hover:bg-red-100 text-red-500 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors border border-red-100"
                  >
                    <X className="w-4 h-4" /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
