import Link from 'next/link';
import { ArrowRight, Zap, Shield, Globe } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-4xl w-full space-y-12">

        {/* Hero Section */}
        <div className="space-y-6">
          <div className="inline-block bg-blue-50 text-blue-700 text-sm font-semibold px-4 py-1.5 rounded-full border border-blue-100 mb-2">
            Pakistan's #1 Link Indexing Platform
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-black">
            Premium{' '}
            <span className="text-blue-600">Link Indexing</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
            Boost your online presence instantly. Submit your URLs to our powerful network and watch your visibility skyrocket.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
            <Link
              href="/signup"
              className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-full shadow-md transition-all flex items-center justify-center gap-2 group"
            >
              Get Started <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/login"
              className="px-8 py-4 bg-white hover:bg-gray-50 border-2 border-gray-200 text-black font-semibold rounded-full transition-all flex items-center justify-center"
            >
              Login to Dashboard
            </Link>
          </div>
        </div>

        {/* Features / Pricing */}
        <div className="grid md:grid-cols-3 gap-6 pt-16">
          <div className="bg-white border border-gray-100 shadow-sm p-8 rounded-3xl text-left space-y-4 hover:-translate-y-1 transition-transform duration-300">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-bold text-black">Lightning Fast</h3>
            <p className="text-gray-500">Experience our 10-30 second rapid processing for every submission.</p>
          </div>

          <div className="bg-blue-600 p-8 rounded-3xl text-left space-y-4 relative overflow-hidden hover:-translate-y-1 transition-transform duration-300 shadow-lg shadow-blue-200">
            <div className="absolute top-0 right-0 bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">POPULAR</div>
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-white">
              <Globe className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-bold text-white">Standard Plan</h3>
            <div className="text-4xl font-extrabold text-white">PKR 500</div>
            <p className="text-blue-100">Get 1000 tokens instantly upon manual receipt approval.</p>
          </div>

          <div className="bg-white border border-gray-100 shadow-sm p-8 rounded-3xl text-left space-y-4 hover:-translate-y-1 transition-transform duration-300">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-bold text-black">Secure & Reliable</h3>
            <p className="text-gray-500">Strictly for users from Pakistan. A dedicated ecosystem for local professionals.</p>
          </div>
        </div>

      </div>
    </div>
  );
}
