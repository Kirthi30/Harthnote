import React from 'react';
import { 
  BookOpen, 
  PenLine, 
  Calendar, 
  Sparkles, 
  Settings, 
  Lock, 
  Flame, 
  ShieldCheck, 
  LogOut, 
  User as UserIcon 
} from 'lucide-react';
import type { AppView, UserProfile } from '../types';
import hearthnoteLogo from '../assets/images/app_logo.png';

interface NavigationProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  user: any;
  userProfile: UserProfile | null;
  onLockApp?: () => void;
  onOpenPrivacy: () => void;
  onSignOut: () => void;
  streakCount: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentView,
  onNavigate,
  user,
  userProfile,
  onLockApp,
  onOpenPrivacy,
  onSignOut,
  streakCount,
}) => {
  const navItems: Array<{ id: AppView; label: string; icon: React.FC<{ className?: string }> }> = [
    { id: 'home', label: 'Home', icon: BookOpen },
    { id: 'write', label: 'Write', icon: PenLine },
    { id: 'history', label: 'History', icon: Calendar },
    { id: 'insights', label: 'Insights', icon: Sparkles },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <>
      {/* Desktop Left Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-[#E8DFC8] bg-[#F7F2E7] p-5 h-screen sticky top-0 justify-between select-none">
        <div className="flex flex-col space-y-6">
          {/* Brand Header */}
          <div 
            onClick={() => onNavigate('home')}
            className="flex items-center space-x-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl border border-[#E8DFC8] bg-[#FFFDF9] shadow-xs flex items-center justify-center overflow-hidden flex-shrink-0 group-hover:scale-105 transition-transform">
              <img 
                src={hearthnoteLogo} 
                alt="Hearthnote Logo" 
                className="w-full h-full object-cover scale-[1.75]"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <h1 className="font-display font-semibold text-lg text-[#2B231F] leading-tight">Hearthnote</h1>
              <p className="text-xs text-[#7C7067]">A warm place for thoughts</p>
            </div>
          </div>

          {/* Gentle Streak Dot Card */}
          <div className="p-3.5 rounded-xl bg-[#EFE8D8]/70 border border-[#E2D8C3] flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#C97C4C]/15 text-[#C97C4C] flex items-center justify-center">
                <Flame className="w-4 h-4 fill-[#C97C4C]/30" />
              </div>
              <div>
                <div className="text-xs font-semibold text-[#2B231F]">
                  {streakCount} {streakCount === 1 ? 'Day' : 'Days'} Streak
                </div>
                <div className="text-[11px] text-[#7C7067]">Quiet consistency</div>
              </div>
            </div>
            <div className="flex space-x-1">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full ${
                    i < Math.min(streakCount, 5) ? 'bg-[#C97C4C]' : 'bg-[#D6CBB8]'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Nav Links */}
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-btn-${item.id}`}
                  onClick={() => onNavigate(item.id)}
                  className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-[#C97C4C] text-[#FFFDF9] shadow-sm'
                      : 'text-[#5C5149] hover:bg-[#EAE1CF] hover:text-[#2B231F]'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#FFFDF9]' : 'text-[#7C7067]'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Profile & Lock Actions */}
        <div className="pt-4 border-t border-[#E8DFC8] space-y-3">
          {userProfile?.pinEnabled && onLockApp && (
            <button
              onClick={onLockApp}
              className="w-full flex items-center justify-center space-x-2 py-2 px-3 rounded-lg text-xs font-medium text-[#7C7067] bg-[#EFE8D8] hover:bg-[#E5DCC8] hover:text-[#2B231F] transition-colors"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Lock Notebook (PIN)</span>
            </button>
          )}

          <div className="flex items-center justify-between px-1">
            <div className="flex items-center space-x-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-[#E2D8C3] text-[#5C5149] flex items-center justify-center font-medium text-xs flex-shrink-0">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <UserIcon className="w-4 h-4 text-[#7C7067]" />
                )}
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-[#2B231F] truncate">
                  {user?.displayName || 'Quiet Writer'}
                </p>
                <p className="text-[10px] text-[#7C7067] truncate">
                  {user?.email || 'Guest Mode'}
                </p>
              </div>
            </div>

            <button
              onClick={onSignOut}
              title="Sign Out"
              className="p-1.5 text-[#7C7067] hover:text-[#B46A3B] hover:bg-[#EAE1CF] rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={onOpenPrivacy}
            className="w-full text-center text-[11px] text-[#8C8075] hover:text-[#2B231F] hover:underline transition-colors flex items-center justify-center space-x-1 pt-1"
          >
            <ShieldCheck className="w-3 h-3 text-[#4D7C5F]" />
            <span>Private & Isolated</span>
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FAF6EE] border-t border-[#E8DFC8] px-3 py-2 flex items-center justify-around shadow-lg">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center py-1 px-2.5 rounded-lg transition-colors ${
                isActive ? 'text-[#C97C4C] font-semibold' : 'text-[#7C7067]'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-[#C97C4C]' : 'text-[#7C7067]'}`} />
              <span className="text-[10px] mt-0.5">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
