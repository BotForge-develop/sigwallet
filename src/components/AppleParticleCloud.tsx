import { useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { encodePattern, type PatternDot } from '@/lib/patternCodec';

interface AppleParticleCloudProps {
  active?: boolean;
  size?: number;
  /** If provided, encodes this 6-digit code into the dot positions */
  pairingCode?: number | null;
}

const AppleParticleCloud = ({ active = true, size = 220, pairingCode = null }: AppleParticleCloudProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const dpr = window.devicePixelRatio || 2;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const cx = size / 2;
    const cy = size / 2;
    const half = size / 2;

    // Encoded pattern dots (deterministic positions based on code)
    const encodedDots: PatternDot[] = pairingCode != null ? encodePattern(pairingCode) : [];

    // Decorative particles (random, animated)
    const decoCount = 200;
    const decoParticles = Array.from({ length: decoCount }, (_, i) => {
      const seed = i * 1337.7 + 42;
      const pseudoRand = (n: number) => {
        const x = Math.sin(seed + n * 9999.1) * 43758.5453;
        return x - Math.floor(x);
      };
      return {
        theta: pseudoRand(0) * Math.PI * 2,
        phi: Math.acos(2 * pseudoRand(1) - 1),
        r: half * (0.65 + pseudoRand(2) * 0.55),
        speed: 0.1 + pseudoRand(3) * 0.5,
        dotSize: 0.3 + pseudoRand(4) * 1.2,
        phase: pseudoRand(5) * Math.PI * 2,
        hue: 205 + pseudoRand(6) * 20,
        drift: (pseudoRand(7) - 0.5) * 0.2,
      };
    });

    let time = 0;

    const render = () => {
      ctx.clearRect(0, 0, size, size);
      time += 0.005;

      // Ambient glow
      if (active) {
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, half * 0.9);
        g.addColorStop(0, 'hsla(210, 100%, 55%, 0.04)');
        g.addColorStop(0.6, 'hsla(210, 100%, 50%, 0.015)');
        g.addColorStop(1, 'transparent');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, size, size);
      }

      // ── Draw decorative particles ──
      const decoProjected = decoParticles.map(p => {
        const t = p.theta + time * p.speed;
        const ph = p.phi + Math.sin(time * 0.3 + p.phase) * 0.1 + p.drift * time;
        const pulse = active ? 1 + Math.sin(time * 1.5 + p.phase) * 0.06 : 1;
        const r = p.r * pulse;
        const x3d = r * Math.sin(ph) * Math.cos(t);
        const y3d = r * Math.sin(ph) * Math.sin(t);
        const z3d = r * Math.cos(ph);
        return { x: cx + x3d * 0.8, y: cy + y3d * 0.8, z: z3d, p };
      });
      decoProjected.sort((a, b) => a.z - b.z);

      for (const pt of decoProjected) {
        const depthNorm = (pt.z / half + 1) * 0.5;
        const alpha = active ? 0.08 + depthNorm * 0.35 : 0.03 + depthNorm * 0.06;
        const dotR = pt.p.dotSize * (active ? 1 : 0.4);

        ctx.beginPath();
        ctx.arc(pt.x, pt.y, dotR * 1.5, 0, Math.PI * 2);
        const coreG = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, dotR * 1.5);
        coreG.addColorStop(0, `hsla(${pt.p.hue}, 100%, 80%, ${Math.min(alpha * 1.5, 0.8)})`);
        coreG.addColorStop(0.6, `hsla(${pt.p.hue}, 100%, 60%, ${alpha * 0.5})`);
        coreG.addColorStop(1, 'transparent');
        ctx.fillStyle = coreG;
        ctx.fill();
      }

      // ── Draw encoded pattern dots (anchors + data) ──
      for (const dot of encodedDots) {
        const ix = cx + dot.x * half;
        const iy = cy + dot.y * half;
        const isAnchor = dot.type === 'anchor';

        // Anchors pulse more strongly
        const breathe = active ? Math.sin(time * 2 + dot.index * 1.5) * 0.15 : 0;
        const baseAlpha = isAnchor ? 0.9 + breathe : 0.7 + breathe;
        const dotRadius = isAnchor ? 5 : 3.5;

        // Outer glow
        const glowR = dotRadius * (isAnchor ? 5 : 3.5);
        const glow = ctx.createRadialGradient(ix, iy, 0, ix, iy, glowR);
        glow.addColorStop(0, `hsla(210, 100%, 70%, ${baseAlpha * 0.5})`);
        glow.addColorStop(0.4, `hsla(210, 100%, 60%, ${baseAlpha * 0.15})`);
        glow.addColorStop(1, 'transparent');
        ctx.beginPath();
        ctx.arc(ix, iy, glowR, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();

        // Core
        const core = ctx.createRadialGradient(ix, iy, 0, ix, iy, dotRadius);
        core.addColorStop(0, `hsla(210, 100%, 90%, ${Math.min(baseAlpha, 1)})`);
        core.addColorStop(0.5, `hsla(210, 100%, 70%, ${baseAlpha * 0.8})`);
        core.addColorStop(1, `hsla(210, 100%, 55%, 0)`);
        ctx.beginPath();
        ctx.arc(ix, iy, dotRadius, 0, Math.PI * 2);
        ctx.fillStyle = core;
        ctx.fill();
      }

      animRef.current = requestAnimationFrame(render);
    };

    render();
  }, [active, size, pairingCode]);

  useEffect(() => {
    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [draw]);

  return (
    <motion.canvas
      ref={canvasRef}
      style={{ width: size, height: size }}
      initial={{ opacity: 0, scale: 0.7 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.7 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
    />
  );
};

export default AppleParticleCloud;
