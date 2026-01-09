/**
 * Simple in-memory cache with TTL support
 * Prevents repeated fetches for the same queries
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class Cache {
  private store: Map<string, CacheEntry<unknown>> = new Map();
  private defaultTTL: number;

  constructor(defaultTTL = 300000) { // 5 minutes default
    this.defaultTTL = defaultTTL;
  }

  /**
   * Get a cached value if it exists and hasn't expired
   */
  get<T>(key: string): T | null {
    const entry = this.store.get(key) as CacheEntry<T> | undefined;
    
    if (!entry) {
      return null;
    }

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      // Expired, remove it
      this.store.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Set a value in the cache
   */
  set<T>(key: string, data: T, ttl?: number): void {
    this.store.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl ?? this.defaultTTL,
    });
  }

  /**
   * Check if a key exists and is valid
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Remove a specific key
   */
  delete(key: string): void {
    this.store.delete(key);
  }

  /**
   * Clear all entries
   */
  clear(): void {
    this.store.clear();
  }

  /**
   * Clean up expired entries
   */
  cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];
    
    this.store.forEach((entry, key) => {
      if (now - entry.timestamp > entry.ttl) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => this.store.delete(key));
  }

  /**
   * Get cache statistics
   */
  stats(): { size: number; keys: string[] } {
    return {
      size: this.store.size,
      keys: Array.from(this.store.keys()),
    };
  }
}

// Singleton cache instances for different purposes
const CACHE_TTL = parseInt(process.env.CACHE_TTL || '300', 10) * 1000;

export const searchCache = new Cache(CACHE_TTL);
export const pageCache = new Cache(CACHE_TTL);
export const answerCache = new Cache(CACHE_TTL);

/**
 * Generate a cache key from query parameters
 */
export function cacheKey(...parts: (string | number)[]): string {
  return parts.map(p => String(p).toLowerCase().trim()).join(':');
}

export default Cache;
