import React, { useState, useEffect } from 'react';
import { ActiveTab, Student } from './types';
import { DEFAULT_SAMPLE_STUDENTS } from './data/sampleStudents';
import { Navbar } from './components/Navbar';
import { RandomPicker } from './components/RandomPicker';
import { AutoGrouper } from './components/AutoGrouper';
import { RosterManager } from './components/RosterManager';
import { Sparkles, Dices, UsersRound, FileSpreadsheet } from 'lucide-react';

const STORAGE_KEY = 'classroom_tools_students_v1';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('picker');
  const [students, setStudents] = useState<Student[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // LocalStorage parsing fallback
    }
    return DEFAULT_SAMPLE_STUDENTS;
  });

  // Persist students to localStorage whenever updated
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
    } catch {
      // Quota exceeded or private browsing fallback
    }
  }, [students]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/60 font-sans text-slate-900">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        totalStudents={students.length}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'picker' && (
          <RandomPicker
            students={students}
            onOpenRoster={() => setActiveTab('roster')}
          />
        )}

        {activeTab === 'groups' && (
          <AutoGrouper
            students={students}
            onOpenRoster={() => setActiveTab('roster')}
          />
        )}

        {activeTab === 'roster' && (
          <RosterManager
            students={students}
            onUpdateStudents={setStudents}
            onNavigateToPicker={() => setActiveTab('picker')}
            onNavigateToGroups={() => setActiveTab('groups')}
          />
        )}
      </main>

      {/* Classroom Footer */}
      <footer className="mt-auto py-6 border-t border-slate-200 bg-white/70 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">課堂隨機抽籤與自動分組工具</span>
            <span className="text-slate-300">|</span>
            <span>專為互動教學設計</span>
          </div>

          <div className="flex items-center gap-4 text-slate-500">
            <span>支援 CSV 匯入與貼上名單</span>
            <span>•</span>
            <span>自帶音效與動畫</span>
            <span>•</span>
            <span>可切換全螢幕投影</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
