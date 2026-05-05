import { useState, useRef, type DragEvent, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, Link as LinkIcon, ArrowRight, FileVideo, FileImage, Mail, MessageSquare, Send, ShieldAlert, ShieldCheck, Activity, LogIn, Globe } from 'lucide-react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { useStore } from '../store/useStore';
import { apiService } from '../services/apiService';
import { calculateFileHash } from '../lib/crypto';
import { cn } from '../lib/utils';
import { GooeyText } from './ui/gooey-text-morphing';
import { GlassEffect } from './ui/liquid-glass';
import { SparklesCore } from './ui/sparkles';
import { SplineScene } from './ui/splite';
import { Spotlight } from './ui/spotlight';
import { Card } from './ui/card';

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState<'upload' | 'link' | 'text'>('upload');
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'fingerprinting' | 'uploading'>('idle');
  const [url, setUrl] = useState('');
  const [text, setText] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const {
    setLoading, setResult, setTextResult, setError,
    isLoading, loadingMessage, textResult, reset,
    setCurrentPage, user: storeUser,
  } = useStore();

  const handleFileUpload = async (file: File) => {
    try {
      setUploadStatus('fingerprinting');
      setLoading(true, 'Generating secure fingerprint...');
      const fileHash = await calculateFileHash(file);

      setUploadStatus('uploading');
      setLoading(true, 'Uploading file and anchoring integrity proof...');
      const walletAddress = publicKey?.toBase58();
      const res = await apiService.analyzeFile(file, fileHash, walletAddress);

      setLoading(true, 'Running deepfake analysis...');
      await new Promise((r) => setTimeout(r, 1500));
      setResult(res);
      setUploadStatus('idle');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
      setUploadStatus('idle');
    } finally {
      setLoading(false);
    }
 
  };

  const handleUrlSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!url) return;
    try {
      setLoading(true, 'Fetching URL...');
      const res = await apiService.analyzeUrl(url);
      setLoading(true, 'Running deepfake analysis...');
      await new Promise((r) => setTimeout(r, 1500));
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'URL analysis failed');
    } finally {
      setLoading(false)
    }
  };

  const handleTextSubmit = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!text.trim()) return;
    try {
      setLoading(true, 'Fact-checking with SentinelAI pipeline...');
      const res = await apiService.analyzeText(text);
      setLoading(true, 'Verifying cross-references...');
      await new Promise((r) => setTimeout(r, 1000));
      setTextResult(res);
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'Text analysis failed');
    }
    finally{
      setLoading(false);
    }
  };

  const onDragOver = (e: DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = () => setIsDragging(false);
  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  };

  /* ─── derived verdict helpers ─────────────────────────────────────── */
  const getVerdictMeta = (result: any) => {
    if (!result) return null;
    const label = (result.verdict || result.newsVerdict || 'Unverified').trim();
    const lower = label.toLowerCase();
    
    // Map new backend verdicts
    const isRed = lower.includes('fake') || lower.includes('false') || lower.includes('misleading') || lower.includes('disputed');
    const isGreen = lower.includes('true') || lower.includes('real');
    const accent = isRed ? 'rose' : isGreen ? 'emerald' : 'neutral';
    
    return { label, accent };
  };

  const verdictMeta = getVerdictMeta(textResult);

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-4 py-14 md:px-6 md:py-16">

      <div className="pointer-events-none absolute inset-0 -z-20 overflow-hidden">
        <div className="landing-ambient-orb landing-ambient-orb--emerald" />
        <div className="landing-ambient-orb landing-ambient-orb--cyan" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65, ease: 'easeOut' }}
        className="max-w-5xl w-full text-center space-y-10 md:space-y-12 relative"
      >

        <div className="absolute inset-0 -top-40 -z-10 w-full h-[120%] pointer-events-none">
          <div className="absolute inset-x-20 top-0 bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent h-[2px] w-3/4 blur-sm" />
          <div className="absolute inset-x-20 top-0 bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent h-px w-3/4" />
          <div className="absolute inset-x-60 top-0 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent h-[5px] w-1/4 blur-sm" />
          <div className="absolute inset-x-60 top-0 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent h-px w-1/4" />
          <SparklesCore
            background="transparent"
            minSize={0.4}
            maxSize={1}
            particleDensity={140}
            className="w-full h-full"
            particleColor="#10b981"
          />
          <div className="absolute inset-0 w-full h-full bg-black [mask-image:radial-gradient(50%_50%_at_50%_40%,transparent_20%,white)]" />
        </div>

        <div className="space-y-5 relative">
          <motion.div
            className="flex flex-col items-center justify-center relative z-20"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.6, ease: 'easeOut' }}
          >
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-medium tracking-tighter text-white leading-[0.95] mb-8 md:mb-10">
              Verify the
            </h1>
            <div className="h-[96px] md:h-[124px] flex items-center justify-center w-full">
              <GooeyText
                texts={['Sentinel AI', 'Visual Truth', 'Neural Core', 'Fake News']}
                morphTime={1.5}
                cooldownTime={1}
                className="font-medium tracking-tighter"
                textClassName="text-5xl md:text-7xl lg:text-8xl text-emerald-500"
              />
            </div>
          </motion.div>

          <div className="flex flex-col items-center gap-6 relative z-20">
            <p className="text-base md:text-lg text-white/45 max-w-2xl mx-auto font-light tracking-wide leading-relaxed">
              Advanced neural forensics for real-time deepfake detection and semantic news verification.
              Protecting truth in the age of synthetic media.
            </p>

            {!storeUser && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                onClick={() => setCurrentPage('auth')}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white active:scale-95 transition-all duration-200 group overflow-hidden"
              >
                <LogIn size={16} />
                <span className="text-[10px] uppercase tracking-widest font-medium">Developer Portal</span>
                <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform duration-200" />
              </motion.button>
            )}
          </div>
        </div>

        <div className="relative max-w-2xl mx-auto">
          <div className="absolute inset-0 -z-10 blur-3xl bg-emerald-500/5 rounded-full" />

          <GlassEffect className="rounded-3xl overflow-hidden shadow-2xl border border-white/10">
            <div className="flex flex-col w-full">

              <div className="flex border-b border-white/5">
                {(['upload', 'link', 'text'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      'flex-1 py-4 text-[10px] uppercase tracking-[0.2em] transition-all duration-300',
                      activeTab === tab
                        ? 'text-emerald-500 bg-white/[0.05]'
                        : 'text-white/30 hover:text-white/60 hover:bg-white/[0.02]'
                    )}
                  >
                    {tab === 'upload' ? 'Local Media' : tab === 'link' ? 'Remote Link' : 'Fact Check'}
                  </button>
                ))}
              </div>

              <div className="p-6 md:p-8 min-h-[300px] flex flex-col justify-center">
                <AnimatePresence mode="wait">

                  {textResult ? (
                    <motion.div
                      key="text-result"
                      initial={{ opacity: 0, scale: 0.97 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.97 }}
                      transition={{ duration: 0.25 }}
                      className="space-y-8"
                    >
                      {verdictMeta && (
                        <div className="flex flex-col items-center gap-4">
                          <div className={cn(
                            'w-20 h-20 rounded-full flex items-center justify-center border transition-all duration-500',
                            verdictMeta.accent === 'rose'
                              ? 'border-rose-500/30 text-rose-500 shadow-[0_0_30px_rgba(244,63,94,0.1)]'
                              : verdictMeta.accent === 'emerald'
                                ? 'border-emerald-500/30 text-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.1)]'
                                : 'border-white/10 text-white/60'
                          )}>
                            {verdictMeta.accent === 'rose'
                              ? <ShieldAlert size={40} />
                              : verdictMeta.accent === 'emerald'
                                ? <ShieldCheck size={40} />
                                : <Activity size={40} />}
                          </div>
                          <div className="text-center">
                            <h3 className={cn(
                              'text-3xl font-medium tracking-tighter uppercase',
                              verdictMeta.accent === 'rose' ? 'text-rose-500' : verdictMeta.accent === 'emerald' ? 'text-emerald-500' : 'text-white/70'
                            )}>
                              {verdictMeta.label}
                            </h3>
                            <p className="text-[10px] uppercase tracking-widest text-white/20 mt-1">
                              Confidence: {textResult.confidence}
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 space-y-3 text-left">
                        <div className="flex items-center justify-between">
                          <p className="text-[9px] uppercase tracking-widest text-white/20">Analysis Summary</p>
                          <Activity size={12} className="text-emerald-500/30" />
                        </div>
                        <p className="text-sm text-white/60 font-light leading-relaxed">
                          {textResult.summary || "No summary provided by analysis."}
                        </p>
                        {textResult.nuance && (
                          <div className="mt-4 pt-4 border-t border-white/5">
                            <p className="text-xs text-white/40 font-light italic leading-relaxed">
                              <span className="text-emerald-500/60 font-medium not-italic mr-1">Nuance:</span>
                              {textResult.nuance}
                            </p>
                          </div>
                        )}
                      </div>

                      {textResult.sources && textResult.sources.length > 0 && (
                        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 space-y-4 text-left">
                          <div className="flex items-center justify-between">
                            <p className="text-[9px] uppercase tracking-widest text-white/20">Verified Sources</p>
                            <Globe size={12} className="text-emerald-500/30" />
                          </div>
                          <ul className="space-y-3">
                            {textResult.sources.map((source: any, idx: number) => (
                              <li key={idx} className="bg-white/[0.01] border border-white/5 rounded-xl p-4 space-y-2">
                                <div className="flex justify-between items-start gap-2">
                                  <a 
                                    href={`https://${source.domain}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs font-medium text-white/80 hover:text-emerald-400 transition-colors line-clamp-1"
                                  >
                                    {source.title || source.domain}
                                  </a>
                                  <span className={cn(
                                    "text-[9px] uppercase tracking-wider px-2 py-1 rounded-full shrink-0",
                                    source.stance === 'Supports' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                                    source.stance === 'Refutes' ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' :
                                    source.stance === 'Partial' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                                    'bg-white/5 text-white/50 border border-white/10'
                                  )}>
                                    {source.stance}
                                  </span>
                                </div>
                                <div className="text-[10px] text-white/30 uppercase tracking-widest flex items-center gap-1.5">
                                  <LinkIcon size={10} />
                                  {source.domain}
                                </div>
                                <p className="text-xs text-white/50 leading-relaxed pt-1">
                                  {source.snippet}
                                </p>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                     <button
                      onClick={() => {
                        reset(); 
                        window.scrollTo({ top: 0, behavior: 'smooth' }); 
                      }}
                      className="w-full py-3 rounded-xl overflow-hidden border border-white/5 text-white/40 hover:text-white bg-white/[0.02] hover:bg-white/[0.06] transition-all duration-200 text-[10px] uppercase tracking-widest"
                    >
                      New News Analysis
                    </button>
                    </motion.div>

                  ) : activeTab === 'upload' ? (
                    <motion.div
                      key="upload"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      transition={{ duration: 0.2 }}
                      className={cn(
                        'relative group cursor-pointer border-2 border-dashed rounded-2xl transition-all duration-300 py-14 md:py-16 flex flex-col items-center justify-center gap-4',
                        isDragging ? 'border-emerald-500 bg-emerald-500/5' : 'border-white/10 hover:border-white/20 hover:bg-white/[0.01]'
                      )}
                      onDragOver={onDragOver}
                      onDragLeave={onDragLeave}
                      onDrop={onDrop}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                        accept="video/*,image/*"
                      />

                      <div className="relative">
                        <Upload
                          className={cn('transition-colors duration-300', isDragging ? 'text-emerald-500' : 'text-white/20 group-hover:text-white/40')}
                          size={48} strokeWidth={1}
                        />
                      </div>

                      <div className="text-center space-y-1 z-10">
                        <p className="text-sm text-white/65 font-medium">Drop media here or click to browse</p>
                        <p className="text-[10px] uppercase tracking-widest text-white/20">Supports MP4, MOV, JPG, PNG</p>
                      </div>

                      {uploadStatus !== 'idle' && (
                        <p className="text-xs text-emerald-400 font-medium z-10 pt-2 animate-pulse flex items-center gap-2">
                          <motion.span animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.2, repeat: Infinity }}>●</motion.span>
                          {uploadStatus === 'fingerprinting' && 'Generating secure fingerprint…'}
                          {uploadStatus === 'uploading' && 'Uploading to SentinelAI core…'}
                        </p>
                      )}
                    </motion.div>

                  ) : activeTab === 'link' ? (
                    <motion.form
                      key="link"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2 }}
                      onSubmit={handleUrlSubmit}
                      className="space-y-6"
                    >
                      <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-emerald-500 transition-colors duration-200 pointer-events-none">
                          <LinkIcon size={20} />
                        </div>
                        <input
                          type="url"
                          placeholder="Paste YouTube, Instagram, or X link…"
                          value={url}
                          onChange={(e) => setUrl(e.target.value)}
                          className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50 focus:bg-white/[0.05] transition-all duration-200"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={!url || isLoading}
                        className={cn('w-full py-3.5 rounded-2xl overflow-hidden bg-emerald-500 hover:bg-emerald-400 text-black font-medium text-sm flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.99]', (!url || isLoading) && 'opacity-50 pointer-events-none')}
                      >
                        Analyze Source <ArrowRight size={18} />
                      </button>
                    </motion.form>

                  ) : (
                    <motion.form
                      key="text"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2 }}
                      onSubmit={handleTextSubmit}
                      className="space-y-6"
                    >
                      <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-emerald-500 transition-colors duration-200 pointer-events-none">
                          <MessageSquare size={20} />
                        </div>
                        <input
                          type="text"
                          placeholder="Paste a news headline or claim to fact-check..."
                          value={text}
                          onChange={(e) => setText(e.target.value)}
                          className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50 focus:bg-white/[0.05] transition-all duration-200"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={!text || isLoading}
                        className={cn(
                          'w-full py-3.5 rounded-2xl overflow-hidden bg-emerald-500 hover:bg-emerald-400 text-black font-medium text-sm flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.99]',
                          (!text || isLoading) && 'opacity-50 pointer-events-none'
                        )}
                      >
                        Verify Headline
                        <ArrowRight size={18} />
                      </button>

                      <p className="text-[10px] text-center uppercase tracking-widest text-white/20">
                        Powered by Google Gemini & Verified Sources
                      </p>
                    </motion.form>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </GlassEffect>
        </div>

        <div className="pt-14 md:pt-16 grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 w-full max-w-4xl">
          {[
            { label: 'Total Users', value: '128K+' },
            { label: 'Analyses', value: '2.4M+' },
            { label: 'Accuracy', value: '99.8%' },
            { label: 'Latency', value: '< 2.5s' },
          ].map((stat, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 + i * 0.08, duration: 0.4 }} className="text-center space-y-1.5">
              <p className="text-3xl md:text-4xl font-medium tracking-tighter text-white">{stat.value}</p>
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/20">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        <div className="pt-20 md:pt-24 w-full max-w-5xl">
          <Card className="w-full h-auto md:h-[500px] bg-white/[0.02] border-white/10 relative overflow-hidden rounded-3xl group shadow-2xl">
            <Spotlight className="from-emerald-500/20 via-emerald-500/5 to-transparent" size={600} />
            <div className="flex h-full flex-col md:flex-row">
              <div className="flex-1 p-8 md:p-12 relative z-10 flex flex-col justify-center text-left space-y-5">
                <div className="space-y-2">
                  <p className="text-[10px] uppercase tracking-[0.4em] text-emerald-500 font-medium">Core Technology</p>
                  <h2 className="text-4xl md:text-5xl font-medium tracking-tighter text-white leading-tight">
                    Interactive <br />
                    <span className="text-emerald-500">Neural Core</span>
                  </h2>
                </div>
                <p className="text-white/45 text-sm md:text-base max-w-md font-light leading-relaxed">
                  Experience the depth of our forensic engine. SentinelAI utilises
                  multi-layered neural networks to identify synthetic artifacts
                  invisible to the human eye.
                </p>
                <div className="pt-4">
                  <button onClick={() => window.open('https://github.com/SentinelAIbyCodeNewbies', '_blank', 'noopener,noreferrer')} className="inline-flex items-center px-8 py-3 rounded-xl overflow-hidden bg-white/[0.03] border border-white/10 hover:border-emerald-500/50 hover:bg-white/[0.06] text-[10px] uppercase tracking-widest text-white/60 transition-all duration-200">
                    Explore Documentation
                  </button>
                </div>
              </div>
              <div className="flex-1 relative min-h-[280px] md:min-h-0 h-full border-t md:border-t-0 md:border-l border-white/5">
                <div className="absolute inset-0 bg-gradient-to-l from-black/40 to-transparent z-10 pointer-events-none" />
                <SplineScene scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode" className="w-full h-full" />
              </div>
            </div>
          </Card>
        </div>

        <div className="pt-20 md:pt-24 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 pb-16 md:pb-20 w-full max-w-5xl">
          <GlassEffect className="p-8 rounded-3xl border border-white/5 flex flex-col h-full group">
            <div className="flex flex-col items-center justify-center text-center flex-1 space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform duration-500">
                <Mail size={32} strokeWidth={1.5} />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-medium text-white">Contact With Us</h3>
                <p className="text-white/40 text-sm font-light">Have questions? Reach out to our technical support team directly.</p>
              </div>
            </div>
            <div className="pt-8 mt-auto w-full">
              <button onClick={() => { window.location.href = 'mailto:supportatsentinelai@gmail.com'; }} className="w-full py-3 rounded-xl overflow-hidden bg-white/[0.03] border border-white/10 hover:bg-emerald-500/10 hover:border-emerald-500/50 text-[10px] uppercase tracking-widest text-white/60 hover:text-emerald-400 transition-all duration-300">
                Send Email
              </button>
            </div>
          </GlassEffect>

          <GlassEffect className="p-8 rounded-3xl border border-white/5 flex flex-col h-full text-left">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
                <MessageSquare size={20} strokeWidth={1.5} />
              </div>
              <h3 className="text-xl font-medium text-white">Give Your Feedback</h3>
            </div>
            <div className="flex flex-col flex-1">
              <div className="flex justify-between items-end ml-1 mb-2">
                <label className="text-[10px] uppercase tracking-widest text-white/20">Message</label>
                {storeUser?.email && (
                  <span className="text-[9px] uppercase tracking-widest text-white/20">
                    Sending as: <span className="text-emerald-500/60 lowercase tracking-normal">{storeUser.email}</span>
                  </span>
                )}
              </div>
              <textarea placeholder="How can we improve?" rows={5} className="w-full bg-white/[0.02] border border-white/5 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/10 focus:outline-none focus:border-emerald-500/30 transition-colors duration-200 resize-none mb-6" />
              <div className="mt-auto w-full">
                <button className="w-full py-3 rounded-xl overflow-hidden bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500 hover:border-emerald-500 text-[10px] uppercase tracking-widest text-emerald-500 hover:text-white transition-all duration-300">
                  Submit Feedback
                </button>
              </div>
            </div>
          </GlassEffect>
        </div>
      </motion.div>

      <AnimatePresence>
        {isLoading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="fixed inset-0 z-40 backdrop-blur-md bg-black/60 flex flex-col items-center justify-center gap-6">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 border-2 border-emerald-500/20 rounded-full" />
              <motion.div className="absolute inset-0 border-2 border-emerald-500 border-t-transparent rounded-full" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} />
            </div>
            <div className="text-center space-y-2">
              <p className="text-sm font-medium text-white tracking-wide">{loadingMessage}</p>
              <div className="flex gap-1 justify-center">
                {[0, 1, 2].map((i) => (
                  <motion.div key={i} className="w-1 h-1 bg-emerald-500 rounded-full" animate={{ opacity: [0.2, 1, 0.2] }} transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }} />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}