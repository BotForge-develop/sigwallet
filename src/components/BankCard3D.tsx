import { useRef, useState, useCallback, useMemo } from 'react';
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'framer-motion';
import { Wifi, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

interface BankCard3DProps {
  last4?: string;
  cardNumber?: string;
  holderName?: string;
  iban?: string;
}

const CARD_THICKNESS = 8; // px — visual edge thickness

const BankCard3D = ({ last4 = '7678', cardNumber, holderName = 'Simon', iban }: BankCard3DProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showNumber, setShowNumber] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const holdTimer = useRef<ReturnType<typeof setTimeout>>();

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
      setTimeout(() => setCopiedField(null), 1500);
    });
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      rotX: rawRotateX.get(),
      rotY: rawRotateY.get(),
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    holdTimer.current = setTimeout(() => setShowNumber(true), 600);
  }, [rawRotateX, rawRotateY]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    if (Math.abs(dx) > 6 || Math.abs(dy) > 6) {
      if (holdTimer.current) clearTimeout(holdTimer.current);
    }
    const sensitivity = 0.4;
    rawRotateY.set(dragStart.current.rotY + dx * sensitivity);
    rawRotateX.set(dragStart.current.rotX - dy * sensitivity);
  }, [isDragging, rawRotateX, rawRotateY]);

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
    if (holdTimer.current) clearTimeout(holdTimer.current);
    setShowNumber(false);
    const currentY = rawRotateY.get();
    const norm = ((currentY % 360) + 360) % 360;

    if (norm >= 90 && norm < 270) {
      const target = currentY - norm + 180;
      rawRotateY.set(target);
    } else {
      const target = norm >= 270 ? currentY - norm + 360 : currentY - norm;
      rawRotateY.set(target);
    }
    rawRotateX.set(0);
  }, [rawRotateX, rawRotateY]);

  const revealNumber = cardNumber || '4291 7832 0551 7678';

  const particles = useMemo(() =>
    Array.from({ length: 40 }, (_, i) => ({
      id: i,
      x: (Math.random() - 0.5) * 250,
      y: (Math.random() - 0.5) * 40,
      scale: Math.random() * 0.4 + 0.2,
      delay: Math.random() * 0.2,
      opacity: Math.random() * 0.5 + 0.3,
    })), []
  );

  const CopyableText = ({ text, label, className, children }: {
    text: string; label: string; className?: string; children: React.ReactNode;
  }) => (
    <span
      className={`${className} cursor-pointer active:opacity-60 transition-opacity`}
      onClick={(e) => {
        if (e.detail === 2) {
          e.stopPropagation();
          e.preventDefault();
          copyToClipboard(text, label);
        }
      }}
      onTouchEnd={(e) => {
        // Double-tap detection for touch
        const now = Date.now();
        const lastTap = (e.currentTarget as any).__lastTap || 0;
        if (now - lastTap < 350) {
          e.stopPropagation();
          e.preventDefault();
          copyToClipboard(text, label);
        }
        (e.currentTarget as any).__lastTap = now;
      }}
    >
      {copiedField === label ? (
        <motion.span initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="inline-flex items-center gap-1">
          <Check size={8} className="text-primary" /> Kopiert
        </motion.span>
      ) : children}
    </span>
  );

  return (
    <div
      className="flex justify-center"
      style={{ perspective: 1200, touchAction: 'none' }}
    >
      <motion.div
        ref={cardRef}
        className="relative w-full max-w-[320px] aspect-[1.586/1] cursor-grab active:cursor-grabbing select-none"
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
          touchAction: 'none',
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        whileTap={{ scale: 0.98 }}
      >
        {/* Front Face */}
        <div
          className="absolute inset-0 rounded-2xl metallic-sheen p-5 flex flex-col justify-between"
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'translateZ(' + (CARD_THICKNESS / 2) + 'px)',
          } as React.CSSProperties}
        >
          <motion.div
            className="absolute inset-0 pointer-events-none rounded-2xl"
            style={{
              background: useTransform(
                sheenX,
                (x) => `linear-gradient(${105 + x * 0.3}deg, transparent 30%, hsla(60, 56%, 91%, ${sheenOpacity.get()}) 50%, transparent 70%)`
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
                  <motion.p
                    key="masked"
                    className="text-foreground/50 text-xs font-light tracking-[0.2em]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, filter: 'blur(4px)', transition: { duration: 0.2 } }}
                  >
                    •••• •••• •••• {last4}
                  </motion.p>
                ) : (
                  <motion.div key="revealed" className="relative">
                    {particles.map((p) => (
                      <motion.span
                        key={`p-${p.id}`}
                        className="absolute left-1/2 top-1/2 w-[2px] h-[2px] rounded-full bg-beige/40"
                        initial={{ x: 0, y: 0, opacity: p.opacity, scale: 1 }}
                        animate={{ x: p.x, y: p.y, opacity: 0, scale: p.scale }}
                        transition={{ duration: 0.8, delay: p.delay, ease: 'easeOut' }}
                      />
                    ))}
                    <CopyableText text={revealNumber} label="Kartennummer" className="text-foreground/80 text-xs font-light tracking-[0.2em] flex">
                      {revealNumber.split('').map((char, i) => (
                        <motion.span
                          key={i}
                          initial={{ opacity: 0, y: 6, filter: 'blur(6px)' }}
                          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                          transition={{ duration: 0.35, delay: 0.05 + i * 0.025, ease: [0.22, 1, 0.36, 1] }}
                        >
                          {char === ' ' ? '\u00A0' : char}
                        </motion.span>
                      ))}
                    </CopyableText>
                  </motion.div>
                )}
              </AnimatePresence>
              {iban && (
                <AnimatePresence>
                  {showNumber && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: 0.3, duration: 0.4 }}
                    >
                      <CopyableText text={iban} label="IBAN" className="text-foreground/30 text-[7px] tracking-wider mt-0.5 flex">
                        {iban.split('').map((char, i) => (
                          <motion.span
                            key={i}
                            initial={{ opacity: 0, filter: 'blur(4px)' }}
                            animate={{ opacity: 1, filter: 'blur(0px)' }}
                            transition={{ duration: 0.3, delay: 0.3 + i * 0.015 }}
                          >
                            {char === ' ' ? '\u00A0' : char}
                          </motion.span>
                        ))}
                      </CopyableText>
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
            </div>
            <div className="flex flex-col items-end">
              <p className="text-foreground/30 text-[8px] tracking-wider">VALID THRU</p>
              <p className="text-foreground/50 text-[11px]">12/29</p>
            </div>
          </div>
          <div className="absolute inset-0 rounded-2xl border border-foreground/[0.06] pointer-events-none" />
        </div>

        {/* Card Edge — Top */}
        <div
          className="absolute left-0 right-0 rounded-t-2xl"
          style={{
            top: 0,
            height: CARD_THICKNESS,
            background: 'linear-gradient(180deg, hsl(0 0% 18%), hsl(0 0% 10%))',
            transform: `rotateX(90deg) translateZ(${CARD_THICKNESS / 2}px)`,
            transformOrigin: 'top center',
          }}
        />
        {/* Card Edge — Bottom */}
        <div
          className="absolute left-0 right-0 rounded-b-2xl"
          style={{
            bottom: 0,
            height: CARD_THICKNESS,
            background: 'linear-gradient(0deg, hsl(0 0% 18%), hsl(0 0% 10%))',
            transform: `rotateX(-90deg) translateZ(${CARD_THICKNESS / 2}px)`,
            transformOrigin: 'bottom center',
          }}
        />
        {/* Card Edge — Left */}
        <div
          className="absolute top-0 bottom-0 rounded-l-2xl"
          style={{
            left: 0,
            width: CARD_THICKNESS,
            background: 'linear-gradient(90deg, hsl(0 0% 14%), hsl(0 0% 10%))',
            transform: `rotateY(-90deg) translateZ(${CARD_THICKNESS / 2}px)`,
            transformOrigin: 'left center',
          }}
        />
        {/* Card Edge — Right */}
        <div
          className="absolute top-0 bottom-0 rounded-r-2xl"
          style={{
            right: 0,
            width: CARD_THICKNESS,
            background: 'linear-gradient(-90deg, hsl(0 0% 14%), hsl(0 0% 10%))',
            transform: `rotateY(90deg) translateZ(${CARD_THICKNESS / 2}px)`,
            transformOrigin: 'right center',
          }}
        />

        {/* Back Face */}
        <div
          className="absolute inset-0 rounded-2xl metallic-sheen flex flex-col"
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: `rotateY(180deg) translateZ(${CARD_THICKNESS / 2}px)`,
          } as React.CSSProperties}
        >
          {/* Magnetic Stripe */}
          <div className="w-full h-11 bg-foreground/30 mt-5" />

          {/* Signature Strip + CVV */}
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
                    <motion.p
                      key="cvv-masked"
                      className="text-foreground/50 text-xs font-mono tracking-widest"
                      exit={{ opacity: 0, filter: 'blur(4px)', transition: { duration: 0.15 } }}
                    >
                      •••
                    </motion.p>
                  ) : (
                    <CopyableText text="847" label="CVV" className="text-foreground/70 text-xs font-mono tracking-widest flex">
                      {'847'.split('').map((d, i) => (
                        <motion.span
                          key={i}
                          initial={{ opacity: 0, y: 4, filter: 'blur(6px)' }}
                          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                          transition={{ duration: 0.3, delay: 0.2 + i * 0.08 }}
                        >
                          {d}
                        </motion.span>
                      ))}
                    </CopyableText>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Card Info */}
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
          <div className="absolute inset-0 rounded-2xl border border-foreground/[0.06] pointer-events-none" />
        </div>
      </motion.div>
    </div>
  );
};

export default BankCard3D;
