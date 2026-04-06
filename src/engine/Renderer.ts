import { ActiveNote, Particle, HitEffect, MidiNote } from '@/types/game';
import { getLaneColor, getLaneColorDim, HIT_RATING_COLORS, BG_COLOR, LANE_LINE_COLOR, HIT_ZONE_COLOR, CRESCENDO_COLOR } from '@/constants/colors';
import { midiNoteToName, isWhiteKey } from '@/constants/keyboard';
import { HIT_ZONE_Y, HIT_EFFECT_DURATION } from '@/constants/timing';
import { lerp } from '@/utils/math';

class Renderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private width = 0;
  private height = 0;
  private time = 0;

  // Dynamic lane configuration
  private laneCount = 8;
  private activeLanes: MidiNote[] = [];

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.resize();
  }

  setLaneConfig(activeLanes: MidiNote[]): void {
    this.activeLanes = activeLanes;
    this.laneCount = activeLanes.length;
  }

  resize(): void {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    this.width = rect.width;
    this.height = rect.height;
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.scale(dpr, dpr);
  }

  render(
    notes: ActiveNote[],
    particles: Particle[],
    effects: HitEffect[],
    pressedLanes: Set<number>,
    crescendoActive: boolean,
    bpm: number,
    songProgress: number,
  ): void {
    this.time = performance.now() / 1000;
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    // Clear
    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, w, h);

    // Background grid pulse
    this.drawBackgroundGrid(w, h);

    // Crescendo border glow
    if (crescendoActive) {
      this.drawCrescendoBorder(w, h);
    }

    // Lane dividers
    this.drawLanes(w, h);

    // Hit zone
    this.drawHitZone(w, h, pressedLanes);

    // Notes
    for (const note of notes) {
      this.drawNote(note, w, h, crescendoActive);
    }

    // Particles
    for (const particle of particles) {
      this.drawParticle(particle);
    }

    // Hit effects (text popups)
    for (const effect of effects) {
      this.drawHitEffect(effect, h);
    }

    // Song progress bar
    this.drawProgressBar(w, h, songProgress);
  }

  private drawBackgroundGrid(w: number, h: number): void {
    const ctx = this.ctx;
    const pulse = 0.03 + Math.sin(this.time * 2) * 0.015;

    ctx.strokeStyle = `rgba(255, 255, 255, ${pulse})`;
    ctx.lineWidth = 0.5;

    const gridSize = 40;
    for (let x = 0; x < w; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
  }

  private drawCrescendoBorder(w: number, h: number): void {
    const ctx = this.ctx;
    const glow = 10 + Math.sin(this.time * 4) * 5;

    ctx.save();
    ctx.shadowColor = CRESCENDO_COLOR;
    ctx.shadowBlur = glow;
    ctx.strokeStyle = CRESCENDO_COLOR;
    ctx.lineWidth = 3;
    ctx.strokeRect(2, 2, w - 4, h - 4);
    ctx.restore();
  }

  private drawLanes(w: number, h: number): void {
    const ctx = this.ctx;
    const lanes = this.laneCount;
    const laneWidth = w / lanes;

    // Shade black-key lanes darker so they're visually distinct
    for (let i = 0; i < lanes; i++) {
      if (!isWhiteKey(this.activeLanes[i])) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
        ctx.fillRect(i * laneWidth, 0, laneWidth, h);
      }
    }

    ctx.strokeStyle = LANE_LINE_COLOR;
    ctx.lineWidth = 1;

    for (let i = 1; i < lanes; i++) {
      const x = i * laneWidth;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }

    // Draw lane glow at bottom (subtle)
    for (let i = 0; i < lanes; i++) {
      const x = i * laneWidth + laneWidth / 2;
      const y = h * HIT_ZONE_Y;

      const gradient = ctx.createRadialGradient(x, y, 0, x, y, laneWidth * 0.6);
      gradient.addColorStop(0, getLaneColorDim(i));
      gradient.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient;
      ctx.fillRect(i * laneWidth, y - laneWidth * 0.3, laneWidth, laneWidth * 0.6);
    }
  }

  private drawHitZone(w: number, h: number, pressedLanes: Set<number>): void {
    const ctx = this.ctx;
    const y = h * HIT_ZONE_Y;
    const lanes = this.laneCount;
    const laneWidth = w / lanes;

    // Base hit zone line
    ctx.fillStyle = HIT_ZONE_COLOR;
    ctx.fillRect(0, y - 2, w, 4);

    // Pressed lane highlights
    for (const lane of pressedLanes) {
      const color = getLaneColor(lane);
      const x = lane * laneWidth;

      ctx.save();
      ctx.shadowColor = color;
      ctx.shadowBlur = 20;
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.4;
      ctx.fillRect(x, y - 15, laneWidth, 30);
      ctx.globalAlpha = 1;
      ctx.restore();
    }
  }

  private drawNote(note: ActiveNote, w: number, h: number, crescendoActive: boolean): void {
    const ctx = this.ctx;
    const lanes = this.laneCount;
    const laneWidth = w / lanes;
    // Black-key notes are narrower to match piano visual
    const isBlack = note.lane < this.activeLanes.length && !isWhiteKey(this.activeLanes[note.lane]);
    const noteWidth = laneWidth * (isBlack ? 0.55 : 0.7);
    const color = crescendoActive ? CRESCENDO_COLOR : getLaneColor(note.lane);

    const x = note.lane * laneWidth + (laneWidth - noteWidth) / 2;
    const noteHeight = Math.max(note.height * h * HIT_ZONE_Y * 0.3, 20);
    const y = note.y * h * HIT_ZONE_Y - noteHeight;

    ctx.save();
    ctx.globalAlpha = note.opacity;

    // Missed notes turn gray
    const drawColor = note.missed ? '#444444' : color;

    // Glow
    ctx.shadowColor = drawColor;
    ctx.shadowBlur = note.hit ? 30 : 12;

    // Note body (rounded rect)
    const radius = 6;
    ctx.fillStyle = drawColor;
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + noteWidth - radius, y);
    ctx.quadraticCurveTo(x + noteWidth, y, x + noteWidth, y + radius);
    ctx.lineTo(x + noteWidth, y + noteHeight - radius);
    ctx.quadraticCurveTo(x + noteWidth, y + noteHeight, x + noteWidth - radius, y + noteHeight);
    ctx.lineTo(x + radius, y + noteHeight);
    ctx.quadraticCurveTo(x, y + noteHeight, x, y + noteHeight - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fill();

    // Inner highlight
    const innerGradient = ctx.createLinearGradient(x, y, x, y + noteHeight);
    innerGradient.addColorStop(0, 'rgba(255,255,255,0.3)');
    innerGradient.addColorStop(0.5, 'rgba(255,255,255,0.05)');
    innerGradient.addColorStop(1, 'rgba(255,255,255,0.1)');
    ctx.fillStyle = innerGradient;
    ctx.fill();

    // Brightness pulse as note approaches hit zone
    if (!note.hit && !note.missed && note.y > 0.7) {
      const intensity = (note.y - 0.7) / 0.3;
      ctx.shadowBlur = lerp(12, 25, intensity);
    }

    ctx.restore();
  }

  private drawParticle(particle: Particle): void {
    const ctx = this.ctx;
    const alpha = particle.life / particle.maxLife;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = particle.color;
    ctx.shadowColor = particle.color;
    ctx.shadowBlur = 5;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size * alpha, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  private drawHitEffect(effect: HitEffect, h: number): void {
    const ctx = this.ctx;
    const progress = 1 - effect.time / HIT_EFFECT_DURATION;
    const alpha = 1 - progress;
    const scale = 1 + progress * 0.5;
    const yOffset = progress * -40;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = `bold ${Math.round(18 * scale)}px "Inter", sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillStyle = HIT_RATING_COLORS[effect.rating];
    ctx.shadowColor = HIT_RATING_COLORS[effect.rating];
    ctx.shadowBlur = 10;
    ctx.fillText(effect.rating, effect.x, effect.y + yOffset);
    ctx.restore();
  }

  private drawProgressBar(w: number, h: number, progress: number): void {
    const ctx = this.ctx;
    const barHeight = 3;
    const barY = h - barHeight;

    // Background
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.fillRect(0, barY, w, barHeight);

    // Progress
    const gradient = ctx.createLinearGradient(0, barY, w * progress, barY);
    gradient.addColorStop(0, '#ff3366');
    gradient.addColorStop(0.5, '#ffcc00');
    gradient.addColorStop(1, '#33ff66');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, barY, w * progress, barHeight);
  }
}

export default Renderer;
