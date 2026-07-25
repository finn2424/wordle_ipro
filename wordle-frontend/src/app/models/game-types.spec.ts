import { describe, it, expect } from 'vitest';
import { LetterStatus, GameStatus, isGameStatus } from './game-types';

describe('game-types', () => {
  describe('LetterStatus', () => {
    it('should have CORRECT as "correct"', () => {
      expect(LetterStatus.CORRECT).toBe('correct');
    });

    it('should have PRESENT as "present"', () => {
      expect(LetterStatus.PRESENT).toBe('present');
    });

    it('should have ABSENT as "absent"', () => {
      expect(LetterStatus.ABSENT).toBe('absent');
    });

    it('should have EMPTY as "empty"', () => {
      expect(LetterStatus.EMPTY).toBe('empty');
    });
  });

  describe('GameStatus', () => {
    it('should have PLAYING as "playing"', () => {
      expect(GameStatus.PLAYING).toBe('playing');
    });

    it('should have WON as "won"', () => {
      expect(GameStatus.WON).toBe('won');
    });

    it('should have LOST as "lost"', () => {
      expect(GameStatus.LOST).toBe('lost');
    });
  });

  describe('isGameStatus', () => {
    it('should return true for "playing"', () => {
      expect(isGameStatus('playing')).toBe(true);
    });

    it('should return true for "won"', () => {
      expect(isGameStatus('won')).toBe(true);
    });

    it('should return true for "lost"', () => {
      expect(isGameStatus('lost')).toBe(true);
    });

    it('should return false for "invalid"', () => {
      expect(isGameStatus('invalid')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isGameStatus('')).toBe(false);
    });

    it('should return false for null', () => {
      expect(isGameStatus(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isGameStatus(undefined)).toBe(false);
    });

    it('should return false for a number', () => {
      expect(isGameStatus(123)).toBe(false);
    });

    it('should return false for a boolean', () => {
      expect(isGameStatus(true)).toBe(false);
    });
  });
});
