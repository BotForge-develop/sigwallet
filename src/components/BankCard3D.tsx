import { useRef, useState, useCallback } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Wifi } from 'lucide-react';

interface BankCard3DProps {
  last4: string;
}

const BankCard3D = ({ last4 }: BankCard3DProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

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
              <p className="text-foreground/60 text-[10px] font-medium tracking-[0.2em] uppercase">SimonDev</p>
              <p className="text-beige text-xs font-semibold tracking-wider mt-0.5">BLACK</p>
            </div>
            <Wifi className="text-foreground/30 rotate-90" size={18} />
          </div>
          <div className="relative z-10">
            <div className="w-9 h-6 rounded-md gradient-beige opacity-80" />
          </div>
          <div className="flex justify-between items-end relative z-10">
            <p className="text-foreground/50 text-xs font-light tracking-[0.25em]">•••• {last4}</p>
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
          <div className="w-full h-10 bg-foreground/20 mt-5" />
          <div className="px-5 flex items-center gap-3">
            <div className="flex-1 h-7 rounded bg-foreground/10" />
            <div className="bg-foreground/10 rounded px-2.5 py-1">
              <p className="text-foreground/50 text-xs font-mono tracking-widest">•••</p>
            </div>
          </div>
          <div className="px-5 pb-3">
            <p className="text-foreground/20 text-[7px] leading-relaxed">
              This card is property of SimonDev Private Banking. Unauthorized use is prohibited.
            </p>
          </div>
          <div className="absolute inset-0 rounded-2xl border border-foreground/[0.06] pointer-events-none" />
        </div>
      </motion.div>
    </div>
  );
};

export default BankCard3D;
