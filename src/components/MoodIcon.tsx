import React from 'react';
import type { MoodType } from '../types';

interface MoodIconProps {
  mood?: MoodType | string | null;
  className?: string;
  size?: number | string;
  showGlow?: boolean;
}

export const RadiantIcon: React.FC<{ className?: string; showGlow?: boolean }> = ({
  className = 'w-6 h-6',
  showGlow = true,
}) => (
  <svg
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-label="Radiant sun icon"
  >
    <defs>
      <radialGradient id="radiant-glow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#FCD34D" stopOpacity="0.45" />
        <stop offset="70%" stopColor="#F59E0B" stopOpacity="0.15" />
        <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
      </radialGradient>
      <radialGradient id="radiant-core" cx="40%" cy="36%" r="62%">
        <stop offset="0%" stopColor="#FFF2B2" />
        <stop offset="45%" stopColor="#FDBA74" />
        <stop offset="90%" stopColor="#EA580C" />
        <stop offset="100%" stopColor="#C2410C" />
      </radialGradient>
      <linearGradient id="radiant-ray-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FED7AA" />
        <stop offset="50%" stopColor="#FB923C" />
        <stop offset="100%" stopColor="#C2410C" />
      </linearGradient>
    </defs>
    {showGlow && <circle cx="50" cy="50" r="46" fill="url(#radiant-glow)" />}
    {/* Sun Rays */}
    <g stroke="#3D200F" strokeWidth="3" strokeLinejoin="round">
      {/* 12 Sun Rays pointing outward */}
      <path d="M 50 8 L 56 22 L 44 22 Z" fill="url(#radiant-ray-grad)" />
      <path d="M 71 14 L 69 29 L 58 21 Z" fill="url(#radiant-ray-grad)" />
      <path d="M 86 29 L 79 41 L 71 31 Z" fill="url(#radiant-ray-grad)" />
      <path d="M 92 50 L 78 56 L 78 44 Z" fill="url(#radiant-ray-grad)" />
      <path d="M 86 71 L 71 69 L 79 59 Z" fill="url(#radiant-ray-grad)" />
      <path d="M 71 86 L 59 79 L 69 71 Z" fill="url(#radiant-ray-grad)" />
      <path d="M 50 92 L 44 78 L 56 78 Z" fill="url(#radiant-ray-grad)" />
      <path d="M 29 86 L 31 71 L 42 79 Z" fill="url(#radiant-ray-grad)" />
      <path d="M 14 71 L 21 59 L 29 69 Z" fill="url(#radiant-ray-grad)" />
      <path d="M 8 50 L 22 44 L 22 56 Z" fill="url(#radiant-ray-grad)" />
      <path d="M 14 29 L 29 31 L 21 41 Z" fill="url(#radiant-ray-grad)" />
      <path d="M 29 14 L 41 21 L 31 29 Z" fill="url(#radiant-ray-grad)" />
    </g>
    {/* Center Sun Core */}
    <circle
      cx="50"
      cy="50"
      r="23"
      fill="url(#radiant-core)"
      stroke="#3D200F"
      strokeWidth="3.5"
    />
    {/* Soft inner highlight */}
    <ellipse cx="44" cy="42" rx="10" ry="7" fill="#FFFFFF" fillOpacity="0.4" transform="rotate(-20 44 42)" />
  </svg>
);

export const CalmIcon: React.FC<{ className?: string; showGlow?: boolean }> = ({
  className = 'w-6 h-6',
  showGlow = true,
}) => (
  <svg
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-label="Calm botanical branch icon"
  >
    <defs>
      <radialGradient id="calm-glow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#E9D8A6" stopOpacity="0.4" />
        <stop offset="100%" stopColor="#E9D8A6" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="calm-leaf-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#E6C29E" />
        <stop offset="60%" stopColor="#B37C4F" />
        <stop offset="100%" stopColor="#784C27" />
      </linearGradient>
    </defs>
    {showGlow && <circle cx="50" cy="50" r="46" fill="url(#calm-glow)" />}
    {/* Main curved central stem */}
    <path
      d="M 25 84 C 34 68 46 45 78 20"
      stroke="#3D200F"
      strokeWidth="4"
      strokeLinecap="round"
    />
    {/* Leaves */}
    <g stroke="#3D200F" strokeWidth="3" strokeLinejoin="round">
      {/* Top terminal leaf */}
      <path
        d="M 78 20 C 84 14 91 16 90 24 C 84 29 76 27 78 20 Z"
        fill="url(#calm-leaf-grad)"
      />
      {/* Upper right leaf */}
      <path
        d="M 68 28 C 82 23 88 33 80 40 C 72 40 68 32 68 28 Z"
        fill="url(#calm-leaf-grad)"
      />
      {/* Upper left leaf */}
      <path
        d="M 60 34 C 54 22 43 25 46 36 C 50 42 58 40 60 34 Z"
        fill="url(#calm-leaf-grad)"
      />
      {/* Mid right leaf */}
      <path
        d="M 52 45 C 68 40 73 52 64 58 C 56 57 52 50 52 45 Z"
        fill="url(#calm-leaf-grad)"
      />
      {/* Mid left leaf */}
      <path
        d="M 44 53 C 34 42 24 48 30 58 C 36 63 43 59 44 53 Z"
        fill="url(#calm-leaf-grad)"
      />
      {/* Lower right leaf */}
      <path
        d="M 36 65 C 50 62 53 74 44 79 C 38 78 35 71 36 65 Z"
        fill="url(#calm-leaf-grad)"
      />
      {/* Lower left leaf */}
      <path
        d="M 30 73 C 20 65 14 74 21 82 C 26 84 31 79 30 73 Z"
        fill="url(#calm-leaf-grad)"
      />
    </g>
  </svg>
);

export const HopefulIcon: React.FC<{ className?: string; showGlow?: boolean }> = ({
  className = 'w-6 h-6',
  showGlow = true,
}) => (
  <svg
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-label="Hopeful sparkle stars icon"
  >
    <defs>
      <radialGradient id="hopeful-glow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#FDE68A" stopOpacity="0.45" />
        <stop offset="100%" stopColor="#FDE68A" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="hopeful-star-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FFF5CC" />
        <stop offset="50%" stopColor="#F5B963" />
        <stop offset="100%" stopColor="#B46522" />
      </linearGradient>
    </defs>
    {showGlow && <circle cx="50" cy="50" r="46" fill="url(#hopeful-glow)" />}
    <g stroke="#3D200F" strokeWidth="2.75" strokeLinejoin="round">
      {/* Main Large Star (Top Left) */}
      <path
        d="M 47 18 Q 47 34 32 34 Q 47 34 47 50 Q 47 34 62 34 Q 47 34 47 18 Z"
        fill="url(#hopeful-star-grad)"
      />
      {/* Top Small Star */}
      <path
        d="M 74 18 Q 74 25 67 25 Q 74 25 74 32 Q 74 25 81 25 Q 74 25 74 18 Z"
        fill="url(#hopeful-star-grad)"
      />
      {/* Middle Right Star */}
      <path
        d="M 72 45 Q 72 58 60 58 Q 72 58 72 71 Q 72 58 84 58 Q 72 58 72 45 Z"
        fill="url(#hopeful-star-grad)"
      />
      {/* Bottom Center Small Star */}
      <path
        d="M 48 64 Q 48 72 40 72 Q 48 72 48 80 Q 48 72 56 72 Q 48 72 48 64 Z"
        fill="url(#hopeful-star-grad)"
      />
    </g>
  </svg>
);

export const ReflectiveIcon: React.FC<{ className?: string; showGlow?: boolean }> = ({
  className = 'w-6 h-6',
  showGlow = true,
}) => (
  <svg
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-label="Reflective autumn leaves icon"
  >
    <defs>
      <radialGradient id="refl-glow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#FDBA74" stopOpacity="0.35" />
        <stop offset="100%" stopColor="#FDBA74" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="refl-oak-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FDBA74" />
        <stop offset="60%" stopColor="#C25E28" />
        <stop offset="100%" stopColor="#7C2D12" />
      </linearGradient>
      <linearGradient id="refl-leaf-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FED7AA" />
        <stop offset="60%" stopColor="#D97706" />
        <stop offset="100%" stopColor="#853E17" />
      </linearGradient>
    </defs>
    {showGlow && <circle cx="50" cy="50" r="46" fill="url(#refl-glow)" />}
    <g stroke="#3D200F" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round">
      {/* Small floating top leaf */}
      <path
        d="M 68 18 C 76 18 82 24 77 30 C 70 31 66 25 68 18 Z"
        fill="url(#refl-leaf-grad)"
      />
      <path d="M 72 23 L 75 27" />

      {/* Left Autumn Leaf */}
      <path
        d="M 38 78 C 30 72 26 58 31 43 C 33 34 44 26 49 32 C 55 38 48 48 53 54 C 58 60 52 74 38 78 Z"
        fill="url(#refl-oak-grad)"
      />
      <path d="M 38 78 C 40 62 44 48 48 33" />
      <path d="M 42 62 Q 35 57 32 54" />
      <path d="M 44 50 Q 51 46 51 43" />

      {/* Right Serrated Leaf */}
      <path
        d="M 52 82 C 56 74 61 70 60 63 C 65 64 72 58 71 52 C 78 52 81 44 79 38 C 72 40 68 47 64 48 C 65 43 59 47 56 56 C 53 66 49 76 52 82 Z"
        fill="url(#refl-oak-grad)"
      />
      <path d="M 52 82 C 58 68 66 54 75 42" />
      <path d="M 60 66 Q 67 64 70 61" />
      <path d="M 64 56 Q 72 53 74 48" />
    </g>
  </svg>
);

export const TenderIcon: React.FC<{ className?: string; showGlow?: boolean }> = ({
  className = 'w-6 h-6',
  showGlow = true,
}) => (
  <svg
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-label="Tender heart bloom flower icon"
  >
    <defs>
      <radialGradient id="tender-glow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#FED7AA" stopOpacity="0.45" />
        <stop offset="100%" stopColor="#FED7AA" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="tender-petal-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FFE4D6" />
        <stop offset="50%" stopColor="#F5B292" />
        <stop offset="100%" stopColor="#C46B4D" />
      </linearGradient>
      <radialGradient id="tender-heart-core" cx="50%" cy="40%" r="60%">
        <stop offset="0%" stopColor="#FFFDF7" />
        <stop offset="60%" stopColor="#FCE7D9" />
        <stop offset="100%" stopColor="#EAA585" />
      </radialGradient>
      <linearGradient id="tender-base-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#B57C53" />
        <stop offset="100%" stopColor="#5E381C" />
      </linearGradient>
    </defs>
    {showGlow && <circle cx="50" cy="50" r="46" fill="url(#tender-glow)" />}
    <g stroke="#3D200F" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round">
      {/* Bottom leaves/stem calyx */}
      <path
        d="M 50 82 C 40 85 24 82 22 72 C 30 70 42 74 50 78 Z"
        fill="url(#tender-base-grad)"
      />
      <path
        d="M 50 82 C 60 85 76 82 78 72 C 70 70 58 74 50 78 Z"
        fill="url(#tender-base-grad)"
      />
      <path d="M 50 74 L 50 86" strokeWidth="3.5" />

      {/* Flower outer backdrop petals */}
      <path
        d="M 50 22 C 32 20 18 36 21 54 C 23 68 38 75 50 77 C 62 75 77 68 79 54 C 82 36 68 20 50 22 Z"
        fill="url(#tender-petal-grad)"
      />

      {/* Flanking inner side petals */}
      <path
        d="M 28 42 C 32 30 46 32 46 48 C 44 62 34 68 28 42 Z"
        fill="url(#tender-petal-grad)"
      />
      <path
        d="M 72 42 C 68 30 54 32 54 48 C 56 62 66 68 72 42 Z"
        fill="url(#tender-petal-grad)"
      />

      {/* Central Heart in Blossom */}
      <path
        d="M 50 63 C 44 56 36 46 36 38 C 36 31 42 27 47 30 C 49 32 50 34 50 34 C 50 34 51 32 53 30 C 58 27 64 31 64 38 C 64 46 56 56 50 63 Z"
        fill="url(#tender-heart-core)"
      />
    </g>
  </svg>
);

export const AnxiousIcon: React.FC<{ className?: string; showGlow?: boolean }> = ({
  className = 'w-6 h-6',
  showGlow = true,
}) => (
  <svg
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-label="Anxious lightning icon"
  >
    <defs>
      <radialGradient id="anxious-glow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#FED7AA" stopOpacity="0.45" />
        <stop offset="100%" stopColor="#FED7AA" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="anxious-bolt-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FFF2B2" />
        <stop offset="45%" stopColor="#F59E0B" />
        <stop offset="100%" stopColor="#B45309" />
      </linearGradient>
    </defs>
    {showGlow && <circle cx="50" cy="50" r="46" fill="url(#anxious-glow)" />}
    {/* Ambient electric sparks / wisp flamelets */}
    <g fill="#D97706" fillOpacity="0.6">
      <path d="M 24 38 Q 20 44 26 48 Q 24 43 24 38 Z" />
      <path d="M 22 56 Q 16 63 23 68 Q 20 62 22 56 Z" />
      <path d="M 74 32 Q 80 38 74 44 Q 78 38 74 32 Z" />
      <path d="M 76 54 Q 82 62 76 68 Q 80 61 76 54 Z" />
    </g>
    {/* Main Lightning Bolt */}
    <path
      d="M 52 14 L 32 46 L 48 46 L 36 84 L 72 38 L 54 38 L 68 14 Z"
      fill="url(#anxious-bolt-grad)"
      stroke="#3D200F"
      strokeWidth="3.5"
      strokeLinejoin="round"
      strokeLinecap="round"
    />
  </svg>
);

export const SadIcon: React.FC<{ className?: string; showGlow?: boolean }> = ({
  className = 'w-6 h-6',
  showGlow = true,
}) => (
  <svg
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-label="Sad teardrop icon"
  >
    <defs>
      <radialGradient id="sad-glow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#E4D5C7" stopOpacity="0.45" />
        <stop offset="100%" stopColor="#E4D5C7" stopOpacity="0" />
      </radialGradient>
      <radialGradient id="sad-drop-grad" cx="42%" cy="40%" r="58%">
        <stop offset="0%" stopColor="#F5E1CE" />
        <stop offset="45%" stopColor="#C49A74" />
        <stop offset="85%" stopColor="#7E5230" />
        <stop offset="100%" stopColor="#4A2D16" />
      </radialGradient>
    </defs>
    {showGlow && <circle cx="50" cy="50" r="46" fill="url(#sad-glow)" />}
    {/* Sculpted teardrop */}
    <path
      d="M 50 16 C 50 16 24 50 24 66 C 24 80 35 90 50 90 C 65 90 76 80 76 66 C 76 50 50 16 50 16 Z"
      fill="url(#sad-drop-grad)"
      stroke="#3D200F"
      strokeWidth="3.5"
      strokeLinejoin="round"
    />
    {/* Gentle soft sheen on upper left */}
    <path
      d="M 44 34 C 36 44 32 54 33 64 C 31 56 34 46 41 38 Z"
      fill="#FFFFFF"
      fillOpacity="0.45"
    />
  </svg>
);

export const AngryIcon: React.FC<{ className?: string; showGlow?: boolean }> = ({
  className = 'w-6 h-6',
  showGlow = true,
}) => (
  <svg
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-label="Angry fire flame icon"
  >
    <defs>
      <radialGradient id="angry-glow" cx="50%" cy="60%" r="50%">
        <stop offset="0%" stopColor="#FDBA74" stopOpacity="0.45" />
        <stop offset="100%" stopColor="#FDBA74" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="angry-outer-flame" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#F97316" />
        <stop offset="60%" stopColor="#DC2626" />
        <stop offset="100%" stopColor="#991B1B" />
      </linearGradient>
      <radialGradient id="angry-inner-flame" cx="50%" cy="60%" r="50%">
        <stop offset="0%" stopColor="#FEF08A" />
        <stop offset="60%" stopColor="#F59E0B" />
        <stop offset="100%" stopColor="#EA580C" />
      </radialGradient>
    </defs>
    {showGlow && <circle cx="50" cy="55" r="44" fill="url(#angry-glow)" />}
    <g stroke="#3D200F" strokeWidth="3.5" strokeLinejoin="round" strokeLinecap="round">
      {/* Outer Flame shape */}
      <path
        d="M 50 14 C 54 26 62 32 68 30 C 76 38 82 52 80 66 C 78 80 66 88 50 88 C 34 88 22 80 20 66 C 18 52 28 40 32 32 C 38 40 46 36 50 14 Z"
        fill="url(#angry-outer-flame)"
      />
      {/* Inner Glowing Core Flame */}
      <path
        d="M 50 44 C 54 52 60 54 62 62 C 64 72 58 78 50 78 C 42 78 36 72 38 62 C 40 56 46 54 50 44 Z"
        fill="url(#angry-inner-flame)"
        strokeWidth="2.5"
      />
    </g>
  </svg>
);

export const OverwhelmedIcon: React.FC<{ className?: string; showGlow?: boolean }> = ({
  className = 'w-6 h-6',
  showGlow = true,
}) => (
  <svg
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-label="Overwhelmed whirlwind tornado icon"
  >
    <defs>
      <radialGradient id="overwhelmed-glow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#EAD8C7" stopOpacity="0.45" />
        <stop offset="100%" stopColor="#EAD8C7" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="twister-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#F5DFCA" />
        <stop offset="50%" stopColor="#C89D78" />
        <stop offset="100%" stopColor="#7E5331" />
      </linearGradient>
    </defs>
    {showGlow && <circle cx="50" cy="50" r="46" fill="url(#overwhelmed-glow)" />}
    <g stroke="#3D200F" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round">
      {/* Funnel Tornado Body with Tiered Swirls */}
      <path
        d="M 22 28 C 22 20 78 20 78 28 C 78 36 68 44 64 48 C 60 52 56 60 54 68 C 52 74 46 86 52 86 C 44 86 42 76 44 68 C 46 58 38 48 32 40 C 26 34 22 32 22 28 Z"
        fill="url(#twister-grad)"
      />
      {/* Swirling Ridge Rings */}
      <ellipse cx="50" cy="28" rx="27" ry="7" fill="url(#twister-grad)" />
      <path d="M 26 38 Q 50 46 72 36" />
      <path d="M 32 48 Q 50 56 66 46" />
      <path d="M 38 58 Q 50 64 60 56" />
      <path d="M 43 68 Q 50 73 56 66" />
    </g>
  </svg>
);

export const WearyIcon: React.FC<{ className?: string; showGlow?: boolean }> = ({
  className = 'w-6 h-6',
  showGlow = true,
}) => (
  <svg
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-label="Weary rain cloud icon"
  >
    <defs>
      <radialGradient id="weary-glow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#E2D9CE" stopOpacity="0.45" />
        <stop offset="100%" stopColor="#E2D9CE" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="weary-cloud-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FFF4E6" />
        <stop offset="50%" stopColor="#E2CCA8" />
        <stop offset="100%" stopColor="#9C7954" />
      </linearGradient>
      <linearGradient id="weary-drop-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#EED9BF" />
        <stop offset="100%" stopColor="#946C44" />
      </linearGradient>
    </defs>
    {showGlow && <circle cx="50" cy="50" r="46" fill="url(#weary-glow)" />}
    <g stroke="#3D200F" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round">
      {/* Puffy Rain Cloud */}
      <path
        d="M 26 56 C 18 56 14 48 18 42 C 18 32 28 28 34 30 C 38 20 54 18 62 26 C 70 20 84 26 82 38 C 88 44 86 56 74 56 Z"
        fill="url(#weary-cloud-grad)"
      />
      {/* 4 Teardrop Raindrops falling below */}
      <path
        d="M 26 68 C 26 68 22 74 22 77 C 22 80 24 82 26 82 C 28 82 30 80 30 77 C 30 74 26 68 26 68 Z"
        fill="url(#weary-drop-grad)"
        strokeWidth="2"
      />
      <path
        d="M 42 66 C 42 66 38 72 38 75 C 38 78 40 80 42 80 C 44 80 46 78 46 75 C 46 72 42 66 42 66 Z"
        fill="url(#weary-drop-grad)"
        strokeWidth="2"
      />
      <path
        d="M 58 70 C 58 70 54 77 54 81 C 54 84 56 86 58 86 C 60 86 62 84 62 81 C 62 77 58 70 58 70 Z"
        fill="url(#weary-drop-grad)"
        strokeWidth="2"
      />
      <path
        d="M 74 68 C 74 68 70 74 70 77 C 70 80 72 82 74 82 C 76 82 78 80 78 77 C 78 74 74 68 74 68 Z"
        fill="url(#weary-drop-grad)"
        strokeWidth="2"
      />
    </g>
  </svg>
);

export const MoodIcon: React.FC<MoodIconProps> = ({
  mood,
  className = 'w-6 h-6',
  showGlow = true,
}) => {
  const norm = typeof mood === 'string' ? mood.toLowerCase() : '';
  switch (norm) {
    case 'radiant':
      return <RadiantIcon className={className} showGlow={showGlow} />;
    case 'calm':
      return <CalmIcon className={className} showGlow={showGlow} />;
    case 'hopeful':
      return <HopefulIcon className={className} showGlow={showGlow} />;
    case 'reflective':
      return <ReflectiveIcon className={className} showGlow={showGlow} />;
    case 'tender':
      return <TenderIcon className={className} showGlow={showGlow} />;
    case 'anxious':
      return <AnxiousIcon className={className} showGlow={showGlow} />;
    case 'sad':
      return <SadIcon className={className} showGlow={showGlow} />;
    case 'angry':
      return <AngryIcon className={className} showGlow={showGlow} />;
    case 'overwhelmed':
    case 'tringara':
      return <OverwhelmedIcon className={className} showGlow={showGlow} />;
    case 'weary':
      return <WearyIcon className={className} showGlow={showGlow} />;
    default:
      return <CalmIcon className={className} showGlow={showGlow} />;
  }
};
