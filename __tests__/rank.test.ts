/**
 * Tests for the ranking and extraction modules
 */

import { tokenize, calculateBM25Score } from '../lib/extract';

describe('tokenize', () => {
  it('should tokenize simple text', () => {
    const result = tokenize('Hello world');
    expect(result).toEqual(['hello', 'world']);
  });

  it('should remove stopwords', () => {
    const result = tokenize('The quick brown fox jumps over the lazy dog');
    expect(result).not.toContain('the');
    expect(result).toContain('quick');
    expect(result).toContain('brown');
    expect(result).toContain('fox');
    expect(result).toContain('jumps');
    expect(result).toContain('lazy');
    expect(result).toContain('dog');
  });

  it('should handle punctuation', () => {
    const result = tokenize('Hello, world! How are you?');
    expect(result).toContain('hello');
    expect(result).toContain('world');
    expect(result).not.toContain('how'); // stopword
    expect(result).not.toContain('are'); // stopword
    expect(result).not.toContain('you'); // stopword
  });

  it('should remove short words', () => {
    const result = tokenize('I am a big dog');
    expect(result).not.toContain('am');
    expect(result).toContain('big');
    expect(result).toContain('dog');
  });

  it('should handle empty input', () => {
    const result = tokenize('');
    expect(result).toEqual([]);
  });

  it('should handle text with only stopwords', () => {
    const result = tokenize('the a an is are was were');
    expect(result).toEqual([]);
  });
});

describe('calculateBM25Score', () => {
  const idfScores = new Map<string, number>([
    ['meditation', 2.0],
    ['benefits', 1.5],
    ['health', 1.0],
    ['stress', 1.2],
  ]);
  const avgDocLength = 100;

  it('should return 0 for empty text', () => {
    const score = calculateBM25Score('', ['meditation'], idfScores, avgDocLength);
    expect(score).toBe(0);
  });

  it('should return 0 for text with no matching terms', () => {
    const score = calculateBM25Score(
      'This is about cooking recipes',
      ['meditation', 'benefits'],
      idfScores,
      avgDocLength
    );
    expect(score).toBe(0);
  });

  it('should return positive score for matching terms', () => {
    const score = calculateBM25Score(
      'Meditation has many benefits for your health including reducing stress',
      ['meditation', 'benefits', 'health', 'stress'],
      idfScores,
      avgDocLength
    );
    expect(score).toBeGreaterThan(0);
  });

  it('should give higher score to more relevant text', () => {
    const highRelevance = calculateBM25Score(
      'Meditation meditation meditation benefits benefits health stress reduction',
      ['meditation', 'benefits'],
      idfScores,
      avgDocLength
    );
    
    const lowRelevance = calculateBM25Score(
      'Some general text about various topics like cooking and sports',
      ['meditation', 'benefits'],
      idfScores,
      avgDocLength
    );
    
    expect(highRelevance).toBeGreaterThan(lowRelevance);
  });

  it('should handle repeated terms with saturation', () => {
    const fewRepeats = calculateBM25Score(
      'Meditation is good for health',
      ['meditation'],
      idfScores,
      avgDocLength
    );
    
    const manyRepeats = calculateBM25Score(
      'Meditation meditation meditation meditation meditation is very good',
      ['meditation'],
      idfScores,
      avgDocLength
    );
    
    // BM25 has term frequency saturation, so many repeats shouldn't be 5x higher
    expect(manyRepeats).toBeGreaterThan(fewRepeats);
    expect(manyRepeats).toBeLessThan(fewRepeats * 5);
  });
});

describe('integration', () => {
  it('should correctly identify relevant content', () => {
    const query = 'benefits of meditation for anxiety';
    const queryTerms = tokenize(query);
    
    expect(queryTerms).toContain('benefits');
    expect(queryTerms).toContain('meditation');
    expect(queryTerms).toContain('anxiety');
    expect(queryTerms).not.toContain('of');
    expect(queryTerms).not.toContain('for');
  });
});
