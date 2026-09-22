import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  RotateCw, 
  Trophy, 
  Volume2, 
  VolumeX, 
  ArrowLeft, 
  ArrowRight, 
  Zap, 
  Shield, 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  Bookmark,
  Maximize2,
  ChevronRight,
  Heart
} from 'lucide-react';
import { GeneratedAiGame } from '../../types';
import { dreamyAudio } from '../../lib/audioSynthesizer';

interface RealGamePlayerProps {
  game: GeneratedAiGame;
  onGameOver: (finalScore: number) => void;
  onSaveToGallery?: () => void;
  isSavedToGallery?: boolean;
}

// -------------------------------------------------------------
// 1. COSMIC DEFENDER (Space Shooter with study questions)
// -------------------------------------------------------------
export const CosmicDefenderGame: React.FC<RealGamePlayerProps> = ({ 
  game, 
  onGameOver, 
  onSaveToGallery, 
  isSavedToGallery 
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; isCorrect: boolean } | null>(null);

  // Extract gameplay items or fallback
  const items = (game.gameplayItems && game.gameplayItems.length > 0)
    ? game.gameplayItems
    : (game.blitzQuestions && game.blitzQuestions.length > 0)
      ? game.blitzQuestions.map((bq, i) => ({
          id: `item_${i}`,
          prompt: bq.prompt,
          targetAnswer: bq.options[bq.correctIndex] || 'Correct Term',
          distractors: bq.options.filter((_, idx) => idx !== bq.correctIndex),
          explanation: bq.explanation
        }))
      : [
          {
            id: 'fallback_1',
            prompt: `Mastery Target for ${game.topic}`,
            targetAnswer: "Fundamental Theorem",
            distractors: ["Random Fluctuation", "Arbitrary Sign", "Unverified Guess"],
            explanation: "Core invariant of the system."
          }
        ];

  const currentItem = items[activeQuestionIndex % items.length];

  // Game loop references
  const stateRef = useRef({
    playerX: 200,
    playerSpeed: 7,
    movingLeft: false,
    movingRight: false,
    lasers: [] as { x: number; y: number; vy: number }[],
    asteroids: [] as { 
      id: string; 
      x: number; 
      y: number; 
      vx: number; 
      vy: number; 
      radius: number; 
      text: string; 
      isTarget: boolean; 
      color: string;
      hp: number;
    }[],
    particles: [] as { x: number; y: number; vx: number; vy: number; life: number; color: string }[],
    stars: [] as { x: number; y: number; speed: number; size: number }[],
    lastSpawn: Date.now(),
    score: 0,
    lives: 3
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Resize canvas to parent
    const width = canvas.width = 600;
    const height = canvas.height = 420;

    // Initialize starfield
    const stars: { x: number; y: number; speed: number; size: number }[] = [];
    for (let i = 0; i < 40; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        speed: 0.5 + Math.random() * 1.5,
        size: Math.random() * 2 + 1
      });
    }
    stateRef.current.stars = stars;
    stateRef.current.playerX = width / 2;

    // Spawn wave of asteroids for current question
    const spawnWave = () => {
      const allAnswers = [
        { text: currentItem.targetAnswer, isTarget: true },
        ...currentItem.distractors.slice(0, 3).map(d => ({ text: d, isTarget: false }))
      ].sort(() => Math.random() - 0.5);

      const spacing = width / (allAnswers.length + 1);
      stateRef.current.asteroids = allAnswers.map((ans, idx) => ({
        id: `ast_${idx}_${Date.now()}`,
        x: spacing * (idx + 1) + (Math.random() * 20 - 10),
        y: -40 - Math.random() * 50,
        vx: (Math.random() - 0.5) * 0.4,
        vy: 0.7 + Math.random() * 0.5,
        radius: 32,
        text: ans.text,
        isTarget: ans.isTarget,
        color: ans.isTarget ? '#f97316' : '#64748b',
        hp: 1
      }));
    };

    spawnWave();

    let animationFrameId: number;

    const gameLoop = () => {
      // Clear
      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, 0, width, height);

      // Draw stars
      ctx.fillStyle = '#ffffff';
      stateRef.current.stars.forEach(star => {
        star.y += star.speed;
        if (star.y > height) {
          star.y = 0;
          star.x = Math.random() * width;
        }
        ctx.globalAlpha = 0.6;
        ctx.fillRect(star.x, star.y, star.size, star.size);
      });
      ctx.globalAlpha = 1.0;

      // Update player
      if (stateRef.current.movingLeft && stateRef.current.playerX > 30) {
        stateRef.current.playerX -= stateRef.current.playerSpeed;
      }
      if (stateRef.current.movingRight && stateRef.current.playerX < width - 30) {
        stateRef.current.playerX += stateRef.current.playerSpeed;
      }

      const pX = stateRef.current.playerX;
      const pY = height - 40;

      // Draw spaceship (sleek geometric aesthetic)
      ctx.save();
      ctx.translate(pX, pY);
      // Engine thrust flame
      ctx.fillStyle = '#fb923c';
      ctx.beginPath();
      ctx.moveTo(-6, 12);
      ctx.lineTo(0, 20 + Math.random() * 8);
      ctx.lineTo(6, 12);
      ctx.fill();

      // Ship body
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.moveTo(0, -18);
      ctx.lineTo(14, 12);
      ctx.lineTo(0, 6);
      ctx.lineTo(-14, 12);
      ctx.closePath();
      ctx.fill();

      // Cockpit orange glow
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.arc(0, -2, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Update & Draw Lasers
      ctx.fillStyle = '#38bdf8';
      stateRef.current.lasers = stateRef.current.lasers.filter(laser => {
        laser.y += laser.vy;
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 8;
        ctx.fillRect(laser.x - 2, laser.y - 8, 4, 14);
        ctx.shadowBlur = 0;
        return laser.y > -20;
      });

      // Update & Draw Asteroids
      stateRef.current.asteroids.forEach(ast => {
        ast.x += ast.vx;
        ast.y += ast.vy;

        // Collision with lasers
        stateRef.current.lasers.forEach((laser, lIdx) => {
          const dist = Math.hypot(laser.x - ast.x, laser.y - ast.y);
          if (dist < ast.radius) {
            // Hit!
            stateRef.current.lasers.splice(lIdx, 1);
            // Spawn explosion particles
            for (let p = 0; p < 12; p++) {
              stateRef.current.particles.push({
                x: ast.x,
                y: ast.y,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                life: 20,
                color: ast.isTarget ? '#f97316' : '#94a3b8'
              });
            }

            if (ast.isTarget) {
              // Correct target destroyed!
              stateRef.current.score += 200;
              setScore(stateRef.current.score);
              setFeedback({ text: `Target Acquired! +200 PTS: ${ast.text}`, isCorrect: true });
              try { dreamyAudio.playChime(587.33); } catch (_) {}
              
              // Clear asteroids and proceed to next question
              stateRef.current.asteroids = [];
              setTimeout(() => {
                setActiveQuestionIndex(prev => {
                  const next = prev + 1;
                  if (next >= items.length) {
                    setIsFinished(true);
                    onGameOver(stateRef.current.score);
                  }
                  return next;
                });
                setFeedback(null);
              }, 600);
            } else {
              // Wrong distractor shot!
              stateRef.current.lives -= 1;
              setLives(stateRef.current.lives);
              setFeedback({ text: `Distractor Blasted! -1 Life: ${ast.text}`, isCorrect: false });
              try { dreamyAudio.playChime(220); } catch (_) {}
              if (stateRef.current.lives <= 0) {
                setIsFinished(true);
                onGameOver(stateRef.current.score);
              }
            }
          }
        });

        // Draw Asteroid / Energy Bubble
        ctx.save();
        ctx.beginPath();
        ctx.arc(ast.x, ast.y, ast.radius, 0, Math.PI * 2);
        ctx.fillStyle = ast.isTarget ? 'rgba(249, 115, 22, 0.25)' : 'rgba(30, 41, 59, 0.7)';
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = ast.isTarget ? '#fb923c' : '#475569';
        ctx.stroke();

        // Label on asteroid
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const displayLabel = ast.text.length > 14 ? ast.text.substring(0, 12) + '...' : ast.text;
        ctx.fillText(displayLabel, ast.x, ast.y);
        ctx.restore();
      });

      // Remove off-screen asteroids & check if target slipped away
      const offscreen = stateRef.current.asteroids.filter(a => a.y > height + 40);
      if (offscreen.some(a => a.isTarget)) {
        // Target escaped without player shooting it
        stateRef.current.lives -= 1;
        setLives(stateRef.current.lives);
        setFeedback({ text: `Target escaped! Answer: ${currentItem.targetAnswer}`, isCorrect: false });
        stateRef.current.asteroids = [];
        setTimeout(() => {
          setActiveQuestionIndex(prev => prev + 1);
          setFeedback(null);
        }, 800);
      }

      // Draw Particles
      stateRef.current.particles = stateRef.current.particles.filter(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 1;
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.life / 20);
        ctx.fillRect(p.x, p.y, 3, 3);
        ctx.globalAlpha = 1.0;
        return p.life > 0;
      });

      if (!isFinished && stateRef.current.lives > 0) {
        animationFrameId = requestAnimationFrame(gameLoop);
      }
    };

    animationFrameId = requestAnimationFrame(gameLoop);

    // Keyboard listener
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        stateRef.current.movingLeft = true;
      }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        stateRef.current.movingRight = true;
      }
      if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        // Fire laser
        stateRef.current.lasers.push({
          x: stateRef.current.playerX,
          y: height - 44,
          vy: -9
        });
        try { dreamyAudio.playChime(880); } catch (_) {}
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        stateRef.current.movingLeft = false;
      }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        stateRef.current.movingRight = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [activeQuestionIndex, isFinished]);

  const fireLaser = () => {
    stateRef.current.lasers.push({
      x: stateRef.current.playerX,
      y: 420 - 44,
      vy: -9
    });
    try { dreamyAudio.playChime(880); } catch (_) {}
  };

  const restartGame = () => {
    stateRef.current.score = 0;
    stateRef.current.lives = 3;
    setScore(0);
    setLives(3);
    setActiveQuestionIndex(0);
    setIsFinished(false);
    setFeedback(null);
  };

  return (
    <div className="flex flex-col items-center w-full max-w-2xl mx-auto space-y-4">
      {/* Top HUD */}
      <div className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-stone-900 border border-white/10 text-white shadow-xl">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center font-black">
            🚀
          </div>
          <div>
            <div className="text-xs font-bold text-stone-200">{game.title}</div>
            <div className="text-[10px] text-stone-400">Cosmic Defender Arena</div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 text-red-400 font-mono text-sm">
            {Array.from({ length: 3 }).map((_, i) => (
              <Heart 
                key={i} 
                className={`w-4 h-4 ${i < lives ? 'fill-red-500 text-red-500' : 'text-stone-700 fill-transparent'}`} 
              />
            ))}
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/15 border border-orange-500/30 text-orange-400 font-mono text-xs font-bold">
            <Trophy className="w-3.5 h-3.5" />
            <span>{score} PTS</span>
          </div>

          {onSaveToGallery && (
            <button
              onClick={onSaveToGallery}
              className={`p-1.5 rounded-xl border text-xs flex items-center gap-1 cursor-pointer transition-all ${
                isSavedToGallery
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-white/10 hover:bg-white/20 text-stone-300 border-white/10'
              }`}
              title="Save game to TechTut Gallery"
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isSavedToGallery ? 'Saved' : 'Save'}</span>
            </button>
          )}
        </div>
      </div>

      {/* MISSION TARGET BANNER */}
      <div className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-orange-950/80 via-stone-900 to-orange-950/80 border border-orange-500/30 text-center shadow-lg">
        <div className="text-[10px] uppercase font-bold text-orange-400 tracking-wider">
          Mission Target #{activeQuestionIndex + 1} / {items.length}
        </div>
        <div className="text-sm sm:text-base font-extrabold text-white mt-0.5">
          {currentItem.prompt}
        </div>
        <div className="text-[11px] text-stone-400 mt-1">
          Shoot the asteroid matching: <span className="text-orange-300 font-bold underline decoration-orange-500">{currentItem.targetAnswer}</span>!
        </div>
      </div>

      {/* Canvas Viewport */}
      <div className="relative w-full rounded-2xl overflow-hidden border border-stone-800 bg-black shadow-2xl flex justify-center">
        <canvas 
          ref={canvasRef} 
          className="w-full h-auto aspect-[600/420] block max-h-[420px]"
        />

        {/* Floating Feedback Alert */}
        {feedback && (
          <div className={`absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-xl text-xs font-bold shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-150 border ${
            feedback.isCorrect ? 'bg-emerald-950/90 text-emerald-200 border-emerald-500/40' : 'bg-red-950/90 text-red-200 border-red-500/40'
          }`}>
            {feedback.text}
          </div>
        )}

        {/* Game Over Screen */}
        {isFinished && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center space-y-4 animate-in fade-in">
            <div className="w-14 h-14 rounded-2xl bg-orange-500/20 border border-orange-500/40 text-orange-400 flex items-center justify-center">
              <Trophy className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-white">Mission Complete!</h3>
              <p className="text-sm text-stone-300 mt-1">
                Final Score: <span className="text-orange-400 font-mono font-bold text-lg">{score} PTS</span>
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={restartGame}
                className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCw className="w-4 h-4" />
                <span>Play Again</span>
              </button>
              {onSaveToGallery && (
                <button
                  onClick={onSaveToGallery}
                  className="px-5 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 border border-white/15 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Bookmark className="w-4 h-4 text-orange-400" />
                  <span>{isSavedToGallery ? 'Saved in Gallery' : 'Save to Gallery'}</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* On-Screen Mobile Controls */}
      <div className="w-full flex items-center justify-between gap-3 p-3 rounded-2xl bg-stone-900 border border-white/10">
        <div className="flex items-center gap-2">
          <button
            onPointerDown={() => { stateRef.current.movingLeft = true; }}
            onPointerUp={() => { stateRef.current.movingLeft = false; }}
            onPointerLeave={() => { stateRef.current.movingLeft = false; }}
            className="w-14 h-12 rounded-xl bg-stone-800 active:bg-stone-700 text-white font-bold flex items-center justify-center border border-white/10 shadow-md touch-manipulation cursor-pointer select-none"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <button
            onPointerDown={() => { stateRef.current.movingRight = true; }}
            onPointerUp={() => { stateRef.current.movingRight = false; }}
            onPointerLeave={() => { stateRef.current.movingRight = false; }}
            className="w-14 h-12 rounded-xl bg-stone-800 active:bg-stone-700 text-white font-bold flex items-center justify-center border border-white/10 shadow-md touch-manipulation cursor-pointer select-none"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        <button
          onClick={fireLaser}
          className="flex-1 py-3 px-6 rounded-xl bg-gradient-to-r from-orange-600 to-amber-500 active:scale-98 text-white font-extrabold text-sm shadow-xl shadow-orange-500/20 flex items-center justify-center gap-2 border border-orange-400/30 touch-manipulation cursor-pointer select-none"
        >
          <Zap className="w-4 h-4 fill-white" />
          <span>FIRE BLASTER (Space)</span>
        </button>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// 2. SCHOLAR RUNNER (2D Platformer Jump & Knowledge Gates)
// -------------------------------------------------------------
export const ScholarRunnerGame: React.FC<RealGamePlayerProps> = ({
  game,
  onGameOver,
  onSaveToGallery,
  isSavedToGallery
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [score, setScore] = useState(0);
  const [checkpointQuestion, setCheckpointQuestion] = useState<{
    prompt: string;
    targetAnswer: string;
    options: string[];
    explanation?: string;
  } | null>(null);
  const [isFinished, setIsFinished] = useState(false);

  const items = game.gameplayItems || [
    {
      id: 'r_1',
      prompt: `Key Concept: ${game.topic}`,
      targetAnswer: "Conserved Quantity",
      distractors: ["Frictionless Assumption", "Zero Inertia"],
      explanation: "Energy & momentum balance."
    }
  ];

  const stateRef = useRef({
    scholarY: 280,
    vy: 0,
    isGrounded: true,
    score: 0,
    speed: 3.8,
    distance: 0,
    obstacles: [] as { x: number; width: number; height: number }[],
    starOrbs: [] as { x: number; y: number; collected: boolean }[],
    checkpointDist: 500,
    activeQuestionIdx: 0,
    isPausedForQuestion: false
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 600;
    canvas.height = 360;

    let animationFrameId: number;

    const gameLoop = () => {
      if (stateRef.current.isPausedForQuestion) {
        animationFrameId = requestAnimationFrame(gameLoop);
        return;
      }

      ctx.fillStyle = '#1c1917';
      ctx.fillRect(0, 0, 600, 360);

      // Draw scrolling floor
      ctx.fillStyle = '#44403c';
      ctx.fillRect(0, 300, 600, 60);
      ctx.fillStyle = '#f97316';
      ctx.fillRect(0, 300, 600, 4);

      // Distance & score
      stateRef.current.distance += stateRef.current.speed;
      stateRef.current.score += 1;
      setScore(Math.floor(stateRef.current.score / 5));

      // Physics
      stateRef.current.scholarY += stateRef.current.vy;
      stateRef.current.vy += 0.65; // gravity

      if (stateRef.current.scholarY >= 260) {
        stateRef.current.scholarY = 260;
        stateRef.current.vy = 0;
        stateRef.current.isGrounded = true;
      }

      // Draw Scholar Character (runner avatar)
      const sX = 80;
      const sY = stateRef.current.scholarY;
      ctx.fillStyle = '#f97316';
      // Body
      ctx.beginPath();
      ctx.arc(sX, sY - 12, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(sX - 6, sY - 2, 12, 22);

      // Running legs animation
      const legPhase = Math.sin(Date.now() / 80) * 8;
      ctx.strokeStyle = '#f8fafc';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(sX - 3, sY + 20);
      ctx.lineTo(sX - 3 - legPhase, sY + 34);
      ctx.moveTo(sX + 3, sY + 20);
      ctx.lineTo(sX + 3 + legPhase, sY + 34);
      ctx.stroke();

      // Spawn obstacles periodically
      if (Math.random() < 0.015 && stateRef.current.obstacles.length < 3) {
        stateRef.current.obstacles.push({
          x: 620,
          width: 22,
          height: 32 + Math.random() * 20
        });
      }

      // Update & Draw Obstacles (Red Error Spikes)
      ctx.fillStyle = '#ef4444';
      stateRef.current.obstacles = stateRef.current.obstacles.filter(obs => {
        obs.x -= stateRef.current.speed;
        ctx.fillRect(obs.x, 300 - obs.height, obs.width, obs.height);

        // Check collision
        if (
          sX + 10 > obs.x && 
          sX - 10 < obs.x + obs.width && 
          sY + 30 > 300 - obs.height
        ) {
          // Hit hazard!
          try { dreamyAudio.playChime(220); } catch (_) {}
          setIsFinished(true);
          onGameOver(Math.floor(stateRef.current.score / 5));
        }
        return obs.x > -40;
      });

      // Knowledge Checkpoint Gate
      if (stateRef.current.distance >= stateRef.current.checkpointDist) {
        stateRef.current.isPausedForQuestion = true;
        const qIdx = stateRef.current.activeQuestionIdx % items.length;
        const q = items[qIdx];
        const allOpts = [q.targetAnswer, ...q.distractors].sort(() => Math.random() - 0.5);
        setCheckpointQuestion({
          prompt: q.prompt,
          targetAnswer: q.targetAnswer,
          options: allOpts,
          explanation: q.explanation
        });
      }

      if (!isFinished) {
        animationFrameId = requestAnimationFrame(gameLoop);
      }
    };

    animationFrameId = requestAnimationFrame(gameLoop);

    const handleJumpKey = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w') {
        if (stateRef.current.isGrounded) {
          stateRef.current.vy = -12;
          stateRef.current.isGrounded = false;
          try { dreamyAudio.playChime(523.25); } catch (_) {}
        }
      }
    };

    window.addEventListener('keydown', handleJumpKey);
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('keydown', handleJumpKey);
    };
  }, [isFinished]);

  const jump = () => {
    if (stateRef.current.isGrounded) {
      stateRef.current.vy = -12;
      stateRef.current.isGrounded = false;
      try { dreamyAudio.playChime(523.25); } catch (_) {}
    }
  };

  const handleCheckpointAnswer = (selected: string) => {
    if (!checkpointQuestion) return;
    if (selected === checkpointQuestion.targetAnswer) {
      // Correct! Boost speed and award points
      stateRef.current.score += 500;
      stateRef.current.checkpointDist += 600;
      stateRef.current.activeQuestionIdx += 1;
      stateRef.current.isPausedForQuestion = false;
      setCheckpointQuestion(null);
      try { dreamyAudio.playChime(659.25); } catch (_) {}
    } else {
      // Wrong answer on checkpoint: stumble penalty
      stateRef.current.score = Math.max(0, stateRef.current.score - 200);
      stateRef.current.checkpointDist += 600;
      stateRef.current.activeQuestionIdx += 1;
      stateRef.current.isPausedForQuestion = false;
      setCheckpointQuestion(null);
      try { dreamyAudio.playChime(220); } catch (_) {}
    }
  };

  return (
    <div className="flex flex-col items-center w-full max-w-2xl mx-auto space-y-4">
      {/* Top HUD */}
      <div className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-stone-900 border border-white/10 text-white shadow-xl">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-black">
            🏃
          </div>
          <div>
            <div className="text-xs font-bold text-stone-200">{game.title}</div>
            <div className="text-[10px] text-stone-400">Scholar Platform Runner</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 font-mono text-xs font-bold">
            <Trophy className="w-3.5 h-3.5" />
            <span>{score} METERS</span>
          </div>

          {onSaveToGallery && (
            <button
              onClick={onSaveToGallery}
              className="p-1.5 rounded-xl border border-white/10 bg-white/10 hover:bg-white/20 text-xs flex items-center gap-1 cursor-pointer transition-all"
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>{isSavedToGallery ? 'Saved' : 'Save'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Canvas Viewport */}
      <div className="relative w-full rounded-2xl overflow-hidden border border-stone-800 bg-black shadow-2xl">
        <canvas ref={canvasRef} className="w-full h-auto aspect-[600/360] block" />

        {/* Checkpoint Gate Question Modal */}
        {checkpointQuestion && (
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center space-y-4 animate-in fade-in">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/20 border border-orange-500/40 text-orange-300 text-xs font-bold">
              <Zap className="w-3.5 h-3.5 text-orange-400" />
              <span>Knowledge Checkpoint Gate</span>
            </div>
            <h4 className="text-base sm:text-lg font-extrabold text-white max-w-md">
              {checkpointQuestion.prompt}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-md">
              {checkpointQuestion.options.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleCheckpointAnswer(opt)}
                  className="p-3 rounded-xl bg-stone-800 hover:bg-orange-600 hover:text-white border border-white/10 text-xs font-semibold text-stone-200 transition-all text-left flex items-center justify-between cursor-pointer"
                >
                  <span>{opt}</span>
                  <ChevronRight className="w-4 h-4 opacity-60" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Game Over Modal */}
        {isFinished && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center space-y-4 animate-in fade-in">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center">
              <Trophy className="w-7 h-7" />
            </div>
            <h3 className="text-2xl font-black text-white">Sprint Finished!</h3>
            <p className="text-sm text-stone-300">
              Total Score: <span className="text-amber-400 font-mono font-bold text-lg">{score} PTS</span>
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  stateRef.current.score = 0;
                  stateRef.current.distance = 0;
                  stateRef.current.obstacles = [];
                  setScore(0);
                  setIsFinished(false);
                }}
                className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCw className="w-4 h-4" />
                <span>Run Again</span>
              </button>
              {onSaveToGallery && (
                <button
                  onClick={onSaveToGallery}
                  className="px-5 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 border border-white/15 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Bookmark className="w-4 h-4 text-orange-400" />
                  <span>{isSavedToGallery ? 'Saved in Gallery' : 'Save to Gallery'}</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Jump Controller */}
      <div className="w-full flex items-center justify-center p-3 rounded-2xl bg-stone-900 border border-white/10">
        <button
          onClick={jump}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-500 active:scale-98 text-white font-extrabold text-sm shadow-xl shadow-orange-500/20 flex items-center justify-center gap-2 border border-orange-400/30 touch-manipulation cursor-pointer select-none"
        >
          <Zap className="w-4 h-4 fill-white" />
          <span>TAP TO JUMP OVER HAZARDS (Space / Up)</span>
        </button>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// 3. GRAVITY CATCHER (Falling Concept Stars & Bucket)
// -------------------------------------------------------------
export const GravityCatcherGame: React.FC<RealGamePlayerProps> = ({
  game,
  onGameOver,
  onSaveToGallery,
  isSavedToGallery
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [score, setScore] = useState(0);
  const [activeItemIndex, setActiveItemIndex] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const items = game.gameplayItems || [
    {
      id: 'g_1',
      prompt: `Catch terms corresponding to: ${game.topic}`,
      targetAnswer: "Valid Principle",
      distractors: ["Error", "Invalid", "Noise"]
    }
  ];

  const currentItem = items[activeItemIndex % items.length];

  const stateRef = useRef({
    basketX: 300,
    basketWidth: 90,
    score: 0,
    falling: [] as { x: number; y: number; vy: number; text: string; isTarget: boolean }[],
    movingLeft: false,
    movingRight: false
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 600;
    canvas.height = 380;

    let animationFrameId: number;

    const gameLoop = () => {
      ctx.fillStyle = '#0c0a09';
      ctx.fillRect(0, 0, 600, 380);

      // Move basket
      if (stateRef.current.movingLeft && stateRef.current.basketX > 50) {
        stateRef.current.basketX -= 6;
      }
      if (stateRef.current.movingRight && stateRef.current.basketX < 550) {
        stateRef.current.basketX += 6;
      }

      // Draw basket
      const bX = stateRef.current.basketX;
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.roundRect(bX - 45, 340, 90, 24, [8, 8, 4, 4]);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('CATCHER', bX, 356);

      // Periodically spawn falling concept items
      if (Math.random() < 0.03 && stateRef.current.falling.length < 5) {
        const isTarget = Math.random() < 0.45;
        const text = isTarget 
          ? currentItem.targetAnswer 
          : currentItem.distractors[Math.floor(Math.random() * currentItem.distractors.length)] || 'Distractor';
        stateRef.current.falling.push({
          x: 50 + Math.random() * 500,
          y: -20,
          vy: 1.6 + Math.random() * 1.2,
          text,
          isTarget
        });
      }

      // Update & Draw Falling Items
      stateRef.current.falling = stateRef.current.falling.filter(item => {
        item.y += item.vy;

        // Draw star pill
        ctx.fillStyle = item.isTarget ? '#ea580c' : '#334155';
        ctx.beginPath();
        ctx.roundRect(item.x - 38, item.y - 14, 76, 28, 14);
        ctx.fill();
        ctx.strokeStyle = item.isTarget ? '#fb923c' : '#475569';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(item.text.length > 10 ? item.text.substring(0, 9) + '..' : item.text, item.x, item.y + 4);

        // Catch check
        if (item.y > 330 && item.y < 360 && Math.abs(item.x - bX) < 48) {
          if (item.isTarget) {
            stateRef.current.score += 100;
            setScore(stateRef.current.score);
            try { dreamyAudio.playChime(659.25); } catch (_) {}
            setActiveItemIndex(prev => prev + 1);
          } else {
            stateRef.current.score = Math.max(0, stateRef.current.score - 50);
            setScore(stateRef.current.score);
            try { dreamyAudio.playChime(220); } catch (_) {}
          }
          return false;
        }

        return item.y < 400;
      });

      if (!isFinished) {
        animationFrameId = requestAnimationFrame(gameLoop);
      }
    };

    animationFrameId = requestAnimationFrame(gameLoop);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') stateRef.current.movingLeft = true;
      if (e.key === 'ArrowRight' || e.key === 'd') stateRef.current.movingRight = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') stateRef.current.movingLeft = false;
      if (e.key === 'ArrowRight' || e.key === 'd') stateRef.current.movingRight = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [activeItemIndex, isFinished]);

  return (
    <div className="flex flex-col items-center w-full max-w-2xl mx-auto space-y-4">
      <div className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-stone-900 border border-white/10 text-white shadow-xl">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center font-black">
            🪂
          </div>
          <div>
            <div className="text-xs font-bold text-stone-200">{game.title}</div>
            <div className="text-[10px] text-stone-400">Gravity Concept Catcher</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/15 border border-orange-500/30 text-orange-400 font-mono text-xs font-bold">
            <Trophy className="w-3.5 h-3.5" />
            <span>{score} PTS</span>
          </div>

          {onSaveToGallery && (
            <button
              onClick={onSaveToGallery}
              className="p-1.5 rounded-xl border border-white/10 bg-white/10 hover:bg-white/20 text-xs flex items-center gap-1 cursor-pointer transition-all"
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>{isSavedToGallery ? 'Saved' : 'Save'}</span>
            </button>
          )}
        </div>
      </div>

      <div className="w-full p-3 rounded-xl bg-orange-950/40 border border-orange-500/20 text-center">
        <div className="text-xs text-stone-300">
          Target to catch: <span className="text-orange-400 font-bold">{currentItem.targetAnswer}</span> (avoid distractors!)
        </div>
      </div>

      <div className="relative w-full rounded-2xl overflow-hidden border border-stone-800 bg-black shadow-2xl">
        <canvas ref={canvasRef} className="w-full h-auto aspect-[600/380] block" />
      </div>

      {/* Touch Controls */}
      <div className="w-full flex items-center justify-between gap-4 p-3 rounded-2xl bg-stone-900 border border-white/10">
        <button
          onPointerDown={() => { stateRef.current.movingLeft = true; }}
          onPointerUp={() => { stateRef.current.movingLeft = false; }}
          className="flex-1 py-3 rounded-xl bg-stone-800 active:bg-stone-700 text-white font-bold text-sm border border-white/10 flex items-center justify-center gap-2 cursor-pointer select-none"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Move Left</span>
        </button>
        <button
          onPointerDown={() => { stateRef.current.movingRight = true; }}
          onPointerUp={() => { stateRef.current.movingRight = false; }}
          className="flex-1 py-3 rounded-xl bg-stone-800 active:bg-stone-700 text-white font-bold text-sm border border-white/10 flex items-center justify-center gap-2 cursor-pointer select-none"
        >
          <span>Move Right</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// 4. HTML SANDBOX PLAYER (For Custom Generated AI HTML5 Games)
// -------------------------------------------------------------
export const HtmlSandboxPlayer: React.FC<RealGamePlayerProps> = ({
  game,
  onGameOver,
  onSaveToGallery,
  isSavedToGallery
}) => {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  // Generate self-contained HTML content if not explicitly provided
  const rawHtml = game.htmlContent || `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #09090b;
      color: #f8fafc;
      font-family: system-ui, -apple-system, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      overflow: hidden;
      user-select: none;
    }
    #game-container {
      width: 100%;
      max-width: 580px;
      padding: 16px;
      text-align: center;
    }
    .card {
      background: #18181b;
      border: 1px solid #27272a;
      border-radius: 16px;
      padding: 20px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.5);
    }
    .badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 999px;
      background: rgba(249, 115, 22, 0.15);
      border: 1px solid rgba(249, 115, 22, 0.3);
      color: #fb923c;
      font-size: 11px;
      font-weight: 700;
      margin-bottom: 12px;
    }
    h2 { font-size: 20px; font-weight: 800; margin-bottom: 8px; color: #ffffff; }
    p { font-size: 13px; color: #a1a1aa; margin-bottom: 20px; line-height: 1.5; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 14px; }
    button {
      background: #27272a;
      color: #ffffff;
      border: 1px solid #3f3f46;
      border-radius: 12px;
      padding: 12px 14px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    button:hover { background: #f97316; border-color: #ea580c; }
    #score-bar {
      margin-top: 16px;
      font-size: 12px;
      font-weight: 700;
      color: #fb923c;
    }
  </style>
</head>
<body>
  <div id="game-container">
    <div class="card">
      <span class="badge">🕹️ TechTut Real-Time HTML5 Arena</span>
      <h2>${game.title}</h2>
      <p id="prompt-box">${game.description || `Master ${game.topic} through rapid interactive simulation!`}</p>
      
      <div class="grid" id="options-box">
        ${(game.gameplayItems?.[0]?.distractors || ["Derivation Step A", "Counter Example B", "Invariance Rule C", "Boundary Limit D"])
          .map((opt, i) => `<button onclick="handlePick('${opt}')">${opt}</button>`)
          .join('')}
      </div>

      <div id="score-bar">Score: <span id="score">0</span> PTS</div>
    </div>
  </div>

  <script>
    let score = 0;
    function handlePick(opt) {
      score += 150;
      document.getElementById('score').innerText = score;
      document.getElementById('prompt-box').innerText = "Excellent reaction! Target " + opt + " assimilated into memory.";
    }
  </script>
</body>
</html>`;

  return (
    <div className="flex flex-col items-center w-full max-w-2xl mx-auto space-y-4">
      <div className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-stone-900 border border-white/10 text-white shadow-xl">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-black">
            🕹️
          </div>
          <div>
            <div className="text-xs font-bold text-stone-200">{game.title}</div>
            <div className="text-[10px] text-stone-400">Custom HTML5 Interactive Game</div>
          </div>
        </div>

        {onSaveToGallery && (
          <button
            onClick={onSaveToGallery}
            className="px-3 py-1.5 rounded-xl border border-white/10 bg-white/10 hover:bg-white/20 text-xs flex items-center gap-1.5 cursor-pointer transition-all text-stone-200"
          >
            <Bookmark className="w-3.5 h-3.5 text-orange-400" />
            <span>{isSavedToGallery ? 'Saved in Gallery' : 'Save to Gallery'}</span>
          </button>
        )}
      </div>

      <div className="w-full rounded-2xl overflow-hidden border border-stone-800 bg-black shadow-2xl h-[420px]">
        <iframe
          ref={iframeRef}
          srcDoc={rawHtml}
          title={game.title}
          sandbox="allow-scripts"
          className="w-full h-full border-none"
        />
      </div>
    </div>
  );
};
