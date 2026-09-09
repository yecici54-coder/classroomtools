import React, { useState, useEffect } from 'react';
import { Sparkles, Dices, Users, UsersRound, Volume2, VolumeX, Maximize2, Minimize2, FileSpreadsheet } from 'lucide-react';
import { ActiveTab } from '../types';
import { isSoundEnabled, setSoundEnabled, playButtonSound } from '../utils/audio';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  totalStudents: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  totalStudents,
}) => {
  const [soundOn, setSoundOn] = useState(isSoundEnabled());
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleSound = () => {
    const nextState = !soundOn;
    setSoundOn(nextState);
    setSoundEnabled(nextState);
    if (nextState) {
      playButtonSound();
    }
  };

  const toggleFullscreen = () => {
    playButtonSound();
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const handleTabChange = (tab: ActiveTab) => {
    playButtonSound();
    setActiveTab(tab);
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2 sm:gap-4">
          
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-amber-400 p-0.5 shadow-md flex items-center justify-center text-white">
              <Sparkles className="w-5 h-5 text-amber-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  課堂抽籤與分組
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  教師助手
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden md:block">
                名單匯入 · 動畫音效抽籤 · 智能視覺化分組
              </p>
            </div>
          </div>

          {/* Center Tabs Navigation */}
          <nav className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80">
            <button
              id="nav-tab-picker"
              onClick={() => handleTabChange('picker')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
                activeTab === 'picker'
                  ? 'bg-white text-indigo-700 shadow-xs ring-1 ring-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Dices className="w-4 h-4 text-indigo-500" />
              <span>隨機抽籤</span>
            </button>

            <button
              id="nav-tab-groups"
              onClick={() => handleTabChange('groups')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
                activeTab === 'groups'
                  ? 'bg-white text-indigo-700 shadow-xs ring-1 ring-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <UsersRound className="w-4 h-4 text-emerald-600" />
              <span>自動分組</span>
            </button>

            <button
              id="nav-tab-roster"
              onClick={() => handleTabChange('roster')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
                activeTab === 'roster'
                  ? 'bg-white text-indigo-700 shadow-xs ring-1 ring-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 text-amber-600" />
              <span>名單管理</span>
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-xs font-mono bg-slate-200 text-slate-700">
                {totalStudents}
              </span>
            </button>
          </nav>

          {/* Right Action Tools */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Audio Toggle */}
            <button
              id="toggle-sound-btn"
              onClick={toggleSound}
              title={soundOn ? '點擊關閉音效' : '點擊開啟音效'}
              className={`p-2 rounded-lg border transition-colors ${
                soundOn
                  ? 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'
                  : 'bg-slate-100 border-slate-200 text-slate-400 hover:bg-slate-200'
              }`}
            >
              {soundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Fullscreen for Classroom Projection */}
            <button
              id="toggle-fullscreen-btn"
              onClick={toggleFullscreen}
              title={isFullscreen ? '退出全螢幕' : '進入投影全螢幕模式'}
              className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors hidden sm:block"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
