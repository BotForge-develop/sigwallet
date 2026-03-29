import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

interface AppleParticleCloudProps {
  active?: boolean;
  size?: number;
}

const AppleParticleCloud = ({ active = true, size = 200 }: AppleParticleCloudProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const dpr = window.devicePixelRatio || 2;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const cx = size / 2;
    const cy = size / 2;
    const particleCount = 120;
    const baseRadius = size * 0.35;

    // Create particles with 3D positions on a sphere
    const particles = Array.from({ length: particleCount }, () => {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = baseRadius * (0.85 + Math.random() * 0.3);
      return {
        theta,
        phi,
        r,
        speed: 0.3 + Math.random() * 0.7,
        size: 1 + Math.random() * 2,
        phaseOffset: Math.random() * Math.PI * 2,
      };
    });

    let time = 0;

    const draw = () => {
      ctx.clearRect(0, 0, size, size);
      time += 0.008;

      // Sort by z for depth
      const projected = particles.map((p) => {
        const theta = p.theta + time * p.speed;
        const phi = p.phi + Math.sin(time * 0.5 + p.phaseOffset) * 0.15;
        const x3d = p.r * Math.sin(phi) * Math.cos(theta);
        const y3d = p.r * Math.sin(phi) * Math.sin(theta);
        const z3d = p.r * Math.cos(phi);
        // Simple perspective
        const scale = 1 + z3d / (baseRadius * 3);
        return { x: cx + x3d * 0.9, y: cy + y3d * 0.9, z: z3d, scale, particle: p };
      });

      projected.sort((a, b) => a.z - b.z);

      for (const pt of projected) {
        const alpha = active
          ? 0.3 + (pt.z / baseRadius + 1) * 0.35
          : 0.08 + (pt.z / baseRadius + 1) * 0.08;
        const dotSize = pt.particle.size * pt.scale * (active ? 1 : 0.6);

        // Blue glow
        const gradient = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, dotSize * 3);
        gradient.addColorStop(0, `hsla(210, 100%, 65%, ${alpha})`);
        gradient.addColorStop(0.4, `hsla(210, 100%, 60%, ${alpha * 0.5})`);
        gradient.addColorStop(1, `hsla(210, 100%, 55%, 0)`);

        ctx.beginPath();
        ctx.arc(pt.x, pt.y, dotSize * 3, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Core dot
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, dotSize * 0.8, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(210, 100%, 75%, ${Math.min(alpha * 1.5, 1)})`;
        ctx.fill();
      }

      animRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [active, size]);

  return (
    <motion.canvas
      ref={canvasRef}
      style={{ width: size, height: size }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    />
  );
};

export default AppleParticleCloud;
