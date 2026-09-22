import React, { useEffect, useRef } from 'react';
import { CosmicCustomizerSettings } from '../types';

interface BackgroundStarsProps {
  theme?: string;
  cosmicSettings?: CosmicCustomizerSettings;
}

export const BackgroundStars: React.FC<BackgroundStarsProps> = ({ 
  theme = 'starlight',
  cosmicSettings 
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const starPattern = cosmicSettings?.starPattern || 'constellation';
  const ambientGlowColor = cosmicSettings?.ambientGlowColor || 'warm_amber';
  const starsEnabled = cosmicSettings?.starsEnabled ?? true;
  const glowIntensity = cosmicSettings?.glowIntensity || 'subtle';
  const particleSpeed = cosmicSettings?.particleSpeed || 'gentle';

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

    // Speed multiplier based on particleSpeed setting
    const speedMult = particleSpeed === 'still' ? 0.05 : particleSpeed === 'cosmic' ? 2.2 : 1.0;

    // Star counts based on pattern
    const starCount = !starsEnabled ? 0 : starPattern === 'minimalist_void' ? 30 : starPattern === 'zenith_cluster' ? 90 : 80;

    // Generate stars with pattern positions
    const stars = Array.from({ length: starCount }, (_, i) => {
      let x = Math.random() * width;
      let y = Math.random() * height;

      if (starPattern === 'zenith_cluster') {
        // Concentrate 65% of stars near the top center
        if (Math.random() < 0.65) {
          x = width * 0.5 + (Math.random() - 0.5) * (width * 0.5);
          y = Math.random() * (height * 0.45);
        }
      } else if (starPattern === 'spiral_galaxy') {
        // Spiral arms arrangement
        const angle = i * 0.25;
        const dist = 50 + (i / starCount) * Math.min(width, height) * 0.48;
        x = width * 0.5 + Math.cos(angle) * dist + (Math.random() - 0.5) * 60;
        y = height * 0.45 + Math.sin(angle) * (dist * 0.65) + (Math.random() - 0.5) * 60;
      }

      return {
        x,
        y,
        originX: x,
        originY: y,
        radius: Math.random() * 1.5 + 0.5,
        alpha: Math.random() * 0.7 + 0.25,
        speed: (Math.random() * 0.008 + 0.002) * speedMult,
        driftX: (Math.random() - 0.5) * 0.3 * speedMult,
        driftY: (Math.random() - 0.5) * 0.3 * speedMult,
        phase: Math.random() * Math.PI * 2,
      };
    });

    // Shooting star
    const shootingStar = {
      x: -100,
      y: -100,
      length: 120,
      speed: 12 * speedMult,
      active: false,
      angle: Math.PI / 4,
    };

    const triggerShootingStar = () => {
      shootingStar.x = Math.random() * (width * 0.7);
      shootingStar.y = Math.random() * (height * 0.4);
      shootingStar.active = true;
    };

    const shootingStarInterval = setInterval(() => {
      if (starsEnabled && !shootingStar.active && Math.random() > 0.4) {
        triggerShootingStar();
      }
    }, 7000);

    // Color mapper for ambient glow and stars
    const getThemeColors = () => {
      switch (ambientGlowColor) {
        case 'celestial_indigo':
          return {
            primary: '99, 102, 241',    // Indigo
            accent: '168, 85, 247',     // Purple
            glow: 'rgba(99, 102, 241, 0.08)'
          };
        case 'aurora_emerald':
          return {
            primary: '16, 185, 129',    // Emerald
            accent: '20, 184, 166',     // Teal
            glow: 'rgba(16, 185, 129, 0.07)'
          };
        case 'solar_citrus':
          return {
            primary: '234, 88, 12',     // Orange
            accent: '245, 158, 11',     // Amber
            glow: 'rgba(234, 88, 12, 0.08)'
          };
        case 'rose_quartz':
          return {
            primary: '244, 63, 94',     // Rose
            accent: '217, 70, 239',     // Fuchsia
            glow: 'rgba(244, 63, 94, 0.07)'
          };
        case 'obsidian_mono':
          return {
            primary: '120, 113, 108',   // Stone
            accent: '168, 162, 158',    // Warm gray
            glow: 'rgba(120, 113, 108, 0.05)'
          };
        case 'warm_amber':
        default:
          return {
            primary: '249, 115, 22',    // Orange
            accent: '245, 158, 11',     // Amber
            glow: 'rgba(249, 115, 22, 0.07)'
          };
      }
    };

    const colors = getThemeColors();

    // Render loop
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Render Ambient Glow Aura
      const intensityAlpha = glowIntensity === 'radiant' ? 0.14 : glowIntensity === 'moderate' ? 0.09 : 0.05;
      
      const ambientGrad = ctx.createRadialGradient(
        width * 0.5,
        height * 0.25,
        50,
        width * 0.5,
        height * 0.25,
        Math.max(width, height) * 0.6
      );
      ambientGrad.addColorStop(0, `rgba(${colors.primary}, ${intensityAlpha})`);
      ambientGrad.addColorStop(0.5, `rgba(${colors.accent}, ${intensityAlpha * 0.4})`);
      ambientGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      
      ctx.fillStyle = ambientGrad;
      ctx.fillRect(0, 0, width, height);

      if (!starsEnabled) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      // Constellation pattern: connect nearby stars with delicate lines
      if (starPattern === 'constellation' && stars.length > 0) {
        ctx.beginPath();
        ctx.strokeStyle = `rgba(${colors.primary}, 0.08)`;
        ctx.lineWidth = 0.75;
        for (let i = 0; i < stars.length; i++) {
          for (let j = i + 1; j < stars.length; j++) {
            const dx = stars[i].x - stars[j].x;
            const dy = stars[i].y - stars[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 105) {
              ctx.moveTo(stars[i].x, stars[i].y);
              ctx.lineTo(stars[j].x, stars[j].y);
            }
          }
        }
        ctx.stroke();
      }

      // Render gentle stars
      stars.forEach((star) => {
        star.phase += star.speed;
        
        // Gentle nebula drift
        if (starPattern === 'nebula_drift') {
          star.x += star.driftX;
          star.y += star.driftY;
          if (star.x < 0) star.x = width;
          if (star.x > width) star.x = 0;
          if (star.y < 0) star.y = height;
          if (star.y > height) star.y = 0;
        }

        const currentAlpha = Math.sin(star.phase) * 0.35 + star.alpha;
        
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        
        const alphaClamped = Math.max(0.04, Math.min(0.3, currentAlpha * 0.32));
        const color = `rgba(${colors.primary}, ${alphaClamped})`;

        ctx.fillStyle = color;
        ctx.shadowBlur = star.radius * 2;
        ctx.shadowColor = `rgba(${colors.primary}, 0.2)`;
        ctx.fill();
      });

      // Render shooting star if active
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
        grad.addColorStop(0, `rgba(${colors.primary}, 0.45)`);
        grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
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
  }, [theme, starPattern, ambientGlowColor, starsEnabled, glowIntensity, particleSpeed]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 opacity-80"
    />
  );
};
