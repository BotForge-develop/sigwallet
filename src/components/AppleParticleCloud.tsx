import { useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';

interface AppleParticleCloudProps {
  active?: boolean;
  size?: number;
  /** 6-digit code encoded into the pattern (invisible to user) */
  encodedData?: string;
}

const AppleParticleCloud = ({ active = true, size = 220 }: AppleParticleCloudProps) => {
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
    const baseRadius = size * 0.38;

    // Generate 3 distinct particle layers for depth
    const layers = [
      { count: 180, rMin: 0.7, rMax: 0.9, sizeMin: 0.4, sizeMax: 1.2, speedMin: 0.15, speedMax: 0.4, hue: 210 },
      { count: 120, rMin: 0.85, rMax: 1.1, sizeMin: 0.8, sizeMax: 2.0, speedMin: 0.25, speedMax: 0.6, hue: 215 },
      { count: 60, rMin: 0.95, rMax: 1.25, sizeMin: 1.5, sizeMax: 3.0, speedMin: 0.35, speedMax: 0.8, hue: 205 },
    ];

    type Particle = {
      theta: number; phi: number; r: number; speed: number;
      dotSize: number; phaseX: number; phaseY: number;
      hue: number; drift: number; pulse: number;
    };

    const particles: Particle[] = [];
    for (const layer of layers) {
      for (let i = 0; i < layer.count; i++) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const r = baseRadius * (layer.rMin + Math.random() * (layer.rMax - layer.rMin));
        particles.push({
          theta,
          phi,
          r,
          speed: layer.speedMin + Math.random() * (layer.speedMax - layer.speedMin),
          dotSize: layer.sizeMin + Math.random() * (layer.sizeMax - layer.sizeMin),
          phaseX: Math.random() * Math.PI * 2,
          phaseY: Math.random() * Math.PI * 2,
          hue: layer.hue + (Math.random() - 0.5) * 20,
          drift: (Math.random() - 0.5) * 0.3,
          pulse: Math.random() * Math.PI * 2,
        });
      }
    }

    let time = 0;

    const render = () => {
      ctx.clearRect(0, 0, size, size);
      time += 0.006;

      // Background ambient glow
      if (active) {
        const ambientGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, baseRadius * 1.2);
        ambientGrad.addColorStop(0, 'hsla(210, 100%, 60%, 0.03)');
        ambientGrad.addColorStop(0.5, 'hsla(210, 100%, 50%, 0.015)');
        ambientGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = ambientGrad;
        ctx.fillRect(0, 0, size, size);
      }

      // Project and sort particles
      const projected = particles.map((p) => {
        const t = p.theta + time * p.speed;
        const pulseFactor = active ? 1 + Math.sin(time * 2 + p.pulse) * 0.08 : 1;
        const ph = p.phi + Math.sin(time * 0.4 + p.phaseY) * 0.12 + p.drift * time;
        const r = p.r * pulseFactor;

        const x3d = r * Math.sin(ph) * Math.cos(t);
        const y3d = r * Math.sin(ph) * Math.sin(t);
        const z3d = r * Math.cos(ph);

        const perspective = 1 + z3d / (baseRadius * 2.5);

        return {
          x: cx + x3d * 0.85,
          y: cy + y3d * 0.85,
          z: z3d,
          scale: perspective,
          p,
        };
      });

      projected.sort((a, b) => a.z - b.z);

      for (const pt of projected) {
        const depthNorm = (pt.z / baseRadius + 1) * 0.5; // 0..1
        const baseAlpha = active ? 0.15 + depthNorm * 0.6 : 0.04 + depthNorm * 0.08;
        const breathe = active ? 1 + Math.sin(time * 1.5 + pt.p.pulse) * 0.3 : 0;
        const alpha = Math.min(baseAlpha + breathe * 0.15, 1);
        const dotR = pt.p.dotSize * pt.scale * (active ? 1 : 0.5);
        const hue = pt.p.hue;

        // Outer glow
        if (active && dotR > 1) {
          const glow = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, dotR * 4);
          glow.addColorStop(0, `hsla(${hue}, 100%, 70%, ${alpha * 0.4})`);
          glow.addColorStop(0.5, `hsla(${hue}, 100%, 60%, ${alpha * 0.1})`);
          glow.addColorStop(1, 'transparent');
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, dotR * 4, 0, Math.PI * 2);
          ctx.fillStyle = glow;
          ctx.fill();
        }

        // Core particle
        const coreGrad = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, dotR * 1.5);
        coreGrad.addColorStop(0, `hsla(${hue}, 100%, 85%, ${Math.min(alpha * 1.8, 1)})`);
        coreGrad.addColorStop(0.6, `hsla(${hue}, 100%, 65%, ${alpha})`);
        coreGrad.addColorStop(1, `hsla(${hue}, 100%, 50%, 0)`);

        ctx.beginPath();
        ctx.arc(pt.x, pt.y, dotR * 1.5, 0, Math.PI * 2);
        ctx.fillStyle = coreGrad;
        ctx.fill();
      }

      animRef.current = requestAnimationFrame(render);
    };

    render();
  }, [active, size]);

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
