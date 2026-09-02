import React from 'react';
import { 
  BookOpen, 
  Sparkles, 
  ShieldCheck, 
  Lock, 
  Calendar, 
  Heart, 
  ArrowRight,
  Flame
} from 'lucide-react';
import hearthnoteLogo from '../assets/images/app_logo.png';

interface LandingScreenProps {
  onSignIn: () => void;
  onExploreDemo?: () => void;
  isLoading: boolean;
  onOpenPrivacy: () => void;
}

export const LandingScreen: React.FC<LandingScreenProps> = ({
  onSignIn,
  isLoading,
  onOpenPrivacy,
}) => {
  return (
    <div className="min-h-screen bg-[#FAF6EE] text-[#4A3F39] flex flex-col justify-between selection:bg-[#C97C4C]/25">
      {/* Top Bar */}
      <header className="max-w-5xl mx-auto w-full px-6 py-6 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-11 h-11 rounded-2xl border border-[#E8DFC8] bg-[#FFFDF9] shadow-sm flex items-center justify-center overflow-hidden flex-shrink-0">
            <img 
              src={hearthnoteLogo} 
              alt="Hearthnote Logo" 
              className="w-full h-full object-cover scale-[1.75]"
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <h1 className="font-display font-semibold text-xl text-[#2B231F] tracking-tight">Hearthnote</h1>
            <p className="text-xs text-[#7C7067]">Warm personal notebook</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={onOpenPrivacy}
            className="text-xs text-[#7C7067] hover:text-[#2B231F] font-medium transition-colors flex items-center space-x-1"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#4D7C5F]" />
            <span>Privacy Promise</span>
          </button>
        </div>
      </header>

      {/* Main Hero */}
      <main className="max-w-4xl mx-auto px-6 py-12 flex flex-col items-center text-center my-auto">
        <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-[#EFE6D6] text-[#7C6353] text-xs font-medium mb-6 border border-[#E2D6C0] shadow-2xs">
          <Flame className="w-3.5 h-3.5 text-[#C97C4C]" />
          <span>Where quiet thoughts find a warm home</span>
        </div>

        <h2 className="font-display text-4xl sm:text-5xl md:text-6xl text-[#2B231F] font-medium tracking-tight leading-[1.15] max-w-3xl mb-6">
          A warm place to keep your thoughts.
        </h2>

        <p className="text-base sm:text-lg text-[#665950] max-w-2xl font-serif leading-relaxed mb-10">
          A distraction-free notebook built for quiet self-discovery. Write with gentle templates, track your emotional flow, and receive quiet weekly reflections — without message bubbles or noisy feeds.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full max-w-md justify-center mb-12">
          <button
            id="google-signin-btn"
            onClick={onSignIn}
            disabled={isLoading}
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-[#C97C4C] hover:bg-[#B46A3B] text-[#FFFDF9] font-medium text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-3 disabled:opacity-50"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#FFF" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#FFF" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FFF" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#FFF" />
            </svg>
            <span>{isLoading ? 'Opening sign in...' : 'Sign in with Google'}</span>
          </button>
        </div>

        {/* 3 Core Principles */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl text-left">
          <div className="p-5 rounded-2xl bg-[#FFFDF9] border border-[#E8DFC8] shadow-sm">
            <div className="w-8 h-8 rounded-xl bg-[#EAE3D4] text-[#C97C4C] flex items-center justify-center mb-3">
              <BookOpen className="w-4 h-4" />
            </div>
            <h3 className="font-display font-semibold text-base text-[#2B231F] mb-1">
              Your Private Sanctuary
            </h3>
            <p className="text-xs text-[#6E625A] leading-relaxed">
              No back-and-forth chatter or AI interruptions. Your pages stay yours, supported by gentle guiding questions.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#FFFDF9] border border-[#E8DFC8] shadow-sm">
            <div className="w-8 h-8 rounded-xl bg-[#E8F2EB] text-[#4D7C5F] flex items-center justify-center mb-3">
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 className="font-display font-semibold text-base text-[#2B231F] mb-1">
              Quiet Weekly Mirrors
            </h3>
            <p className="text-xs text-[#6E625A] leading-relaxed">
              Gemini reads across your week only when invited to gently surface recurring themes and open reflection questions.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#FFFDF9] border border-[#E8DFC8] shadow-sm">
            <div className="w-8 h-8 rounded-xl bg-[#F4ECEF] text-[#8A6D79] flex items-center justify-center mb-3">
              <Lock className="w-4 h-4" />
            </div>
            <h3 className="font-display font-semibold text-base text-[#2B231F] mb-1">
              User-Isolated & Private
            </h3>
            <p className="text-xs text-[#6E625A] leading-relaxed">
              Protected by Firestore database rules locked strictly to your account UID. Optional 4-digit PIN lock for screen privacy.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#E8DFC8] py-6 px-6 text-center text-xs text-[#8C8075]">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Hearthnote · Made for calm reflection</span>
          <div className="flex items-center space-x-4">
            <button onClick={onOpenPrivacy} className="hover:underline">Privacy & Security</button>
            <span>·</span>
            <span>Non-clinical companion</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
