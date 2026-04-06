'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { GameState, Song, MidiNote, ActiveNote, Particle, HitEffect } from '@/types/game';
import { Track } from '@/types/tracks';
import { getSong } from '@/data/songRegistry';
import { getActiveLanes, buildNoteToLane, buildKeyboardMap, buildKeyLabels, DEFAULT_ACTIVE_LANES, DEFAULT_KEY_LABELS } from '@/constants/keyboard';
import { getLaneColor } from '@/constants/colors';
import { FALL_DURATION, SONG_START_DELAY } from '@/constants/timing';
import { useProfile } from '@/contexts/ProfileContext';

import AudioEngine from '@/engine/AudioEngine';
import InputManager from '@/engine/InputManager';
import NoteManager from '@/engine/NoteManager';
import ScoreManager from '@/engine/ScoreManager';
import ParticleSystem from '@/engine/ParticleSystem';
import EffectsManager from '@/engine/EffectsManager';

import ProfileSetup from './ProfileSetup';
import ProfileSelect from './ProfileSelect';
import TrackSelect from './TrackSelect';
import TrackMap from './TrackMap';
import Menu from './Menu';
import Countdown from './Countdown';
import PausedOverlay from './PausedOverlay';
import ResultsScreen from './ResultsScreen';
import HUD from './HUD';
import CrescendoMeter from './CrescendoMeter';
import PianoKeyboard from './PianoKeyboard';
import GameCanvas from './GameCanvas';

export default function Game() {
  const { profile, allProfiles, isNewUser, isLoading, createNewProfile, switchProfile, recordSongResult } = useProfile();

  const [gameState, setGameState] = useState<GameState>('TRACK_SELECT');
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [showProfileCreate, setShowProfileCreate] = useState(false);

  // Result data for the results screen
  const [lastResultData, setLastResultData] = useState<{
    xpEarned: number;
    leveledUp: boolean;
    isFirstClear: boolean;
    newBadges: string[];
  } | null>(null);

  // Render state (updated every frame)
  const [visibleNotes, setVisibleNotes] = useState<ActiveNote[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [effects, setEffects] = useState<HitEffect[]>([]);
  const [pressedNotes, setPressedNotes] = useState<Set<MidiNote>>(new Set());
  const [pressedLanes, setPressedLanes] = useState<Set<number>>(new Set());
  const [hitLanes, setHitLanes] = useState<Set<number>>(new Set());
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [multiplier, setMultiplier] = useState(1);
  const [crescendoMeter, setCrescendoMeter] = useState(0);
  const [crescendoReady, setCrescendoReady] = useState(false);
  const [crescendoActive, setCrescendoActive] = useState(false);
  const [crescendoTime, setCrescendoTime] = useState(0);
  const [songProgress, setSongProgress] = useState(0);

  // Engine refs
  const audioRef = useRef<AudioEngine | null>(null);
  const inputRef = useRef<InputManager>(new InputManager());
  const noteManagerRef = useRef<NoteManager | null>(null);
  const scoreManagerRef = useRef<ScoreManager | null>(null);
  const particleRef = useRef<ParticleSystem | null>(null);
  const effectsRef = useRef<EffectsManager | null>(null);

  // Try to enable MIDI on mount
  useEffect(() => {
    inputRef.current.enableMidi();
  }, []);

  // Timing refs
  const gameStartTimeRef = useRef(0);
  const lastFrameTimeRef = useRef(0);
  const rafRef = useRef<number>(0);
  const pauseTimeRef = useRef(0);
  const totalPausedRef = useRef(0);

  // Compute dynamic lanes from current song's noteRange
  const activeLanes = useMemo(() => {
    if (!currentSong) return DEFAULT_ACTIVE_LANES;
    return getActiveLanes(currentSong.noteRange);
  }, [currentSong]);

  const noteToLane = useMemo(() => {
    return buildNoteToLane(activeLanes);
  }, [activeLanes]);

  const keyLabels = useMemo(() => {
    if (!currentSong) return DEFAULT_KEY_LABELS;
    const keyMap = buildKeyboardMap(activeLanes);
    return buildKeyLabels(keyMap);
  }, [currentSong, activeLanes]);

  // Determine initial screen based on profile state
  useEffect(() => {
    if (isLoading) return;
    if (isNewUser || (!profile && allProfiles.length === 0)) {
      setGameState('PROFILE_SETUP');
    } else if (!profile && allProfiles.length > 0) {
      setGameState('PROFILE_SETUP');
      setShowProfileCreate(false);
    }
  }, [isLoading, isNewUser, profile, allProfiles.length]);

  // Initialize audio on first interaction
  const initAudio = useCallback(() => {
    if (!audioRef.current) {
      audioRef.current = AudioEngine.getInstance();
    }
    if (!audioRef.current.isInitialized()) {
      audioRef.current.init();
    }
  }, []);

  // --- Navigation handlers ---

  const handleCreateProfile = useCallback((name: string, avatarIndex: number) => {
    createNewProfile(name, avatarIndex);
    setShowProfileCreate(false);
    setGameState('TRACK_SELECT');
  }, [createNewProfile]);

  const handleSelectProfile = useCallback((id: string) => {
    switchProfile(id);
    setGameState('TRACK_SELECT');
  }, [switchProfile]);

  const handleSelectTrack = useCallback((track: Track) => {
    setCurrentTrack(track);
    setGameState('TRACK_MAP');
  }, []);

  const handleFreePlay = useCallback(() => {
    setCurrentTrack(null);
    setGameState('MENU');
  }, []);

  const handleSelectSong = useCallback((song: Song) => {
    initAudio();
    setCurrentSong(song);
    setGameState('COUNTDOWN');
  }, [initAudio]);

  const handleBackToTracks = useCallback(() => {
    setCurrentTrack(null);
    setGameState('TRACK_SELECT');
  }, []);

  // Start playing after countdown
  const handleCountdownComplete = useCallback(() => {
    if (!currentSong) return;

    const songLanes = getActiveLanes(currentSong.noteRange);
    const songNoteToLane = buildNoteToLane(songLanes);

    const noteManager = new NoteManager(currentSong, songNoteToLane);
    const scoreManager = new ScoreManager();
    const particleSys = new ParticleSystem();
    const effectsMgr = new EffectsManager();

    scoreManager.setTotalNotes(currentSong.notes.length);

    noteManagerRef.current = noteManager;
    scoreManagerRef.current = scoreManager;
    particleRef.current = particleSys;
    effectsRef.current = effectsMgr;

    inputRef.current.setActiveLanes(songLanes);

    // Offset start time so currentTime begins negative, giving notes time to fall from the top
    gameStartTimeRef.current = performance.now() / 1000 + SONG_START_DELAY;
    lastFrameTimeRef.current = performance.now() / 1000;
    totalPausedRef.current = 0;

    setLastResultData(null);
    setGameState('PLAYING');
  }, [currentSong]);

  // Key press handler
  const handleNotePress = useCallback((midiNote: MidiNote, lane: number) => {
    const audio = audioRef.current;
    const noteManager = noteManagerRef.current;
    const scoreManager = scoreManagerRef.current;
    const particleSys = particleRef.current;
    const effectsMgr = effectsRef.current;

    if (!audio || !noteManager || !scoreManager || !particleSys || !effectsMgr) return;

    audio.startNote(midiNote);

    const currentTime = performance.now() / 1000 - gameStartTimeRef.current - totalPausedRef.current;
    const hitResult = noteManager.checkHit(midiNote, currentTime);

    if (hitResult) {
      scoreManager.addHit(hitResult.rating);
      audio.playHitSound();

      const currentCombo = scoreManager.getCombo();
      audio.playComboSound(currentCombo);

      const canvasWidth = window.innerWidth;
      const effectiveLaneCount = activeLanes.length;
      const laneWidth = canvasWidth / effectiveLaneCount;
      const hitX = lane * laneWidth + laneWidth / 2;
      const hitY = (window.innerHeight - 80) * 0.85;
      const color = getLaneColor(lane);

      const particleCount = hitResult.rating === 'PERFECT' ? 15 : hitResult.rating === 'GREAT' ? 10 : 5;
      particleSys.emit(hitX, hitY, color, particleCount);
      effectsMgr.addHitEffect(lane, hitResult.rating, hitX, hitY);

      setHitLanes((prev) => {
        const next = new Set(prev);
        next.add(lane);
        setTimeout(() => {
          setHitLanes((p) => {
            const n = new Set(p);
            n.delete(lane);
            return n;
          });
        }, 100);
        return next;
      });
    }
  }, [activeLanes]);

  // Handle space for crescendo
  useEffect(() => {
    const handleSpace = (e: KeyboardEvent) => {
      if (e.code === 'Space' && gameState === 'PLAYING') {
        e.preventDefault();
        const sm = scoreManagerRef.current;
        if (sm && sm.isCrescendoReady()) {
          sm.activateCrescendo();
          audioRef.current?.playCrescendoActivate();
        }
      }
    };
    window.addEventListener('keydown', handleSpace);
    return () => window.removeEventListener('keydown', handleSpace);
  }, [gameState]);

  // Handle escape for pause
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        if (gameState === 'PLAYING') {
          pauseTimeRef.current = performance.now() / 1000;
          setGameState('PAUSED');
        } else if (gameState === 'PAUSED') {
          handleResume();
        }
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [gameState]);

  const handleResume = useCallback(() => {
    const pausedDuration = performance.now() / 1000 - pauseTimeRef.current;
    totalPausedRef.current += pausedDuration;
    setGameState('PLAYING');
  }, []);

  const handleQuit = useCallback(() => {
    inputRef.current.stop();
    audioRef.current?.stopAllNotes();
    cancelAnimationFrame(rafRef.current);
    // Return to track map if we came from a track, otherwise to track select
    if (currentTrack) {
      setGameState('TRACK_MAP');
    } else {
      setGameState('TRACK_SELECT');
    }
    setCurrentSong(null);
  }, [currentTrack]);

  const handleReplay = useCallback(() => {
    if (currentSong) {
      setGameState('COUNTDOWN');
    }
  }, [currentSong]);

  const handleNextLevel = useCallback(() => {
    if (!currentTrack || !currentSong) return;
    // Find the current level and the next one
    const currentLevel = currentTrack.levels.find(l => l.songId === currentSong.id);
    if (!currentLevel) return;
    const nextLevel = currentTrack.levels.find(l => l.levelNumber === currentLevel.levelNumber + 1);
    if (!nextLevel) {
      // No more levels, go back to track map
      setGameState('TRACK_MAP');
      setCurrentSong(null);
      return;
    }
    const nextSong = getSong(nextLevel.songId);
    if (nextSong) {
      initAudio();
      setCurrentSong(nextSong);
      setGameState('COUNTDOWN');
    } else {
      setGameState('TRACK_MAP');
      setCurrentSong(null);
    }
  }, [currentTrack, currentSong, initAudio]);

  // Main game loop
  useEffect(() => {
    if (gameState !== 'PLAYING') {
      if (gameState === 'PAUSED') {
        inputRef.current.stop();
        audioRef.current?.stopAllNotes();
      }
      return;
    }

    const input = inputRef.current;
    input.onKeyDown = handleNotePress;
    input.onKeyUp = (midiNote: MidiNote) => {
      // Release the sustained note sound
      audioRef.current?.stopNote(midiNote);

      setPressedNotes((prev) => {
        const next = new Set(prev);
        next.delete(midiNote);
        return next;
      });
      setPressedLanes((prev) => {
        const next = new Set(prev);
        const lane = noteToLane.get(midiNote);
        if (lane !== undefined) next.delete(lane);
        return next;
      });
    };

    const originalHandler = handleNotePress;
    input.onKeyDown = (midiNote: MidiNote, lane: number) => {
      setPressedNotes((prev) => new Set(prev).add(midiNote));
      setPressedLanes((prev) => new Set(prev).add(lane));
      originalHandler(midiNote, lane);
    };

    input.start();

    const noteManager = noteManagerRef.current!;
    const scoreManager = scoreManagerRef.current!;
    const particleSys = particleRef.current!;
    const effectsMgr = effectsRef.current!;

    const gameLoop = () => {
      const now = performance.now() / 1000;
      const currentTime = now - gameStartTimeRef.current - totalPausedRef.current;
      const deltaTime = Math.min(now - lastFrameTimeRef.current, 0.05);
      lastFrameTimeRef.current = now;

      noteManager.update(currentTime, FALL_DURATION);
      particleSys.update(deltaTime);
      effectsMgr.update(deltaTime);
      scoreManager.updateCrescendo(deltaTime);

      const visible = noteManager.getVisibleNotes();
      for (const n of visible) {
        if (n.missed && !n.hit && n.opacity > 0.95) {
          scoreManager.addMiss();
        }
      }

      if (currentSong) {
        const lastNoteTime = currentSong.notes[currentSong.notes.length - 1]?.time ?? 0;
        setSongProgress(Math.min(currentTime / (lastNoteTime + 2), 1));
      }

      setVisibleNotes([...visible]);
      setParticles([...particleSys.getParticles()]);
      setEffects([...effectsMgr.getEffects()]);
      setScore(scoreManager.getScore());
      setCombo(scoreManager.getCombo());
      setMultiplier(scoreManager.getMultiplier());
      setCrescendoMeter(scoreManager.getCrescendoMeter());
      setCrescendoReady(scoreManager.isCrescendoReady());
      setCrescendoActive(scoreManager.isCrescendoActive());
      setCrescendoTime(scoreManager.getCrescendoTimeRemaining());

      if (noteManager.isComplete(currentTime)) {
        input.stop();

        if (currentSong) {
          const stats = scoreManager.getStats();
          const grade = scoreManager.getGrade();
          const resultData = recordSongResult(
            currentSong.id,
            stats,
            grade,
            currentSong.difficulty,
          );
          setLastResultData(resultData);
        }

        setGameState('RESULTS');
        return;
      }

      rafRef.current = requestAnimationFrame(gameLoop);
    };

    rafRef.current = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(rafRef.current);
      input.stop();
    };
  }, [gameState, currentSong, handleNotePress, noteToLane, recordSongResult]);

  // --- Rendering ---

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-[#0a0a1a] flex items-center justify-center">
        <div className="text-gray-500 text-lg">Loading...</div>
      </div>
    );
  }

  // Profile setup / select
  if (gameState === 'PROFILE_SETUP' || (!profile && gameState !== 'PLAYING')) {
    if (showProfileCreate || allProfiles.length === 0) {
      return <ProfileSetup onCreateProfile={handleCreateProfile} />;
    }
    return (
      <ProfileSelect
        profiles={allProfiles}
        onSelectProfile={handleSelectProfile}
        onCreateNew={() => setShowProfileCreate(true)}
      />
    );
  }

  if (!profile) {
    return <ProfileSetup onCreateProfile={handleCreateProfile} />;
  }

  return (
    <div className="fixed inset-0 bg-[#0a0a1a] overflow-hidden select-none">
      {/* Game canvas */}
      {(gameState === 'PLAYING' || gameState === 'PAUSED' || gameState === 'COUNTDOWN') && currentSong && (
        <>
          <GameCanvas
            notes={visibleNotes}
            particles={particles}
            effects={effects}
            pressedLanes={pressedLanes}
            crescendoActive={crescendoActive}
            bpm={currentSong.bpm}
            songProgress={songProgress}
            activeLanes={activeLanes}
          />
          <PianoKeyboard
            activeLanes={activeLanes}
            keyLabels={keyLabels}
            pressedNotes={pressedNotes}
            hitLanes={hitLanes}
          />
        </>
      )}

      {/* HUD */}
      {gameState === 'PLAYING' && currentSong && (
        <>
          <HUD
            score={score}
            combo={combo}
            multiplier={multiplier}
            songTitle={currentSong.title}
            crescendoActive={crescendoActive}
          />
          <CrescendoMeter
            meter={crescendoMeter}
            isReady={crescendoReady}
            isActive={crescendoActive}
            timeRemaining={crescendoTime}
          />
        </>
      )}

      {/* State overlays */}
      {gameState === 'TRACK_SELECT' && (
        <TrackSelect
          profile={profile}
          inputManager={inputRef.current}
          onSelectTrack={handleSelectTrack}
          onFreePlay={handleFreePlay}
          onSwitchProfile={() => {
            setGameState('PROFILE_SETUP');
            setShowProfileCreate(false);
          }}
        />
      )}

      {gameState === 'TRACK_MAP' && currentTrack && (
        <TrackMap
          track={currentTrack}
          profile={profile}
          onSelectSong={handleSelectSong}
          onBack={handleBackToTracks}
        />
      )}

      {gameState === 'MENU' && (
        <Menu
          onSelectSong={handleSelectSong}
          profile={profile}
          onSwitchProfile={() => setGameState('TRACK_SELECT')}
          onBack={() => setGameState('TRACK_SELECT')}
        />
      )}

      {gameState === 'COUNTDOWN' && <Countdown onComplete={handleCountdownComplete} />}

      {gameState === 'PAUSED' && (
        <PausedOverlay onResume={handleResume} onQuit={handleQuit} />
      )}

      {gameState === 'RESULTS' && currentSong && scoreManagerRef.current && (
        <ResultsScreen
          song={currentSong}
          stats={scoreManagerRef.current.getStats()}
          grade={scoreManagerRef.current.getGrade()}
          xpEarned={lastResultData?.xpEarned ?? 0}
          leveledUp={lastResultData?.leveledUp ?? false}
          isFirstClear={lastResultData?.isFirstClear ?? false}
          newBadges={lastResultData?.newBadges ?? []}
          profile={profile}
          onReplay={handleReplay}
          onMenu={handleQuit}
          onNextLevel={currentTrack ? handleNextLevel : undefined}
        />
      )}
    </div>
  );
}
