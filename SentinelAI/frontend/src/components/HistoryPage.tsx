import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { History, FileVideo, FileImage, ShieldCheck, ShieldAlert, Clock, ChevronRight, Search, Filter } from 'lucide-react';
import { useStore } from '../store/useStore';
import { apiService, AnalysisResult } from '../services/apiService';
import { GlassEffect, GlassButton } from './ui/liquid-glass';
import { cn } from '../lib/utils';

export default function HistoryPage() {
  const [history, setHistory] = useState<AnalysisResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'Real' | 'Fake'>('all');
  const { token, setResult, setCurrentPage } = useStore();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setIsLoading(true);
        const data = await apiService.getHistory();
        // Assuming the backend returns an array of AnalysisResult objects or similar
        const normalized = Array.isArray(data) ? data : data.history || [];
        setHistory(normalized);
      } catch (err) {
        console.error('Failed to fetch history:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (token) {
      fetchHistory();
    }
  }, [token]);

  const filteredHistory = history.filter(item => {
    const verdict = item.verdict || '';
    const sourceUrl = item.sourceUrl || '';
    const matchesSearch = sourceUrl.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         verdict.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' || verdict === filter;
    return matchesSearch && matchesFilter;
  });

  const handleViewResult = (result: AnalysisResult) => {
    setResult(result);
    setCurrentPage('dashboard');
  };

  return (
    <div className="min-h-screen pt-32 pb-20 px-6 max-w-6xl mx-auto space-y-12">
      <div className="space-y-4">
        <div className="flex items-center gap-3 text-emerald-500 mb-2">
          <History size={20} />
          <p className="text-[10px] uppercase tracking-[0.4em] font-medium">Neural Archives</p>
        </div>
        <h1 className="text-6xl md:text-8xl font-medium tracking-tighter text-white leading-none">
          Analysis <span className="text-emerald-500">History</span>
        </h1>
        <p className="text-lg text-white/40 max-w-xl font-light">
          Review past forensic investigations and integrity proofs anchored on the Solana blockchain.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white/[0.02] border border-white/5 p-4 rounded-2xl backdrop-blur-xl">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
          <input 
            type="text" 
            placeholder="Search by URL or verdict..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50 transition-all"
          />
        </div>
        
        <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/10">
          {(['all', 'Real', 'Fake'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-4 py-2 rounded-lg text-[10px] uppercase tracking-widest transition-all",
                filter === f ? "bg-emerald-500 text-black font-bold" : "text-white/40 hover:text-white"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <AnimatePresence mode="popLayout">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full"
              />
              <p className="text-[10px] uppercase tracking-widest text-white/20">Accessing archives...</p>
            </div>
          ) : filteredHistory.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-20 text-center space-y-4"
            >
              <p className="text-white/20 text-sm">No forensic records found matching your criteria.</p>
              <GlassButton onClick={() => setCurrentPage('home')} className="px-6 py-2 border border-white/10">
                <span className="text-[10px] uppercase tracking-widest text-white/40">Start New Analysis</span>
              </GlassButton>
            </motion.div>
          ) : (
            filteredHistory.map((item, idx) => (
              <motion.div
                key={`${item.timestamp}-${idx}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                layout
              >
                <GlassEffect 
                  className="p-5 rounded-2xl border border-white/5 group hover:border-emerald-500/30 transition-colors cursor-pointer"
                  onClick={() => handleViewResult(item)}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-5 flex-1 min-w-0">
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 duration-500",
                        item.verdict === 'Fake' ? "bg-rose-500/10 text-rose-500" : "bg-emerald-500/10 text-emerald-500"
                      )}>
                        {item.verdict === 'Fake' ? <ShieldAlert size={22} /> : <ShieldCheck size={22} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <span className={cn(
                            "text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border",
                            item.verdict === 'Fake' ? "text-rose-400 border-rose-500/20 bg-rose-500/5" : "text-emerald-400 border-emerald-500/20 bg-emerald-500/5"
                          )}>
                            {item.verdict}
                          </span>
                          <span className="text-[9px] text-white/20 uppercase tracking-widest font-mono">
                            {item.confidence}% Confidence
                          </span>
                        </div>
                        <p className="text-sm text-white font-medium truncate max-w-md">
                          {item.sourceUrl || "Uploaded Media File"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-8 text-right">
                      <div className="hidden sm:block">
                        <div className="flex items-center gap-1.5 text-white/20 justify-end mb-1">
                          <Clock size={10} />
                          <p className="text-[9px] uppercase tracking-widest">Analyzed</p>
                        </div>
                        <p className="text-xs text-white/60">
                          {item.timestamp ? new Date(item.timestamp).toLocaleDateString() : 'Unknown Date'} 
                          {item.timestamp ? ' ' + new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </p>
                      </div>
                      
                      <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-white/20 group-hover:text-emerald-500 group-hover:border-emerald-500/50 group-hover:bg-emerald-500/10 transition-all">
                        <ChevronRight size={16} />
                      </div>
                    </div>
                  </div>
                </GlassEffect>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
