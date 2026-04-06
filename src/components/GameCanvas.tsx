'use client';

import { useEffect, useRef, useCallback } from 'react';
import Renderer from '@/engine/Renderer';
import { ActiveNote, Particle, HitEffect, MidiNote } from '@/types/game';
import { PianoKeyPos } from '@/utils/pianoPositions';

interface GameCanvasProps {
  notes: ActiveNote[];
  particles: Particle[];
  effects: HitEffect[];
  pressedLanes: Set<number>;
  crescendoActive: boolean;
  bpm: number;
  songProgress: number;
  activeLanes: MidiNote[];
  pianoPositions?: Map<MidiNote, PianoKeyPos>;
}

export default function GameCanvas({
  notes,
  particles,
  effects,
  pressedLanes,
  crescendoActive,
  bpm,
  songProgress,
  activeLanes,
  pianoPositions,
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<Renderer | null>(null);

  // Initialize renderer
  useEffect(() => {
    if (!canvasRef.current) return;
    rendererRef.current = new Renderer(canvasRef.current);

    const handleResize = () => rendererRef.current?.resize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Update lane config when activeLanes or pianoPositions change
  useEffect(() => {
    rendererRef.current?.setLaneConfig(activeLanes, pianoPositions);
  }, [activeLanes, pianoPositions]);

  // Render frame
  const renderFrame = useCallback(() => {
    rendererRef.current?.render(
      notes,
      particles,
      effects,
      pressedLanes,
      crescendoActive,
      bpm,
      songProgress,
    );
  }, [notes, particles, effects, pressedLanes, crescendoActive, bpm, songProgress]);

  useEffect(() => {
    renderFrame();
  }, [renderFrame]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full"
      style={{ height: 'calc(100% - 80px)' }}
    />
  );
}
