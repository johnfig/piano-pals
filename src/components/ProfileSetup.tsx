'use client';

import { useState } from 'react';
import { AVATARS } from '@/constants/avatars';

interface ProfileSetupProps {
  onCreateProfile: (name: string, avatarIndex: number) => void;
}

export default function ProfileSetup({ onCreateProfile }: ProfileSetupProps) {
  const [name, setName] = useState('');
  const [avatarIndex, setAvatarIndex] = useState(0);

  const canSubmit = name.trim().length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (canSubmit) {
      onCreateProfile(name.trim(), avatarIndex);
    }
  };

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#0F0B1A] z-50 p-4">
      {/* Title */}
      <div className="mb-10 text-center">
        <h1 className="text-5xl font-black tracking-tight mb-2">
          <span className="text-[#FF6B6B]">
            Welcome to
          </span>
        </h1>
        <h2 className="text-6xl font-black tracking-tight">
          <span className="text-[#FF6B6B]">
            Piano
          </span>
          <span className="text-white ml-3">Pals</span>
        </h2>
        <p className="text-[#A09BB8] text-lg mt-3">Create your profile to start learning!</p>
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-8">
        {/* Name input */}
        <div>
          <label htmlFor="name" className="text-[#A09BB8] text-sm font-semibold uppercase tracking-wider block mb-2">
            What&apos;s your name?
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name..."
            maxLength={20}
            autoFocus
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/20 text-white text-lg placeholder-gray-600 focus:outline-none focus:border-[#FF6B6B] focus:ring-1 focus:ring-[#FF6B6B] transition-colors"
          />
        </div>

        {/* Avatar picker */}
        <div>
          <p className="text-[#A09BB8] text-sm font-semibold uppercase tracking-wider mb-3">
            Pick your avatar
          </p>
          <div className="grid grid-cols-7 gap-2">
            {AVATARS.map((emoji, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setAvatarIndex(i)}
                className={`w-14 h-14 rounded-xl text-2xl flex items-center justify-center transition-all ${
                  avatarIndex === i
                    ? 'bg-[#FF6B6B]/20 border-2 border-[#FF6B6B] scale-110'
                    : 'bg-white/5 border border-white/10 hover:bg-white/10 hover:scale-105'
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={!canSubmit}
          className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
            canSubmit
              ? 'bg-gradient-to-r from-[#FF6B6B] to-[#E85555] text-white hover:scale-[1.02] active:scale-[0.98]'
              : 'bg-gray-800 text-gray-600 cursor-not-allowed'
          }`}
        >
          Let&apos;s Play! 🎵
        </button>
      </form>
    </div>
  );
}
