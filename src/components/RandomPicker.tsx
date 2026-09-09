import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { 
  Sparkles, 
  RotateCcw, 
  CheckCircle2, 
  History, 
  Settings2, 
  Volume2, 
  VolumeX, 
  Trophy, 
  Users, 
  Play, 
  Flame,
  ArrowRight,
  Maximize2
} from 'lucide-react';
import { Student, PickerMode, PickerSpeed, PickHistoryItem } from '../types';
import { playTickSound, playVictorySound, playButtonSound, isSoundEnabled, setSoundEnabled } from '../utils/audio';

interface RandomPickerProps {
  students: Student[];
  onOpenRoster: () => void;
}

export const RandomPicker: React.FC<RandomPickerProps> = ({
  students,
  onOpenRoster,
}) => {
  // Picker configuration state
  const [mode, setMode] = useState<PickerMode>('no-repeat');
  const [speed, setSpeed] = useState<PickerSpeed>('normal');
  const [soundActive, setSoundActive] = useState(isSoundEnabled());

  // Picker execution state
  const [isDrawing, setIsDrawing] = useState(false);
  const [displayStudent, setDisplayStudent] = useState<Student | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [drawnStudentIds, setDrawnStudentIds] = useState<Set<string>>(new Set());
  const [history, setHistory] = useState<PickHistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Available students in pool
  const availableStudents = mode === 'no-repeat'
    ? students.filter(s => !drawnStudentIds.has(s.id))
    : students;

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  // Update sound state
  const handleToggleSound = () => {
    const next = !soundActive;
    setSoundActive(next);
    setSoundEnabled(next);
    if (next) playButtonSound();
  };

  // Reset drawn students pool
  const handleResetPool = () => {
    playButtonSound();
    setDrawnStudentIds(new Set());
    setSelectedStudent(null);
    setDisplayStudent(null);
  };

  // Clear history
  const handleClearHistory = () => {
    playButtonSound();
    setHistory([]);
  };

  // Launch celebratory confetti burst
  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#6366f1', '#f59e0b', '#10b981', '#ec4899', '#3b82f6'],
      });
      // Side cannons for extra excitement
      setTimeout(() => {
        confetti({
          particleCount: 40,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
        });
        confetti({
          particleCount: 40,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
        });
      }, 150);
    } catch {
      // Fallback if canvas-confetti is not supported
    }
  };

  // Main draw logic with mathematical easing animation & sound ticks
  const startDraw = useCallback(() => {
    if (isDrawing || students.length === 0) return;
    if (mode === 'no-repeat' && availableStudents.length === 0) {
      alert('所有學生皆已抽出！請點擊「重置抽籤進度」以重新開始。');
      return;
    }

    setIsDrawing(true);
    setSelectedStudent(null);
    playButtonSound();

    // Determine target duration based on speed
    const durationMs = speed === 'fast' ? 1400 : speed === 'suspense' ? 4200 : 2500;
    const startTime = Date.now();

    // Pre-calculate winning student from current available pool
    const pool = mode === 'no-repeat' ? availableStudents : students;
    const winnerIndex = Math.floor(Math.random() * pool.length);
    const chosenOne = pool[winnerIndex];

    let currentInterval = 40;
    let pitchMultiplier = 0.9;

    const runShuffleLoop = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / durationMs, 1);

      // Randomly pick temporary student for the flashing reel
      const randomDisplay = pool[Math.floor(Math.random() * pool.length)];
      setDisplayStudent(randomDisplay);

      // Play tick sound with rising pitch then decelerating tone
      pitchMultiplier = 0.8 + progress * 0.5;
      playTickSound(pitchMultiplier);

      if (progress < 1) {
        // Exponential deceleration curve for suspense
        // As progress approaches 1, interval increases from 40ms to ~320ms
        const eased = Math.pow(progress, 2.5);
        currentInterval = 40 + eased * 280;

        timerRef.current = setTimeout(runShuffleLoop, currentInterval);
      } else {
        // Animation finished! Final landing on winner
        setDisplayStudent(chosenOne);
        setSelectedStudent(chosenOne);
        setIsDrawing(false);

        // Sound & Confetti celebration
        playVictorySound();
        triggerConfetti();

        // Update drawn pool and history
        if (mode === 'no-repeat') {
          setDrawnStudentIds(prev => {
            const next = new Set(prev);
            next.add(chosenOne.id);
            return next;
          });
        }

        setHistory(prev => [
          {
            id: `pick_${Date.now()}`,
            student: chosenOne,
            timestamp: new Date(),
            roundNumber: prev.length + 1,
          },
          ...prev,
        ]);
      }
    };

    runShuffleLoop();
  }, [isDrawing, students, mode, availableStudents, speed]);

  // Spacebar trigger support for teachers using presenter remote
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !isDrawing && students.length > 0) {
        // Only trigger if not typing inside an input/textarea
        const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
        if (tag !== 'input' && tag !== 'textarea') {
          e.preventDefault();
          startDraw();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDrawing, students.length, startDraw]);

  if (students.length === 0) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 bg-white rounded-3xl border border-slate-200 shadow-sm text-center">
        <div className="w-16 h-16 mx-auto bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 mb-4">
          <Users className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-slate-800 mb-2">尚未匯入學生名冊</h3>
        <p className="text-sm text-slate-500 mb-6 max-w-md mx-auto">
          隨機抽籤需要先有名冊資料，您可以上傳 CSV 檔案、貼上姓名或載入預設示範名冊。
        </p>
        <button
          onClick={onOpenRoster}
          className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-md transition-all"
        >
          前往匯入名冊
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  const isAllDrawn = mode === 'no-repeat' && availableStudents.length === 0;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      
      {/* Control Configuration Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs flex flex-wrap items-center justify-between gap-4">
        
        {/* Left: Mode Selection (User Explicit Requirement) */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <span className="text-xs sm:text-sm font-bold text-slate-700 flex items-center gap-1.5">
            <Settings2 className="w-4 h-4 text-indigo-600" />
            抽籤規則：
          </span>
          <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200/80">
            <button
              id="mode-no-repeat-btn"
              onClick={() => {
                playButtonSound();
                setMode('no-repeat');
              }}
              disabled={isDrawing}
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                mode === 'no-repeat'
                  ? 'bg-white text-indigo-700 shadow-xs ring-1 ring-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              不重複抽取 (抽過即排除)
            </button>
            <button
              id="mode-allow-repeat-btn"
              onClick={() => {
                playButtonSound();
                setMode('allow-repeat');
              }}
              disabled={isDrawing}
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                mode === 'allow-repeat'
                  ? 'bg-white text-indigo-700 shadow-xs ring-1 ring-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              允許重複抽取 (每次皆全班隨機)
            </button>
          </div>
        </div>

        {/* Right: Sound & Speed Controls */}
        <div className="flex items-center gap-2">
          {/* Speed Selector */}
          <div className="flex items-center text-xs text-slate-500 gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-xl">
            <span className="hidden sm:inline">動畫節奏：</span>
            <select
              value={speed}
              onChange={(e) => setSpeed(e.target.value as PickerSpeed)}
              disabled={isDrawing}
              className="bg-transparent font-medium text-slate-700 focus:outline-hidden cursor-pointer"
            >
              <option value="fast">急速 (1.5秒)</option>
              <option value="normal">標準 (2.5秒)</option>
              <option value="suspense">懸疑刺激 (4.2秒)</option>
            </select>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={handleToggleSound}
            title={soundActive ? '點擊靜音' : '開啟抽籤音效'}
            className={`p-2 rounded-xl border text-xs font-semibold transition-colors flex items-center gap-1 ${
              soundActive
                ? 'bg-amber-50 border-amber-200 text-amber-700'
                : 'bg-slate-100 border-slate-200 text-slate-400'
            }`}
          >
            {soundActive ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden md:inline">{soundActive ? '音效開啟' : '靜音'}</span>
          </button>
        </div>

      </div>

      {/* Progress & Pool status (for No-Repeat mode) */}
      {mode === 'no-repeat' && (
        <div className="bg-white rounded-2xl px-5 py-3.5 border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              剩餘待抽：
              <span className="text-lg font-bold text-indigo-600 font-mono">
                {availableStudents.length}
              </span>
              <span className="text-slate-400">/</span>
              <span className="text-slate-500 font-normal">全班共 {students.length} 人</span>
            </div>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-medium">
              已抽 {drawnStudentIds.size} 人
            </span>
          </div>

          <div className="flex items-center gap-2">
            {drawnStudentIds.size > 0 && (
              <button
                onClick={handleResetPool}
                disabled={isDrawing}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-xl hover:bg-amber-100 transition-colors disabled:opacity-50"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                重置抽籤進度
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Lucky Draw Stage Card (Projector View Design) */}
      <div className="relative overflow-hidden bg-gradient-to-b from-white via-indigo-50/30 to-white rounded-3xl border-2 border-indigo-100 shadow-lg p-6 sm:p-12 text-center flex flex-col items-center justify-center min-h-[380px]">
        
        {/* Subtle Decorative Background Rings */}
        <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-indigo-100/40 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-amber-100/40 blur-3xl pointer-events-none" />

        {/* Status Badge */}
        <div className="mb-4 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-100/80 text-indigo-800 text-xs sm:text-sm font-semibold tracking-wide">
          <Sparkles className="w-4 h-4 text-amber-500 animate-spin" style={{ animationDuration: '4s' }} />
          {isDrawing
            ? '幸運轉輪旋轉中...'
            : selectedStudent
            ? '恭喜抽中同學！'
            : isAllDrawn
            ? '本輪抽籤已全數完成'
            : '準備好開始抽籤'}
        </div>

        {/* Display Center: Large Rolling Slot / Revealed Student */}
        <div className="w-full max-w-xl py-6 flex items-center justify-center min-h-[160px]">
          {isAllDrawn ? (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="space-y-3"
            >
              <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center">
                <Trophy className="w-8 h-8" />
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900">
                全班學生皆已抽過一遍！
              </h3>
              <p className="text-sm text-slate-500">
                點擊下方按鈕可清空抽籤紀錄，展開全新一輪。
              </p>
              <button
                onClick={handleResetPool}
                className="mt-2 inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                開啟新一輪抽籤
              </button>
            </motion.div>
          ) : (
            <AnimatePresence mode="wait">
              {isDrawing ? (
                <motion.div
                  key="drawing"
                  className="flex flex-col items-center justify-center space-y-2"
                >
                  <motion.div
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ repeat: Infinity, duration: 0.15 }}
                    className="px-8 py-4 rounded-2xl bg-white border-2 border-indigo-400 shadow-md flex items-center gap-3"
                  >
                    {displayStudent?.number && (
                      <span className="text-2xl font-black font-mono text-indigo-400">
                        #{displayStudent.number}
                      </span>
                    )}
                    <span className="text-4xl sm:text-6xl font-black text-indigo-600 tracking-wider font-sans">
                      {displayStudent?.name || '...'}
                    </span>
                  </motion.div>
                  <span className="text-xs text-indigo-400 font-medium tracking-widest uppercase">
                    ROLLING
                  </span>
                </motion.div>
              ) : selectedStudent ? (
                <motion.div
                  key={`winner_${selectedStudent.id}`}
                  initial={{ scale: 0.4, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  transition={{ type: 'spring', stiffness: 350, damping: 20 }}
                  className="relative group"
                >
                  <div className="absolute -inset-2 bg-gradient-to-r from-amber-400 via-indigo-500 to-rose-400 rounded-3xl blur-md opacity-70 group-hover:opacity-100 transition duration-500"></div>
                  <div className="relative px-8 sm:px-12 py-6 rounded-2xl bg-white border border-amber-200 shadow-xl flex flex-col items-center">
                    {selectedStudent.number && (
                      <span className="text-sm sm:text-base font-bold text-amber-600 font-mono bg-amber-50 px-3 py-0.5 rounded-full border border-amber-200 mb-2">
                        座號 #{selectedStudent.number}
                      </span>
                    )}
                    <span className="text-5xl sm:text-7xl font-black text-slate-900 tracking-wider">
                      {selectedStudent.name}
                    </span>
                    <div className="mt-3 flex items-center gap-1 text-emerald-600 font-bold text-xs sm:text-sm">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>已被抽出</span>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="text-slate-300 font-bold text-3xl sm:text-5xl tracking-widest select-none py-8">
                  ？ ？ ？
                </div>
              )}
            </AnimatePresence>
          )}
        </div>

        {/* Primary Draw Action Button */}
        {!isAllDrawn && (
          <div className="mt-4 flex flex-col items-center gap-3">
            <button
              id="start-draw-btn"
              onClick={startDraw}
              disabled={isDrawing}
              className={`relative group px-8 sm:px-12 py-4 rounded-2xl text-lg sm:text-xl font-black text-white shadow-xl transition-all transform active:scale-95 ${
                isDrawing
                  ? 'bg-slate-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-800 hover:from-indigo-500 hover:to-indigo-700 hover:shadow-indigo-300/60 hover:-translate-y-0.5'
              }`}
            >
              <div className="flex items-center gap-3">
                <Play className={`w-6 h-6 fill-current ${isDrawing ? 'animate-spin' : ''}`} />
                <span>{isDrawing ? '抽取中...' : selectedStudent ? '再次抽籤' : '開始抽籤'}</span>
              </div>
            </button>

            <span className="text-xs text-slate-400 font-medium">
              提示：按下鍵盤 <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded-md font-mono text-slate-700 text-xs">空白鍵 Space</kbd> 亦可快速抽籤
            </span>
          </div>
        )}

      </div>

      {/* History Record Drawer / Panel */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="px-5 py-4 flex items-center justify-between border-b border-slate-100 bg-slate-50/50">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-2 text-sm font-bold text-slate-800 hover:text-indigo-600 transition-colors"
          >
            <History className="w-4 h-4 text-indigo-600" />
            <span>抽籤紀錄 ({history.length})</span>
            <span className="text-xs text-slate-400 font-normal">
              {showHistory ? '點擊收合' : '點擊展開'}
            </span>
          </button>

          {history.length > 0 && (
            <button
              onClick={handleClearHistory}
              className="text-xs text-slate-500 hover:text-rose-600 font-medium transition-colors"
            >
              清空紀錄
            </button>
          )}
        </div>

        {showHistory && (
          <div className="p-5">
            {history.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">
                尚未進行任何抽籤
              </p>
            ) : (
              <div className="flex flex-wrap gap-2.5 max-h-60 overflow-y-auto pr-1">
                {history.map((item, idx) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium"
                  >
                    <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-mono font-bold flex items-center justify-center text-[10px]">
                      {history.length - idx}
                    </span>
                    <span className="font-bold text-slate-800">{item.student.name}</span>
                    {item.student.number && (
                      <span className="text-slate-400 font-mono">#{item.student.number}</span>
                    )}
                    <span className="text-[10px] text-slate-400 ml-1">
                      {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
};
