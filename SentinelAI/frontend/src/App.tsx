/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AnimatePresence, motion } from 'motion/react';
import { Home, Terminal, LogOut, LogIn, History } from 'lucide-react';
import { useStore } from './store/useStore';
import ThreeBackground from './components/ThreeBackground';
import LoadingScreen from './components/LoadingScreen';
import IntroScreen from './components/IntroScreen';
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import AuthPage from './components/AuthPage';
import ApiDashboard from './components/ApiDashboard';
import HistoryPage from './components/HistoryPage';
import { GlassFilter } from './components/ui/liquid-glass';
import { AppWalletProvider } from './components/WalletProvider';
import { IntegrityStatus } from './components/IntegrityStatus';
import { cn } from './lib/utils';

export default function App() {
  const { isInitializing, hasEntered, result, error, setError, currentPage, setCurrentPage, user, setUser, logout, token } = useStore();

  return (
    <AppWalletProvider>
      <div className="relative min-h-screen bg-black text-white selection:bg-emerald-500/30 overflow-x-hidden">
        <ThreeBackground />
        <GlassFilter />
        
        {/* Top-Right Nav */}
        <div className="fixed top-8 right-8 z-50">
          <IntegrityStatus />
        </div>

        <AnimatePresence mode="wait">
          {isInitializing ? (
            <LoadingScreen key="loading" />
          ) : !hasEntered ? (
            <IntroScreen key="intro" />
          ) : (
            <main className="relative z-10">
              {currentPage === 'auth' ? (
                <AuthPage />
              ) : currentPage === 'api-dashboard' ? (
                <ApiDashboard />
              ) : currentPage === 'history' ? (
                <HistoryPage />
              ) : result ? (
                <Dashboard />
              ) : (
                <LandingPage />
              )}
            </main>
          )}
        </AnimatePresence>

        {/* Navigation Footer */}
        {hasEntered && (
          <footer className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
            <div className="flex items-center gap-2 px-6 py-3 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl">
              <button 
                onClick={() => setCurrentPage('home')}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-full transition-all",
                  currentPage === 'home' ? "bg-emerald-500 text-black" : "text-white/40 hover:text-white"
                )}
              >
                <Home size={16} />
                <span className="text-[10px] uppercase tracking-widest font-medium">Home</span>
              </button>
              
              {user && (
                <>
                  <div className="w-px h-4 bg-white/10 mx-1" />
                  <button 
                    onClick={() => setCurrentPage('history')}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-full transition-all",
                      currentPage === 'history' ? "bg-emerald-500 text-black" : "text-white/40 hover:text-white"
                    )}
                  >
                    <History size={16} />
                    <span className="text-[10px] uppercase tracking-widest font-medium">History</span>
                  </button>
                </>
              )}
              
              <div className="w-px h-4 bg-white/10 mx-1" />

              {user ? (
                <>
                  <button 
                    onClick={logout}
                    className="flex items-center gap-2 px-4 py-2 rounded-full text-white/40 hover:text-rose-500 transition-all"
                  >
                    <LogOut size={16} />
                    <span className="text-[10px] uppercase tracking-widest font-medium">Logout</span>
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => setCurrentPage('auth')}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-full transition-all",
                    currentPage === 'auth' ? "bg-emerald-500 text-black" : "text-white/40 hover:text-white"
                  )}
                >
                  <LogIn size={16} />
                  <span className="text-[10px] uppercase tracking-widest font-medium">Login</span>
                </button>
              )}
            </div>
          </footer>
        )}

        {/* Error Toast */}
        <AnimatePresence>
          {error && (
            <div className="fixed bottom-8 right-8 z-50">
              <div className="backdrop-blur-xl bg-rose-500/10 border border-rose-500/20 px-6 py-4 rounded-2xl flex items-center gap-4 shadow-2xl">
                <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                <p className="text-sm font-medium text-rose-200">{error}</p>
                <button 
                  onClick={() => setError(null)}
                  className="text-white/20 hover:text-white transition-colors text-xs uppercase tracking-widest ml-4"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}
        </AnimatePresence>

        {/* Footer Info */}
        <div className="fixed bottom-12 left-12 hidden md:block">
          <p className="text-[10px] uppercase tracking-[0.3em] text-white/20 font-mono">
            Neural Core v4.2.0 // Secure Connection
          </p>
        </div>
      </div>
    </AppWalletProvider>
  );
}
