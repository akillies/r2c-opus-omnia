import type { Product } from "@shared/schema";

const SYNONYMS: Record<string, string[]> = {
  "trash": ["garbage", "waste", "refuse", "rubbish"],
  "bag": ["liner", "sack"],
  "liner": ["bag", "sack"],
  "can": ["bin", "receptacle", "container"],
  "mop": ["mopping", "floor mop"],
  "cloth": ["rag", "wipe", "towel"],
  "wipe": ["cloth", "towelette"],
  "towel": ["cloth", "wipe", "paper towel"],
  "cleaner": ["cleaning", "detergent", "solution", "cleanser"],
  "cleaning": ["cleaner", "janitorial", "sanitation"],
  "sanitizer": ["disinfectant", "antimicrobial", "germicide"],
  "disinfectant": ["sanitizer", "germicide", "antimicrobial"],
  "spray": ["sprayer", "mist", "aerosol"],
  "glove": ["gloves", "hand protection"],
  "gloves": ["glove", "hand protection"],
  "goggle": ["goggles", "eye protection", "safety glasses"],
  "goggles": ["goggle", "eye protection", "safety glasses"],
  "mask": ["respirator", "face mask", "face covering"],
  "respirator": ["mask", "face mask"],
  "vest": ["hi-vis", "high visibility", "safety vest"],
  "paper": ["sheets", "ream"],
  "pen": ["pens", "writing", "ballpoint"],
  "pens": ["pen", "writing", "ballpoint"],
  "folder": ["folders", "file folder", "binder"],
  "binder": ["binders", "ring binder", "folder"],
  "tape": ["adhesive", "scotch", "packing tape"],
  "label": ["labels", "sticker", "tag"],
  "cup": ["cups", "drinkware"],
  "cups": ["cup", "drinkware"],
  "napkin": ["napkins", "serviette", "tissue"],
  "napkins": ["napkin", "serviette"],
  "coffee": ["java", "brew"],
  "plate": ["plates", "dinnerware"],
  "bulb": ["bulbs", "lamp", "light bulb"],
  "battery": ["batteries", "cell"],
  "batteries": ["battery", "cells"],
  "filter": ["filters", "filtration"],
  "toilet": ["restroom", "bathroom", "lavatory"],
  "tissue": ["toilet paper", "bath tissue"],
  "ppe": ["personal protective equipment", "safety equipment", "protective gear"],
  "safety": ["protective", "protection"],
  "eco": ["green", "sustainable", "environmentally friendly", "recycled"],
  "heavy duty": ["industrial", "commercial grade", "heavy-duty"],
  "industrial": ["heavy duty", "commercial", "commercial grade"],
  "first aid": ["medical", "emergency", "trauma"],
  "earplug": ["ear plug", "hearing protection", "ear protection"],
  "hand towel": ["paper towel", "folded towel", "c-fold"],
};

const STOPWORDS = new Set([
  "a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for",
  "of", "with", "by", "from", "is", "are", "was", "were", "be", "been",
  "has", "had", "do", "does", "did", "will", "would", "could", "should",
  "may", "might", "per", "each", "pack", "box", "case", "qty", "quantity",
]);

interface TermStats {
  df: number;
  idf: number;
}

interface MatchResult {
  product: Product;
  score: number;
  confidence: number;
  matchDetails: {
    exactTerms: string[];
    fuzzyTerms: string[];
    synonymTerms: string[];
    categoryBoost: boolean;
  };
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s\-]/g, " ")
    .split(/[\s\-]+/)
    .filter(w => w.length > 1 && !STOPWORDS.has(w));
}

function expandWithSynonyms(tokens: string[]): string[] {
  const expanded = new Set(tokens);
  for (const token of tokens) {
    const syns = SYNONYMS[token];
    if (syns) {
      for (const syn of syns) {
        for (const part of syn.split(/\s+/)) {
          expanded.add(part);
        }
      }
    }
  }
  return Array.from(expanded);
}

function trigramSimilarity(a: string, b: string): number {
  if (a === b) return 1.0;
  const triA = new Set<string>();
  const triB = new Set<string>();
  const padA = `  ${a} `;
  const padB = `  ${b} `;
  for (let i = 0; i < padA.length - 2; i++) triA.add(padA.substring(i, i + 3));
  for (let i = 0; i < padB.length - 2; i++) triB.add(padB.substring(i, i + 3));

  let intersection = 0;
  triA.forEach(t => {
    if (triB.has(t)) intersection++;
  });
  const union = triA.size + triB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

export class ProductMatcher {
  private products: Product[] = [];
  private termStats: Map<string, TermStats> = new Map();
  private avgDocLength = 0;
  private k1 = 1.5;
  private b = 0.75;

  initialize(products: Product[]) {
    this.products = products;
    this.buildIndex();
  }

  private buildIndex() {
    const docCount = this.products.length;
    const dfMap = new Map<string, number>();
    let totalLength = 0;

    for (const product of this.products) {
      const docTokens = this.getProductTokens(product);
      totalLength += docTokens.length;
      const uniqueTokens = Array.from(new Set(docTokens));
      for (const token of uniqueTokens) {
        dfMap.set(token, (dfMap.get(token) || 0) + 1);
      }
    }

    this.avgDocLength = totalLength / Math.max(1, docCount);

    Array.from(dfMap.entries()).forEach(([term, df]) => {
      const idf = Math.log((docCount - df + 0.5) / (df + 0.5) + 1);
      this.termStats.set(term, { df, idf });
    });
  }

  private getProductTokens(product: Product): string[] {
    const parts = [
      product.name || "",
      product.description || "",
      product.brand || "",
      product.category || "",
      product.categoryPath || "",
    ];
    return tokenize(parts.join(" "));
  }

  private bm25Score(queryTokens: string[], docTokens: string[]): number {
    const docLength = docTokens.length;
    const tfMap = new Map<string, number>();
    for (const token of docTokens) {
      tfMap.set(token, (tfMap.get(token) || 0) + 1);
    }

    let score = 0;
    for (const qt of queryTokens) {
      const stats = this.termStats.get(qt);
      if (!stats) continue;
      const tf = tfMap.get(qt) || 0;
      if (tf === 0) continue;
      const numerator = stats.idf * tf * (this.k1 + 1);
      const denominator = tf + this.k1 * (1 - this.b + this.b * (docLength / this.avgDocLength));
      score += numerator / denominator;
    }
    return score;
  }

  match(searchTerm: string, topK: number = 5): MatchResult[] {
    if (this.products.length === 0) return [];

    const queryTokens = tokenize(searchTerm);
    if (queryTokens.length === 0) return [];

    const expandedTokens = expandWithSynonyms(queryTokens);

    const results: MatchResult[] = [];

    for (const product of this.products) {
      const nameTokens = tokenize(product.name || "");
      const docTokens = this.getProductTokens(product);

      const exactBM25 = this.bm25Score(queryTokens, docTokens);
      const synonymBM25 = this.bm25Score(expandedTokens, docTokens);

      let fuzzyBonus = 0;
      const fuzzyTerms: string[] = [];
      for (const qt of queryTokens) {
        for (const nt of nameTokens) {
          const sim = trigramSimilarity(qt, nt);
          if (sim > 0.4 && sim < 1.0) {
            fuzzyBonus += sim * 2;
            fuzzyTerms.push(`${qt}≈${nt}`);
          }
        }
      }

      const nameBoost = this.bm25Score(queryTokens, nameTokens) * 2.0;

      let score = exactBM25 + (synonymBM25 - exactBM25) * 0.5 + fuzzyBonus + nameBoost;

      const categoryBoost = queryTokens.some(qt =>
        (product.category || "").toLowerCase().includes(qt) ||
        (product.categoryPath || "").toLowerCase().includes(qt)
      );
      if (categoryBoost) score *= 1.1;

      const exactTerms = queryTokens.filter(qt => docTokens.includes(qt));
      const synonymTerms = expandedTokens.filter(et =>
        !queryTokens.includes(et) && docTokens.includes(et)
      );

      if (score > 0.1) {
        const maxPossibleScore = queryTokens.length * 8;
        const confidence = Math.min(0.99, 0.5 + (score / maxPossibleScore) * 0.5);

        results.push({
          product,
          score,
          confidence,
          matchDetails: {
            exactTerms,
            fuzzyTerms,
            synonymTerms,
            categoryBoost,
          },
        });
      }
    }

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, topK);
  }

  matchItems(items: Array<{ name: string; quantity: number; unitOfMeasure?: string; description?: string; estimatedPrice?: string }>): any[] {
    return items.map(item => {
      const searchText = [item.name, item.description].filter(Boolean).join(" ");
      const matches = this.match(searchText, 1);
      const best = matches[0];

      if (best) {
        return {
          requestedItem: item,
          matchedProduct: best.product,
          confidence: best.confidence.toFixed(2),
          quantity: item.quantity,
          matchDetails: best.matchDetails,
        };
      }

      return {
        requestedItem: item,
        matchedProduct: null,
        confidence: "0.00",
        quantity: item.quantity,
        matchDetails: { exactTerms: [], fuzzyTerms: [], synonymTerms: [], categoryBoost: false },
      };
    });
  }
}

export const productMatcher = new ProductMatcher();
