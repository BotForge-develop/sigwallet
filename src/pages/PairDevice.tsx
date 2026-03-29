import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Monitor, Shield, Camera } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AppleParticleCloud from '@/components/AppleParticleCloud';

const PairDevice = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'scanning' | 'confirm' | 'approving' | 'done' | 'error'>('scanning');
  const [error, setError] = useState<string | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<number | null>(null);

  const stopCamera = useCallback(() => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 640 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      startScanning();
    } catch {
      setError('Kamera nicht verfügbar');
      setStatus('error');
    }
  }, []);

  const startScanning = useCallback(() => {
    // Use BarcodeDetector API if available, otherwise fall back
    if ('BarcodeDetector' in window) {
      const detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
      
      scanIntervalRef.current = window.setInterval(async () => {
        if (!videoRef.current || videoRef.current.readyState < 2) return;
        
        try {
          const barcodes = await detector.detect(videoRef.current);
          if (barcodes.length > 0) {
            const data = barcodes[0].rawValue;
            handleScannedData(data);
          }
        } catch {
          // Scan failed silently
        }
      }, 200);
    } else {
      // Fallback: try using canvas-based detection with jsQR-like approach
      // For now, show manual entry fallback
      console.log('BarcodeDetector not supported, using manual fallback');
    }
  }, []);

  const handleScannedData = useCallback((rawData: string) => {
    try {
      const data = JSON.parse(rawData);
      if (data.type === 'sigwallet_pair' && data.token) {
        stopCamera();
        setSessionToken(data.token);
        setStatus('confirm');
      }
    } catch {
      // Not valid JSON, ignore
    }
  }, [stopCamera]);

  useEffect(() => {
    if (status === 'scanning') {
      startCamera();
    }
    return () => stopCamera();
  }, [status, startCamera, stopCamera]);

  const handleApprove = async () => {
    if (!sessionToken || !user) return;
    setStatus('approving');

    try {
      const response = await supabase.functions.invoke('approve-pairing', {
        body: { session_token: sessionToken, device_name: 'macOS Desktop' },
      });

      if (response.error) {
        setError('Pairing fehlgeschlagen');
        setStatus('error');
        return;
      }

      setStatus('done');
      setTimeout(() => navigate('/profile'), 2000);
    } catch {
      setError('Verbindungsfehler');
      setStatus('error');
    }
  };

  const resetFlow = () => {
    stopCamera();
    setSessionToken(null);
    setError(null);
    setStatus('scanning');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <motion.div
        className="glass-liquid rounded-3xl p-8 max-w-sm w-full flex flex-col items-center gap-5"
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <AnimatePresence mode="wait">
          {status === 'scanning' && (
            <motion.div
              key="scanning"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-5"
            >
              <div className="text-center">
                <h2 className="text-lg font-semibold text-foreground">Gerät verbinden</h2>
                <p className="text-foreground/50 text-sm mt-2 leading-relaxed">
                  Halte dein iPhone an den Mac-Bildschirm
                </p>
              </div>

              {/* Circular camera viewfinder */}
              <div className="relative w-52 h-52">
                {/* Outer particle ring */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <AppleParticleCloud active={true} size={208} />
                </div>

                {/* Circular camera cutout */}
                <div className="absolute inset-6 rounded-full overflow-hidden border-2 border-blue-500/20">
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    playsInline
                    muted
                    autoPlay
                  />
                  {/* Scanning line animation */}
                  <motion.div
                    className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent"
                    animate={{ top: ['10%', '90%', '10%'] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                  />
                </div>

                {/* Hidden canvas for frame capture */}
                <canvas ref={canvasRef} className="hidden" width={320} height={320} />
              </div>

              <div className="flex items-center gap-2 text-foreground/30">
                <Camera size={14} />
                <p className="text-[11px]">Suche nach Pairing-Signal…</p>
              </div>

              <button
                onClick={() => navigate('/profile')}
                className="text-foreground/40 text-sm hover:text-foreground/60 transition-colors mt-2"
              >
                Abbrechen
              </button>
            </motion.div>
          )}

          {status === 'confirm' && (
            <motion.div
              key="confirm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-5"
            >
              <div className="w-16 h-16 rounded-2xl glass flex items-center justify-center">
                <Monitor className="text-foreground/60" size={28} />
              </div>
              <div className="text-center">
                <h2 className="text-lg font-semibold text-foreground">Gerät verbinden?</h2>
                <p className="text-foreground/50 text-sm mt-2">
                  Ein macOS-Gerät möchte sich mit deinem Konto verbinden.
                </p>
              </div>
              <div className="glass rounded-xl px-4 py-3 flex items-center gap-3 w-full">
                <Shield className="text-beige/60 shrink-0" size={16} />
                <p className="text-foreground/40 text-[11px] leading-relaxed">
                  Das Gerät erhält Zugriff auf dein Konto.
                </p>
              </div>
              <div className="flex gap-3 w-full mt-2">
                <button onClick={resetFlow} className="flex-1 glass rounded-xl py-3 flex items-center justify-center gap-2 text-foreground/50 text-sm">
                  <X size={16} /> Ablehnen
                </button>
                <button onClick={handleApprove} className="flex-1 gradient-beige rounded-xl py-3 flex items-center justify-center gap-2 text-background text-sm font-medium">
                  <Check size={16} /> Verbinden
                </button>
              </div>
            </motion.div>
          )}

          {status === 'approving' && (
            <motion.div key="approving" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-8 flex flex-col items-center gap-4">
              <div className="w-10 h-10 border-2 border-beige/30 border-t-beige rounded-full animate-spin" />
              <p className="text-foreground/50 text-sm">Verbinde...</p>
            </motion.div>
          )}

          {status === 'done' && (
            <motion.div key="done" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} className="py-8 flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                <Check className="text-green-400" size={28} />
              </div>
              <p className="text-foreground/70 text-sm font-medium">Gerät verbunden!</p>
            </motion.div>
          )}

          {status === 'error' && (
            <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-8 flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-destructive/10 border border-destructive/20 flex items-center justify-center">
                <X className="text-destructive" size={28} />
              </div>
              <p className="text-foreground/50 text-sm">{error}</p>
              <button onClick={resetFlow} className="glass rounded-xl px-6 py-2 text-sm text-foreground/50">Erneut versuchen</button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default PairDevice;
