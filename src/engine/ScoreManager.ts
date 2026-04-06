import { HitRating, Grade, GameStats } from '@/types/game';
import {
  HIT_POINTS,
  COMBO_MULTIPLIER_THRESHOLDS,
  CRESCENDO_PERFECTS_NEEDED,
  CRESCENDO_DURATION,
  CRESCENDO_MULTIPLIER_BONUS,
  GRADE_THRESHOLDS,
} from '@/constants/scoring';

class ScoreManager {
  private score = 0;
  private combo = 0;
  private maxCombo = 0;
  private multiplier = 1;
  private totalNotes = 0;

  private stats = {
    perfect: 0,
    great: 0,
    good: 0,
    miss: 0,
  };

  // Crescendo mode state
  private consecutivePerfects = 0;
  private crescendoMeter = 0; // 0-1 progress toward activation
  private crescendoActive = false;
  private crescendoTimer = 0;

  addHit(rating: HitRating): void {
    if (rating === 'MISS') {
      this.addMiss();
      return;
    }

    this.stats[rating === 'PERFECT' ? 'perfect' : rating === 'GREAT' ? 'great' : 'good']++;
    this.combo++;
    if (this.combo > this.maxCombo) {
      this.maxCombo = this.combo;
    }

    this.updateMultiplier();

    const effectiveMultiplier = this.crescendoActive
      ? this.multiplier * CRESCENDO_MULTIPLIER_BONUS
      : this.multiplier;

    this.score += HIT_POINTS[rating] * effectiveMultiplier;

    // Track consecutive perfects for crescendo meter
    if (rating === 'PERFECT') {
      this.consecutivePerfects++;
      this.crescendoMeter = Math.min(
        1,
        this.consecutivePerfects / CRESCENDO_PERFECTS_NEEDED
      );
    } else {
      this.consecutivePerfects = 0;
      this.crescendoMeter = 0;
    }
  }

  addMiss(): void {
    this.stats.miss++;
    this.combo = 0;
    this.consecutivePerfects = 0;
    this.crescendoMeter = 0;
    this.updateMultiplier();
  }

  private updateMultiplier(): void {
    let newMultiplier = 1;
    for (const threshold of COMBO_MULTIPLIER_THRESHOLDS) {
      if (this.combo >= threshold.combo) {
        newMultiplier = threshold.multiplier;
      }
    }
    this.multiplier = newMultiplier;
  }

  isCrescendoReady(): boolean {
    return this.crescendoMeter >= 1 && !this.crescendoActive;
  }

  activateCrescendo(): void {
    if (!this.isCrescendoReady()) return;
    this.crescendoActive = true;
    this.crescendoTimer = CRESCENDO_DURATION;
    this.consecutivePerfects = 0;
    this.crescendoMeter = 0;
  }

  updateCrescendo(deltaTime: number): void {
    if (!this.crescendoActive) return;

    this.crescendoTimer -= deltaTime;
    if (this.crescendoTimer <= 0) {
      this.crescendoActive = false;
      this.crescendoTimer = 0;
    }
  }

  isCrescendoActive(): boolean {
    return this.crescendoActive;
  }

  getCrescendoMeter(): number {
    return this.crescendoMeter;
  }

  getCrescendoTimeRemaining(): number {
    return this.crescendoTimer;
  }

  setTotalNotes(total: number): void {
    this.totalNotes = total;
  }

  getScore(): number {
    return this.score;
  }

  getCombo(): number {
    return this.combo;
  }

  getMaxCombo(): number {
    return this.maxCombo;
  }

  getMultiplier(): number {
    return this.crescendoActive
      ? this.multiplier * CRESCENDO_MULTIPLIER_BONUS
      : this.multiplier;
  }

  getBaseMultiplier(): number {
    return this.multiplier;
  }

  getGrade(): Grade {
    if (this.totalNotes === 0) return 'F';

    // Grade based on accuracy (percentage of notes hit)
    const hitNotes = this.stats.perfect + this.stats.great + this.stats.good;
    const accuracy = hitNotes / this.totalNotes;

    for (const threshold of GRADE_THRESHOLDS) {
      if (accuracy >= threshold.min) {
        return threshold.grade;
      }
    }

    return 'F';
  }

  getStats(): GameStats {
    return {
      perfect: this.stats.perfect,
      great: this.stats.great,
      good: this.stats.good,
      miss: this.stats.miss,
      maxCombo: this.maxCombo,
      score: this.score,
      totalNotes: this.totalNotes,
    };
  }

  reset(): void {
    this.score = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.multiplier = 1;
    this.totalNotes = 0;
    this.stats = { perfect: 0, great: 0, good: 0, miss: 0 };
    this.consecutivePerfects = 0;
    this.crescendoMeter = 0;
    this.crescendoActive = false;
    this.crescendoTimer = 0;
  }
}

export default ScoreManager;
