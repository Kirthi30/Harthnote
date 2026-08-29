import React, { useState } from 'react';
import { Sparkles, Lock, ArrowRight, Check, BookOpen, Shield } from 'lucide-react';
import type { AIMemoryLevel } from '../types';

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: (config: { aiMemoryLevel: AIMemoryLevel; pinEnabled: boolean; pin?: string }) => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onComplete }) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedMemory, setSelectedMemory] = useState<AIMemoryLevel>('light');
  const [enablePin, setEnablePin] = useState(false);
  const [pinCode, setPinCode] = useState('');
  const [pinError, setPinError] = useState('');

  if (!isOpen) return null;

  const handleNext = () => {
    if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    } else if (step === 3) {
      if (enablePin && pinCode.length !== 4) {
        setPinError('Please enter a 4-digit PIN or uncheck the box.');
        return;
      }
      onComplete({
        aiMemoryLevel: selectedMemory,
        pinEnabled: enablePin && pinCode.length === 4,
        pin: enablePin ? pinCode : undefined,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#2B231F]/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#FFFDF9] border border-[#E8DFC8] rounded-3xl max-w-lg w-full p-7 sm:p-8 shadow-xl text-[#4A3F39] relative overflow-hidden">
        {/* Step Indicator */}
        <div className="flex items-center justify-center space-x-2 mb-6">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                s === step ? 'w-8 bg-[#C97C4C]' : s < step ? 'w-4 bg-[#8A6D79]' : 'w-4 bg-[#EADFCE]'
              }`}
            />
          ))}
        </div>

        {/* Step 1: Welcome */}
        {step === 1 && (
          <div className="space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-[#FAF0E8] text-[#C97C4C] mx-auto flex items-center justify-center">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="font-display text-2xl font-semibold text-[#2B231F]">
              Welcome to your quiet space
            </h3>
            <p className="text-sm text-[#665950] font-serif leading-relaxed">
              Hearthnote is a distraction-free notebook built for thoughtful, calm self-reflection. 
              There are no chat bubbles, notifications, or unsolicited advice — just your thoughts on paper.
            </p>
            <div className="bg-[#F8F3EA] p-4 rounded-2xl border border-[#EADFCF] text-left text-xs space-y-2 mt-4 text-[#594C44]">
              <div className="flex items-center space-x-2">
                <Check className="w-3.5 h-3.5 text-[#4D7C5F] flex-shrink-0" />
                <span>Private & isolated in your own Firestore database</span>
              </div>
              <div className="flex items-center space-x-2">
                <Check className="w-3.5 h-3.5 text-[#4D7C5F] flex-shrink-0" />
                <span>5 gentle journaling templates for everyday clarity</span>
              </div>
              <div className="flex items-center space-x-2">
                <Check className="w-3.5 h-3.5 text-[#4D7C5F] flex-shrink-0" />
                <span>Optional once-a-week gentle reflection mirror</span>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: AI Memory Depth */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-[#E8F2EB] text-[#4D7C5F] mx-auto flex items-center justify-center mb-2">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="font-display text-2xl font-semibold text-[#2B231F]">
                How should AI assist you?
              </h3>
              <p className="text-xs text-[#665950] font-serif">
                Choose the memory depth that feels most comfortable for you. You can change this at any time in Settings.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <div
                onClick={() => setSelectedMemory('light')}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  selectedMemory === 'light'
                    ? 'border-[#C97C4C] bg-[#FAF0E8]/70 shadow-sm ring-1 ring-[#C97C4C]'
                    : 'border-[#E8DFC8] bg-[#FFFDF9] hover:bg-[#F9F5EC]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm text-[#2B231F]">Light Reflection (Recommended)</span>
                  {selectedMemory === 'light' && <Check className="w-4 h-4 text-[#C97C4C]" />}
                </div>
                <p className="text-xs text-[#665950] mt-1">
                  Gemini offers a brief 1-2 sentence gentle thought after you close an entry, and summarizes weekly mood trends.
                </p>
              </div>

              <div
                onClick={() => setSelectedMemory('deep')}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  selectedMemory === 'deep'
                    ? 'border-[#C97C4C] bg-[#FAF0E8]/70 shadow-sm ring-1 ring-[#C97C4C]'
                    : 'border-[#E8DFC8] bg-[#FFFDF9] hover:bg-[#F9F5EC]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm text-[#2B231F]">Deep Memory</span>
                  {selectedMemory === 'deep' && <Check className="w-4 h-4 text-[#C97C4C]" />}
                </div>
                <p className="text-xs text-[#665950] mt-1">
                  Synthesizes recurring long-term patterns, boundary habits, and deep reflection questions across multiple weeks.
                </p>
              </div>

              <div
                onClick={() => setSelectedMemory('none')}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  selectedMemory === 'none'
                    ? 'border-[#C97C4C] bg-[#FAF0E8]/70 shadow-sm ring-1 ring-[#C97C4C]'
                    : 'border-[#E8DFC8] bg-[#FFFDF9] hover:bg-[#F9F5EC]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm text-[#2B231F]">None (Offline / Pure Notebook)</span>
                  {selectedMemory === 'none' && <Check className="w-4 h-4 text-[#C97C4C]" />}
                </div>
                <p className="text-xs text-[#665950] mt-1">
                  Disables all AI processing entirely. Hearthnote acts purely as a traditional personal diary.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Optional PIN */}
        {step === 3 && (
          <div className="space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-[#F4ECEF] text-[#8A6D79] mx-auto flex items-center justify-center">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="font-display text-2xl font-semibold text-[#2B231F]">
              Optional Passcode Lock
            </h3>
            <p className="text-xs text-[#665950] font-serif leading-relaxed">
              Add a 4-digit code to quickly lock your notebook when stepping away from your screen or at a cafe.
            </p>

            <div className="bg-[#F8F3EA] p-4 rounded-2xl border border-[#EADFCF] text-left">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enablePin}
                  onChange={(e) => {
                    setEnablePin(e.target.checked);
                    if (!e.target.checked) setPinCode('');
                  }}
                  className="rounded border-[#D0C4B0] text-[#C97C4C] focus:ring-[#C97C4C] w-4 h-4"
                />
                <span className="text-xs font-semibold text-[#2B231F]">
                  Enable 4-digit screen lock PIN
                </span>
              </label>

              {enablePin && (
                <div className="mt-4 space-y-2">
                  <input
                    type="password"
                    maxLength={4}
                    placeholder="••••"
                    value={pinCode}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setPinCode(val);
                      if (val.length === 4) setPinError('');
                    }}
                    className="w-full text-center tracking-[0.6em] text-xl font-bold py-2 px-3 bg-[#FFFDF9] border border-[#DDD0BC] rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#C97C4C]"
                  />
                  {pinError && <p className="text-[11px] text-[#B91C1C] text-center">{pinError}</p>}
                </div>
              )}

              <div className="mt-3 flex items-start space-x-1.5 text-[11px] text-[#8C8075]">
                <Shield className="w-3.5 h-3.5 text-[#8A6D79] flex-shrink-0 mt-0.5" />
                <span>
                  Plain-language disclosure: This is a client-side screen lock for convenience, keeping casual onlookers away from open tabs.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="mt-7 flex items-center justify-between">
          {step > 1 ? (
            <button
              onClick={() => setStep((s) => (s - 1) as any)}
              className="text-xs font-medium text-[#7C7067] hover:text-[#2B231F] px-3 py-2"
            >
              Back
            </button>
          ) : (
            <div />
          )}

          <button
            onClick={handleNext}
            className="px-6 py-2.5 rounded-xl bg-[#C97C4C] hover:bg-[#B46A3B] text-[#FFFDF9] text-xs font-medium flex items-center space-x-2 shadow-sm transition-colors"
          >
            <span>{step === 3 ? 'Open My Notebook' : 'Continue'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
