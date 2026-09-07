import React, { useEffect, useRef } from 'react';

interface BackgroundStarsProps {
  theme?: string;
}

export const BackgroundStars: React.FC<BackgroundStarsProps> = ({ theme = 'starlight' }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Star generation
    const starCount = 85;
    const stars = Array.from({ length: starCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.6 + 0.4,
      alpha: Math.random() * 0.8 + 0.2,
      speed: Math.random() * 0.008 + 0.002,
      phase: Math.random() * Math.PI * 2,
    }));

    // Shooting stars
    let shootingStar = {
      x: -100,
      y: -100,
      length: 120,
      speed: 12,
      active: false,
      angle: Math.PI / 4,
    };

    const triggerShootingStar = () => {
      shootingStar.x = Math.random() * (width * 0.7);
      shootingStar.y = Math.random() * (height * 0.4);
      shootingStar.active = true;
    };

    const shootingStarInterval = setInterval(() => {
      if (!shootingStar.active && Math.random() > 0.4) {
        triggerShootingStar();
      }
    }, 7000);

    // Render loop
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Render gentle stars
      stars.forEach((star) => {
        star.phase += star.speed;
        const currentAlpha = Math.sin(star.phase) * 0.35 + star.alpha;
        
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        
        let color = `rgba(249, 115, 22, ${Math.max(0.04, Math.min(0.22, currentAlpha * 0.3))})`;
        if (Math.random() > 0.5) {
          color = `rgba(214, 211, 209, ${Math.max(0.05, Math.min(0.25, currentAlpha * 0.4))})`;
        }

        ctx.fillStyle = color;
        ctx.shadowBlur = star.radius;
        ctx.shadowColor = 'rgba(251, 146, 60, 0.2)';
        ctx.fill();
      });

      // Render shooting star as subtle warm starlight beam if active
      if (shootingStar.active) {
        ctx.save();
        ctx.beginPath();
        ctx.lineWidth = 1.2;
        const grad = ctx.createLinearGradient(
          shootingStar.x,
          shootingStar.y,
          shootingStar.x - Math.cos(shootingStar.angle) * shootingStar.length,
          shootingStar.y - Math.sin(shootingStar.angle) * shootingStar.length
        );
        grad.addColorStop(0, 'rgba(249, 115, 22, 0.45)');
        grad.addColorStop(1, 'rgba(254, 215, 170, 0)');
        ctx.strokeStyle = grad;
        ctx.moveTo(shootingStar.x, shootingStar.y);
        ctx.lineTo(
          shootingStar.x - Math.cos(shootingStar.angle) * shootingStar.length,
          shootingStar.y - Math.sin(shootingStar.angle) * shootingStar.length
        );
        ctx.stroke();
        ctx.restore();

        shootingStar.x += Math.cos(shootingStar.angle) * shootingStar.speed;
        shootingStar.y += Math.sin(shootingStar.angle) * shootingStar.speed;

        if (shootingStar.x > width + 200 || shootingStar.y > height + 200) {
          shootingStar.active = false;
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      clearInterval(shootingStarInterval);
    };
  }, [theme]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 opacity-70"
    />
  );
};
