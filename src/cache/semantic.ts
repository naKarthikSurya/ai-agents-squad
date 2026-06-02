import fs from 'node:fs';
import path from 'node:path';

export interface CacheEntry {
  query: string;
  response: string;
  timestamp: string;
}

export class SemanticCache {
  private cachePath: string;
  private entries: CacheEntry[] = [];

  constructor() {
    const projectRoot = process.cwd();
    const storageDir = path.join(projectRoot, '.talos', 'storage');
    if (!fs.existsSync(storageDir)) {
      fs.mkdirSync(storageDir, { recursive: true });
    }
    this.cachePath = path.join(storageDir, 'semantic_cache.json');
    this.loadCache();
  }

  private loadCache() {
    if (fs.existsSync(this.cachePath)) {
      try {
        const raw = fs.readFileSync(this.cachePath, 'utf8');
        this.entries = JSON.parse(raw);
      } catch (e) {
        this.entries = [];
      }
    }
  }

  private saveCache() {
    try {
      fs.writeFileSync(this.cachePath, JSON.stringify(this.entries, null, 2), 'utf8');
    } catch (e) {
      // Ignore write errors
    }
  }

  /**
   * Helper to construct a token frequency map (vector) from a text query.
   */
  private getTermVector(text: string): Map<string, number> {
    const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2); // Exclude very short stopwords

    const vector = new Map<string, number>();
    for (const w of words) {
      vector.set(w, (vector.get(w) || 0) + 1);
    }
    return vector;
  }

  /**
   * Computes the Cosine Similarity between two term frequency vectors.
   */
  private cosineSimilarity(v1: Map<string, number>, v2: Map<string, number>): number {
    let dotProduct = 0;
    let magnitude1 = 0;
    let magnitude2 = 0;

    // Collect all unique keys
    const allKeys = new Set([...v1.keys(), ...v2.keys()]);

    for (const key of allKeys) {
      const val1 = v1.get(key) || 0;
      const val2 = v2.get(key) || 0;

      dotProduct += val1 * val2;
      magnitude1 += val1 * val1;
      magnitude2 += val2 * val2;
    }

    if (magnitude1 === 0 || magnitude2 === 0) return 0;
    return dotProduct / (Math.sqrt(magnitude1) * Math.sqrt(magnitude2));
  }

  /**
   * Performs semantic lookup in the local cache. 
   * Returns the cached response if similarity exceeds the threshold.
   */
  public lookup(query: string, threshold = 0.82): string | null {
    if (this.entries.length === 0) return null;

    const queryVector = this.getTermVector(query);
    let bestMatch: CacheEntry | null = null;
    let maxSimilarity = 0;

    for (const entry of this.entries) {
      const entryVector = this.getTermVector(entry.query);
      const similarity = this.cosineSimilarity(queryVector, entryVector);
      if (similarity > maxSimilarity) {
        maxSimilarity = similarity;
        bestMatch = entry;
      }
    }

    if (maxSimilarity >= threshold && bestMatch) {
      console.error(`[Semantic Cache HIT] Cosine Similarity: ${(maxSimilarity * 100).toFixed(1)}%`);
      return bestMatch.response;
    }

    return null;
  }

  /**
   * Commits a new query-response resolution to the local cache.
   */
  public set(query: string, response: string) {
    // Avoid double caching identical entries
    const existing = this.entries.find(e => e.query.toLowerCase() === query.toLowerCase());
    if (existing) {
      existing.response = response;
      existing.timestamp = new Date().toISOString();
    } else {
      this.entries.push({
        query,
        response,
        timestamp: new Date().toISOString()
      });
    }
    this.saveCache();
  }
}
