'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { GameState, Song, MidiNote, ActiveNote, Particle, HitEffect } from '@/types/game';
import { Track } from '@/types/tracks';
import { getSong } from '@/data/songRegistry';
import { getActiveLanes, buildNoteToLane, buildKeyboardMap, buildKeyLabels, DEFAULT_ACTIVE_LANES, DEFAULT_KEY_LABELS } from '@/constants/keyboard';
import { resolveSongData } from '@/utils/songMode';
import { computePianoPositions, MIDI_49_LOWEST, MIDI_49_HIGHEST } from '@/utils/pianoPositions';
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
import SpeedSelect from './SpeedSelect';
import { SpeedOption } from './SpeedSelect';
import { InstrumentType } from '@/engine/AudioEngine';
import PausedOverlay from './PausedOverlay';
import ResultsScreen from './ResultsScreen';
import HUD from './HUD';
import CrescendoMeter from './CrescendoMeter';
import PianoKeyboard, { getKeyboardHeight, countWhiteKeysInRange } from './PianoKeyboard';
import GameCanvas from './GameCanvas';
import FreePiano from './FreePiano';

export default function Game() {
  const { profile, allProfiles, isNewUser, isLoading, createNewProfile, switchProfile, removeProfile, recordSongResult, updateProfile } = useProfile();

  const [gameState, setGameState] = useState<GameState>('TRACK_SELECT');
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [showProfileCreate, setShowProfileCreate] = useState(false);
  const [speedMultiplier, setSpeedMultiplier] = useState<SpeedOption>(1);
  const [twoHands, setTwoHands] = useState(false);
  const [isAutoplay, setIsAutoplay] = useState(false);
  const isPracticeMode = speedMultiplier !== 1 || isAutoplay;

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
  const [midiConnected, setMidiConnected] = useState(false);

  // Dev: ?forceMidi=true in URL simulates MIDI connected for visual testing
  const forceMidi = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('forceMidi') === 'true';
  const effectiveMidiConnected = midiConnected || forceMidi;

  // Engine refs
  const audioRef = useRef<AudioEngine | null>(null);
  const inputRef = useRef<InputManager>(new InputManager());
  const noteManagerRef = useRef<NoteManager | null>(null);
  const scoreManagerRef = useRef<ScoreManager | null>(null);
  const particleRef = useRef<ParticleSystem | null>(null);
  const effectsRef = useRef<EffectsManager | null>(null);

  // Track MIDI device connection (don't auto-enable — Chrome requires user gesture)
  useEffect(() => {
    const input = inputRef.current;
    const onDevicesChanged = (devices: string[]) => {
      setMidiConnected(devices.length > 0);
    };
    // If MIDI was already enabled (e.g., user clicked Connect), sync state
    if (input.isMidiEnabled()) {
      setMidiConnected(input.getConnectedMidiDevices().length > 0);
    }
    input.addOnMidiDevicesChanged(onDevicesChanged);
    return () => input.removeOnMidiDevicesChanged(onDevicesChanged);
  }, []);

  // Timing refs
  const gameStartTimeRef = useRef(0);
  const lastFrameTimeRef = useRef(0);
  const rafRef = useRef<number>(0);
  const pauseTimeRef = useRef(0);
  const totalPausedRef = useRef(0);

  // Resolve which note set to use (authentic piano vs simplified keyboard)
  const resolvedSong = useMemo(() => {
    if (!currentSong) return null;
    return resolveSongData(currentSong, effectiveMidiConnected, twoHands);
  }, [currentSong, effectiveMidiConnected, twoHands]);

  // Compute dynamic lanes from resolved note range
  const activeLanes = useMemo(() => {
    if (!resolvedSong) return DEFAULT_ACTIVE_LANES;
    return getActiveLanes(resolvedSong.noteRange);
  }, [resolvedSong]);

  const noteToLane = useMemo(() => {
    return buildNoteToLane(activeLanes);
  }, [activeLanes]);

  const keyLabels = useMemo(() => {
    if (effectiveMidiConnected) {
      // No keyboard labels in MIDI mode — user looks at physical keyboard
      return new Map<MidiNote, string>();
    }
    if (!resolvedSong) return DEFAULT_KEY_LABELS;
    const keyMap = buildKeyboardMap(activeLanes);
    return buildKeyLabels(keyMap);
  }, [effectiveMidiConnected, resolvedSong, activeLanes]);

  // Piano key positions — sized to the song's note range (with padding)
  // Simpler songs = fewer keys = bigger keys on screen
  const songDisplayRange = useMemo(() => {
    if (!resolvedSong) return null;
    const range = resolvedSong.noteRange;
    // Pad by ~3 semitones (but clamp to physical keyboard range in MIDI mode)
    const PAD = 3;
    const minNote = effectiveMidiConnected ? MIDI_49_LOWEST : 21;
    const maxNote = effectiveMidiConnected ? MIDI_49_HIGHEST : 108;
    const lowest = Math.max(range.lowest - PAD, minNote) as MidiNote;
    const highest = Math.min(range.highest + PAD, maxNote) as MidiNote;
    return { lowest, highest };
  }, [resolvedSong, effectiveMidiConnected]);

  const pianoPositions = useMemo(() => {
    if (!songDisplayRange) return undefined;
    return computePianoPositions(songDisplayRange.lowest, songDisplayRange.highest);
  }, [songDisplayRange]);

  const keyboardHeight = useMemo(() => {
    if (!songDisplayRange) return 80;
    return getKeyboardHeight(countWhiteKeysInRange(songDisplayRange.lowest, songDisplayRange.highest));
  }, [songDisplayRange]);

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

  const handleDeleteProfile = useCallback((id: string) => {
    removeProfile(id);
  }, [removeProfile]);

  const handleChangeAvatar = useCallback((id: string, avatarIndex: number) => {
    if (profile && profile.id === id) {
      updateProfile(prev => ({ ...prev, avatarIndex }));
    } else {
      // For non-active profiles, fetch and update
      const target = allProfiles.find(p => p.id === id);
      if (target) {
        const updated = { ...target, avatarIndex };
        import('@/lib/storage').then(({ saveProfile }) => {
          saveProfile(updated).catch(console.error);
        });
      }
    }
  }, [profile, allProfiles, updateProfile]);

  const handleSelectTrack = useCallback((track: Track) => {
    setCurrentTrack(track);
    setGameState('TRACK_MAP');
  }, []);

  const handleFreePlay = useCallback(() => {
    setCurrentTrack(null);
    setGameState('MENU');
  }, []);

  const handleSelectSong = useCallback((song: Song) => {
    setCurrentSong(song);
    setGameState('SPEED_SELECT');
  }, []);

  const handleSpeedSelected = useCallback((speed: SpeedOption, hands: boolean, instrument: InstrumentType) => {
    initAudio();
    audioRef.current?.setInstrument(instrument);
    setSpeedMultiplier(speed);
    setTwoHands(hands);
    setIsAutoplay(false);
    setGameState('COUNTDOWN');
  }, [initAudio]);

  const handleAutoplaySelected = useCallback((speed: SpeedOption, instrument: InstrumentType) => {
    initAudio();
    audioRef.current?.setInstrument(instrument);
    setSpeedMultiplier(speed);
    setTwoHands(false);
    setIsAutoplay(true);
    setGameState('COUNTDOWN');
  }, [initAudio]);

  const handleBackToTracks = useCallback(() => {
    setCurrentTrack(null);
    setGameState('TRACK_SELECT');
  }, []);

  // Start playing after countdown
  const handleCountdownComplete = useCallback(() => {
    if (!currentSong || !resolvedSong) return;

    const songLanes = getActiveLanes(resolvedSong.noteRange);
    const songNoteToLane = buildNoteToLane(songLanes);

    // Build effective song with the resolved note set
    const effectiveSong: Song = {
      ...currentSong,
      notes: resolvedSong.notes,
      noteRange: resolvedSong.noteRange,
    };

    const noteManager = new NoteManager(effectiveSong, songNoteToLane);
    const scoreManager = new ScoreManager();
    const particleSys = new ParticleSystem();
    const effectsMgr = new EffectsManager();

    scoreManager.setTotalNotes(resolvedSong.notes.length);

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
  }, [currentSong, resolvedSong]);

  // Key press handler
  const handleNotePress = useCallback((midiNote: MidiNote, lane: number) => {
    const audio = audioRef.current;
    const noteManager = noteManagerRef.current;
    const scoreManager = scoreManagerRef.current;
    const particleSys = particleRef.current;
    const effectsMgr = effectsRef.current;

    if (!audio || !noteManager || !scoreManager || !particleSys || !effectsMgr) return;

    // Always play sound, even for non-lane MIDI notes
    audio.startNote(midiNote);

    // lane -1 = MIDI note not in game lanes (sound only, no hit check)
    if (lane < 0) return;

    const realElapsed = performance.now() / 1000 - gameStartTimeRef.current - totalPausedRef.current;
    const currentTime = realElapsed * speedMultiplier;
    const hitResult = noteManager.checkHit(midiNote, currentTime);

    if (hitResult) {
      scoreManager.addHit(hitResult.rating);
      audio.playHitSound();

      const currentCombo = scoreManager.getCombo();
      audio.playComboSound(currentCombo);

      const canvasWidth = window.innerWidth;
      // Use piano key positions if available, otherwise equal-width lanes
      let hitX: number;
      const pos = pianoPositions?.get(midiNote);
      if (pos) {
        hitX = pos.center * canvasWidth;
      } else {
        const laneWidth = canvasWidth / activeLanes.length;
        hitX = lane * laneWidth + laneWidth / 2;
      }
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
  }, [activeLanes, pianoPositions, speedMultiplier]);

  // Handle space for crescendo
  useEffect(() => {
    const handleSpace = (e: KeyboardEvent) => {
      if (e.code === 'Space' && gameState === 'PLAYING' && !isAutoplay) {
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
  }, [gameState, isAutoplay]);

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
    setIsAutoplay(false);
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
      setIsAutoplay(false);
      setGameState('COUNTDOWN');
    }
  }, [currentSong]);

  const handleNextLevel = useCallback(() => {
    if (!currentTrack || !currentSong) return;
    const currentLevel = currentTrack.levels.find(l => l.songId === currentSong.id);
    if (!currentLevel) return;
    const nextLevel = currentTrack.levels.find(l => l.levelNumber === currentLevel.levelNumber + 1);
    if (!nextLevel) {
      setGameState('TRACK_MAP');
      setCurrentSong(null);
      return;
    }
    const nextSong = getSong(nextLevel.songId);
    if (nextSong) {
      initAudio();
      setSpeedMultiplier(1); // Next level always at normal speed
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
    input.onKeyUp = (midiNote: MidiNote, lane: number) => {
      // Release the sustained note sound
      audioRef.current?.stopNote(midiNote);

      setPressedNotes((prev) => {
        const next = new Set(prev);
        next.delete(midiNote);
        return next;
      });
      if (lane >= 0) {
        setPressedLanes((prev) => {
          const next = new Set(prev);
          next.delete(lane);
          return next;
        });
      }
    };

    const originalHandler = handleNotePress;
    input.onKeyDown = (midiNote: MidiNote, lane: number) => {
      setPressedNotes((prev) => new Set(prev).add(midiNote));
      if (lane >= 0) {
        setPressedLanes((prev) => new Set(prev).add(lane));
      }
      originalHandler(midiNote, lane);
    };

    if (!isAutoplay) {
      input.start();
    }

    const noteManager = noteManagerRef.current!;
    const scoreManager = scoreManagerRef.current!;
    const particleSys = particleRef.current!;
    const effectsMgr = effectsRef.current!;

    const gameLoop = () => {
      const now = performance.now() / 1000;
      const realElapsed = now - gameStartTimeRef.current - totalPausedRef.current;
      const currentTime = realElapsed * speedMultiplier;
      const deltaTime = Math.min(now - lastFrameTimeRef.current, 0.05);
      lastFrameTimeRef.current = now;

      noteManager.update(currentTime, FALL_DURATION);
      particleSys.update(deltaTime);
      effectsMgr.update(deltaTime);
      scoreManager.updateCrescendo(deltaTime);

      // --- AUTOPLAY: auto-hit notes at the correct time ---
      if (isAutoplay) {
        const audio = audioRef.current;
        const visNotes = noteManager.getVisibleNotes();

        for (const note of visNotes) {
          if (note.hit || note.missed) continue;

          const timeDiff = currentTime - note.songNote.time;

          // Trigger when note reaches hit zone (within ~30ms = 2 frames at 60fps)
          if (timeDiff >= 0 && timeDiff < 0.03) {
            const midiNote = note.songNote.note;

            // Play audio
            audio?.startNote(midiNote);

            // Schedule note-off after real-time duration
            const durationMs = (note.songNote.duration / speedMultiplier) * 1000;
            setTimeout(() => {
              audio?.stopNote(midiNote);
            }, Math.max(durationMs, 100));

            // Register hit (will be PERFECT since timeDiff < 30ms < 50ms window)
            const hitResult = noteManager.checkHit(midiNote, currentTime);
            if (hitResult) {
              scoreManager.addHit(hitResult.rating);

              // Spawn particles & effects
              const canvasWidth = window.innerWidth;
              let hitX: number;
              const pos = pianoPositions?.get(midiNote);
              if (pos) {
                hitX = pos.center * canvasWidth;
              } else {
                const laneWidth = canvasWidth / activeLanes.length;
                hitX = note.lane * laneWidth + laneWidth / 2;
              }
              const hitY = (window.innerHeight - 80) * 0.85;
              const color = getLaneColor(note.lane);
              particleSys.emit(hitX, hitY, color, 15);
              effectsMgr.addHitEffect(note.lane, hitResult.rating, hitX, hitY);
            }

            // Highlight keys visually
            setPressedNotes(prev => new Set(prev).add(midiNote));
            if (note.lane >= 0) {
              setPressedLanes(prev => new Set(prev).add(note.lane));
            }

            // Release key highlight after duration
            const releaseMs = Math.max(durationMs, 80);
            const lane = note.lane;
            setTimeout(() => {
              setPressedNotes(prev => {
                const next = new Set(prev);
                next.delete(midiNote);
                return next;
              });
              if (lane >= 0) {
                setPressedLanes(prev => {
                  const next = new Set(prev);
                  next.delete(lane);
                  return next;
                });
              }
            }, releaseMs);
          }
        }
      }

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
        audioRef.current?.stopAllNotes();

        if (currentSong) {
          if (isPracticeMode) {
            // Practice mode: no XP, no progression
            setLastResultData({ xpEarned: 0, leveledUp: false, isFirstClear: false, newBadges: [] });
          } else {
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
  }, [gameState, currentSong, handleNotePress, noteToLane, recordSongResult, speedMultiplier, isPracticeMode, isAutoplay, activeLanes, pianoPositions]);

  // --- Rendering ---

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-[#0F0B1A] flex items-center justify-center">
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
        onDeleteProfile={handleDeleteProfile}
        onChangeAvatar={handleChangeAvatar}
      />
    );
  }

  if (!profile) {
    return <ProfileSetup onCreateProfile={handleCreateProfile} />;
  }

  return (
    <div className="fixed inset-0 bg-[#0F0B1A] overflow-hidden select-none">
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
            pianoPositions={pianoPositions}
            keyboardHeight={keyboardHeight}
          />
          <PianoKeyboard
            activeLanes={activeLanes}
            keyLabels={keyLabels}
            pressedNotes={pressedNotes}
            hitLanes={hitLanes}
            isMidiMode={effectiveMidiConnected}
            displayRange={songDisplayRange ?? undefined}
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
          {isAutoplay ? (
            <div className="fixed top-14 left-1/2 -translate-x-1/2 z-40 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-semibold">
              Watching Demo {speedMultiplier}x
            </div>
          ) : isPracticeMode ? (
            <div className="fixed top-14 left-1/2 -translate-x-1/2 z-40 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-300 text-xs font-semibold">
              Practice {speedMultiplier}x
            </div>
          ) : null}
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
          onFreePiano={() => {
            initAudio();
            setGameState('FREE_PIANO');
          }}
          onSwitchProfile={() => {
            setGameState('PROFILE_SETUP');
            setShowProfileCreate(false);
          }}
        />
      )}

      {gameState === 'FREE_PIANO' && (
        <FreePiano
          inputManager={inputRef.current}
          onBack={() => setGameState('TRACK_SELECT')}
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

      {gameState === 'SPEED_SELECT' && currentSong && (
        <SpeedSelect
          song={currentSong}
          isMidiMode={effectiveMidiConnected}
          onStart={handleSpeedSelected}
          onAutoplay={handleAutoplaySelected}
          onBack={() => {
            if (currentTrack) {
              setGameState('TRACK_MAP');
            } else {
              setGameState('MENU');
            }
          }}
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
          isPracticeMode={isPracticeMode}
          isAutoplayMode={isAutoplay}
          profile={profile}
          onReplay={handleReplay}
          onMenu={handleQuit}
          onNextLevel={currentTrack && !isPracticeMode ? handleNextLevel : undefined}
        />
      )}
    </div>
  );
}
