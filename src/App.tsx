import React, { useState, useEffect } from 'react';
import { 
  auth, 
  signInWithGoogle, 
  logoutUser, 
  subscribeToAuthState, 
  saveJournalEntry, 
  deleteJournalEntry, 
  subscribeToUserEntries, 
  saveMoodLog, 
  subscribeToMoodLogs, 
  saveWeeklyReflection, 
  deleteWeeklyReflection,
  subscribeToWeeklyReflections, 
  saveUserProfile, 
  subscribeToUserProfile 
} from './firebase';
import type { 
  AppView, 
  JournalEntry, 
  MoodLog, 
  MoodType, 
  TemplateType, 
  UserProfile, 
  WeeklyReflection,
  AIMemoryLevel 
} from './types';
import { SAMPLE_ENTRIES, SAMPLE_WEEKLY_REFLECTION, MOODS } from './data/templates';

// Components
import { Navigation } from './components/Navigation';
import { LandingScreen } from './components/LandingScreen';
import { OnboardingModal } from './components/OnboardingModal';
import { HomeScreen } from './components/HomeScreen';
import { JournalEditor } from './components/JournalEditor';
import { HistoryScreen } from './components/HistoryScreen';
import { EntryDetailModal } from './components/EntryDetailModal';
import { EntrySavedModal } from './components/EntrySavedModal';
import { InsightsScreen } from './components/InsightsScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { PrivacyModal } from './components/PrivacyModal';
import { PinLockScreen } from './components/PinLockScreen';

// Helper: Calculate streak count dynamically based on the historical entries and mood logs records
const calculateStreakFromRecords = (
  entriesList: JournalEntry[],
  moodList: MoodLog[]
): number => {
  // Collect all distinct active calendar dates (YYYY-MM-DD) from both entries and mood logs
  const datesSet = new Set<string>();

  entriesList.forEach((e) => {
    if (e.createdAt) {
      const d = new Date(e.createdAt).toISOString().split('T')[0];
      datesSet.add(d);
    }
  });

  moodList.forEach((m) => {
    if (m.date) {
      datesSet.add(m.date);
    } else if (m.createdAt) {
      const d = new Date(m.createdAt).toISOString().split('T')[0];
      datesSet.add(d);
    }
  });

  if (datesSet.size === 0) return 0;

  const sortedDates = Array.from(datesSet).sort().reverse(); // newest first
  const today = new Date();
  const todayIso = today.toISOString().split('T')[0];

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayIso = yesterday.toISOString().split('T')[0];

  // Check if the user has an active streak (has logged today or yesterday)
  let currentCheckDate: Date;
  if (sortedDates.includes(todayIso)) {
    currentCheckDate = new Date(today);
  } else if (sortedDates.includes(yesterdayIso)) {
    currentCheckDate = new Date(yesterday);
  } else {
    // Streak broken (last activity was before yesterday)
    return 0;
  }

  let streak = 0;
  while (true) {
    const checkIso = currentCheckDate.toISOString().split('T')[0];
    if (datesSet.has(checkIso)) {
      streak += 1;
      // Step back one day
      currentCheckDate.setDate(currentCheckDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
};

// Generate dynamic sample data with consecutive dates ending today/yesterday for demo mode
const getDemoSampleData = () => {
  const todayTime = Date.now();
  const dayMs = 86400000;
  
  const demoEntries: JournalEntry[] = [
    {
      ...SAMPLE_ENTRIES[0],
      id: 'sample-entry-1',
      createdAt: todayTime - dayMs * 2,
      updatedAt: todayTime - dayMs * 2,
    },
    {
      ...SAMPLE_ENTRIES[1],
      id: 'sample-entry-2',
      createdAt: todayTime - dayMs * 1,
      updatedAt: todayTime - dayMs * 1,
    },
    {
      ...SAMPLE_ENTRIES[2],
      id: 'sample-entry-3',
      createdAt: todayTime,
      updatedAt: todayTime,
    },
  ];

  const todayIso = new Date().toISOString().split('T')[0];
  const yesterdayIso = new Date(todayTime - dayMs).toISOString().split('T')[0];
  const twoDaysAgoIso = new Date(todayTime - dayMs * 2).toISOString().split('T')[0];

  const demoMoods: MoodLog[] = [
    {
      id: 'mood-today',
      userId: 'guest-user',
      date: todayIso,
      mood: 'calm',
      moodLabel: 'Calm',
      createdAt: todayTime,
    },
    {
      id: 'mood-yesterday',
      userId: 'guest-user',
      date: yesterdayIso,
      mood: 'reflective',
      moodLabel: 'Reflective',
      createdAt: todayTime - dayMs,
    },
    {
      id: 'mood-two-days-ago',
      userId: 'guest-user',
      date: twoDaysAgoIso,
      mood: 'radiant',
      moodLabel: 'Radiant',
      createdAt: todayTime - dayMs * 2,
    },
  ];

  return { demoEntries, demoMoods, todayIso };
};

export const App: React.FC = () => {
  // Auth state
  const [user, setUser] = useState<any>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [isGuestMode, setIsGuestMode] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);

  // App Navigation
  const [currentView, setCurrentView] = useState<AppView>('home');
  const [selectedTemplateForWriting, setSelectedTemplateForWriting] = useState<TemplateType>('freewrite');
  const [selectedEntryForDetail, setSelectedEntryForDetail] = useState<JournalEntry | null>(null);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);

  // Data States
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [moodLogs, setMoodLogs] = useState<MoodLog[]>([]);
  const [weeklyReflections, setWeeklyReflections] = useState<WeeklyReflection[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Modals & Locks
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  // Post-save modal state
  const [savedModalEntry, setSavedModalEntry] = useState<JournalEntry | null>(null);
  const [savedModalReflection, setSavedModalReflection] = useState<string>('');
  const [isLoadingReflection, setIsLoadingReflection] = useState(false);
  const [isSavingEntry, setIsSavingEntry] = useState(false);
  const [isGeneratingWeekly, setIsGeneratingWeekly] = useState(false);

  // Error Banner
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Dynamic streak calculation based on actual entries and mood logs records
  const dynamicStreakCount = calculateStreakFromRecords(entries, moodLogs);
  const effectiveStreakCount = dynamicStreakCount > 0 ? dynamicStreakCount : (userProfile?.streakCount || 1);

  // 1. Subscribe to Firebase Auth
  useEffect(() => {
    const unsubscribe = subscribeToAuthState((currentUser) => {
      setUser(currentUser);
      setIsAuthChecking(false);

      if (currentUser) {
        setIsGuestMode(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // 2. Real-time Firestore Subscriptions for Logged-In User
  useEffect(() => {
    if (!user || isGuestMode) {
      if (isGuestMode && entries.length === 0) {
        // Populate guest mode with sample demo data
        const { demoEntries, demoMoods, todayIso } = getDemoSampleData();
        setEntries(demoEntries);
        setWeeklyReflections([SAMPLE_WEEKLY_REFLECTION]);
        setMoodLogs(demoMoods);
        setUserProfile({
          id: 'guest',
          displayName: 'Guest Writer',
          email: 'guest@hearthnote.app',
          aiMemoryLevel: 'light',
          pinEnabled: false,
          streakCount: 3,
          lastJournalDate: todayIso,
          createdAt: Date.now(),
        });
      }
      return;
    }

    const unsubProfile = subscribeToUserProfile(user.uid, (profile) => {
      setUserProfile(profile);
      if (!profile) {
        // Show onboarding if profile not created yet
        setShowOnboarding(true);
      } else if (profile.pinEnabled && profile.pinHash && !isLocked) {
        // Trigger PIN lock on fresh load if enabled
        const hasUnlockedSession = sessionStorage.getItem(`hearthnote_unlocked_${user.uid}`);
        if (!hasUnlockedSession) {
          setIsLocked(true);
        }
      }
    });

    const unsubEntries = subscribeToUserEntries(user.uid, (data) => {
      setEntries(data);
    }, (err) => {
      console.warn('Entries subscription error:', err);
    });

    const unsubMoods = subscribeToMoodLogs(user.uid, (data) => {
      setMoodLogs(data);
    }, (err) => {
      console.warn('Moods subscription error:', err);
    });

    const unsubWeekly = subscribeToWeeklyReflections(user.uid, (data) => {
      setWeeklyReflections(data);
    }, (err) => {
      console.warn('Weekly reflection error:', err);
    });

    return () => {
      unsubProfile();
      unsubEntries();
      unsubMoods();
      unsubWeekly();
    };
  }, [user, isGuestMode]);

  // Auth Handlers
  const handleSignIn = async () => {
    setAuthLoading(true);
    setErrorMessage(null);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      console.error('Sign in failed:', err);
      setErrorMessage(err?.message || 'Sign in failed. Please try again.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleExploreDemo = () => {
    setIsGuestMode(true);
    setUser({
      uid: 'guest-user',
      displayName: 'Eleanor Vance',
      email: 'eleanor@example.com',
    });
    const { demoEntries, demoMoods, todayIso } = getDemoSampleData();
    setEntries(demoEntries);
    setWeeklyReflections([SAMPLE_WEEKLY_REFLECTION]);
    setMoodLogs(demoMoods);
    setUserProfile({
      id: 'guest-user',
      displayName: 'Eleanor Vance',
      email: 'eleanor@example.com',
      aiMemoryLevel: 'light',
      pinEnabled: false,
      streakCount: 3,
      lastJournalDate: todayIso,
      createdAt: Date.now(),
    });
    setCurrentView('home');
  };

  const handleSignOut = async () => {
    if (user && !isGuestMode) {
      await logoutUser();
    }
    setUser(null);
    setIsGuestMode(false);
    setEntries([]);
    setMoodLogs([]);
    setWeeklyReflections([]);
    setUserProfile(null);
    setIsLocked(false);
    setCurrentView('home');
  };

  // Onboarding Complete Handler
  const handleOnboardingComplete = async (config: {
    aiMemoryLevel: AIMemoryLevel;
    pinEnabled: boolean;
    pin?: string;
  }) => {
    if (!user) return;
    const profile: UserProfile = {
      id: user.uid,
      displayName: user.displayName || 'Writer',
      email: user.email || '',
      aiMemoryLevel: config.aiMemoryLevel,
      pinEnabled: config.pinEnabled,
      pinHash: config.pin ? btoa(config.pin) : undefined,
      streakCount: 1,
      createdAt: Date.now(),
    };

    if (!isGuestMode) {
      await saveUserProfile(user.uid, profile);
    } else {
      setUserProfile(profile);
    }
    setShowOnboarding(false);
  };

  // Mood Logging Handler
  const handleSelectMood = async (mood: MoodType) => {
    const todayIso = new Date().toISOString().split('T')[0];
    const moodLog: MoodLog = {
      id: `mood-${Date.now()}`,
      userId: user?.uid || 'guest',
      date: todayIso,
      mood,
      moodLabel: MOODS[mood]?.label || 'Calm',
      createdAt: Date.now(),
    };

    // Strict daily streak logic: only increment once per calendar day
    const alreadyLoggedToday = 
      userProfile?.lastJournalDate === todayIso || 
      moodLogs.some((m) => m.date === todayIso);

    let nextStreak = userProfile?.streakCount || 1;

    if (!alreadyLoggedToday) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayIso = yesterday.toISOString().split('T')[0];

      if (userProfile?.lastJournalDate === yesterdayIso) {
        // Logged yesterday: increment consecutive streak by 1
        nextStreak = (userProfile?.streakCount || 0) + 1;
      } else if (!userProfile?.lastJournalDate) {
        // First log ever
        nextStreak = Math.max(1, userProfile?.streakCount || 1);
      } else {
        // Missed one or more days: reset to 1
        nextStreak = 1;
      }
    }

    if (!isGuestMode && user) {
      await saveMoodLog(user.uid, moodLog);
      await saveUserProfile(user.uid, { streakCount: nextStreak, lastJournalDate: todayIso });
    } else {
      setMoodLogs((prev) => [moodLog, ...prev.filter((m) => m.date !== todayIso)]);
      if (userProfile) {
        setUserProfile({ ...userProfile, streakCount: nextStreak, lastJournalDate: todayIso });
      }
    }
  };

  // Save Journal Entry Handler
  const handleSaveEntry = async (entryData: {
    templateType: TemplateType;
    templateTitle: string;
    title: string;
    text: string;
    promptAnswers: Record<string, string>;
    mood: MoodType;
    moodLabel: string;
    wordCount: number;
  }) => {
    setIsSavingEntry(true);
    setErrorMessage(null);

    const entryId = editingEntry ? editingEntry.id : `entry-${Date.now()}`;
    const newEntry: JournalEntry = {
      id: entryId,
      userId: user?.uid || 'guest',
      templateType: entryData.templateType,
      templateTitle: entryData.templateTitle,
      title: entryData.title,
      text: entryData.text,
      promptAnswers: entryData.promptAnswers,
      mood: entryData.mood,
      moodLabel: entryData.moodLabel,
      wordCount: entryData.wordCount,
      createdAt: editingEntry ? editingEntry.createdAt : Date.now(),
      updatedAt: Date.now(),
    };

    try {
      const todayIso = new Date().toISOString().split('T')[0];
      const alreadyLoggedToday = userProfile?.lastJournalDate === todayIso;
      
      let nextStreak = userProfile?.streakCount || 1;
      if (!alreadyLoggedToday) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayIso = yesterday.toISOString().split('T')[0];
        if (userProfile?.lastJournalDate === yesterdayIso) {
          nextStreak = (userProfile?.streakCount || 0) + 1;
        } else if (!userProfile?.lastJournalDate) {
          nextStreak = Math.max(1, userProfile?.streakCount || 1);
        } else {
          nextStreak = 1;
        }
      }

      // 1. Persist to Firestore
      if (!isGuestMode && user) {
        await saveJournalEntry(user.uid, newEntry);
        await saveUserProfile(user.uid, { streakCount: nextStreak, lastJournalDate: todayIso });
      } else {
        setEntries((prev) => [newEntry, ...prev.filter((e) => e.id !== entryId)]);
        if (userProfile) {
          setUserProfile({ ...userProfile, streakCount: nextStreak, lastJournalDate: todayIso });
        }
      }

      setSavedModalEntry(newEntry);
      setEditingEntry(null);

      // 2. If AI memory != 'none', call server-side Gemini reflection
      const memoryLevel = userProfile?.aiMemoryLevel || 'light';
      if (memoryLevel !== 'none') {
        setIsLoadingReflection(true);
        try {
          const resp = await fetch('/api/gemini/reflect-entry', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              entryText: newEntry.text,
              templateTitle: newEntry.templateTitle,
              mood: newEntry.mood,
              promptAnswers: newEntry.promptAnswers,
              aiMemoryLevel: memoryLevel,
            }),
          });

          if (resp.ok) {
            const data = await resp.json();
            const reflection = data.reflection || '';
            setSavedModalReflection(reflection);
            newEntry.aiReflection = reflection;

            // Update entry with reflection in database
            if (!isGuestMode && user && reflection) {
              await saveJournalEntry(user.uid, newEntry);
            }
          }
        } catch (genErr) {
          console.warn('Gemini reflection fetch error:', genErr);
        } finally {
          setIsLoadingReflection(false);
        }
      }

      setCurrentView('home');
    } catch (err: any) {
      console.error('Error saving entry:', err);
      setErrorMessage(err?.message || 'Failed to save entry. Please try again.');
    } finally {
      setIsSavingEntry(false);
    }
  };

  // Delete Journal Entry
  const handleDeleteEntry = async (entryId: string) => {
    if (!isGuestMode && user) {
      await deleteJournalEntry(user.uid, entryId);
    } else {
      setEntries((prev) => prev.filter((e) => e.id !== entryId));
    }
    setSelectedEntryForDetail(null);
  };

  // Generate Weekly Reflection ("The Wow Moment")
  const handleGenerateWeeklyReflection = async () => {
    setIsGeneratingWeekly(true);
    setErrorMessage(null);

    const moodCounts = entries.reduce((acc, entry) => {
      acc[entry.mood] = (acc[entry.mood] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    try {
      const resp = await fetch('/api/gemini/weekly-reflection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entries: entries.slice(0, 10).map((e) => ({
            date: new Date(e.createdAt).toISOString().split('T')[0],
            templateTitle: e.templateTitle,
            mood: e.mood,
            text: e.text.slice(0, 300),
          })),
          moodCounts,
          aiMemoryLevel: userProfile?.aiMemoryLevel || 'light',
        }),
      });

      if (!resp.ok) {
        throw new Error('Failed to generate weekly reflection from server.');
      }

      const data = await resp.json();

      // If an existing reflection exists, update/replace it in place instead of creating a duplicate
      const existingReflection = weeklyReflections.length > 0 ? weeklyReflections[0] : null;
      const reflectionId = existingReflection ? existingReflection.id : `weekly-${Date.now()}`;

      const reflectionObj: WeeklyReflection = {
        id: reflectionId,
        userId: user?.uid || 'guest',
        weekStartDate: new Date(Date.now() - 86400000 * 6).toISOString().split('T')[0],
        weekEndDate: new Date().toISOString().split('T')[0],
        moodTrendSummary: data.moodTrendSummary || 'Your week was marked by quiet moments of grounding and presence.',
        themes: Array.isArray(data.themes) ? data.themes : ['Quiet presence', 'Gentle pacing'],
        reflectionQuestions: Array.isArray(data.reflectionQuestions) ? data.reflectionQuestions : ['What small pause supported you most this week?'],
        inquiryAnswers: existingReflection?.inquiryAnswers,
        userNotes: existingReflection?.userNotes,
        entriesCount: entries.length,
        createdAt: existingReflection ? existingReflection.createdAt : Date.now(),
        savedAt: Date.now(),
      };

      if (!isGuestMode && user) {
        await saveWeeklyReflection(user.uid, reflectionObj);
      } else {
        setWeeklyReflections((prev) => {
          const index = prev.findIndex((r) => r.id === reflectionId);
          if (index !== -1) {
            const updated = [...prev];
            updated[index] = reflectionObj;
            return updated;
          }
          return [reflectionObj, ...prev];
        });
      }
    } catch (err: any) {
      console.error('Error generating weekly reflection:', err);
      setErrorMessage(err?.message || 'Could not generate weekly reflection.');
    } finally {
      setIsGeneratingWeekly(false);
    }
  };

  // Save / Update User Thoughts on a Weekly Reflection
  const handleSaveWeeklyReflection = async (reflection: WeeklyReflection) => {
    if (!isGuestMode && user) {
      await saveWeeklyReflection(user.uid, reflection);
    } else {
      setWeeklyReflections((prev) =>
        prev.map((r) => (r.id === reflection.id ? reflection : r))
      );
    }
  };

  // Delete a Weekly Reflection Record
  const handleDeleteWeeklyReflection = async (reflectionId: string) => {
    if (!isGuestMode && user) {
      await deleteWeeklyReflection(user.uid, reflectionId);
    } else {
      setWeeklyReflections((prev) => prev.filter((r) => r.id !== reflectionId));
    }
  };

  // Settings Handlers
  const handleUpdateMemoryLevel = async (level: AIMemoryLevel) => {
    if (userProfile && user && !isGuestMode) {
      await saveUserProfile(user.uid, { aiMemoryLevel: level });
    } else if (userProfile) {
      setUserProfile({ ...userProfile, aiMemoryLevel: level });
    }
  };

  const handleUpdatePin = async (enabled: boolean, pin?: string) => {
    const pinHash = pin ? btoa(pin) : undefined;
    if (userProfile && user && !isGuestMode) {
      await saveUserProfile(user.uid, { pinEnabled: enabled, pinHash });
    } else if (userProfile) {
      setUserProfile({ ...userProfile, pinEnabled: enabled, pinHash });
    }
  };

  const handleUpdateReminder = async (time: string) => {
    if (userProfile && user && !isGuestMode) {
      await saveUserProfile(user.uid, { reminderTime: time });
    } else if (userProfile) {
      setUserProfile({ ...userProfile, reminderTime: time });
    }
  };

  const handleLoadSampleData = async () => {
    if (!isGuestMode && user) {
      for (const sample of SAMPLE_ENTRIES) {
        await saveJournalEntry(user.uid, { ...sample, userId: user.uid });
      }
      await saveWeeklyReflection(user.uid, { ...SAMPLE_WEEKLY_REFLECTION, userId: user.uid });
    } else {
      setEntries(SAMPLE_ENTRIES);
      setWeeklyReflections([SAMPLE_WEEKLY_REFLECTION]);
    }
  };

  const handleClearAllData = async () => {
    if (!isGuestMode && user) {
      for (const entry of entries) {
        await deleteJournalEntry(user.uid, entry.id);
      }
    }
    setEntries([]);
    setWeeklyReflections([]);
    setMoodLogs([]);
  };

  const handleDismissReflection = async (entryId: string) => {
    if (!isGuestMode && user) {
      const entry = entries.find((e) => e.id === entryId);
      if (entry) {
        await saveJournalEntry(user.uid, { ...entry, aiReflectionDismissed: true });
      }
    } else {
      setEntries((prev) =>
        prev.map((e) => (e.id === entryId ? { ...e, aiReflectionDismissed: true } : e))
      );
    }
  };

  // Today's logged mood
  const todayIso = new Date().toISOString().split('T')[0];
  const todayMoodLog = moodLogs.find((m) => m.date === todayIso);
  const todayMood = todayMoodLog ? todayMoodLog.mood : null;

  // Unauthenticated / Landing View
  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-[#FAF6EE] flex items-center justify-center text-[#4A3F39]">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-[#C97C4C] text-[#FFFDF9] flex items-center justify-center animate-pulse">
            <span className="font-display font-bold text-xl">H</span>
          </div>
          <p className="text-xs font-serif text-[#7C7067]">Opening your quiet space...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <LandingScreen
          onSignIn={handleSignIn}
          onExploreDemo={handleExploreDemo}
          isLoading={authLoading}
          onOpenPrivacy={() => setShowPrivacy(true)}
        />
        <PrivacyModal isOpen={showPrivacy} onClose={() => setShowPrivacy(false)} />
      </>
    );
  }

  // PIN Lock Screen if enabled and locked
  if (isLocked && userProfile?.pinEnabled && userProfile.pinHash) {
    let rawPin = '';
    try {
      rawPin = atob(userProfile.pinHash);
    } catch {
      rawPin = '';
    }

    return (
      <PinLockScreen
        expectedPin={rawPin}
        userName={user.displayName || 'Writer'}
        onUnlock={() => {
          setIsLocked(false);
          sessionStorage.setItem(`hearthnote_unlocked_${user.uid}`, 'true');
        }}
        onSignOutOrReset={handleSignOut}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF6EE] text-[#4A3F39] flex flex-col md:flex-row selection:bg-[#C97C4C]/25 pb-20 md:pb-0">
      {/* Navigation (Sidebar on Desktop, Bottom Bar on Mobile) */}
      <Navigation
        currentView={currentView}
        onNavigate={(v) => {
          setEditingEntry(null);
          setCurrentView(v);
        }}
        user={user}
        userProfile={userProfile}
        onLockApp={() => setIsLocked(true)}
        onOpenPrivacy={() => setShowPrivacy(true)}
        onSignOut={handleSignOut}
        streakCount={effectiveStreakCount}
      />

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto min-h-screen">
        {/* Global Error Banner if any */}
        {errorMessage && (
          <div className="bg-[#FEF2F2] border-b border-[#FECACA] px-4 py-2.5 text-xs text-[#991B1B] flex items-center justify-between">
            <span>{errorMessage}</span>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-[#991B1B] font-bold hover:underline ml-2"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* View Switcher */}
        {currentView === 'home' && (
          <HomeScreen
            userName={user.displayName || 'Friend'}
            onSelectTemplate={(tmplId) => {
              setSelectedTemplateForWriting(tmplId);
              setEditingEntry(null);
              setCurrentView('write');
            }}
            onSelectMood={handleSelectMood}
            todayMood={todayMood}
            recentEntries={entries}
            latestWeeklyReflection={weeklyReflections.length > 0 ? weeklyReflections[0] : null}
            onViewEntry={(entry) => setSelectedEntryForDetail(entry)}
            onViewInsights={() => setCurrentView('insights')}
            onViewHistory={() => setCurrentView('history')}
            streakCount={effectiveStreakCount}
            moodLogsLast7Days={moodLogs}
          />
        )}

        {currentView === 'write' && (
          <JournalEditor
            initialTemplate={selectedTemplateForWriting}
            initialEntry={editingEntry}
            initialMood={todayMood}
            onMoodChange={handleSelectMood}
            onSave={handleSaveEntry}
            onCancel={() => {
              setEditingEntry(null);
              setCurrentView('home');
            }}
            isSaving={isSavingEntry}
            userProfile={userProfile}
          />
        )}

        {currentView === 'history' && (
          <HistoryScreen
            entries={entries}
            onSelectEntry={(entry) => setSelectedEntryForDetail(entry)}
            onNewEntry={() => {
              setSelectedTemplateForWriting('freewrite');
              setEditingEntry(null);
              setCurrentView('write');
            }}
          />
        )}

        {currentView === 'insights' && (
          <InsightsScreen
            entries={entries}
            moodLogs={moodLogs}
            weeklyReflections={weeklyReflections}
            onGenerateWeeklyReflection={handleGenerateWeeklyReflection}
            onSaveWeeklyReflection={handleSaveWeeklyReflection}
            onDeleteWeeklyReflection={handleDeleteWeeklyReflection}
            isGeneratingReflection={isGeneratingWeekly}
            streakCount={effectiveStreakCount}
          />
        )}

        {currentView === 'settings' && (
          <SettingsScreen
            user={user}
            userProfile={userProfile}
            onUpdateMemoryLevel={handleUpdateMemoryLevel}
            onUpdatePin={handleUpdatePin}
            onUpdateReminder={handleUpdateReminder}
            onOpenPrivacy={() => setShowPrivacy(true)}
            onSignOut={handleSignOut}
          />
        )}
      </div>

      {/* Onboarding Modal */}
      <OnboardingModal
        isOpen={showOnboarding}
        onComplete={handleOnboardingComplete}
      />

      {/* Privacy Policy Modal */}
      <PrivacyModal
        isOpen={showPrivacy}
        onClose={() => setShowPrivacy(false)}
      />

      {/* Entry Detail Modal */}
      <EntryDetailModal
        entry={selectedEntryForDetail}
        onClose={() => setSelectedEntryForDetail(null)}
        onEdit={(entry) => {
          setEditingEntry(entry);
          setSelectedTemplateForWriting(entry.templateType);
          setSelectedEntryForDetail(null);
          setCurrentView('write');
        }}
        onDelete={handleDeleteEntry}
        onDismissReflection={handleDismissReflection}
      />

      {/* Entry Saved Modal ("Your thoughts are safely kept") */}
      <EntrySavedModal
        isOpen={Boolean(savedModalEntry)}
        entry={savedModalEntry}
        reflectionText={savedModalReflection}
        isLoadingReflection={isLoadingReflection}
        onDismissReflection={() => {
          if (savedModalEntry) {
            handleDismissReflection(savedModalEntry.id);
          }
          setSavedModalEntry(null);
          setSavedModalReflection('');
        }}
        onKeepReflection={() => {
          setSavedModalEntry(null);
          setSavedModalReflection('');
        }}
        onViewHistory={() => {
          setSavedModalEntry(null);
          setSavedModalReflection('');
          setCurrentView('history');
        }}
        onBackHome={() => {
          setSavedModalEntry(null);
          setSavedModalReflection('');
          setCurrentView('home');
        }}
      />
    </div>
  );
};

export default App;
