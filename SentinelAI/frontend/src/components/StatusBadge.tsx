import { useEffect, useState } from 'react';
import { buildApiUrl } from '../lib/api-base';

type BackendStatus = 'online' | 'offline';

export default function StatusBadge() {
  const [status, setStatus] = useState<BackendStatus>('offline');
  const [lastSuccessfulCheck, setLastSuccessfulCheck] = useState<string | null>(null);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await fetch(buildApiUrl('/health'));
        if (response.ok) {
          setStatus('online');
          setLastSuccessfulCheck(new Date().toLocaleTimeString());
        } else {
          setStatus('offline');
        }
      } catch {
        setStatus('offline');
      }
    };

    checkStatus();
    const intervalId = window.setInterval(checkStatus, 10000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  const isOnline = status === 'online';
  const tooltip = lastSuccessfulCheck
    ? `Last successful check: ${lastSuccessfulCheck}`
    : 'No successful backend check yet';

  return (
    <div
      className="fixed top-8 right-8 z-40 hidden md:flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-3 py-2 backdrop-blur-md"
      title={tooltip}
      aria-label={tooltip}
    >
      <div
        className={`h-2.5 w-2.5 rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-rose-400'}`}
        aria-hidden
      />
      <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/70">
        Backend: {status}
      </span>
    </div>
  );
}
