import { useState, useEffect, useRef, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Monitor, Shield, Camera as CameraIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { decodePattern } from '@/lib/patternCodec';
import AppleParticleCloud from '@/components/AppleParticleCloud';

const PairDevice = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'init' | 'scanning' | 'confirm' | 'approving' | 'done' | 'error'>('init');
  const [error, setError] = useState<string | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<number | null>(null);
  const decodedRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const stopCamera = useCallback(() => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const lookupByCode = useCallback(async (code: number) => {
    if (decodedRef.current) return;
    decodedRef.current = true;

    const codeStr = code.toString().padStart(6, '0');
    const { data } = await supabase
      .from('pairing_sessions')
      .select('session_token, expires_at')
      .eq('pairing_code', codeStr)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!data) {
      decodedRef.current = false;
      return;
    }

    if (new Date(data.expires_at) < new Date()) {
      stopCamera();
      if (mountedRef.current) {
        setError('Pairing abgelaufen');
        setStatus('error');
      }
      return;
    }

    stopCamera();
    if (mountedRef.current) {
      setSessionToken(data.session_token);
      setStatus('confirm');
    }
  }, [stopCamera]);

  const startScanning = useCallback(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const scanSize = 320;
    canvas.width = scanSize;
    canvas.height = scanSize;

    let lastCode: number | null = null;
    let confirmCount = 0;

    scanIntervalRef.current = window.setInterval(() => {
      if (video.readyState < 2 || decodedRef.current) return;
      const vw = video.videoWidth;
      const vh = video.videoHeight;
      if (!vw || !vh) return;

      const cropSize = Math.min(vw, vh);
      const sx = (vw - cropSize) / 2;
      const sy = (vh - cropSize) / 2;

      ctx.drawImage(video, sx, sy, cropSize, cropSize, 0, 0, scanSize, scanSize);
      const imageData = ctx.getImageData(0, 0, scanSize, scanSize);
      const code = decodePattern(imageData, scanSize, scanSize);

      if (code === null) {
        lastCode = null;
        confirmCount = 0;
        return;
      }

      if (code === lastCode) {
        confirmCount += 1;
        if (confirmCount >= 2) lookupByCode(code);
      } else {
        lastCode = code;
        confirmCount = 1;
      }
    }, 250);
  }, [lookupByCode]);

  const startCamera = useCallback(async () => {
    if (!mountedRef.current) return;
    setError(null);

    try {
      if (Capacitor.isNativePlatform()) {
        try {
          const { Camera } = await import('@capacitor/camera');
          await Camera.requestPermissions({ permissions: ['camera'] });
        } catch {
          // Continue with getUserMedia
        }
      }

      // Extra delay on iOS for permission dialog
      if (Capacitor.getPlatform() === 'ios') {
        await new Promise(r => setTimeout(r, 600));
        if (!mountedRef.current) return;
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        if (mountedRef.current) {
          setError('Kamera nicht verfügbar auf diesem Gerät.');
          setStatus('error');
        }
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 1280 } },
        audio: false,
      });

      if (!mountedRef.current) {
        stream.getTracks().forEach(t => t.stop());
        return;
      }

      streamRef.current = stream;

      if (!videoRef.current) {
        stream.getTracks().forEach(t => t.stop());
        if (mountedRef.current) {
          setError('Kameravorschau konnte nicht initialisiert werden');
          setStatus('error');
        }
        return;
      }

      videoRef.current.srcObject = stream;
      videoRef.current.setAttribute('playsinline', 'true');
      videoRef.current.muted = true;

      await videoRef.current.play();
      if (mountedRef.current) {
        window.setTimeout(startScanning, 400);
      }
    } catch (err) {
      if (!mountedRef.current) return;
      const message = err instanceof Error ? err.message : '';
      setError(message || 'Kamera nicht verfügbar');
      setStatus('error');
    }
  }, [startScanning]);

  useEffect(() => {
    if (status === 'scanning') {
      decodedRef.current = false;
      const timer = setTimeout(() => startCamera(), 500);
      return () => { clearTimeout(timer); stopCamera(); };
    }
    return () => stopCamera();
  }, [status, startCamera, stopCamera]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (mountedRef.current) setStatus('scanning');
    }, Capacitor.isNativePlatform() ? 800 : 300);
    return () => clearTimeout(timer);
  }, []);

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
    decodedRef.current = false;
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
          {(status === 'init' || status === 'scanning') && (
            <motion.div key="scanning" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-5">
              <div className="text-center">
                <h2 className="text-lg font-semibold text-foreground">Gerät verbinden</h2>
                <p className="text-foreground/50 text-sm mt-2 leading-relaxed">
                  Halte dein iPhone an den Mac-Bildschirm
                </p>
              </div>

              <div className="relative w-56 h-56">
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <AppleParticleCloud active={true} size={224} />
                </div>
                <div className="absolute inset-7 rounded-full overflow-hidden border border-primary/20 bg-background shadow-lg">
                  <video ref={videoRef} className="w-full h-full object-cover scale-[1.2]" playsInline muted autoPlay />
                  <motion.div
                    className="absolute inset-0 rounded-full border border-primary/30"
                    animate={{ scale: [1, 1.05, 1], opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  />
                </div>
                <canvas ref={canvasRef} className="hidden" />
              </div>

              <div className="flex items-center gap-2 text-foreground/30">
                <CameraIcon size={14} />
                <p className="text-[11px]">Suche nach Pairing-Signal…</p>
              </div>

              <button onClick={() => navigate('/profile')} className="text-foreground/40 text-sm hover:text-foreground/60 transition-colors">
                Abbrechen
              </button>
            </motion.div>
          )}

          {status === 'confirm' && (
            <motion.div key="confirm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-5">
              <motion.div className="w-16 h-16 rounded-2xl glass-liquid flex items-center justify-center" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
                <Monitor className="text-foreground/60" size={28} />
              </motion.div>
              <div className="text-center">
                <h2 className="text-lg font-semibold text-foreground">Gerät erkannt!</h2>
                <p className="text-foreground/50 text-sm mt-2">Ein macOS-Gerät möchte sich verbinden.</p>
              </div>
              <div className="glass-liquid rounded-xl px-4 py-3 flex items-center gap-3 w-full">
                <Shield className="text-foreground/50 shrink-0" size={16} />
                <p className="text-foreground/40 text-[11px] leading-relaxed">Das Gerät erhält Zugriff auf dein Konto.</p>
              </div>
              <div className="flex gap-3 w-full mt-2">
                <button onClick={resetFlow} className="flex-1 glass-liquid rounded-xl py-3 flex items-center justify-center gap-2 text-foreground/50 text-sm">
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
              <div className="w-10 h-10 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
              <p className="text-foreground/50 text-sm">Verbinde...</p>
            </motion.div>
          )}

          {status === 'done' && (
            <motion.div key="done" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} className="py-8 flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Check className="text-primary" size={28} />
              </div>
              <p className="text-foreground/70 text-sm font-medium">Gerät verbunden!</p>
            </motion.div>
          )}

          {status === 'error' && (
            <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-8 flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-destructive/10 border border-destructive/20 flex items-center justify-center">
                <X className="text-destructive" size={28} />
              </div>
              <p className="text-foreground/50 text-sm text-center">{error}</p>
              <button onClick={resetFlow} className="glass-liquid rounded-xl px-6 py-2 text-sm text-foreground/50">
                Erneut versuchen
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default PairDevice;
