import { buildApiUrl } from '../lib/api-base';

export interface AnalysisResult {
  verdict: 'Real' | 'Fake' | string;
  newsVerdict?: string;
  confidence: number | string;
  framesAnalyzed?: number;
  suspiciousFrames?: number;
  sourceUrl?: string;
  timestamp: string;

  reasoning?: string;
  claim?: string;
  evidence?: string[];
  
  summary?: string;
  nuance?: string | null;
  sources?: Array<{
    title: string;
    domain: string;
    stance: string;
    snippet: string;
  }>;

  geminiAnalysis?: string;
  systemWarning?: string | null;
  metadataRiskLevel?: string;
  metadataFlags?: string[];
  suspiciousFrameDetails?: Array<{ timestampSec: number; score: number }>;
  blockchainTx?: string;
  raw?: unknown;
}

export interface PaymentVerificationResult {
  success: boolean;
  status?: string;
  message?: string;
}

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('sentinel_token');
  const apiKey = localStorage.getItem('sentinel_api_key');

  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(apiKey ? { 'x-api-key': apiKey } : {}),
    'ngrok-skip-browser-warning': 'true',
  };
}

function inferMediaTypeFromUrl(url: string): 'image' | 'video' {
  try {
    const pathname = new URL(url).pathname.toLowerCase();
    if (/\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(pathname)) {
      return 'image';
    }
  } catch {
    if (/\.(png|jpe?g|gif|webp|bmp|svg)(\?|#|$)/i.test(url.toLowerCase())) {
      return 'image';
    }
  }

  return 'video';
}

function normalizeAnalysisResult(raw: any): AnalysisResult {
  const visual = raw?.visual_analysis ?? raw?.visualAnalysis ?? raw;
  const metadata = raw?.metadata_analysis ?? raw?.metadataAnalysis ?? undefined;

  const verdict = (
    visual?.verdict ??
    visual?.result ??
    raw?.verdict ??
    raw?.result
  ) as AnalysisResult['verdict'] | string | undefined;
  const confidence = visual?.confidence ?? raw?.confidence;

  const framesAnalyzed =
    visual?.frames_analyzed ??
    visual?.frames_analysed ??
    visual?.framesAnalyzed ??
    raw?.frames_analyzed ??
    raw?.frames_analysed ??
    raw?.framesAnalyzed;

  const suspiciousFrames =
    visual?.suspicious_frames_count ??
    visual?.suspiciousFramesCount ??
    raw?.suspicious_frames ??
    raw?.suspiciousFrames;

  const suspiciousFrameDetailsRaw =
    visual?.suspicious_frame_details ??
    visual?.suspiciousFrameDetails ??
    raw?.suspicious_frame_details ??
    raw?.suspiciousFrameDetails;

  const suspiciousFrameDetails = Array.isArray(suspiciousFrameDetailsRaw)
    ? suspiciousFrameDetailsRaw
        .map((d: any) => ({
          timestampSec: Number(d?.timestamp_sec ?? d?.timestampSec),
          score: Number(d?.score),
        }))
        .filter((d: any) => Number.isFinite(d.timestampSec) && Number.isFinite(d.score))
    : undefined;

  const sourceUrl = (raw?.source_url ?? raw?.sourceUrl ?? raw?.original_url) as string | undefined;

  const timestampRaw = raw?.timestamp || raw?.created_at || raw?.date;
  const timestamp =
    typeof timestampRaw === 'string' && timestampRaw
      ? timestampRaw
      : new Date().toISOString();

  return {
    verdict: typeof verdict === 'string' && verdict.toLowerCase() === 'fake' ? 'Fake' : 'Real',
    confidence: typeof confidence === 'number' ? confidence : Number(confidence ?? 0),
    framesAnalyzed: typeof framesAnalyzed === 'number' ? framesAnalyzed : Number(framesAnalyzed ?? 0),
    suspiciousFrames:
      typeof suspiciousFrames === 'number' ? suspiciousFrames : Number(suspiciousFrames ?? 0),
    sourceUrl,
    timestamp,
    geminiAnalysis: typeof raw?.gemini_analysis === 'string' ? raw.gemini_analysis : undefined,
    systemWarning: typeof raw?.system_warning === 'string' || raw?.system_warning === null ? raw.system_warning : undefined,
    metadataRiskLevel: typeof metadata?.risk_level === 'string' ? metadata.risk_level : undefined,
    metadataFlags: Array.isArray(metadata?.flags) ? metadata.flags : undefined,
    suspiciousFrameDetails,
    blockchainTx:
      typeof raw?.blockchain_proof?.signature === 'string'
        ? raw.blockchain_proof.signature
        : typeof raw?.blockchainTx === 'string'
          ? raw.blockchainTx
          : undefined,
    raw,
  };
}

export const apiService = {
  analyzeFile: async (file: File, fileHash: string, walletAddress?: string, blockchainTx?: string): Promise<AnalysisResult> => {
    const authHeaders = getAuthHeaders();
    if (!authHeaders.Authorization && !authHeaders['x-api-key']) {
      throw new Error('Please sign in to your SentinelAI account before starting an analysis.');
    }

    const formData = new FormData();
    formData.append('file', file);
    if (blockchainTx) {
      formData.append('blockchain_tx', blockchainTx);
    }

    const endpoint = buildApiUrl('/analyse/analyse_upload');

    const response = await fetch(endpoint, {
      method: 'POST',
      body: formData,
      headers: {
        ...authHeaders,
        'X-File-Hash': fileHash,
        ...(walletAddress ? { 'X-Wallet-Address': walletAddress } : {}),
      },
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      throw new Error(detail || response.statusText);
    }

    const raw = await response.json();
    const result = normalizeAnalysisResult(raw);
    if (blockchainTx) {
      result.blockchainTx = blockchainTx;
    }
    return result;
  },

  analyzeUrl: async (url: string): Promise<AnalysisResult> => {
    const authHeaders = getAuthHeaders();
    if (!authHeaders.Authorization && !authHeaders['x-api-key']) {
      throw new Error('Please sign in to your SentinelAI account before starting an analysis.');
    }

    const response = await fetch(buildApiUrl('/analyse/url'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
      body: JSON.stringify({
        input: url,
        type: inferMediaTypeFromUrl(url),
      }),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      throw new Error(`URL analysis failed: ${response.statusText}${detail ? ` - ${detail}` : ''}`);
    }

    const raw = await response.json();
    return normalizeAnalysisResult(raw);
  },

  analyzeText: async (text: string) => {
    const response = await fetch(buildApiUrl('/factcheck'), {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify({ headline: text }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const detail = errorData.detail || response.statusText;
      throw new Error(`Headline analysis failed: ${detail}`); 
    }

    // The backend provides a rich JSON object including verdict, summary, nuance, sources.
    const data = await response.json();

    return {
      ...data,
      timestamp: new Date().toISOString()
    };
  },

  getHistory: async (mediaType?: 'image' | 'video') => {
    const authHeaders = getAuthHeaders();
    if (!authHeaders.Authorization && !authHeaders['x-api-key']) {
      throw new Error('Please sign in to your SentinelAI account before loading history.');
    }

    const query = mediaType ? `?media_type=${encodeURIComponent(mediaType)}` : '';
    const endpoint = buildApiUrl(`/history${query}`);
    
    const response = await fetch(endpoint, {
      headers: {
        ...authHeaders,
      },
    });

    const contentType = response.headers.get('content-type') || '';
    if (!response.ok) {
      if (contentType.includes('text/html')) {
        throw new Error('Backend is currently offline or unreachable (Server returned HTML). Check your ngrok tunnel.');
      }
      const detail = await response.text().catch(() => '');
      throw new Error(`History fetch failed (${response.status}): ${response.statusText}${detail ? ` - ${detail}` : ''}`);
    }

    if (!contentType.includes('application/json')) {
      const text = await response.text();
      const snippet = text.slice(0, 100).replace(/</g, '&lt;').replace(/>/g, '&gt;');
      console.error('[API] Expected JSON but got:', text.slice(0, 500));
      throw new Error(`Invalid response format (Expected JSON, got ${contentType}). Response snippet: "${snippet}..."`);
    }

    return response.json();
  },

  verifyPayment: async (signature: string, amount: number): Promise<PaymentVerificationResult> => {
    const response = await fetch(buildApiUrl('/verify-payment'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify({ signature, amount }),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      throw new Error(`Payment verification failed: ${response.statusText}${detail ? ` - ${detail}` : ''}`);
    }

    return response.json();
  },
};