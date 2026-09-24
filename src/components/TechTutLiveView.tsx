import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Play, 
  Pause, 
  Square, 
  Sparkles, 
  RotateCw, 
  Send, 
  Headphones, 
  GraduationCap, 
  Sliders, 
  ChevronRight, 
  MessageSquare, 
  Zap, 
  Flame, 
  Award,
  BookOpen,
  ArrowRight
} from 'lucide-react';
import { EducationLevel, StudySolution } from '../types';

interface TechTutLiveViewProps {
  educationLevel: EducationLevel;
  activeStudySolution?: StudySolution | null;
  onAwardReward?: (xp: number, stardust: number, badgeId?: string) => void;
  onOpenStudyMode?: (query?: string, subject?: string) => void;
}

type TutorPersona = 'vance';

interface LiveTurn {
  id: string;
  sender: 'student' | 'techtut';
  text: string;
  spokenText?: string;
  visualSummary?: string;
  keyFormula?: string;
  keyTakeaways?: string[];
  followUpPrompt?: string;
  timestamp: number;
}

const PRESET_PROMPTS = [
  "Explain the derivation of the Chain Rule intuitively",
  "How does ATP Synthase act like a miniature molecular motor?",
  "What is the difference between SN1 and SN2 reaction mechanisms?",
  "Why is angular momentum conserved when net external torque is zero?",
  "Explain Big-O space vs time complexity in merge sort"
];

export const TechTutLiveView: React.FC<TechTutLiveViewProps> = ({
  educationLevel,
  activeStudySolution,
  onAwardReward,
  onOpenStudyMode,
}) => {
  const [persona, setPersona] = useState<TutorPersona>('vance');
  const [speechRate, setSpeechRate] = useState<number>(1.0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  
  // Voice & Interaction states
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  
  // Input query
  const [queryInput, setQueryInput] = useState<string>('');
  const [conversation, setConversation] = useState<LiveTurn[]>([
    {
      id: 'welcome_turn',
      sender: 'techtut',
      text: 'Greetings, Scholar. I am Professor Vance, your lead academic mentor and primary voice tutor on TechTut Live. Tap the microphone or enter any concept, and I will illuminate the derivation aloud step by step.',
      spokenText: 'Greetings, Scholar. I am Professor Vance, your lead academic mentor and primary voice tutor on TechTut Live. Tap the microphone or select any topic, and I will illuminate the derivation aloud in real time step by step.',
      visualSummary: 'Professor Vance is active and listening. Ask any math, physics, biology, code, or exam problem.',
      keyTakeaways: [
        'Hands-free voice recognition with real-time vocal feedback',
        'Professor Vance is your primary voice tutor with step-by-step rigor',
        'Ask follow-up questions or request derivations aloud anytime'
      ],
      timestamp: Date.now()
    }
  ]);

  const [currentSpokenTurn, setCurrentSpokenTurn] = useState<LiveTurn | null>(conversation[0]);

  // Audio wave canvas ref
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Initialize Speech Synthesis
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }
    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
          setIsListening(true);
        };

        recognition.onresult = (event: any) => {
          const transcript = event.results?.[0]?.[0]?.transcript;
          if (transcript) {
            setQueryInput(transcript);
            handleSendQuery(transcript);
          }
          setIsListening(false);
        };

        recognition.onerror = (err: any) => {
          console.warn('Speech recognition error:', err);
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, [persona, educationLevel]);

  // If there is an active study solution passed in, offer quick start
  useEffect(() => {
    if (activeStudySolution && conversation.length === 1) {
      const topic = activeStudySolution.topic || activeStudySolution.question;
      handleSendQuery(`Explain the core intuition of: ${topic}`);
    }
  }, [activeStudySolution]);

  // Sound Wave Animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let phase = 0;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      const isLiveActive = isSpeaking || isListening || isThinking;
      const baseAmplitude = isSpeaking ? 32 : isListening ? 22 : isThinking ? 14 : 6;
      const waveCount = 3;

      for (let w = 0; w < waveCount; w++) {
        ctx.beginPath();
        ctx.lineWidth = w === 0 ? 3 : 1.5;
        
        if (isSpeaking) {
          ctx.strokeStyle = w === 0 ? 'rgba(249, 115, 22, 0.9)' : 'rgba(251, 146, 60, 0.4)';
        } else if (isListening) {
          ctx.strokeStyle = w === 0 ? 'rgba(234, 88, 12, 0.9)' : 'rgba(249, 115, 22, 0.4)';
        } else if (isThinking) {
          ctx.strokeStyle = w === 0 ? 'rgba(217, 119, 6, 0.9)' : 'rgba(245, 158, 11, 0.4)';
        } else {
          ctx.strokeStyle = w === 0 ? 'rgba(214, 211, 209, 0.7)' : 'rgba(231, 229, 228, 0.4)';
        }

        for (let x = 0; x < width; x++) {
          const scaling = Math.sin((x / width) * Math.PI);
          const freq = isSpeaking ? 0.02 : 0.015;
          const speed = isSpeaking ? 0.08 : isListening ? 0.05 : 0.02;
          const y = height / 2 + Math.sin(x * freq + phase * (w + 1) * speed) * (baseAmplitude * scaling);
          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      }

      phase += 1;
      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isSpeaking, isListening, isThinking]);

  // Speak aloud using SpeechSynthesis
  const speakText = (text: string) => {
    if (!synthRef.current || isMuted) return;

    synthRef.current.cancel();

    // Clean text of any accidental symbols or markdown
    const cleanSpeech = text
      .replace(/[*_#`~]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanSpeech) return;

    const utterance = new SpeechSynthesisUtterance(cleanSpeech);
    utterance.rate = 1.02;
    utterance.pitch = 1.05;
    
    // Professor Vance normal voice
    const voices = synthRef.current.getVoices();
    if (voices && voices.length > 0) {
      const vanceVoice = voices.find(v => 
        v.name.includes('Daniel') || 
        v.name.includes('David') || 
        v.name.includes('George') || 
        v.name.includes('Oliver') ||
        v.lang === 'en-GB' ||
        v.name.includes('Google US English') ||
        (v.lang.startsWith('en') && v.default)
      ) || voices.find(v => v.lang.startsWith('en')) || voices[0];
      if (vanceVoice) utterance.voice = vanceVoice;
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
      setIsPaused(false);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
    };

    utterance.onerror = (err) => {
      console.warn('Speech error:', err);
      setIsSpeaking(false);
      setIsPaused(false);
    };

    utteranceRef.current = utterance;
    synthRef.current.speak(utterance);
  };

  const handleToggleVoice = () => {
    if (isSpeaking) {
      if (synthRef.current) {
        if (isPaused) {
          synthRef.current.resume();
          setIsPaused(false);
        } else {
          synthRef.current.pause();
          setIsPaused(true);
        }
      }
    } else if (currentSpokenTurn?.spokenText) {
      speakText(currentSpokenTurn.spokenText);
    }
  };

  const handleStopSpeaking = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
      setIsPaused(false);
    }
  };

  const handleToggleMic = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      handleStopSpeaking();
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (err) {
        console.warn('Mic start failed:', err);
        setIsListening(false);
      }
    }
  };

  const handleSendQuery = async (queryToSend?: string) => {
    const query = (queryToSend || queryInput).trim();
    if (!query) return;

    handleStopSpeaking();
    setIsThinking(true);

    const userTurn: LiveTurn = {
      id: `turn_user_${Date.now()}`,
      sender: 'student',
      text: query,
      timestamp: Date.now()
    };

    setConversation(prev => [...prev, userTurn]);
    setQueryInput('');

    try {
      const res = await fetch('/api/live/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          topic: activeStudySolution?.topic,
          level: educationLevel,
          persona,
          contextData: activeStudySolution ? {
            steps: activeStudySolution.steps?.slice(0, 3),
            summary: activeStudySolution.dreamySummary
          } : undefined
        })
      });

      const data = await res.json();
      const tutorTurn: LiveTurn = {
        id: `turn_tut_${Date.now()}`,
        sender: 'techtut',
        text: data.visualSummary || data.spokenText,
        spokenText: data.spokenText,
        visualSummary: data.visualSummary,
        keyFormula: data.keyFormula,
        keyTakeaways: data.keyTakeaways,
        followUpPrompt: data.followUpPrompt,
        timestamp: Date.now()
      };

      setConversation(prev => [...prev, tutorTurn]);
      setCurrentSpokenTurn(tutorTurn);
      setIsThinking(false);

      // Award XP for engaging in interactive voice learning
      if (onAwardReward) {
        onAwardReward(25, 10);
      }

      // Automatically speak explanation out loud
      speakText(tutorTurn.spokenText || tutorTurn.text);

    } catch (err) {
      console.error('Live voice explanation error:', err);
      setIsThinking(false);
      const fallbackTurn: LiveTurn = {
        id: `turn_err_${Date.now()}`,
        sender: 'techtut',
        text: `Let us break down ${query}. The foundational rule is to verify the primary governing relationship and test your boundary cases. Would you like to review an intuitive analogy?`,
        spokenText: `Let us break down ${query}. The foundational rule is to verify the primary governing relationship and test your boundary cases. Would you like to review an intuitive analogy?`,
        visualSummary: `Spoken analysis of ${query}.`,
        timestamp: Date.now()
      };
      setConversation(prev => [...prev, fallbackTurn]);
      setCurrentSpokenTurn(fallbackTurn);
      speakText(fallbackTurn.spokenText || fallbackTurn.text);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-6">
      
      {/* Top Banner: Voice Persona & Status */}
      <div className="bg-white border border-stone-200/90 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-12 h-12 rounded-2xl bg-orange-500 text-white flex items-center justify-center shadow-xs">
            <Headphones className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-stone-900 tracking-tight">TechTut Stage</h2>
              <span className="px-2.5 py-0.5 rounded-full bg-orange-50 border border-orange-200 text-orange-700 text-xs font-bold uppercase tracking-wider">
                TechTut Live Engine
              </span>
            </div>
            <p className="text-xs text-stone-500 font-medium">
              Real-Time Conversational AI Voice Tutor powered by TechTut Stage • Hands-Free Oral Explanations
            </p>
          </div>
        </div>

        {/* Single Dedicated Voice: Prof Vance */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-stone-100 border border-stone-200 text-xs font-semibold text-stone-800">
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
            <span>Voice Tutor: Prof. Vance</span>
            <span className="text-[10px] text-stone-500 font-normal font-mono">(Standard)</span>
          </div>
        </div>
      </div>

      {/* Main Interactive Stage: Live Audio Orb & Waveform */}
      <div className="bg-white border border-stone-200/90 rounded-3xl p-6 sm:p-8 shadow-xs relative overflow-hidden">
        
        {/* Subtle Ambient Radial Backlight */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className={`w-80 h-80 rounded-full blur-[90px] transition-all duration-700 ${
            isSpeaking ? 'bg-orange-200/60' : isListening ? 'bg-amber-200/50' : isThinking ? 'bg-orange-100/40' : 'bg-stone-100/40'
          }`} />
        </div>

        <div className="relative z-10 flex flex-col items-center text-center space-y-6">
          
          {/* Animated Waveform Visualizer Canvas */}
          <div className="w-full max-w-xl h-24 sm:h-28 flex items-center justify-center">
            <canvas 
              ref={canvasRef} 
              width={560} 
              height={100} 
              className="w-full h-full max-w-md"
            />
          </div>

          {/* Status Badge */}
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${
              isSpeaking ? 'bg-orange-500 animate-ping' : isListening ? 'bg-amber-500 animate-pulse' : isThinking ? 'bg-orange-400 animate-spin' : 'bg-stone-300'
            }`} />
            <span className="text-xs font-bold uppercase tracking-widest text-stone-600 font-mono">
              {isSpeaking ? 'TechTut is Explaining Aloud...' : isListening ? 'Listening to Your Question...' : isThinking ? 'Formulating Spoken Derivation...' : 'Live Voice Ready • Tap Mic'}
            </span>
          </div>

          {/* Interactive Voice Controls Bar */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 pt-2">
            
            {/* Primary Mic Button */}
            <button
              onClick={handleToggleMic}
              className={`px-6 py-3.5 rounded-2xl font-bold text-sm flex items-center gap-2.5 shadow-sm transition-all cursor-pointer ${
                isListening
                  ? 'bg-amber-500 hover:bg-amber-600 text-white ring-4 ring-amber-200 animate-pulse'
                  : 'bg-orange-500 hover:bg-orange-600 text-white hover:scale-105'
              }`}
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              <span>{isListening ? 'Stop Listening' : 'Tap to Speak'}</span>
            </button>

            {/* Play / Pause Toggle */}
            <button
              onClick={handleToggleVoice}
              disabled={!currentSpokenTurn?.spokenText}
              className="p-3.5 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-700 disabled:opacity-40 transition-all cursor-pointer"
              title={isSpeaking ? (isPaused ? 'Resume' : 'Pause') : 'Repeat Voice Explanation'}
            >
              {isSpeaking && !isPaused ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </button>

            {/* Interrupt / Stop Button */}
            <button
              onClick={handleStopSpeaking}
              disabled={!isSpeaking}
              className="p-3.5 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-700 disabled:opacity-40 transition-all cursor-pointer"
              title="Interrupt & Silence Voice"
            >
              <Square className="w-5 h-5" />
            </button>

            {/* Mute Toggle */}
            <button
              onClick={() => {
                const next = !isMuted;
                setIsMuted(next);
                if (next) handleStopSpeaking();
              }}
              className={`p-3.5 rounded-2xl transition-all cursor-pointer ${
                isMuted ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
              title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>

            {/* Speech Rate Controls */}
            <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl text-[11px] font-bold text-stone-600">
              {[0.9, 1.0, 1.2].map(rate => (
                <button
                  key={rate}
                  onClick={() => {
                    setSpeechRate(rate);
                    if (isSpeaking) {
                      handleStopSpeaking();
                      if (currentSpokenTurn?.spokenText) speakText(currentSpokenTurn.spokenText);
                    }
                  }}
                  className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                    speechRate === rate ? 'bg-white text-orange-600 shadow-xs' : 'hover:text-stone-900'
                  }`}
                >
                  {rate}x
                </button>
              ))}
            </div>

          </div>

          {/* Quick Preset Topics */}
          <div className="w-full pt-4 border-t border-stone-100">
            <span className="text-[11px] uppercase font-bold text-stone-400 block mb-2 font-mono">
              Quick Oral Questions to Ask TechTut Stage (TechTut Live):
            </span>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {PRESET_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendQuery(prompt)}
                  className="px-3 py-1.5 rounded-xl bg-stone-50 hover:bg-orange-50 border border-stone-200 hover:border-orange-300 text-stone-700 hover:text-orange-900 text-xs font-medium transition-colors cursor-pointer text-left"
                >
                  💬 {prompt}
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Chalkboard Display & Spoken Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Live Chalkboard & Key Takeaways */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-stone-200/90 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-orange-500" />
                <h3 className="text-sm font-bold text-stone-900">Live Chalkboard Notes</h3>
              </div>
              {currentSpokenTurn && (
                <button
                  onClick={() => currentSpokenTurn.spokenText && speakText(currentSpokenTurn.spokenText)}
                  className="text-xs font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-1 cursor-pointer"
                >
                  <Volume2 className="w-3.5 h-3.5" /> Repeat Audio
                </button>
              )}
            </div>

            {currentSpokenTurn ? (
              <div className="space-y-4">
                {/* Visual Summary */}
                <div className="p-4 rounded-2xl bg-orange-50/60 border border-orange-200/80">
                  <h4 className="text-xs font-bold text-orange-900 uppercase font-mono tracking-wider mb-1">
                    Vocal Explanation Transcript
                  </h4>
                  <p className="text-sm text-stone-800 leading-relaxed font-sans">
                    {currentSpokenTurn.spokenText || currentSpokenTurn.text}
                  </p>
                </div>

                {/* Key Mathematical Formula or Invariant */}
                {currentSpokenTurn.keyFormula && (
                  <div className="p-3.5 rounded-2xl bg-stone-900 text-white font-mono text-xs flex items-center justify-between">
                    <span className="text-orange-300 font-bold uppercase tracking-wider text-[10px]">Governing Rule:</span>
                    <span className="text-amber-100 font-bold">{currentSpokenTurn.keyFormula}</span>
                  </div>
                )}

                {/* Key Bullet Takeaways */}
                {currentSpokenTurn.keyTakeaways && currentSpokenTurn.keyTakeaways.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <span className="text-xs font-bold text-stone-700 block uppercase tracking-wider font-mono">
                      High-Yield Takeaways
                    </span>
                    <ul className="space-y-2">
                      {currentSpokenTurn.keyTakeaways.map((point, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-xs text-stone-600 bg-stone-50 p-2.5 rounded-xl border border-stone-200/70">
                          <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-700 font-bold flex items-center justify-center shrink-0 text-[10px]">
                            {i + 1}
                          </span>
                          <span className="leading-snug">{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Follow Up Verbal Check */}
                {currentSpokenTurn.followUpPrompt && (
                  <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-between gap-3">
                    <p className="text-xs text-stone-700 font-medium">
                      💡 {currentSpokenTurn.followUpPrompt}
                    </p>
                    <button
                      onClick={() => handleSendQuery(`Yes, please walk me through an example of this!`)}
                      className="px-3 py-1 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shrink-0 cursor-pointer"
                    >
                      Answer Aloud
                    </button>
                  </div>
                )}

              </div>
            ) : (
              <div className="text-center py-10 text-stone-400 text-xs">
                Speak or type a question to illuminate the live chalkboard.
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Conversation Transcript & Text Input */}
        <div className="space-y-4">
          <div className="bg-white border border-stone-200/90 rounded-3xl p-5 shadow-xs space-y-4 flex flex-col h-full max-h-[500px]">
            <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-600 font-mono flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-orange-500" />
                Live Dialogue
              </h3>
              <span className="text-[10px] text-stone-400 font-mono">{conversation.length} turns</span>
            </div>

            {/* Scrollable Chat Log */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
              {conversation.map((turn) => (
                <div 
                  key={turn.id} 
                  className={`p-3 rounded-2xl ${
                    turn.sender === 'student' 
                      ? 'bg-orange-50 border border-orange-200/80 ml-4 text-stone-900' 
                      : 'bg-stone-50 border border-stone-200/80 mr-4 text-stone-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-[10px] uppercase font-mono text-stone-500">
                      {turn.sender === 'student' ? 'You (Voice / Text)' : `TechTut Stage (${persona})`}
                    </span>
                    {turn.spokenText && (
                      <button 
                        onClick={() => speakText(turn.spokenText!)}
                        className="text-[10px] text-orange-600 hover:text-orange-700 cursor-pointer"
                        title="Replay Voice"
                      >
                        🔊 Listen
                      </button>
                    )}
                  </div>
                  <p className="line-clamp-4 leading-relaxed">{turn.text}</p>
                </div>
              ))}
            </div>

            {/* Text Input Fallback Bar */}
            <div className="pt-2 border-t border-stone-100">
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendQuery();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={queryInput}
                  onChange={(e) => setQueryInput(e.target.value)}
                  placeholder="Or type a question to hear it explained..."
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-orange-500"
                />
                <button
                  type="submit"
                  disabled={!queryInput.trim() || isThinking}
                  className="p-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white transition-colors cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
};
