import { useRef, useState, useCallback, useMemo } from 'react';
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'framer-motion';
import { Wifi, Check } from 'lucide-react';
import { toast } from 'sonner';

interface BankCard3DProps {
  last4?: string;
  cardNumber?: string;
  holderName?: string;
  iban?: string;
}

const T = 10; // card thickness in px

const BankCard3D = ({ last4 = '7678', cardNumber, holderName = 'Simon', iban }: BankCard3DProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showNumber, setShowNumber] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const holdTimer = useRef<ReturnType<typeof setTimeout>>();
  const didDrag = useRef(false);
  const tapTimestamps = useRef<number[]>([]);

  const rawRotateX = useMotionValue(0);
  const rawRotateY = useMotionValue(0);
  const rotateX = useSpring(rawRotateX, { stiffness: 150, damping: 20 });
  const rotateY = useSpring(rawRotateY, { stiffness: 150, damping: 20 });

  const sheenX = useTransform(rotateY, [-180, 180], [100, -100]);
  const sheenOpacity = useTransform(rotateY, [-180, -90, 0, 90, 180], [0, 0.15, 0.05, 0.15, 0]);

  const dragStart = useRef({ x: 0, y: 0, rotX: 0, rotY: 0 });

  const copyToClipboard = useCallback((text: string, label: string) => {
    navigator.clipboard.writeText(text.replace(/\s/g, '')).then(() => {
      setCopiedField(label);
      toast.success(`${label} kopiert`);
      setTimeout(() => setCopiedField(null), 2000);
    });
  }, []);

  // Detect double-tap on the whole card (works on iOS touch)
  const handleDoubleTap = useCallback(() => {
    if (!showNumber) return;
    // Determine which face is visible
    const normY = ((rawRotateY.get() % 360) + 360) % 360;
    const isBack = normY >= 90 && normY < 270;
    if (isBack) {
      copyToClipboard('847', 'CVV');
    } else {
      const num = cardNumber || '4291 7832 0551 7678';
      copyToClipboard(num, 'Kartennummer');
    }
  }, [showNumber, rawRotateY, cardNumber, copyToClipboard]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    setIsDragging(true);
    didDrag.current = false;
    dragStart.current = {
      x: e.clientX, y: e.clientY,
      rotX: rawRotateX.get(), rotY: rawRotateY.get(),
    };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    holdTimer.current = setTimeout(() => setShowNumber(true), 500);
  }, [rawRotateX, rawRotateY]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
      didDrag.current = true;
      if (holdTimer.current) { clearTimeout(holdTimer.current); holdTimer.current = undefined; }
    }
    rawRotateY.set(dragStart.current.rotY + dx * 0.4);
    rawRotateX.set(dragStart.current.rotX - dy * 0.4);
  }, [isDragging, rawRotateX, rawRotateY]);

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
    if (holdTimer.current) { clearTimeout(holdTimer.current); holdTimer.current = undefined; }
    setShowNumber(false);

    // Double-tap detection
    if (!didDrag.current) {
      const now = Date.now();
      tapTimestamps.current.push(now);
      // Keep only last 2
      if (tapTimestamps.current.length > 2) tapTimestamps.current.shift();
      if (tapTimestamps.current.length === 2 && now - tapTimestamps.current[0] < 400) {
        handleDoubleTap();
        tapTimestamps.current = [];
      }
    }

    // Snap to nearest face
    const currentY = rawRotateY.get();
    const norm = ((currentY % 360) + 360) % 360;
    if (norm >= 90 && norm < 270) {
      rawRotateY.set(currentY - norm + 180);
    } else {
      rawRotateY.set(norm >= 270 ? currentY - norm + 360 : currentY - norm);
    }
    rawRotateX.set(0);
  }, [rawRotateX, rawRotateY, handleDoubleTap]);

  const revealNumber = cardNumber || '4291 7832 0551 7678';

  const particles = useMemo(() =>
    Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: (Math.random() - 0.5) * 280,
      y: (Math.random() - 0.5) * 50,
      scale: Math.random() * 0.5 + 0.2,
      delay: Math.random() * 0.25,
      opacity: Math.random() * 0.6 + 0.3,
    })), []
  );

  const edgeColor = 'hsl(0 0% 12%)';

  return (
    <div className="flex justify-center" style={{ perspective: 1200, touchAction: 'none' }}>
      <motion.div
        ref={cardRef}
        className="relative w-full max-w-[320px] cursor-grab active:cursor-grabbing select-none"
        style={{
          aspectRatio: '1.586 / 1',
          rotateX, rotateY,
          transformStyle: 'preserve-3d',
          touchAction: 'none',
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {/* ===== FRONT FACE ===== */}
        <div
          className="absolute inset-0 rounded-2xl metallic-sheen p-5 flex flex-col justify-between"
          style={{
            backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
            transform: `translateZ(${T / 2}px)`,
          }}
        >
          <motion.div
            className="absolute inset-0 pointer-events-none rounded-2xl"
            style={{
              background: useTransform(sheenX, (x) =>
                `linear-gradient(${105 + x * 0.3}deg, transparent 30%, hsla(60,56%,91%,${sheenOpacity.get()}) 50%, transparent 70%)`
              ),
            }}
          />
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-foreground/60 text-[10px] font-medium tracking-[0.2em] uppercase">MLP Banking</p>
              <p className="text-beige text-xs font-semibold tracking-wider mt-0.5">PRIVATE</p>
            </div>
            <Wifi className="text-foreground/30 rotate-90" size={18} />
          </div>
          <div className="relative z-10">
            <div className="w-9 h-6 rounded-md gradient-beige opacity-80" />
          </div>
          <div className="flex justify-between items-end relative z-10">
            <div className="relative">
              <AnimatePresence mode="wait">
                {!showNumber ? (
                  <motion.p key="masked" className="text-foreground/50 text-xs font-light tracking-[0.2em]"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    exit={{ opacity: 0, filter: 'blur(4px)', transition: { duration: 0.2 } }}>
                    •••• •••• •••• {last4}
                  </motion.p>
                ) : (
                  <motion.div key="revealed" className="relative">
                    {particles.map((p) => (
                      <motion.span key={`p-${p.id}`}
                        className="absolute left-1/2 top-1/2 w-[2px] h-[2px] rounded-full bg-beige/40"
                        initial={{ x: 0, y: 0, opacity: p.opacity, scale: 1 }}
                        animate={{ x: p.x, y: p.y, opacity: 0, scale: p.scale }}
                        transition={{ duration: 0.8, delay: p.delay, ease: 'easeOut' }}
                      />
                    ))}
                    <p className="text-foreground/80 text-xs font-light tracking-[0.2em] flex">
                      {revealNumber.split('').map((char, i) => (
                        <motion.span key={i}
                          initial={{ opacity: 0, y: 6, filter: 'blur(6px)' }}
                          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                          transition={{ duration: 0.35, delay: 0.05 + i * 0.025, ease: [0.22, 1, 0.36, 1] }}>
                          {char === ' ' ? '\u00A0' : char}
                        </motion.span>
                      ))}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
              {iban && (
                <AnimatePresence>
                  {showNumber && (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      transition={{ delay: 0.3, duration: 0.4 }}
                      className="text-foreground/30 text-[7px] tracking-wider mt-0.5 flex">
                      {iban.split('').map((char, i) => (
                        <motion.span key={i}
                          initial={{ opacity: 0, filter: 'blur(4px)' }}
                          animate={{ opacity: 1, filter: 'blur(0px)' }}
                          transition={{ duration: 0.3, delay: 0.3 + i * 0.015 }}>
                          {char === ' ' ? '\u00A0' : char}
                        </motion.span>
                      ))}
                    </motion.p>
                  )}
                </AnimatePresence>
              )}
            </div>
            <div className="flex flex-col items-end">
              <p className="text-foreground/30 text-[8px] tracking-wider">VALID THRU</p>
              <p className="text-foreground/50 text-[11px]">12/29</p>
            </div>
          </div>
          {copiedField && (
            <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
              className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 bg-background/80 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-1.5">
              <Check size={10} className="text-primary" />
              <span className="text-[9px] text-foreground/70 font-medium">{copiedField} kopiert</span>
            </motion.div>
          )}
          <div className="absolute inset-0 rounded-2xl border border-foreground/[0.06] pointer-events-none" />
        </div>

        {/* ===== EDGES (seamless) ===== */}
        <div className="absolute inset-0 pointer-events-none" style={{ transformStyle: 'preserve-3d' }}>
          {/* Top */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: T,
            background: edgeColor,
            transform: `translateY(-${T}px) translateZ(${T / 2}px) rotateX(90deg)`,
            transformOrigin: 'bottom center',
          }} />
          {/* Bottom */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: T,
            background: edgeColor,
            transform: `translateY(${T}px) translateZ(${T / 2}px) rotateX(-90deg)`,
            transformOrigin: 'top center',
          }} />
          {/* Left */}
          <div style={{
            position: 'absolute', top: 0, bottom: 0, left: 0, width: T,
            background: `linear-gradient(90deg, hsl(0 0% 10%), ${edgeColor})`,
            transform: `translateX(-${T}px) translateZ(${T / 2}px) rotateY(-90deg)`,
            transformOrigin: 'right center',
          }} />
          {/* Right */}
          <div style={{
            position: 'absolute', top: 0, bottom: 0, right: 0, width: T,
            background: `linear-gradient(-90deg, hsl(0 0% 10%), ${edgeColor})`,
            transform: `translateX(${T}px) translateZ(${T / 2}px) rotateY(90deg)`,
            transformOrigin: 'left center',
          }} />
        </div>

        {/* ===== BACK FACE ===== */}
        <div
          className="absolute inset-0 rounded-2xl metallic-sheen flex flex-col"
          style={{
            backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
            transform: `rotateY(180deg) translateZ(${T / 2}px)`,
          }}
        >
          <div className="w-full h-11 bg-foreground/30 mt-5" />
          <div className="px-4 mt-2.5 flex items-center gap-2.5">
            <div className="flex-1">
              <p className="text-foreground/20 text-[6px] mb-0.5">AUTHORIZED SIGNATURE</p>
              <div className="h-7 rounded bg-foreground/5 border border-foreground/10 flex items-center px-2">
                <p className="text-foreground/30 text-[9px] italic font-medium tracking-wide">{holderName}</p>
              </div>
            </div>
            <div>
              <p className="text-foreground/20 text-[6px] mb-0.5">CVV</p>
              <div className="bg-foreground/10 rounded px-2.5 py-1 border border-foreground/10">
                <AnimatePresence mode="wait">
                  {!showNumber ? (
                    <motion.p key="cvv-masked" className="text-foreground/50 text-xs font-mono tracking-widest"
                      exit={{ opacity: 0, filter: 'blur(4px)', transition: { duration: 0.15 } }}>
                      •••
                    </motion.p>
                  ) : (
                    <p className="text-foreground/70 text-xs font-mono tracking-widest flex">
                      {'847'.split('').map((d, i) => (
                        <motion.span key={i}
                          initial={{ opacity: 0, y: 4, filter: 'blur(6px)' }}
                          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                          transition={{ duration: 0.3, delay: 0.2 + i * 0.08 }}>
                          {d}
                        </motion.span>
                      ))}
                    </p>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
          <div className="px-4 pb-2 mt-auto">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <div className="w-7 h-4 rounded-sm bg-foreground/10 flex items-center justify-center">
                  <p className="text-foreground/30 text-[5px] font-bold">VISA</p>
                </div>
                <div className="w-7 h-4 rounded-sm bg-foreground/10 flex items-center justify-center">
                  <p className="text-foreground/30 text-[5px] font-bold">DEBIT</p>
                </div>
              </div>
              <p className="text-foreground/20 text-[6px] font-mono">BLZ 672 300 00</p>
            </div>
            <div>
              <p className="text-foreground/40 text-[8px] font-medium tracking-wider">{holderName}</p>
              <p className="text-foreground/20 text-[6px] leading-relaxed mt-0.5">
                MLP Banking AG · Alte Heerstraße 40 · 69168 Wiesloch
              </p>
            </div>
          </div>
          {copiedField && (
            <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
              className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 bg-background/80 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-1.5">
              <Check size={10} className="text-primary" />
              <span className="text-[9px] text-foreground/70 font-medium">{copiedField} kopiert</span>
            </motion.div>
          )}
          <div className="absolute inset-0 rounded-2xl border border-foreground/[0.06] pointer-events-none" />
        </div>
      </motion.div>
    </div>
  );
};

export default BankCard3D;
