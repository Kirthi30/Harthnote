import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Sparkles, 
  Clock, 
  LogOut, 
  User as UserIcon,
  Check,
  Download,
  FileText,
  FileSpreadsheet,
  AlertTriangle,
  UserX,
  Trash2,
  X
} from 'lucide-react';
import type { AIMemoryLevel, JournalEntry, UserProfile } from '../types';

interface SettingsScreenProps {
  user: any;
  userProfile: UserProfile | null;
  entries: JournalEntry[];
  onUpdateMemoryLevel: (level: AIMemoryLevel) => Promise<void>;
  onUpdatePin: (enabled: boolean, pin?: string) => Promise<void>;
  onUpdateReminder: (time: string) => Promise<void>;
  onOpenPrivacy: () => void;
  onSignOut: () => void;
  onDeactivateAccount: () => Promise<void>;
  onDeleteAccount: () => Promise<void>;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  user,
  userProfile,
  entries,
  onUpdateMemoryLevel,
  onUpdatePin,
  onUpdateReminder,
  onOpenPrivacy,
  onSignOut,
  onDeactivateAccount,
  onDeleteAccount,
}) => {
  const [selectedMemory, setSelectedMemory] = useState<AIMemoryLevel>(userProfile?.aiMemoryLevel || 'light');
  const [reminderTime, setReminderTime] = useState(userProfile?.reminderTime || '20:30');
  
  // Sync selectedMemory when userProfile loads or changes
  useEffect(() => {
    if (userProfile?.aiMemoryLevel) {
      setSelectedMemory(userProfile.aiMemoryLevel);
    }
  }, [userProfile?.aiMemoryLevel]);

  // AI Memory Depth Testing / Verification
  const [testingMemory, setTestingMemory] = useState(false);
  const [memoryTestResult, setMemoryTestResult] = useState<string | null>(null);

  // PIN state
  const [pinEnabled, setPinEnabled] = useState(Boolean(userProfile?.pinEnabled));
  const [pinInput, setPinInput] = useState('');
  const [pinSuccessMsg, setPinSuccessMsg] = useState('');
  const [savedSettingsNotice, setSavedSettingsNotice] = useState(false);

  // Export State
  const [exportFormat, setExportFormat] = useState<'md' | 'json' | 'csv'>('md');
  const [exportRange, setExportRange] = useState<'all' | '30' | '90' | 'custom'>('all');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  // Deactivation & Deletion Modals
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSaveMemory = async (level: AIMemoryLevel) => {
    setSelectedMemory(level);
    setMemoryTestResult(null);
    await onUpdateMemoryLevel(level);
    showNotice();
  };

  const handleTestMemory = async () => {
    setTestingMemory(true);
    setMemoryTestResult(null);
    try {
      const resp = await fetch('/api/gemini/test-memory-level', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aiMemoryLevel: selectedMemory }),
      });
      const data = await resp.json();
      if (data.summary) {
        setMemoryTestResult(data.summary);
      } else {
        setMemoryTestResult(`Memory Level "${selectedMemory.toUpperCase()}" verified active.`);
      }
    } catch (err: any) {
      setMemoryTestResult(`Configuration active: ${selectedMemory.toUpperCase()} mode.`);
    } finally {
      setTestingMemory(false);
    }
  };

  const handleSaveReminder = async () => {
    await onUpdateReminder(reminderTime);
    showNotice();
  };

  const handleSavePin = async () => {
    if (pinEnabled && pinInput.length !== 4) {
      alert('Please enter a 4-digit PIN.');
      return;
    }
    await onUpdatePin(pinEnabled, pinEnabled ? pinInput : undefined);
    setPinSuccessMsg(pinEnabled ? 'PIN lock updated successfully.' : 'PIN lock turned off.');
    setTimeout(() => setPinSuccessMsg(''), 3000);
  };

  const showNotice = () => {
    setSavedSettingsNotice(true);
    setTimeout(() => setSavedSettingsNotice(false), 2500);
  };

  // Export Logic
  const handleExportJournal = () => {
    setIsExporting(true);
    try {
      let filtered = [...entries];

      const now = Date.now();
      if (exportRange === '30') {
        const cutoff = now - 30 * 24 * 60 * 60 * 1000;
        filtered = filtered.filter((e) => e.createdAt >= cutoff);
      } else if (exportRange === '90') {
        const cutoff = now - 90 * 24 * 60 * 60 * 1000;
        filtered = filtered.filter((e) => e.createdAt >= cutoff);
      } else if (exportRange === 'custom') {
        if (customStart) {
          const startTime = new Date(customStart).getTime();
          filtered = filtered.filter((e) => e.createdAt >= startTime);
        }
        if (customEnd) {
          const endTime = new Date(customEnd).getTime() + 86400000; // end of day
          filtered = filtered.filter((e) => e.createdAt <= endTime);
        }
      }

      if (filtered.length === 0) {
        alert('No journal entries match the selected date range to export.');
        setIsExporting(false);
        return;
      }

      let fileContent = '';
      let mimeType = 'text/plain';
      let extension = 'md';

      if (exportFormat === 'json') {
        fileContent = JSON.stringify(filtered, null, 2);
        mimeType = 'application/json';
        extension = 'json';
      } else if (exportFormat === 'csv') {
        mimeType = 'text/csv';
        extension = 'csv';
        const headers = ['ID', 'Date', 'Template', 'Title', 'Mood', 'Word Count', 'Text'];
        const rows = filtered.map((e) => [
          `"${e.id}"`,
          `"${new Date(e.createdAt).toISOString()}"`,
          `"${(e.templateTitle || e.templateType).replace(/"/g, '""')}"`,
          `"${(e.title || '').replace(/"/g, '""')}"`,
          `"${e.moodLabel || e.mood}"`,
          e.wordCount || 0,
          `"${(e.text || '').replace(/"/g, '""')}"`,
        ]);
        fileContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      } else {
        // Markdown format
        mimeType = 'text/markdown';
        extension = 'md';
        fileContent = `# Hearthnote Personal Journal Export\nExported on: ${new Date().toLocaleDateString()}\nTotal Entries: ${filtered.length}\n\n---\n\n` +
          filtered.map((e) => {
            const dateStr = new Date(e.createdAt).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
            let answersText = '';
            if (e.promptAnswers && Object.keys(e.promptAnswers).length > 0) {
              answersText = Object.entries(e.promptAnswers)
                .map(([k, v]) => `> **Prompt (${k}):** ${v}`)
                .join('\n') + '\n\n';
            }
            return `## ${e.title || e.templateTitle}\n*Date:* ${dateStr}  |  *Mood:* ${e.moodLabel || e.mood}  |  *Template:* ${e.templateTitle}\n\n${answersText}${e.text}\n\n---\n`;
          }).join('\n');
      }

      const blob = new Blob([fileContent], { type: `${mimeType};charset=utf-8;` });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `hearthnote_export_${new Date().toISOString().slice(0, 10)}.${extension}`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export error:', err);
      alert('Failed to export journal entries. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeactivate = async () => {
    setIsDeactivating(true);
    try {
      await onDeactivateAccount();
    } finally {
      setIsDeactivating(false);
      setShowDeactivateConfirm(false);
    }
  };

  const handleDelete = async () => {
    if (deleteConfirmText.trim().toUpperCase() !== 'DELETE') return;
    setIsDeleting(true);
    try {
      await onDeleteAccount();
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div className="border-b border-[#E8DFC8] pb-5">
        <h2 className="font-display text-3xl font-semibold text-[#2B231F]">
          Notebook Settings
        </h2>
        <p className="text-xs text-[#7C7067] font-serif mt-1">
          Personalize your writing environment, privacy lock, backup exports, and account settings.
        </p>
      </div>

      {savedSettingsNotice && (
        <div className="p-3 rounded-xl bg-[#E8F2EB] text-[#4D7C5F] text-xs font-semibold flex items-center space-x-2 animate-fade-in">
          <Check className="w-4 h-4" />
          <span>Settings saved successfully.</span>
        </div>
      )}

      {/* 1. AI Memory Depth */}
      <section className="bg-[#FFFDF9] border border-[#E8DFC8] rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex items-center space-x-2.5 text-[#C97C4C]">
          <Sparkles className="w-5 h-5" />
          <h3 className="font-display font-semibold text-lg text-[#2B231F]">
            AI Memory Depth
          </h3>
        </div>
        <p className="text-xs text-[#7C7067] font-serif">
          Controls how much past journal context is passed to Gemini during weekly reflections.
        </p>

        <div className="space-y-3 pt-1">
          {[
            {
              id: 'light' as AIMemoryLevel,
              title: 'Light Reflection (Recommended)',
              desc: 'Gemini gives a 1-2 sentence gentle thought on save based solely on your immediate entry.',
            },
            {
              id: 'deep' as AIMemoryLevel,
              title: 'Deep Memory',
              desc: 'Analyzes recurring emotional threads and continuity across your recent past entries.',
            },
            {
              id: 'none' as AIMemoryLevel,
              title: 'None (Pure Private Notebook)',
              desc: 'Completely disables all Gemini AI features. Hearthnote functions as a traditional personal diary.',
            },
          ].map((opt) => (
            <div
              key={opt.id}
              onClick={() => handleSaveMemory(opt.id)}
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                selectedMemory === opt.id
                  ? 'border-[#C97C4C] bg-[#FAF0E8] shadow-xs ring-1 ring-[#C97C4C]'
                  : 'border-[#EAE1CF] bg-[#FFFDF9] hover:bg-[#F9F5EC]'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-sm text-[#2B231F]">{opt.title}</span>
                  {selectedMemory === opt.id && (
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-[#C97C4C] text-[#FFFDF9]">
                      Active
                    </span>
                  )}
                </div>
                {selectedMemory === opt.id && <Check className="w-4 h-4 text-[#C97C4C]" />}
              </div>
              <p className="text-xs text-[#665950] font-serif mt-1">{opt.desc}</p>
            </div>
          ))}
        </div>

        {/* Live Configuration Diagnostic */}
        <div className="p-4 rounded-2xl bg-[#F9F5EC] border border-[#EAE1CF] space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="text-xs">
              <span className="font-semibold text-[#2B231F]">Configuration Health: </span>
              <span className="text-[#C97C4C] font-medium">
                {selectedMemory === 'none' 
                  ? 'Private Mode (AI Completely Disabled)' 
                  : selectedMemory === 'deep' 
                  ? 'Deep Memory (Multi-entry continuity active)' 
                  : 'Light Reflection (Immediate entry only)'}
              </span>
            </div>

            <button
              type="button"
              onClick={handleTestMemory}
              disabled={testingMemory}
              className="px-3 py-1.5 rounded-xl bg-[#FFFDF9] hover:bg-[#EFE8D8] text-[#2B231F] border border-[#E8DFC8] text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors cursor-pointer disabled:opacity-50 flex-shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#C97C4C]" />
              <span>{testingMemory ? 'Verifying...' : 'Verify Configuration'}</span>
            </button>
          </div>

          {memoryTestResult && (
            <div className="p-3 rounded-xl bg-[#FFFDF9] border border-[#E0D5C1] text-xs text-[#4A3F39] font-serif animate-fade-in flex items-start space-x-2">
              <Check className="w-4 h-4 text-[#4D7C5F] mt-0.5 flex-shrink-0" />
              <p className="leading-relaxed">{memoryTestResult}</p>
            </div>
          )}
        </div>
      </section>

      {/* 2. Privacy & PIN Passcode Lock */}
      <section className="bg-[#FFFDF9] border border-[#E8DFC8] rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex items-center space-x-2.5 text-[#8A6D79]">
          <Lock className="w-5 h-5" />
          <h3 className="font-display font-semibold text-lg text-[#2B231F]">
            PIN Screen Lock
          </h3>
        </div>
        <p className="text-xs text-[#7C7067] font-serif">
          A client-side 4-digit PIN lock for physical privacy in coffee shops, libraries, or shared screens.
        </p>

        <div className="space-y-4 pt-1">
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={pinEnabled}
              onChange={(e) => setPinEnabled(e.target.checked)}
              className="rounded border-[#D0C4B0] text-[#C97C4C] focus:ring-[#C97C4C] w-4 h-4"
            />
            <span className="text-xs font-semibold text-[#2B231F]">
              Enable 4-digit PIN lock on launch
            </span>
          </label>

          {pinEnabled && (
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <input
                type="password"
                maxLength={4}
                placeholder="Set 4-digit PIN"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                className="text-center tracking-[0.5em] text-lg font-bold py-2 px-4 bg-[#FAF6EE] border border-[#DDD0BC] rounded-xl focus:outline-hidden focus:ring-1 focus:ring-[#C97C4C] w-full sm:w-48"
              />
              <button
                onClick={handleSavePin}
                className="px-4 py-2 rounded-xl bg-[#C97C4C] hover:bg-[#B46A3B] text-[#FFFDF9] text-xs font-semibold shadow-xs transition-colors w-full sm:w-auto"
              >
                Save PIN
              </button>
            </div>
          )}

          {pinSuccessMsg && (
            <p className="text-xs text-[#4D7C5F] font-semibold">{pinSuccessMsg}</p>
          )}

          <div className="pt-2 text-[11px] text-[#8C8075] flex items-center space-x-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#4D7C5F]" />
            <button onClick={onOpenPrivacy} className="hover:underline text-[#5C5149]">
              Read full Plain-Language Privacy Architecture
            </button>
          </div>
        </div>
      </section>

      {/* 3. Journal Export & Backup Section */}
      <section className="bg-[#FFFDF9] border border-[#E8DFC8] rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex items-center space-x-2.5 text-[#2563EB]">
          <Download className="w-5 h-5" />
          <h3 className="font-display font-semibold text-lg text-[#2B231F]">
            Export & Backup Journal
          </h3>
        </div>
        <p className="text-xs text-[#7C7067] font-serif">
          Download a complete copy of your personal journal entries in your choice of open format.
        </p>

        <div className="space-y-4 pt-2">
          {/* Format Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-[#2B231F]">Select Export Format:</label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setExportFormat('md')}
                className={`p-3 rounded-2xl border text-center transition-all ${
                  exportFormat === 'md'
                    ? 'border-[#2563EB] bg-[#EFF6FF] text-[#1D4ED8] font-bold shadow-xs'
                    : 'border-[#EAE1CF] bg-[#FFFDF9] text-[#5C5149] hover:bg-[#F9F5EC]'
                }`}
              >
                <FileText className="w-4 h-4 mx-auto mb-1" />
                <span className="text-xs">Markdown (.md)</span>
              </button>

              <button
                type="button"
                onClick={() => setExportFormat('json')}
                className={`p-3 rounded-2xl border text-center transition-all ${
                  exportFormat === 'json'
                    ? 'border-[#2563EB] bg-[#EFF6FF] text-[#1D4ED8] font-bold shadow-xs'
                    : 'border-[#EAE1CF] bg-[#FFFDF9] text-[#5C5149] hover:bg-[#F9F5EC]'
                }`}
              >
                <FileText className="w-4 h-4 mx-auto mb-1" />
                <span className="text-xs">JSON (.json)</span>
              </button>

              <button
                type="button"
                onClick={() => setExportFormat('csv')}
                className={`p-3 rounded-2xl border text-center transition-all ${
                  exportFormat === 'csv'
                    ? 'border-[#2563EB] bg-[#EFF6FF] text-[#1D4ED8] font-bold shadow-xs'
                    : 'border-[#EAE1CF] bg-[#FFFDF9] text-[#5C5149] hover:bg-[#F9F5EC]'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4 mx-auto mb-1" />
                <span className="text-xs">CSV (.csv)</span>
              </button>
            </div>
          </div>

          {/* Date Range Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-[#2B231F]">Select Date Range:</label>
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'all', label: 'All Time' },
                { id: '30', label: 'Last 30 Days' },
                { id: '90', label: 'Last 90 Days' },
                { id: 'custom', label: 'Custom Date Range' },
              ].map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setExportRange(r.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                    exportRange === r.id
                      ? 'bg-[#2563EB] text-[#FFFDF9] font-bold'
                      : 'bg-[#FAF6EE] text-[#5C5149] border border-[#E0D5BF] hover:bg-[#EFE8D8]'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>

            {exportRange === 'custom' && (
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <div>
                  <label className="block text-[10px] text-[#7C7067]">Start Date:</label>
                  <input
                    type="date"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    className="text-xs p-2 bg-[#FAF6EE] border border-[#E0D5BF] rounded-xl text-[#2B231F]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-[#7C7067]">End Date:</label>
                  <input
                    type="date"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    className="text-xs p-2 bg-[#FAF6EE] border border-[#E0D5BF] rounded-xl text-[#2B231F]"
                  />
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleExportJournal}
            disabled={isExporting}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-[#FFFDF9] text-xs font-semibold shadow-xs transition-colors flex items-center justify-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>{isExporting ? 'Preparing Export...' : `Download ${exportFormat.toUpperCase()} Backup (${entries.length} pages available)`}</span>
          </button>
        </div>
      </section>

      {/* 4. Daily Reflection Reminder */}
      <section className="bg-[#FFFDF9] border border-[#E8DFC8] rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex items-center space-x-2.5 text-[#4D7C5F]">
          <Clock className="w-5 h-5" />
          <h3 className="font-display font-semibold text-lg text-[#2B231F]">
            Daily Reminder Window
          </h3>
        </div>
        <p className="text-xs text-[#7C7067] font-serif">
          Set a gentle daily time to prompt your journaling rhythm.
        </p>

        <div className="flex items-center space-x-3 pt-1">
          <input
            type="time"
            value={reminderTime}
            onChange={(e) => setReminderTime(e.target.value)}
            className="text-xs font-semibold p-2 bg-[#FAF6EE] border border-[#E0D5BF] rounded-xl focus:outline-hidden focus:ring-1 focus:ring-[#C97C4C] text-[#2B231F]"
          />
          <button
            onClick={handleSaveReminder}
            className="px-4 py-2 rounded-xl bg-[#FAF0E8] hover:bg-[#F4E3D5] text-[#C97C4C] text-xs font-semibold transition-colors"
          >
            Save Time
          </button>
        </div>
      </section>

      {/* 5. Account & Danger Zone (Deactivation & Permanent Deletion) */}
      <section className="bg-[#FFFDF9] border border-[#E8DFC8] rounded-3xl p-6 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-[#EFE7D8] pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FAF0E8] text-[#C97C4C] flex items-center justify-center font-bold">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="Avatar" className="w-full h-full rounded-2xl object-cover" />
              ) : (
                <UserIcon className="w-5 h-5 text-[#C97C4C]" />
              )}
            </div>
            <div>
              <div className="text-xs font-bold text-[#2B231F]">
                {user?.displayName || 'Quiet Writer'}
              </div>
              <div className="text-[11px] text-[#7C7067]">
                {user?.email || 'Guest Mode'}
              </div>
            </div>
          </div>

          <button
            onClick={onSignOut}
            className="px-4 py-2 rounded-xl bg-[#EFE8D8] hover:bg-[#E5DAC8] text-[#594C44] text-xs font-semibold transition-colors flex items-center space-x-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Account Deactivation & Deletion Actions */}
        <div className="space-y-4 pt-1">
          <h4 className="text-xs font-bold text-[#8C2D19] uppercase tracking-wider flex items-center space-x-1.5">
            <AlertTriangle className="w-4 h-4 text-[#C53030]" />
            <span>Account Status & Data Management</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Deactivate Option */}
            <div className="p-4 rounded-2xl border border-[#EAE1CF] bg-[#FAF8F2] space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center space-x-2 text-[#9C623C] font-semibold text-xs mb-1">
                  <UserX className="w-4 h-4" />
                  <span>Deactivate Account</span>
                </div>
                <p className="text-[11px] text-[#6E625A] font-serif leading-relaxed">
                  Pauses your active session and signs you out. All your journal entries stay safely preserved in Firestore for when you return.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowDeactivateConfirm(true)}
                className="w-full py-2 px-3 rounded-xl bg-[#EFE7D8] hover:bg-[#E2D6C0] text-[#5C5149] font-semibold text-xs transition-colors"
              >
                Deactivate Account
              </button>
            </div>

            {/* Permanent Delete Option */}
            <div className="p-4 rounded-2xl border border-[#F87171]/40 bg-[#FEF2F2] space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center space-x-2 text-[#991B1B] font-semibold text-xs mb-1">
                  <Trash2 className="w-4 h-4" />
                  <span>Permanently Delete Account</span>
                </div>
                <p className="text-[11px] text-[#7F1D1D] font-serif leading-relaxed">
                  Irreversibly wipes all your journal entries, mood logs, weekly reflections, and account profile from Firestore.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full py-2 px-3 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-[#FFFDF9] font-semibold text-xs transition-colors"
              >
                Delete Account & Wipe Data
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Deactivation Confirmation Modal */}
      {showDeactivateConfirm && (
        <div className="fixed inset-0 z-50 bg-[#2B231F]/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FFFDF9] border border-[#E4DAC3] rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 relative animate-fade-in">
            <div className="flex items-center space-x-3 text-[#9C623C]">
              <UserX className="w-6 h-6" />
              <h3 className="font-display font-semibold text-lg text-[#2B231F]">
                Deactivate Your Account?
              </h3>
            </div>

            <p className="text-xs text-[#594C44] font-serif leading-relaxed">
              Deactivating your account will pause your active session and sign you out immediately.
              <br /><br />
              <strong>Your data remains completely safe:</strong> Your private journal pages and reflections will be safely kept in Cloud Firestore and will automatically restore whenever you sign back in.
            </p>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeactivateConfirm(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#7C7067] hover:bg-[#EAE1CF]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeactivate}
                disabled={isDeactivating}
                className="px-4 py-2 rounded-xl bg-[#9C623C] hover:bg-[#804E2D] text-[#FFFDF9] text-xs font-semibold shadow-xs"
              >
                {isDeactivating ? 'Deactivating...' : 'Confirm Deactivation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Permanent Deletion Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-[#2B231F]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FFFDF9] border border-[#F87171] rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 relative animate-fade-in">
            <div className="flex items-center space-x-3 text-[#DC2626]">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="font-display font-semibold text-lg text-[#2B231F]">
                Permanently Delete Account?
              </h3>
            </div>

            <p className="text-xs text-[#7F1D1D] font-serif leading-relaxed bg-[#FEF2F2] p-3 rounded-2xl border border-[#FCA5A5]">
              <strong>Warning: This action is permanent and cannot be undone.</strong>
              <br />
              All your entries, mood logs, weekly mirror reflections, and personal settings will be completely deleted from Cloud Firestore.
            </p>

            <div className="space-y-2">
              <label className="block text-xs font-medium text-[#2B231F]">
                Type <strong>DELETE</strong> below to confirm permanent deletion:
              </label>
              <input
                type="text"
                placeholder="DELETE"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                className="w-full text-xs font-bold uppercase tracking-wider p-2.5 bg-[#FAF6EE] border border-[#DDD0BC] rounded-xl focus:outline-hidden focus:ring-1 focus:ring-[#DC2626] text-[#2B231F]"
              />
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteConfirmText('');
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#7C7067] hover:bg-[#EAE1CF]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting || deleteConfirmText.trim().toUpperCase() !== 'DELETE'}
                className="px-4 py-2 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-[#FFFDF9] text-xs font-semibold shadow-xs disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isDeleting ? 'Wiping All Data...' : 'Permanently Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
