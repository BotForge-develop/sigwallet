import { useRef, useState, useCallback } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Wifi } from 'lucide-react';

interface BankCard3DProps {
  last4?: string;
  cardNumber?: string;
  holderName?: string;
  iban?: string;
}

const BankCard3D = ({ last4 = '7678', cardNumber, holderName = 'Simon', iban }: BankCard3DProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showNumber, setShowNumber] = useState(false);
  const holdTimer = useRef<ReturnType<typeof setTimeout>>();

  const rawRotateX = useMotionValue(0);
  const rawRotateY = useMotionValue(0);

  const rotateX = useSpring(rawRotateX, { stiffness: 150, damping: 20 });
  const rotateY = useSpring(rawRotateY, { stiffness: 150, damping: 20 });

  const sheenX = useTransform(rotateY, [-180, 180], [100, -100]);
  const sheenOpacity = useTransform(rotateY, [-180, -90, 0, 90, 180], [0, 0.15, 0.05, 0.15, 0]);

  const dragStart = useRef({ x: 0, y: 0, rotX: 0, rotY: 0 });

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

  return (
    <div
      className="flex justify-center"
      style={{ perspective: 1200, touchAction: 'none' }}
    >
      <motion.div
        ref={cardRef}
        className="relative w-full max-w-[320px] aspect-[1.586/1] rounded-2xl overflow-hidden cursor-grab active:cursor-grabbing select-none"
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
          style={{ backfaceVisibility: 'hidden' }}
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
              <div>
                <p className={`text-foreground/50 text-xs font-light tracking-[0.2em] transition-all duration-300 ${showNumber ? 'text-foreground/80' : ''}`}>
                  {showNumber ? revealNumber : `•••• •••• •••• ${last4}`}
                </p>
                {iban && (
                  <p className={`text-foreground/30 text-[7px] tracking-wider mt-0.5 transition-opacity duration-300 ${showNumber ? 'opacity-100' : 'opacity-0'}`}>
                    {iban}
                  </p>
                )}
              </div>
            <div className="flex flex-col items-end">
              <p className="text-foreground/30 text-[8px] tracking-wider">VALID THRU</p>
              <p className="text-foreground/50 text-[11px]">12/29</p>
            </div>
          </div>
          <div className="absolute inset-0 rounded-2xl border border-foreground/[0.06] pointer-events-none" />
        </div>

        {/* Back Face */}
        <div
          className="absolute inset-0 rounded-2xl metallic-sheen flex flex-col justify-between"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          {/* Magnetic Stripe */}
          <div className="w-full h-12 bg-foreground/30 mt-6" />

          {/* Signature Strip + CVV */}
          <div className="px-5 mt-3 flex items-center gap-3">
            <div className="flex-1">
              <p className="text-foreground/20 text-[7px] mb-0.5">AUTHORIZED SIGNATURE</p>
              <div className="h-8 rounded bg-foreground/5 border border-foreground/10 flex items-center px-2">
                <p className="text-foreground/30 text-[10px] italic font-medium tracking-wide">{holderName}</p>
              </div>
            </div>
            <div>
              <p className="text-foreground/20 text-[7px] mb-0.5">CVV</p>
              <div className="bg-foreground/10 rounded px-3 py-1.5 border border-foreground/10">
                <p className={`text-xs font-mono tracking-widest transition-all duration-300 ${showNumber ? 'text-foreground/70' : 'text-foreground/50'}`}>
                  {showNumber ? '847' : '•••'}
                </p>
              </div>
            </div>
          </div>

          {/* Card Info */}
          <div className="px-5 pb-3 mt-auto">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-5 rounded-sm bg-foreground/10 flex items-center justify-center">
                  <p className="text-foreground/30 text-[6px] font-bold">VISA</p>
                </div>
                <div className="w-8 h-5 rounded-sm bg-foreground/10 flex items-center justify-center">
                  <p className="text-foreground/30 text-[6px] font-bold">DEBIT</p>
                </div>
              </div>
              <p className="text-foreground/20 text-[7px] font-mono">BLZ 672 300 00</p>
            </div>
            <div>
              <p className="text-foreground/40 text-[9px] font-medium tracking-wider">{holderName}</p>
              <p className="text-foreground/20 text-[7px] leading-relaxed mt-0.5">
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
