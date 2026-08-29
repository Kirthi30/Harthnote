import React, { useState } from 'react';
import { Lock, Delete, ArrowRight, Shield } from 'lucide-react';

interface PinLockScreenProps {
  expectedPin: string;
  onUnlock: () => void;
  onSignOutOrReset: () => void;
  userName: string;
}

export const PinLockScreen: React.FC<PinLockScreenProps> = ({
  expectedPin,
  onUnlock,
  onSignOutOrReset,
  userName,
}) => {
  const [enteredPin, setEnteredPin] = useState('');
  const [errorShake, setErrorShake] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleDigit = (digit: string) => {
    if (enteredPin.length < 4) {
      const next = enteredPin + digit;
      setEnteredPin(next);
      setErrorMsg('');

      if (next.length === 4) {
        if (next === expectedPin) {
          onUnlock();
        } else {
          setErrorShake(true);
          setErrorMsg('Incorrect PIN. Please try again.');
          setTimeout(() => {
            setErrorShake(false);
            setEnteredPin('');
          }, 600);
        }
      }
    }
  };

  const handleDelete = () => {
    setEnteredPin((prev) => prev.slice(0, -1));
    setErrorMsg('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#FAF6EE] text-[#4A3F39] flex flex-col items-center justify-center p-6 selection:bg-[#C97C4C]/25">
      <div className="max-w-xs w-full text-center space-y-7">
        {/* Brand & Lock Icon */}
        <div className="space-y-2">
          <div className="w-14 h-14 rounded-3xl bg-[#FFFDF9] border border-[#E8DFC8] text-[#C97C4C] mx-auto flex items-center justify-center shadow-xs">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="font-display font-semibold text-2xl text-[#2B231F]">
            Hearthnote Locked
          </h2>
          <p className="text-xs text-[#7C7067] font-serif">
            Welcome back, {userName.split(' ')[0] || 'Writer'}. Enter your 4-digit PIN to open your notebook.
          </p>
        </div>

        {/* 4 PIN Dots */}
        <div className={`flex items-center justify-center space-x-4 py-2 ${errorShake ? 'animate-bounce' : ''}`}>
          {[0, 1, 2, 3].map((i) => {
            const isFilled = i < enteredPin.length;
            return (
              <div
                key={i}
                className={`w-4 h-4 rounded-full transition-all duration-200 ${
                  isFilled
                    ? 'bg-[#C97C4C] scale-110 shadow-xs'
                    : 'bg-[#E5DAC8] border border-[#D0C4B0]'
                }`}
              />
            );
          })}
        </div>

        {errorMsg && (
          <p className="text-xs font-semibold text-[#B91C1C] animate-fade-in">
            {errorMsg}
          </p>
        )}

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-3">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
            <button
              key={d}
              onClick={() => handleDigit(d)}
              className="h-14 rounded-2xl bg-[#FFFDF9] hover:bg-[#F4ECE0] active:bg-[#EAE0CF] border border-[#E8DFC8] text-xl font-semibold text-[#2B231F] shadow-xs transition-colors cursor-pointer select-none"
            >
              {d}
            </button>
          ))}
          <div />
          <button
            onClick={() => handleDigit('0')}
            className="h-14 rounded-2xl bg-[#FFFDF9] hover:bg-[#F4ECE0] active:bg-[#EAE0CF] border border-[#E8DFC8] text-xl font-semibold text-[#2B231F] shadow-xs transition-colors cursor-pointer select-none"
          >
            0
          </button>
          <button
            onClick={handleDelete}
            className="h-14 rounded-2xl bg-[#FFFDF9] hover:bg-[#F4ECE0] active:bg-[#EAE0CF] border border-[#E8DFC8] text-sm font-semibold text-[#7C7067] shadow-xs transition-colors flex items-center justify-center cursor-pointer select-none"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        {/* Reset / Sign Out */}
        <div className="pt-4">
          <button
            onClick={onSignOutOrReset}
            className="text-xs text-[#8C8075] hover:text-[#2B231F] hover:underline"
          >
            Forgot PIN / Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};
