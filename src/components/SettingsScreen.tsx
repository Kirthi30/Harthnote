import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Sparkles, 
  Clock, 
  LogOut, 
  User as UserIcon,
  Check
} from 'lucide-react';
import type { AIMemoryLevel, UserProfile } from '../types';

interface SettingsScreenProps {
  user: any;
  userProfile: UserProfile | null;
  onUpdateMemoryLevel: (level: AIMemoryLevel) => Promise<void>;
  onUpdatePin: (enabled: boolean, pin?: string) => Promise<void>;
  onUpdateReminder: (time: string) => Promise<void>;
  onOpenPrivacy: () => void;
  onSignOut: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  user,
  userProfile,
  onUpdateMemoryLevel,
  onUpdatePin,
  onUpdateReminder,
  onOpenPrivacy,
  onSignOut,
}) => {
  const [selectedMemory, setSelectedMemory] = useState<AIMemoryLevel>(userProfile?.aiMemoryLevel || 'light');
  const [reminderTime, setReminderTime] = useState(userProfile?.reminderTime || '20:30');
  
  // PIN state
  const [pinEnabled, setPinEnabled] = useState(Boolean(userProfile?.pinEnabled));
  const [pinInput, setPinInput] = useState('');
  const [pinSuccessMsg, setPinSuccessMsg] = useState('');
  const [savedSettingsNotice, setSavedSettingsNotice] = useState(false);

  const handleSaveMemory = async (level: AIMemoryLevel) => {
    setSelectedMemory(level);
    await onUpdateMemoryLevel(level);
    showNotice();
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

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div className="border-b border-[#E8DFC8] pb-5">
        <h2 className="font-display text-3xl font-semibold text-[#2B231F]">
          Notebook Settings
        </h2>
        <p className="text-xs text-[#7C7067] font-serif mt-1">
          Personalize your writing environment, privacy lock, and AI memory depth.
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
              desc: 'Gemini gives a 1-2 sentence gentle thought on save and summarizes weekly mood trends.',
            },
            {
              id: 'deep' as AIMemoryLevel,
              title: 'Deep Memory',
              desc: 'Analyzes long-term patterns, recurring emotional knots, and deep growth themes over multiple weeks.',
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
                <span className="font-semibold text-sm text-[#2B231F]">{opt.title}</span>
                {selectedMemory === opt.id && <Check className="w-4 h-4 text-[#C97C4C]" />}
              </div>
              <p className="text-xs text-[#665950] font-serif mt-1">{opt.desc}</p>
            </div>
          ))}
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

      {/* 3. Daily Reflection Reminder */}
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

      {/* 4. Account & Sign Out */}
      <section className="bg-[#FFFDF9] border border-[#E8DFC8] rounded-3xl p-6 shadow-xs flex items-center justify-between">
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
      </section>
    </div>
  );
};
