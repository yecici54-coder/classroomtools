import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  UsersRound, 
  Shuffle, 
  Copy, 
  Check, 
  Crown, 
  Sparkles, 
  ArrowRightLeft, 
  Palette, 
  ArrowRight,
  Printer,
  ChevronDown
} from 'lucide-react';
import { Student, Group, GroupingMode, NamingTheme } from '../types';
import { playButtonSound, playVictorySound, playRollSound } from '../utils/audio';

interface AutoGrouperProps {
  students: Student[];
  onOpenRoster: () => void;
}

// Preset color themes for group cards
const THEME_PALETTES = [
  { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700', badge: 'bg-rose-100 text-rose-800', header: 'bg-rose-500' },
  { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-800', header: 'bg-blue-500' },
  { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-800', header: 'bg-emerald-500' },
  { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-800', header: 'bg-amber-500' },
  { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', badge: 'bg-purple-100 text-purple-800', header: 'bg-purple-500' },
  { bg: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-700', badge: 'bg-cyan-100 text-cyan-800', header: 'bg-cyan-500' },
  { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700', badge: 'bg-indigo-100 text-indigo-800', header: 'bg-indigo-500' },
  { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', badge: 'bg-orange-100 text-orange-800', header: 'bg-orange-500' },
  { bg: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-700', badge: 'bg-teal-100 text-teal-800', header: 'bg-teal-500' },
  { bg: 'bg-fuchsia-50', border: 'border-fuchsia-200', text: 'text-fuchsia-700', badge: 'bg-fuchsia-100 text-fuchsia-800', header: 'bg-fuchsia-500' },
];

const ANIMAL_NAMES = ['雄鷹組 🦅', '躍豹組 🐆', '海豚組 🐬', '烈獅組 🦁', '白虎組 🐅', '靈狐組 🦊', '青龍組 🐉', '金熊組 🐻', '靈雀組 🦜', '羚羊組 🦌', '夜梟組 🦉', '飛馬組 🦄'];
const COLOR_NAMES = ['紅隊 🔴', '藍隊 🔵', '綠隊 🟢', '黃隊 🟡', '紫隊 🟣', '青隊 💠', '橙隊 🟠', '粉隊 🌸', '黑曜隊 ♠️', '翡翠隊 💎'];

export const AutoGrouper: React.FC<AutoGrouperProps> = ({
  students,
  onOpenRoster,
}) => {
  // Configuration
  const [groupSize, setGroupSize] = useState<number>(4);
  const [groupCount, setGroupCount] = useState<number>(4);
  const [mode, setMode] = useState<GroupingMode>('by-size');
  const [namingTheme, setNamingTheme] = useState<NamingTheme>('numbered');
  const [autoAssignLeader, setAutoAssignLeader] = useState<boolean>(true);
  const [remainderStrategy, setRemainderStrategy] = useState<'balance' | 'standalone'>('balance');

  // Execution & Output State
  const [groups, setGroups] = useState<Group[]>([]);
  const [isShuffling, setIsShuffling] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Student transfer modal / menu state
  const [transferringStudent, setTransferringStudent] = useState<{ student: Student; fromGroupId: string } | null>(null);

  // Calculate estimated summary based on current inputs
  const total = students.length;
  let estimatedGroups = 0;
  if (mode === 'by-size') {
    const size = Math.max(1, groupSize);
    estimatedGroups = Math.max(1, Math.ceil(total / size));
  } else {
    estimatedGroups = Math.min(total, Math.max(1, groupCount));
  }

  // Generate Group Names based on theme
  const getGroupName = (index: number): string => {
    switch (namingTheme) {
      case 'animals':
        return ANIMAL_NAMES[index % ANIMAL_NAMES.length] || `第 ${index + 1} 組`;
      case 'colors':
        return COLOR_NAMES[index % COLOR_NAMES.length] || `第 ${index + 1} 組`;
      case 'letters':
        return `Group ${String.fromCharCode(65 + index)}`;
      case 'numbered':
      default:
        return `第 ${index + 1} 組`;
    }
  };

  // Perform Fisher-Yates fair shuffle and group distribution
  const executeGrouping = () => {
    if (students.length === 0) return;

    playRollSound();
    setIsShuffling(true);

    setTimeout(() => {
      // 1. Shuffle students copy fairly
      const shuffled = [...students];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }

      // 2. Determine number of groups and bucket sizes
      let numGroups = 1;
      if (mode === 'by-size') {
        const targetSize = Math.max(1, groupSize);
        if (remainderStrategy === 'balance') {
          numGroups = Math.max(1, Math.round(shuffled.length / targetSize));
        } else {
          numGroups = Math.max(1, Math.ceil(shuffled.length / targetSize));
        }
      } else {
        numGroups = Math.min(shuffled.length, Math.max(1, groupCount));
      }

      // 3. Initialize groups
      const newGroups: Group[] = Array.from({ length: numGroups }, (_, idx) => {
        const palette = THEME_PALETTES[idx % THEME_PALETTES.length];
        return {
          id: `group_${idx}_${Date.now()}`,
          name: getGroupName(idx),
          color: palette.header,
          badgeBg: palette.badge,
          borderColor: palette.border,
          textColor: palette.text,
          members: [],
        };
      });

      // 4. Distribute students
      if (remainderStrategy === 'balance' || mode === 'by-count') {
        // Round-robin distribution for optimal balance
        shuffled.forEach((student, index) => {
          const groupIdx = index % numGroups;
          newGroups[groupIdx].members.push(student);
        });
      } else {
        // Fill up to target groupSize sequentially
        const targetSize = Math.max(1, groupSize);
        let currentGroupIdx = 0;
        shuffled.forEach((student) => {
          if (newGroups[currentGroupIdx].members.length >= targetSize && currentGroupIdx < numGroups - 1) {
            currentGroupIdx++;
          }
          newGroups[currentGroupIdx].members.push(student);
        });
      }

      // 5. Auto-assign group leader if checked
      if (autoAssignLeader) {
        newGroups.forEach((g) => {
          if (g.members.length > 0) {
            const randomLeaderIdx = Math.floor(Math.random() * g.members.length);
            g.leaderId = g.members[randomLeaderIdx].id;
          }
        });
      }

      setGroups(newGroups);
      setIsShuffling(false);
      playVictorySound();
    }, 450);
  };

  // Toggle leader designation manually
  const toggleLeader = (groupId: string, studentId: string) => {
    playButtonSound();
    setGroups(prev => prev.map(g => {
      if (g.id !== groupId) return g;
      return {
        ...g,
        leaderId: g.leaderId === studentId ? undefined : studentId,
      };
    }));
  };

  // Move student to another group manually
  const handleMoveStudent = (targetGroupId: string) => {
    if (!transferringStudent || transferringStudent.fromGroupId === targetGroupId) {
      setTransferringStudent(null);
      return;
    }

    playButtonSound();
    const { student, fromGroupId } = transferringStudent;

    setGroups(prev => prev.map(g => {
      if (g.id === fromGroupId) {
        return {
          ...g,
          members: g.members.filter(m => m.id !== student.id),
          leaderId: g.leaderId === student.id ? undefined : g.leaderId,
        };
      }
      if (g.id === targetGroupId) {
        return {
          ...g,
          members: [...g.members, student],
        };
      }
      return g;
    }));

    setTransferringStudent(null);
  };

  // Copy nicely formatted text
  const handleCopyResults = () => {
    playButtonSound();
    if (groups.length === 0) return;

    const lines = [
      `【課堂分組名單】（全班共 ${students.length} 人，分為 ${groups.length} 組）`,
      `分組時間：${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      '------------------------------------',
    ];

    groups.forEach(g => {
      const leader = g.members.find(m => m.id === g.leaderId);
      const leaderNote = leader ? ` [組長：${leader.name}]` : '';
      const memberNames = g.members.map(m => m.name).join('、');
      lines.push(`${g.name} (${g.members.length}人)${leaderNote}：${memberNames}`);
    });

    lines.push('------------------------------------');

    navigator.clipboard.writeText(lines.join('\n')).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }).catch(() => {
      alert('複製失敗，請手動選取文字複製');
    });
  };

  if (students.length === 0) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 bg-white rounded-3xl border border-slate-200 shadow-sm text-center">
        <div className="w-16 h-16 mx-auto bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mb-4">
          <UsersRound className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-slate-800 mb-2">尚未匯入學生名冊</h3>
        <p className="text-sm text-slate-500 mb-6 max-w-md mx-auto">
          自動分組需要名冊來源，請先上傳 CSV 檔案、貼上姓名或載入預設示範名單。
        </p>
        <button
          onClick={onOpenRoster}
          className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-md transition-all"
        >
          前往匯入名冊
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      {/* Controls & Configuration Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <UsersRound className="w-5 h-5 text-emerald-600" />
              自動分組設定
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              現有名冊共 <strong className="text-emerald-700 font-bold">{students.length}</strong> 人。
              {mode === 'by-size' 
                ? ` 設定每組 ${groupSize} 人，約分成 ${estimatedGroups} 組。` 
                : ` 設定分成 ${groupCount} 組，每組約 ${Math.round(students.length / groupCount)} 人。`}
            </p>
          </div>

          {/* Start Grouping Big Button */}
          <button
            id="start-grouping-btn"
            onClick={executeGrouping}
            disabled={isShuffling}
            className={`px-6 py-3 rounded-xl text-base font-bold text-white shadow-md flex items-center justify-center gap-2 transition-all transform active:scale-95 ${
              isShuffling
                ? 'bg-slate-400 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-700 hover:shadow-emerald-200'
            }`}
          >
            <Shuffle className={`w-5 h-5 ${isShuffling ? 'animate-spin' : ''}`} />
            <span>{groups.length > 0 ? '重新隨機分組' : '開始自動分組'}</span>
          </button>
        </div>

        {/* Setting Parameters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Setting 1: Grouping Metric */}
          <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/80 space-y-2">
            <label className="text-xs font-bold text-slate-700 block">
              分組方式
            </label>
            <div className="flex rounded-lg bg-slate-200/80 p-0.5">
              <button
                type="button"
                onClick={() => setMode('by-size')}
                className={`flex-1 py-1 text-xs font-bold rounded-md transition-all ${
                  mode === 'by-size'
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                每組幾人
              </button>
              <button
                type="button"
                onClick={() => setMode('by-count')}
                className={`flex-1 py-1 text-xs font-bold rounded-md transition-all ${
                  mode === 'by-count'
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                共分幾組
              </button>
            </div>
          </div>

          {/* Setting 2: Numeric Target */}
          <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 block">
                {mode === 'by-size' ? '每組人數' : '總分組數'}
              </label>
              <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                {mode === 'by-size' ? `${groupSize} 人 / 組` : `${groupCount} 組`}
              </span>
            </div>
            
            {mode === 'by-size' ? (
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="2"
                  max={Math.min(12, students.length)}
                  value={groupSize}
                  onChange={(e) => setGroupSize(parseInt(e.target.value, 10))}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="2"
                  max={Math.min(16, students.length)}
                  value={groupCount}
                  onChange={(e) => setGroupCount(parseInt(e.target.value, 10))}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
              </div>
            )}
          </div>

          {/* Setting 3: Group Naming Theme */}
          <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/80 space-y-2">
            <label className="text-xs font-bold text-slate-700 block flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-indigo-500" />
              組別命名風格
            </label>
            <select
              value={namingTheme}
              onChange={(e) => setNamingTheme(e.target.value as NamingTheme)}
              className="w-full text-xs font-semibold bg-white border border-slate-200 rounded-lg p-1.5 text-slate-800 focus:outline-hidden cursor-pointer"
            >
              <option value="numbered">數字順序 (第 1 組、第 2 組)</option>
              <option value="animals">活力吉祥物 (雄鷹、海豚、獵豹)</option>
              <option value="colors">鮮明色彩 (紅隊、藍隊、綠隊)</option>
              <option value="letters">英文字母 (Group A, Group B)</option>
            </select>
          </div>

          {/* Setting 4: Team Leader Designate Toggle */}
          <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/80 space-y-2 flex flex-col justify-center">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={autoAssignLeader}
                onChange={(e) => setAutoAssignLeader(e.target.checked)}
                className="w-4 h-4 rounded-sm text-emerald-600 accent-emerald-600 cursor-pointer"
              />
              <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
              <span>自動為每組隨機指定組長</span>
            </label>
            <p className="text-[11px] text-slate-400">
              分組後可點擊組員頭像隨時更換組長
            </p>
          </div>

        </div>

        {/* Remainder Distribution Option */}
        <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 pt-2">
          <div className="flex items-center gap-2">
            <span>餘數分配策略：</span>
            <button
              onClick={() => setRemainderStrategy('balance')}
              className={`px-2.5 py-1 rounded-md font-medium border transition-colors ${
                remainderStrategy === 'balance'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800 font-bold'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              平攤各組（人數最均勻）
            </button>
            <button
              onClick={() => setRemainderStrategy('standalone')}
              className={`px-2.5 py-1 rounded-md font-medium border transition-colors ${
                remainderStrategy === 'standalone'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800 font-bold'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              末組獨立落單
            </button>
          </div>
        </div>

      </div>

      {/* Visualized Group Cards Display */}
      {groups.length > 0 && (
        <div className="space-y-4">
          
          {/* Action Header on top of results */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white px-5 py-3.5 rounded-2xl border border-slate-200/90 shadow-xs">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span className="text-sm font-bold text-slate-900">
                分組結果一覽（共 {groups.length} 組）
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                id="copy-groups-btn"
                onClick={handleCopyResults}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? '已複製名單到剪貼簿！' : '複製分組名冊'}</span>
              </button>

              <button
                onClick={() => window.print()}
                title="列印分組表"
                className="p-1.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-xl text-xs transition-colors"
              >
                <Printer className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <AnimatePresence>
              {groups.map((group, groupIdx) => (
                <motion.div
                  key={group.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: groupIdx * 0.05 }}
                  className={`bg-white rounded-2xl border-2 ${group.borderColor} shadow-xs overflow-hidden flex flex-col`}
                >
                  {/* Group Header Strip */}
                  <div className={`px-4 py-3 ${group.color} text-white flex items-center justify-between`}>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-sm tracking-wide">
                        {group.name}
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-white/25 backdrop-blur-xs text-[11px] font-bold font-mono">
                      {group.members.length} 人
                    </span>
                  </div>

                  {/* Members List */}
                  <div className="p-4 space-y-2 flex-1">
                    {group.members.length === 0 ? (
                      <p className="text-xs text-slate-400 italic py-4 text-center">
                        暫無成員
                      </p>
                    ) : (
                      group.members.map((member) => {
                        const isLeader = group.leaderId === member.id;
                        return (
                          <div
                            key={member.id}
                            className={`group relative flex items-center justify-between p-2 rounded-xl transition-all ${
                              isLeader
                                ? 'bg-amber-50/80 border border-amber-200'
                                : 'bg-slate-50/70 border border-slate-100 hover:bg-slate-100/80'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 text-xs font-mono font-bold flex items-center justify-center shrink-0">
                                {member.number || '•'}
                              </span>
                              <span className="text-sm font-bold text-slate-800 truncate">
                                {member.name}
                              </span>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              {/* Leader designation button */}
                              <button
                                onClick={() => toggleLeader(group.id, member.id)}
                                title={isLeader ? '點擊取消組長身份' : '點擊設為組長'}
                                className={`p-1 rounded-md transition-colors ${
                                  isLeader
                                    ? 'text-amber-500 bg-amber-100'
                                    : 'text-slate-300 hover:text-amber-500 hover:bg-slate-200'
                                }`}
                              >
                                <Crown className={`w-3.5 h-3.5 ${isLeader ? 'fill-amber-400' : ''}`} />
                              </button>

                              {/* Move student to other group button */}
                              <button
                                onClick={() => setTransferringStudent({ student: member, fromGroupId: group.id })}
                                title="移至其他組別"
                                className="p-1 rounded-md text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                              >
                                <ArrowRightLeft className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Card Footer */}
                  <div className="px-4 py-2 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                    <span>
                      {group.leaderId 
                        ? `組長：${group.members.find(m => m.id === group.leaderId)?.name || '未指派'}`
                        : '點擊皇冠指定組長'}
                    </span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Manual Student Transfer Modal/Popup */}
      {transferringStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 border border-slate-200 shadow-xl space-y-4">
            <h4 className="text-base font-bold text-slate-900">
              調整學生組別
            </h4>
            <p className="text-xs text-slate-500">
              將學生 <strong className="text-indigo-600 font-bold">{transferringStudent.student.name}</strong> 移至哪一組？
            </p>

            <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
              {groups.map((targetG) => {
                const isCurrent = targetG.id === transferringStudent.fromGroupId;
                return (
                  <button
                    key={targetG.id}
                    disabled={isCurrent}
                    onClick={() => handleMoveStudent(targetG.id)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors ${
                      isCurrent
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        : 'bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 border border-slate-200'
                    }`}
                  >
                    <span>{targetG.name} ({targetG.members.length} 人)</span>
                    {isCurrent && <span className="text-[10px] text-slate-400">目前所在組</span>}
                  </button>
                );
              })}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setTransferringStudent(null)}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
