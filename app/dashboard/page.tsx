'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Link as LinkIcon, LogOut, Coins, CreditCard, CheckCircle2, Upload, X } from 'lucide-react';

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [link, setLink] = useState('');

  // Submission Loader State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('Connecting...');

  // Buy Tokens Modal State
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchUser();
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
    } catch (err) {
      router.push('/login');
    } finally {
      setLoading(false);
    }
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
      reader.onloadend = () => {
        setReceiptPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBuyTokens = async () => {
    if (!receiptFile) return toast.error('Please upload a payment receipt');

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('receipt', receiptFile);

      const res = await fetch('/api/buy-tokens', {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        toast.success('Receipt uploaded! Waiting for admin approval.');
        setShowBuyModal(false);
        setReceiptFile(null);
        setReceiptPreview(null);
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to upload receipt');
      }
    } catch (err) {
      toast.error('An error occurred');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmitLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (user.tokens <= 0) {
      return toast.error('You do not have enough tokens');
    }

    setIsSubmitting(true);
    setProgress(0);
    setLoadingMessage('Connecting...');

    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ link }),
      });
      const data = await res.json();

      if (res.ok) {
        setUser({ ...user, tokens: data.newTokens });

        const totalMs = data.randomSeconds * 1000;
        const intervalMs = 100;
        const steps = totalMs / intervalMs;
        let currentStep = 0;

        const interval = setInterval(() => {
          currentStep++;
          const currentProgress = (currentStep / steps) * 100;
          setProgress(Math.min(currentProgress, 100));

          if (currentProgress > 30 && currentProgress <= 60) {
            setLoadingMessage('Processing indexing...');
          } else if (currentProgress > 60 && currentProgress < 95) {
            setLoadingMessage('Finalizing submission...');
          } else if (currentProgress >= 95) {
            setLoadingMessage('Done!');
          }

          if (currentStep >= steps) {
            clearInterval(interval);
            setIsSubmitting(false);
            setLink('');
            toast.success('Link submitted successfully!', { duration: 4000, icon: '🚀' });
          }
        }, intervalMs);
      } else {
        toast.error(data.error || 'Failed to submit link');
        setIsSubmitting(false);
      }
    } catch (err) {
      toast.error('An error occurred');
      setIsSubmitting(false);
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

      {/* Main Card */}
      <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
        <h2 className="text-xl font-bold text-black mb-6 flex items-center gap-2">
          <LinkIcon className="text-blue-600 w-5 h-5" /> Submit a New Link
        </h2>

        <form onSubmit={handleSubmitLink} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">URL to Index</label>
            <input
              type="url"
              required
              placeholder="https://example.com/my-article"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl py-4 px-4 text-black placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-base"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting || user?.tokens <= 0}
            className={`w-full py-4 rounded-xl font-bold text-base transition-all flex items-center justify-center gap-2
              ${isSubmitting || user?.tokens <= 0
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'}`}
          >
            {user?.tokens <= 0 ? 'Not Enough Tokens' : 'Submit Link (1 Token)'}
          </button>
        </form>
      </div>

      {/* Fake Loader Modal */}
      {isSubmitting && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-gray-100 shadow-2xl p-8 rounded-3xl w-full max-w-md text-center space-y-6">
            <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mx-auto">
              <LinkIcon className="w-7 h-7 text-blue-600 animate-pulse" />
            </div>
            <h3 className="text-xl font-bold text-black">Processing Submission</h3>
            <p className="text-gray-500 animate-pulse">{loadingMessage}</p>

            <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-100 ease-linear rounded-full"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-400 font-mono">{Math.round(progress)}%</p>
          </div>
        </div>
      )}

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
                  <p>Send exactly <strong className="text-blue-700">PKR 500</strong> to:</p>
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
                <p className="text-gray-500">3. Wait for admin approval to receive <strong className="text-black">1000 tokens</strong>.</p>
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
