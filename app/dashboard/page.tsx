'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Link as LinkIcon, LogOut, Coins, CreditCard, CheckCircle2, Upload, X, ExternalLink, Clock, History, ChevronLeft, ChevronRight, Loader2, Globe } from 'lucide-react';

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [link, setLink] = useState('');
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [subPage, setSubPage] = useState(1);
  const [subTotalPages, setSubTotalPages] = useState(1);
  const [subTotal, setSubTotal] = useState(0);

  // Active Submissions State
  const [activeSubmissions, setActiveSubmissions] = useState<any[]>([]);

  // Buy Tokens Modal State
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchUser();
    fetchSubmissions(1);
  }, []);

  const fetchUser = async () => {
    try {
      const res = await fetch('/api/user');
      const data = await res.json();
      if (res.ok) {
        setUser(data.user);
      } else {
        router.push('/login');
      }
    } catch {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubmissions = async (page = 1) => {
    try {
      const res = await fetch(`/api/user/submissions?page=${page}`);
      if (res.ok) {
        const data = await res.json();
        setSubmissions(data.submissions);
        setSubPage(data.page);
        setSubTotalPages(data.totalPages);
        setSubTotal(data.total);
      }
    } catch {}
  };

  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'POST' });
    router.push('/login');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReceiptFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setReceiptPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleBuyTokens = async () => {
    if (!receiptFile) return toast.error('Please upload a payment receipt');

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('receipt', receiptFile);

      const res = await fetch('/api/buy-tokens', { method: 'POST', body: formData });
      if (res.ok) {
        toast.success('Receipt uploaded! Waiting for admin approval.');
        setShowBuyModal(false);
        setReceiptFile(null);
        setReceiptPreview(null);
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to upload receipt');
      }
    } catch {
      toast.error('An error occurred');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmitLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (user.tokens <= 0) return toast.error('You do not have enough tokens');

    const linkToSubmit = link.trim();
    if (!linkToSubmit) return;
    
    setLink('');

    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ link: linkToSubmit }),
      });
      const data = await res.json();

      if (res.ok) {
        setUser({ ...user, tokens: data.newTokens });
        
        const newActiveSub = {
          id: Date.now().toString(),
          link: data.link || linkToSubmit,
          timeLeft: 30,
          status: 'indexing'
        };
        
        setActiveSubmissions(prev => [newActiveSub, ...prev]);

        const interval = setInterval(() => {
          setActiveSubmissions(prev => {
            const index = prev.findIndex(s => s.id === newActiveSub.id);
            if (index === -1) {
              clearInterval(interval);
              return prev;
            }
            
            const updated = [...prev];
            if (updated[index].timeLeft > 0) {
              updated[index].timeLeft -= 1;
              return updated;
            } else {
              clearInterval(interval);
              setTimeout(() => {
                setActiveSubmissions(current => current.filter(s => s.id !== newActiveSub.id));
                fetchSubmissions(1);
              }, 1000);
              return updated;
            }
          });
        }, 1000);

        toast.success('Indexing started!', { icon: '🚀' });
      } else {
        toast.error(data.error || 'Failed to submit link');
      }
    } catch {
      toast.error('An error occurred');
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-gray-500 font-medium">Loading...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white p-6 max-w-5xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-black">Welcome, {user?.name}</h1>
          <p className="text-gray-400 text-sm">User Dashboard</p>
        </div>
        <div className="flex items-center gap-3 mt-4 md:mt-0">
          <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-xl border border-blue-100">
            <Coins className="w-5 h-5 text-blue-600" />
            <span className="font-bold text-blue-700">{user?.tokens} Tokens</span>
          </div>
          <button
            onClick={() => setShowBuyModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-semibold transition-colors flex items-center gap-2 text-sm"
          >
            <CreditCard className="w-4 h-4" /> Buy Tokens
          </button>
          <button
            onClick={handleLogout}
            className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-xl transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Submit Link Card */}
      <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
        <h2 className="text-xl font-bold text-black mb-6 flex items-center gap-2">
          <LinkIcon className="text-blue-600 w-5 h-5" /> Submit a New Link
        </h2>
        <form onSubmit={handleSubmitLink} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">URL to Index</label>
            <input
              type="text"
              required
              placeholder="example.com or https://example.com"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl py-4 px-4 text-black placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-base"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              disabled={false}
            />
          </div>
          <button
            type="submit"
            disabled={user?.tokens <= 0}
            className={`w-full py-4 rounded-xl font-bold text-base transition-all flex items-center justify-center gap-2
              ${user?.tokens <= 0
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-[#007ba0] hover:bg-[#006a8a] text-white shadow-lg shadow-cyan-900/20'}`}
          >
            <span className="text-lg">📡</span> Submit & Start Indexing
          </button>
        </form>
      </div>

      {/* Active Submissions */}
      {activeSubmissions.length > 0 && (
        <div className="bg-[#0b1424] rounded-2xl border border-gray-800 shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between bg-white/5">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 bg-orange-100/10 rounded flex items-center justify-center text-orange-400">📋</span>
              Active Submissions
            </h2>
            <span className="text-xs font-medium text-blue-400 bg-blue-400/10 px-3 py-1 rounded-full border border-blue-400/20">
              {activeSubmissions.length} active links
            </span>
          </div>
          <div className="divide-y divide-gray-800">
            {activeSubmissions.map((s) => (
              <div key={s.id} className="flex items-center justify-between px-6 py-5 bg-[#0d1b2e]/50">
                <div className="flex items-center gap-3 min-w-0">
                  <Globe className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  <span className="text-gray-300 text-sm font-medium truncate max-w-[250px] md:max-w-xl">
                    {s.link}
                  </span>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                  <div className="flex items-center gap-2 bg-[#162a45] px-4 py-2 rounded-full border border-blue-500/30">
                    <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                    <span className="text-cyan-400 text-xs font-bold uppercase tracking-wider">Indexing</span>
                    <div className="w-px h-3 bg-blue-500/30 mx-1" />
                    <span className="text-blue-300 text-xs font-mono font-bold w-6 text-center">{s.timeLeft}s</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Submission History */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
          <h2 className="text-lg font-bold text-black flex items-center gap-2">
            <History className="w-5 h-5 text-blue-600" /> My Submission History
          </h2>
          <span className="text-xs text-gray-400">{subTotal} total submissions</span>
        </div>

        {submissions.length === 0 ? (
          <div className="py-12 text-center text-gray-400 space-y-2">
            <LinkIcon className="w-8 h-8 mx-auto text-gray-200" />
            <p className="text-sm">No submissions yet. Submit your first link above!</p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-gray-50">
              {submissions.map((s, i) => (
                <div key={s._id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-600 text-xs font-bold">{(subPage - 1) * 30 + i + 1}</span>
                    </div>
                    <div className="min-w-0">
                      <span className="text-gray-700 text-sm font-medium block truncate max-w-[280px] md:max-w-lg">
                        {s.link}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-400 flex-shrink-0 ml-4">
                    <Clock className="w-3.5 h-3.5" />
                    <span className="whitespace-nowrap">{new Date(s.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
            {subTotalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-50">
                <span className="text-xs text-gray-400">Page {subPage} of {subTotalPages}</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => fetchSubmissions(subPage - 1)}
                    disabled={subPage === 1}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" /> Prev
                  </button>
                  <button
                    onClick={() => fetchSubmissions(subPage + 1)}
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
      </div>


      {/* Buy Tokens Modal */}
      {showBuyModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-gray-100 shadow-2xl p-8 rounded-3xl w-full max-w-md relative">
            <button
              onClick={() => { setShowBuyModal(false); setReceiptFile(null); setReceiptPreview(null); }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-black mb-1">Buy Tokens</h3>
            <p className="text-gray-500 text-sm mb-6">Plan: 1000 tokens for PKR 500</p>

            <div className="space-y-5">
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-sm text-gray-700 space-y-3">
                <p className="font-semibold text-black">Payment Instructions</p>
                <div className="space-y-1.5">
                  <div className="bg-white rounded-xl p-3 border border-blue-100 space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 text-xs">Account Name</span>
                      <span className="font-bold text-black text-xs">MUHAMMAD TAHIR SHAFIQ</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 text-xs">Bank</span>
                      <span className="font-semibold text-black text-xs">Meezan Bank – RENALA KHURD BRANCH</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 text-xs">Account No.</span>
                      <span className="font-mono font-bold text-blue-700 text-xs">98540105795749</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 text-xs">IBAN</span>
                      <span className="font-mono font-bold text-blue-700 text-xs">PK79MEZN0098540105795749</span>
                    </div>
                  </div>
                </div>
                <p className="text-gray-500">2. Upload screenshot of successful transaction.</p>
                <p className="text-gray-500">3. Wait for admin approval to receive <strong className="text-black">indexing tokens.</strong>.</p>
              </div>

              <div
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${receiptPreview ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-blue-400 hover:bg-blue-50'}`}
              >
                {receiptPreview ? (
                  <div className="space-y-2">
                    <img src={receiptPreview} alt="Receipt preview" className="max-h-32 mx-auto rounded-lg object-contain" />
                    <p className="text-blue-600 font-medium text-sm flex items-center justify-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Image Selected
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 text-gray-400">
                    <Upload className="w-8 h-8 mx-auto" />
                    <p className="font-medium text-sm">Click to upload receipt</p>
                    <p className="text-xs text-gray-300">PNG, JPG, JPEG supported</p>
                  </div>
                )}
                <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
              </div>

              <button
                onClick={handleBuyTokens}
                disabled={isUploading || !receiptFile}
                className={`w-full py-3 rounded-xl font-bold transition-all ${(!receiptFile || isUploading) ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'}`}
              >
                {isUploading ? 'Uploading...' : 'Submit Receipt'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
