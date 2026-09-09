import React, { useState, useRef } from 'react';
import { Upload, ClipboardPaste, Plus, Trash2, Download, RefreshCw, Search, CheckCircle2, AlertTriangle, Users, FileText } from 'lucide-react';
import { Student } from '../types';
import { parseRosterInput, exportRosterToCSV } from '../utils/csvParser';
import { DEFAULT_SAMPLE_STUDENTS } from '../data/sampleStudents';
import { playButtonSound } from '../utils/audio';

interface RosterManagerProps {
  students: Student[];
  onUpdateStudents: (students: Student[]) => void;
  onNavigateToPicker: () => void;
  onNavigateToGroups: () => void;
}

export const RosterManager: React.FC<RosterManagerProps> = ({
  students,
  onUpdateStudents,
  onNavigateToPicker,
  onNavigateToGroups,
}) => {
  const [pasteText, setPasteText] = useState('');
  const [newStudentName, setNewStudentName] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'warning' | 'error'; message: string } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showNotification = (type: 'success' | 'warning' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => {
      setFeedback(null);
    }, 4000);
  };

  const handleFileUpload = (file: File) => {
    playButtonSound();
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) {
        showNotification('error', '讀取檔案失敗或檔案內容為空');
        return;
      }
      const { students: parsed, warnings } = parseRosterInput(text);
      if (parsed.length === 0) {
        showNotification('error', '未能從檔案中解析出學生姓名，請確認格式');
        return;
      }

      onUpdateStudents(parsed);
      const warnMsg = warnings.length > 0 ? ` (${warnings.length} 處注意：${warnings[0]})` : '';
      showNotification('success', `成功自「${file.name}」匯入 ${parsed.length} 名學生！${warnMsg}`);
    };
    reader.onerror = () => {
      showNotification('error', '讀取檔案出錯，請重試');
    };
    reader.readAsText(file, 'utf-8');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
      e.target.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handlePasteSubmit = () => {
    playButtonSound();
    if (!pasteText.trim()) {
      showNotification('warning', '請在文字框內貼上學生名單');
      return;
    }

    const { students: parsed, warnings } = parseRosterInput(pasteText);
    if (parsed.length === 0) {
      showNotification('error', '未找到有效姓名，請檢查輸入內容');
      return;
    }

    onUpdateStudents(parsed);
    setPasteText('');
    const warnMsg = warnings.length > 0 ? ` (${warnings.length} 處重複提醒)` : '';
    showNotification('success', `成功解析並匯入 ${parsed.length} 名學生！${warnMsg}`);
  };

  const handleAddSingleStudent = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newStudentName.trim();
    if (!clean) return;

    playButtonSound();
    const newStudent: Student = {
      id: `student_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: clean,
      number: students.length + 1,
    };

    onUpdateStudents([...students, newStudent]);
    setNewStudentName('');
    showNotification('success', `已新增學生「${clean}」`);
  };

  const handleDeleteStudent = (id: string, name: string) => {
    playButtonSound();
    onUpdateStudents(students.filter(s => s.id !== id));
    showNotification('warning', `已移除學生「${name}」`);
  };

  const handleClearAll = () => {
    if (students.length === 0) return;
    if (window.confirm('確定要清空目前的學生名單嗎？')) {
      playButtonSound();
      onUpdateStudents([]);
      showNotification('warning', '名單已清空');
    }
  };

  const handleLoadSample = () => {
    playButtonSound();
    onUpdateStudents(DEFAULT_SAMPLE_STUDENTS);
    showNotification('success', '已載入 24 位示範班級名單！');
  };

  const handleExportCSV = () => {
    playButtonSound();
    if (students.length === 0) {
      showNotification('warning', '目前沒有名單可供匯出');
      return;
    }
    const csvContent = exportRosterToCSV(students);
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `班級學生名單_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showNotification('success', '名單已下載為 CSV 檔案');
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchKeyword.toLowerCase()) ||
    (s.number && s.number.toString().includes(searchKeyword))
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Banner Alert */}
      {feedback && (
        <div
          id="roster-feedback"
          className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : feedback.type === 'warning'
              ? 'bg-amber-50 border-amber-200 text-amber-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Hero Stats & Quick Actions */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            學生名單設定
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            目前名單共有 <strong className="text-indigo-600 font-bold">{students.length}</strong> 位學生。支援拖曳 CSV 檔案、整批貼上姓名或手動增減。
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            id="load-sample-btn"
            onClick={handleLoadSample}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-xl hover:bg-indigo-100 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            載入示範名單 (24人)
          </button>

          <button
            id="export-csv-btn"
            onClick={handleExportCSV}
            disabled={students.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 disabled:opacity-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            匯出名單 CSV
          </button>

          {students.length > 0 && (
            <button
              id="clear-all-btn"
              onClick={handleClearAll}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-rose-600 bg-rose-50 border border-rose-200 rounded-xl hover:bg-rose-100 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              清空
            </button>
          )}
        </div>
      </div>

      {/* Two Import Ways: File Upload & Paste Box */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Method 1: CSV Upload */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Upload className="w-4 h-4 text-indigo-600" />
              方法一：上傳 CSV / TXT 檔案
            </h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
              推薦
            </span>
          </div>
          <p className="text-xs text-slate-500 mb-4">
            支援從 Excel、Google 試算表匯出的 CSV，自動識別「姓名」或第一欄欄位。
          </p>

          <div
            id="csv-drop-zone"
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`flex-1 border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-indigo-500 bg-indigo-50/50 scale-[0.99]'
                : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50/60'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.txt,.tsv"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
              <FileText className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-800">
              點擊選擇檔案，或直接拖曳檔案至此
            </p>
            <p className="text-xs text-slate-400 mt-1">
              支援 .csv, .txt 等純文字試算表格式
            </p>
          </div>
        </div>

        {/* Method 2: Direct Paste */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ClipboardPaste className="w-4 h-4 text-emerald-600" />
              方法二：直接貼上學生名單
            </h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-medium border border-emerald-200">
              快速貼上
            </span>
          </div>
          <p className="text-xs text-slate-500 mb-2">
            一行一個姓名，或用逗號、頓號分開（例如：陳柏翰、林怡萱、張家豪）。
          </p>

          <textarea
            id="paste-textarea"
            rows={4}
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            placeholder="陳柏翰&#10;林怡萱&#10;張家豪&#10;黃品睿..."
            className="w-full flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-sm font-sans placeholder:text-slate-400 resize-none transition-all outline-hidden"
          />

          <div className="flex items-center justify-end mt-3 gap-2">
            <button
              id="confirm-paste-btn"
              onClick={handlePasteSubmit}
              disabled={!pasteText.trim()}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              解析並匯入
            </button>
          </div>
        </div>
      </div>

      {/* Roster Table / Card Management */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              班級名冊一覽 ({students.length} 人)
            </h3>
            <p className="text-xs text-slate-500">
              名單已保存在本機瀏覽器，重新整理不會遺失
            </p>
          </div>

          {/* Quick Add Single Student Input */}
          <form onSubmit={handleAddSingleStudent} className="flex items-center gap-2">
            <input
              id="new-student-input"
              type="text"
              placeholder="新增單一學生姓名..."
              value={newStudentName}
              onChange={(e) => setNewStudentName(e.target.value)}
              className="px-3 py-1.5 text-sm border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-hidden w-44 sm:w-52"
            />
            <button
              id="add-student-btn"
              type="submit"
              disabled={!newStudentName.trim()}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-colors flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              新增
            </button>
          </form>
        </div>

        {/* Search Bar */}
        {students.length > 0 && (
          <div className="relative max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="search-student-input"
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="搜尋姓名或座號..."
              className="w-full pl-9 pr-3.5 py-1.5 text-xs sm:text-sm rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-hidden"
            />
          </div>
        )}

        {/* Students Grid Display */}
        {students.length === 0 ? (
          <div className="py-12 text-center text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
            <Users className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-medium text-slate-600">目前名單為空</p>
            <p className="text-xs text-slate-400 mt-1">
              請由上方上傳 CSV、貼上姓名名單，或點擊「載入示範名單」開始使用。
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 max-h-96 overflow-y-auto pr-1">
            {filteredStudents.map((s, idx) => (
              <div
                key={s.id}
                className="group flex items-center justify-between p-2.5 rounded-xl border border-slate-200/80 bg-slate-50/60 hover:bg-white hover:border-indigo-200 hover:shadow-xs transition-all"
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <span className="w-5 h-5 rounded-full bg-slate-200/80 text-slate-700 text-xs font-mono font-semibold flex items-center justify-center shrink-0">
                    {s.number || idx + 1}
                  </span>
                  <span className="text-sm font-bold text-slate-800 truncate" title={s.name}>
                    {s.name}
                  </span>
                </div>
                <button
                  onClick={() => handleDeleteStudent(s.id, s.name)}
                  title="移除學生"
                  className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 transition-opacity p-1 rounded-md"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Quick Launch Buttons for Teachers */}
        {students.length > 0 && (
          <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-slate-500">
              名單準備完畢！可直接切換至功能開始上課。
            </span>
            <div className="flex items-center gap-2">
              <button
                id="go-picker-btn"
                onClick={onNavigateToPicker}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-xs transition-colors"
              >
                前往隨機抽籤 →
              </button>
              <button
                id="go-groups-btn"
                onClick={onNavigateToGroups}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-xs transition-colors"
              >
                前往自動分組 →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
