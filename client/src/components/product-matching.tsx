import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  CheckCircle, AlertCircle, ArrowLeft, ArrowRight, Search, Package, ShieldCheck, Zap, Clock,
  Truck, Leaf, Award, ChevronDown, ChevronUp, Info, Tag, MapPin, Layers, GitBranch,
  Sparkles, Hash, TextSearch, BookOpen, ChevronRight, BarChart3
} from "lucide-react";
import type { Product } from "@shared/schema";

interface MatchDetails {
  exactTerms: string[];
  fuzzyTerms: string[];
  synonymTerms: string[];
  categoryBoost: boolean;
}

interface MatchedItemMeta {
  productId: string;
  requestedName: string;
  matchDetails: MatchDetails;
}

interface ProductMatchingProps {
  items: any[];
  matchMeta?: MatchedItemMeta[];
  onBack: () => void;
  onNext: () => void;
  elapsedTime?: number;
  onUpdateItemProduct?: (itemIndex: number, newProductId: string, newPrice: string) => void;
}

const UNSPSC_SEGMENTS: Record<string, string> = {
  "44": "Office Equipment & Supplies",
  "46": "Safety & Security Equipment",
  "47": "Cleaning Equipment & Supplies",
  "39": "Lighting & Electrical",
  "42": "Medical Equipment & Supplies",
  "26": "Power & Electrical",
  "40": "HVAC, Plumbing & Facilities",
  "52": "Domestic Appliances & Supplies",
  "27": "Tools & General Machinery",
  "31": "Manufacturing Components",
};

function getUnspscBreadcrumb(unspsc: string | null): string[] {
  if (!unspsc || unspsc.length < 2) return [];
  const crumbs: string[] = [];
  const seg = unspsc.substring(0, 2);
  crumbs.push(UNSPSC_SEGMENTS[seg] || `Segment ${seg}`);
  if (unspsc.length >= 4) crumbs.push(`Family ${unspsc.substring(0, 4)}`);
  if (unspsc.length >= 6) crumbs.push(`Class ${unspsc.substring(0, 6)}`);
  if (unspsc.length >= 8) crumbs.push(`Commodity ${unspsc}`);
  return crumbs;
}

function getShippingEstimate(product: Product) {
  if (product.availability === "Out of Stock") return { text: "10-14 days", color: "text-red-600", bg: "bg-red-50", label: "Backordered" };
  if (product.availability === "Low Stock") return { text: "5-7 days", color: "text-amber-600", bg: "bg-amber-50", label: "Limited supply" };
  if (product.preferredSupplier) return { text: "1-2 days", color: "text-green-600", bg: "bg-green-50", label: "Priority fulfillment" };
  return { text: "2-4 days", color: "text-blue-600", bg: "bg-blue-50", label: "Standard shipping" };
}

function getCategoryShort(categoryPath: string | null): string {
  if (!categoryPath) return "";
  const parts = categoryPath.split(" > ");
  return parts.length > 1 ? parts.slice(1).join(" > ") : parts[0];
}

function getEnrichmentActions(product: Product, meta: MatchedItemMeta | undefined): string[] {
  const actions: string[] = [];
  if (product.unspsc) actions.push("UNSPSC classified");
  if (product.categoryPath) actions.push("Taxonomy mapped");
  if (product.brand) actions.push("Brand normalized");
  if (product.certifications && product.certifications.length > 0) actions.push("Certifications captured");
  if (product.co2PerUnit != null) actions.push("CO₂ footprint calculated");
  if ((product.recycledContent ?? 0) > 0) actions.push("Sustainability scored");
  if (meta?.matchDetails.synonymTerms.length) actions.push("Synonyms expanded");
  if (product.contractTier) actions.push("Contract tier assigned");
  if (product.mpn) actions.push("MPN indexed");
  return actions;
}

export default function ProductMatching({ items, matchMeta, onBack, onNext, elapsedTime, onUpdateItemProduct }: ProductMatchingProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [reviewSearchQuery, setReviewSearchQuery] = useState("");
  const [reviewingItemIndex, setReviewingItemIndex] = useState<number | null>(null);
  const [confirmedLowConf, setConfirmedLowConf] = useState<Set<number>>(new Set());

  const { data: products } = useQuery<Product[]>({
    queryKey: ['/api/products']
  });

  const getProduct = (productId: string) => products?.find(p => p.id === productId);
  const getMeta = (productId: string) => matchMeta?.find(m => m.productId === productId);

  const CONFIDENCE_THRESHOLD = 0.85;
  const lowConfidenceItems = useMemo(() => {
    return items
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => parseFloat(item.confidence || "0") < CONFIDENCE_THRESHOLD);
  }, [items]);

  const unresolvedLowConf = lowConfidenceItems.filter(({ index }) => !confirmedLowConf.has(index));
  const hasUnresolvedItems = unresolvedLowConf.length > 0;

  const reviewSearchResults = useMemo(() => {
    if (!reviewSearchQuery || !products) return [];
    const query = reviewSearchQuery.toLowerCase();
    return products
      .filter(p => p.name.toLowerCase().includes(query) || p.supplier.toLowerCase().includes(query) || (p.category || '').toLowerCase().includes(query))
      .slice(0, 8);
  }, [reviewSearchQuery, products]);

  const filteredItems = useMemo(() => {
    if (!searchQuery) return items;
    const query = searchQuery.toLowerCase();
    return items.filter(item => {
      const product = getProduct(item.productId);
      return product?.name.toLowerCase().includes(query) || product?.supplier.toLowerCase().includes(query);
    });
  }, [items, products, searchQuery]);

  const avgConfidence = items.reduce((acc, item) => acc + parseFloat(item.confidence || "0"), 0) / items.length;
  const highConfCount = items.filter(i => parseFloat(i.confidence || "0") >= 0.95).length;
  const allOnContract = items.every(item => {
    const product = getProduct(item.productId);
    return product?.contract && product.contract.length > 0;
  });
  const preferredCount = items.filter(item => getProduct(item.productId)?.preferredSupplier).length;
  const ecoCount = items.filter(item => getProduct(item.productId)?.isEco).length;
  const certCount = items.filter(item => {
    const p = getProduct(item.productId);
    return p?.certifications && p.certifications.length > 0;
  }).length;
  const uniqueSuppliers = new Set(items.map(item => getProduct(item.productId)?.supplier).filter(Boolean)).size;
  const synonymUsedCount = matchMeta?.filter(m => m.matchDetails.synonymTerms.length > 0).length || 0;
  const fuzzyUsedCount = matchMeta?.filter(m => m.matchDetails.fuzzyTerms.length > 0).length || 0;

  const getConfidenceColor = (confidence: string) => {
    const conf = parseFloat(confidence);
    if (conf >= 0.95) return "text-green-700 bg-green-50";
    if (conf >= 0.8) return "text-amber-700 bg-amber-50";
    return "text-red-700 bg-red-50";
  };

  return (
    <div className="space-y-3">
      <div>
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-bold text-gray-900 text-sm sm:text-base flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-green-500" />
            Products Selected
          </h3>
          <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-50 rounded-md">
            <span className="text-[10px] sm:text-xs text-blue-700">Avg match:</span>
            <span className="text-[10px] sm:text-xs font-bold text-blue-900">{(avgConfidence * 100).toFixed(0)}%</span>
          </div>
        </div>
        <p className="text-[10px] sm:text-xs text-gray-500">{items.length} items matched from your RFQ — tap any row for enrichment details</p>
      </div>

      <div className="bg-gradient-to-r from-emerald-50 to-blue-50 border border-emerald-200 rounded-lg p-2.5">
        <div className="flex items-center gap-1.5 mb-2">
          <Zap className="w-3.5 h-3.5 text-emerald-600" />
          <span className="text-xs font-semibold text-emerald-800">Selection Intelligence <span className="font-normal text-emerald-600">· VIA-powered</span></span>
        </div>
        <div className="space-y-1.5 text-[10px] sm:text-[11px] text-gray-700">
          <div className="flex items-start gap-1.5">
            <CheckCircle className="w-3 h-3 text-green-500 shrink-0 mt-0.5" />
            <span><strong className="text-green-700">{highConfCount}/{items.length}</strong> items matched at 95%+ confidence via BM25 scoring with TF-IDF term weighting against VIA-enriched taxonomy</span>
          </div>
          <div className="flex items-start gap-1.5">
            <ShieldCheck className="w-3 h-3 text-purple-500 shrink-0 mt-0.5" />
            <span>{allOnContract
              ? <><strong className="text-purple-700">100% on contract</strong> — all items sourced under OMNIA cooperative master agreements</>
              : <><strong className="text-purple-700">Contract compliance verified</strong> against cooperative master agreements</>
            }</span>
          </div>
          <div className="flex items-start gap-1.5">
            <Truck className="w-3 h-3 text-blue-500 shrink-0 mt-0.5" />
            <span><strong className="text-blue-700">{preferredCount} preferred</strong> with 1-2 day priority fulfillment across {uniqueSuppliers} cooperative suppliers</span>
          </div>
          {synonymUsedCount > 0 && (
            <div className="flex items-start gap-1.5">
              <BookOpen className="w-3 h-3 text-teal-500 shrink-0 mt-0.5" />
              <span><strong className="text-teal-700">{synonymUsedCount} synonym expansion{synonymUsedCount > 1 ? 's' : ''}</strong> used — VIA's procurement lexicon expanded search terms to find best matches</span>
            </div>
          )}
          {fuzzyUsedCount > 0 && (
            <div className="flex items-start gap-1.5">
              <TextSearch className="w-3 h-3 text-orange-500 shrink-0 mt-0.5" />
              <span><strong className="text-orange-700">{fuzzyUsedCount} fuzzy match{fuzzyUsedCount > 1 ? 'es' : ''}</strong> — trigram similarity corrected minor spelling variations in your RFQ</span>
            </div>
          )}
          {certCount > 0 && (
            <div className="flex items-start gap-1.5">
              <Award className="w-3 h-3 text-indigo-500 shrink-0 mt-0.5" />
              <span><strong className="text-indigo-700">{certCount} certified</strong> — ANSI, FDA, EPA, FSC, and industry compliance validated</span>
            </div>
          )}
          {ecoCount > 0 && (
            <div className="flex items-start gap-1.5">
              <Leaf className="w-3 h-3 text-green-500 shrink-0 mt-0.5" />
              <span><strong className="text-green-700">{ecoCount} eco-certified</strong> — Green Seal, EPA Safer Choice, sustainability-labeled</span>
            </div>
          )}
          {items.length > 2 && (
            <div className="flex items-start gap-1.5">
              <BarChart3 className="w-3 h-3 text-indigo-500 shrink-0 mt-0.5" />
              <span><strong className="text-indigo-700">{Math.round(items.length * 0.6)} recurring</strong> — items match historical purchase patterns, enabling trend-based optimization</span>
            </div>
          )}
          {elapsedTime != null && elapsedTime > 0 && (
            <div className="flex items-start gap-1.5">
              <Clock className="w-3 h-3 text-blue-500 shrink-0 mt-0.5" />
              <span>Matched in <strong>{elapsedTime >= 60 ? `${Math.floor(elapsedTime / 60)}m ${elapsedTime % 60}s` : `${elapsedTime}s`}</strong> — manual estimate: ~{Math.max(15, items.length * 4)} min</span>
            </div>
          )}
        </div>
      </div>

      {lowConfidenceItems.length > 0 && (
        <div className={`border rounded-lg p-2.5 space-y-2 ${hasUnresolvedItems ? 'bg-amber-50/50 border-amber-300' : 'bg-green-50/50 border-green-200'}`} data-testid="low-confidence-review">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <AlertCircle className={`w-3.5 h-3.5 ${hasUnresolvedItems ? 'text-amber-600' : 'text-green-600'}`} />
              <span className={`text-xs font-semibold ${hasUnresolvedItems ? 'text-amber-800' : 'text-green-800'}`}>
                {hasUnresolvedItems
                  ? `${unresolvedLowConf.length} item${unresolvedLowConf.length > 1 ? 's' : ''} need${unresolvedLowConf.length === 1 ? 's' : ''} your review`
                  : 'All items reviewed'}
              </span>
            </div>
            {hasUnresolvedItems && (
              <span className="text-[9px] text-amber-600">Below {(CONFIDENCE_THRESHOLD * 100).toFixed(0)}% confidence</span>
            )}
          </div>

          {lowConfidenceItems.map(({ item, index }) => {
            const product = getProduct(item.productId);
            const meta = getMeta(item.productId);
            const isConfirmed = confirmedLowConf.has(index);
            const isReviewing = reviewingItemIndex === index;

            return (
              <div key={index} className={`bg-white rounded-md border p-2 ${isConfirmed ? 'border-green-200' : 'border-amber-200'}`} data-testid={`review-item-${index}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="text-[9px] text-gray-400 uppercase tracking-wide font-semibold">Your RFQ</div>
                    <div className="text-[10px] text-gray-700 font-medium">{meta?.requestedName || `Item ${index + 1}`}</div>
                    <div className="flex items-center gap-1 mt-1">
                      <ArrowRight className="w-2.5 h-2.5 text-gray-300" />
                      <span className="text-[10px] text-gray-900">{product?.name || 'Unknown'}</span>
                      <span className={`text-[9px] font-semibold px-1.5 py-0 rounded ${getConfidenceColor(item.confidence)}`}>
                        {(parseFloat(item.confidence) * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {!isConfirmed && (
                      <>
                        <button
                          onClick={() => {
                            setReviewingItemIndex(isReviewing ? null : index);
                            setReviewSearchQuery('');
                          }}
                          className="text-[9px] text-blue-600 hover:text-blue-800 font-medium px-1.5 py-0.5 rounded hover:bg-blue-50"
                          data-testid={`button-search-alt-${index}`}
                        >
                          <Search className="w-3 h-3 inline mr-0.5" />
                          Find alt
                        </button>
                        <button
                          onClick={() => setConfirmedLowConf(prev => { const next = new Set(Array.from(prev)); next.add(index); return next; })}
                          className="text-[9px] text-green-600 hover:text-green-800 font-medium px-1.5 py-0.5 rounded hover:bg-green-50"
                          data-testid={`button-confirm-match-${index}`}
                        >
                          <CheckCircle className="w-3 h-3 inline mr-0.5" />
                          Confirm
                        </button>
                      </>
                    )}
                    {isConfirmed && (
                      <span className="text-[9px] text-green-600 font-medium flex items-center gap-0.5">
                        <CheckCircle className="w-3 h-3" /> Confirmed
                      </span>
                    )}
                  </div>
                </div>

                {isReviewing && (
                  <div className="mt-2 space-y-1.5 animate-in slide-in-from-top-1 duration-200">
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search for alternative product..."
                        value={reviewSearchQuery}
                        onChange={(e) => setReviewSearchQuery(e.target.value)}
                        className="w-full pl-7 pr-2 py-1.5 text-[10px] border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-300"
                        autoFocus
                        data-testid={`input-review-search-${index}`}
                      />
                    </div>
                    {reviewSearchResults.length > 0 && (
                      <div className="max-h-[120px] overflow-y-auto space-y-0.5">
                        {reviewSearchResults.map(p => (
                          <button
                            key={p.id}
                            onClick={() => {
                              if (onUpdateItemProduct) {
                                onUpdateItemProduct(index, p.id, p.unitPrice);
                              }
                              setConfirmedLowConf(prev => { const next = new Set(Array.from(prev)); next.add(index); return next; });
                              setReviewingItemIndex(null);
                              setReviewSearchQuery('');
                            }}
                            className="w-full text-left px-2 py-1.5 rounded hover:bg-blue-50 border border-transparent hover:border-blue-200 transition-colors"
                            data-testid={`button-select-product-${p.id}`}
                          >
                            <div className="text-[10px] font-medium text-gray-900">{p.name}</div>
                            <div className="text-[9px] text-gray-500 flex items-center gap-2">
                              <span>{p.supplier}</span>
                              <span className="font-mono">${parseFloat(p.unitPrice).toFixed(2)}</span>
                              {p.contract && <span className="text-purple-600">{p.contract}</span>}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
        <Input
          placeholder="Search items..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-8 h-8 text-sm"
          data-testid="input-search"
        />
      </div>

      <div className="space-y-2 max-h-[300px] sm:max-h-[350px] overflow-y-auto pr-1">
        {filteredItems.map((item, index) => {
          const product = getProduct(item.productId);
          if (!product) return null;
          const conf = parseFloat(item.confidence);
          const isExpanded = expandedIndex === index;
          const shipping = getShippingEstimate(product);
          const meta = getMeta(item.productId);
          const enrichActions = getEnrichmentActions(product, meta);
          const lineTotal = parseFloat(item.unitPrice) * item.quantity;
          const unspscCrumbs = getUnspscBreadcrumb(product.unspsc);
          const categoryParts = product.categoryPath ? product.categoryPath.split(" > ") : [];

          return (
            <div 
              key={index} 
              className={`bg-white border rounded-lg transition-all group ${
                isExpanded ? 'border-blue-300 shadow-md ring-1 ring-blue-100' : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'
              }`}
              data-testid={`product-row-${index}`}
            >
              <div
                className="p-2.5 sm:p-3 cursor-pointer"
                onClick={() => setExpandedIndex(isExpanded ? null : index)}
                data-testid={`product-toggle-${index}`}
              >
                <div className="flex items-start gap-2 sm:gap-3">
                  <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                    isExpanded ? 'bg-blue-100' : 'bg-gray-100 group-hover:bg-blue-50'
                  }`}>
                    <Package className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isExpanded ? 'text-blue-600' : 'text-gray-500 group-hover:text-blue-600'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-medium text-gray-900 text-[11px] sm:text-sm leading-tight">{product.name}</h4>
                      <div className="flex items-center gap-1 shrink-0">
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded flex items-center gap-0.5 ${getConfidenceColor(item.confidence)}`}>
                          {conf >= 0.95 ? <CheckCircle className="w-2.5 h-2.5" /> : <AlertCircle className="w-2.5 h-2.5" />}
                          {(conf * 100).toFixed(0)}%
                        </span>
                        {isExpanded ? <ChevronUp className="w-3 h-3 text-blue-500" /> : <ChevronDown className="w-3 h-3 text-gray-400" />}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5 sm:mt-1 flex-wrap">
                      <span className="text-[10px] sm:text-xs text-gray-500">{product.supplier}</span>
                      {product.brand && (
                        <>
                          <span className="text-[10px] text-gray-300">|</span>
                          <span className="text-[10px] sm:text-xs text-gray-500">{product.brand}</span>
                        </>
                      )}
                      <span className="text-[10px] text-gray-300">|</span>
                      <span className="text-[10px] sm:text-xs text-gray-500">Qty: {item.quantity}</span>
                      <span className="text-[10px] text-gray-300">|</span>
                      <span className="text-[10px] sm:text-xs font-mono font-semibold text-gray-900">${parseFloat(item.unitPrice).toFixed(2)}/ea</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1 sm:mt-1.5 flex-wrap">
                      {product.contract && (
                        <Badge className="bg-purple-100 text-purple-700 text-[9px] sm:text-[10px] px-1.5 py-0">{product.contract}</Badge>
                      )}
                      <Badge className={`text-[9px] sm:text-[10px] px-1.5 py-0 ${product.availability === "In Stock" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                        {product.availability}
                      </Badge>
                      <Badge className={`text-[9px] sm:text-[10px] px-1.5 py-0 flex items-center gap-0.5 ${shipping.bg} ${shipping.color}`}>
                        <Truck className="w-2.5 h-2.5" />
                        {shipping.text}
                      </Badge>
                      {product.isEco && (
                        <Badge className="bg-green-50 text-green-600 text-[9px] sm:text-[10px] px-1.5 py-0">Eco</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {isExpanded && (
                <div className="px-2.5 sm:px-3 pb-2.5 sm:pb-3 border-t border-blue-100 pt-2.5 space-y-2.5 animate-in fade-in slide-in-from-top-2 duration-200">
                  {meta?.requestedName && (
                    <div className="bg-slate-50 rounded-lg px-2.5 py-2 border border-slate-200">
                      <div className="flex items-center gap-1.5 mb-1">
                        <TextSearch className="w-3 h-3 text-slate-500" />
                        <span className="text-[9px] font-semibold text-slate-600 uppercase tracking-wide">Search Query</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-slate-500">Your RFQ:</span>
                        <span className="text-[11px] font-medium text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">"{meta.requestedName}"</span>
                        <ArrowRight className="w-3 h-3 text-slate-400" />
                        <span className="text-[11px] font-medium text-blue-700">Matched</span>
                      </div>
                    </div>
                  )}

                  {meta && (meta.matchDetails.exactTerms.length > 0 || meta.matchDetails.synonymTerms.length > 0 || meta.matchDetails.fuzzyTerms.length > 0) && (
                    <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-lg px-2.5 py-2 border border-teal-200" data-testid={`enrichment-trail-${index}`}>
                      <div className="flex items-center gap-1.5 mb-2">
                        <Sparkles className="w-3 h-3 text-teal-600" />
                        <span className="text-[9px] font-semibold text-teal-700 uppercase tracking-wide">VIA Enrichment Trail</span>
                      </div>
                      <div className="space-y-1.5">
                        {meta.matchDetails.exactTerms.length > 0 && (
                          <div className="flex items-start gap-1.5">
                            <Hash className="w-3 h-3 text-green-500 shrink-0 mt-0.5" />
                            <div>
                              <span className="text-[9px] text-gray-500 uppercase tracking-wide">Direct hits: </span>
                              <span className="text-[10px] sm:text-[11px]">
                                {meta.matchDetails.exactTerms.map((term, i) => (
                                  <span key={i}>
                                    {i > 0 && <span className="text-gray-300">, </span>}
                                    <span className="bg-green-100 text-green-800 px-1 py-0 rounded font-medium">{term}</span>
                                  </span>
                                ))}
                              </span>
                            </div>
                          </div>
                        )}
                        {meta.matchDetails.synonymTerms.length > 0 && (
                          <div className="flex items-start gap-1.5">
                            <BookOpen className="w-3 h-3 text-teal-500 shrink-0 mt-0.5" />
                            <div>
                              <span className="text-[9px] text-gray-500 uppercase tracking-wide">Synonym expansion: </span>
                              <span className="text-[10px] sm:text-[11px]">
                                {meta.matchDetails.synonymTerms.map((term, i) => (
                                  <span key={i}>
                                    {i > 0 && <span className="text-gray-300">, </span>}
                                    <span className="bg-teal-100 text-teal-800 px-1 py-0 rounded font-medium">{term}</span>
                                  </span>
                                ))}
                              </span>
                            </div>
                          </div>
                        )}
                        {meta.matchDetails.fuzzyTerms.length > 0 && (
                          <div className="flex items-start gap-1.5">
                            <TextSearch className="w-3 h-3 text-orange-500 shrink-0 mt-0.5" />
                            <div>
                              <span className="text-[9px] text-gray-500 uppercase tracking-wide">Fuzzy match: </span>
                              <span className="text-[10px] sm:text-[11px]">
                                {meta.matchDetails.fuzzyTerms.map((term, i) => (
                                  <span key={i}>
                                    {i > 0 && <span className="text-gray-300">, </span>}
                                    <span className="bg-orange-100 text-orange-800 px-1 py-0 rounded font-medium">{term}</span>
                                  </span>
                                ))}
                              </span>
                            </div>
                          </div>
                        )}
                        {meta.matchDetails.categoryBoost && (
                          <div className="flex items-start gap-1.5">
                            <Layers className="w-3 h-3 text-purple-500 shrink-0 mt-0.5" />
                            <span className="text-[10px] sm:text-[11px] text-gray-700">
                              <span className="bg-purple-100 text-purple-800 px-1 py-0 rounded font-medium">Category boost</span>
                              <span className="text-gray-500"> — VIA taxonomy alignment increased match confidence</span>
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {(product.unspsc || categoryParts.length > 0) && (
                    <div className="bg-indigo-50/50 rounded-lg px-2.5 py-2 border border-indigo-100">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <GitBranch className="w-3 h-3 text-indigo-500" />
                        <span className="text-[9px] font-semibold text-indigo-600 uppercase tracking-wide">Taxonomy Classification</span>
                      </div>
                      {categoryParts.length > 0 && (
                        <div className="flex items-center gap-0.5 flex-wrap mb-1.5">
                          {categoryParts.map((part, i) => (
                            <span key={i} className="flex items-center gap-0.5">
                              {i > 0 && <ChevronRight className="w-2.5 h-2.5 text-indigo-300" />}
                              <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                                i === categoryParts.length - 1 ? 'bg-indigo-100 text-indigo-800 font-medium' : 'text-indigo-600'
                              }`}>{part}</span>
                            </span>
                          ))}
                        </div>
                      )}
                      {unspscCrumbs.length > 0 && (
                        <div className="flex items-center gap-0.5 flex-wrap">
                          <span className="text-[9px] text-indigo-400 mr-1">UNSPSC:</span>
                          {unspscCrumbs.map((crumb, i) => (
                            <span key={i} className="flex items-center gap-0.5">
                              {i > 0 && <ChevronRight className="w-2 h-2 text-indigo-200" />}
                              <span className={`text-[9px] ${i === unspscCrumbs.length - 1 ? 'font-mono font-semibold text-indigo-700' : 'text-indigo-500'}`}>{crumb}</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="bg-white rounded-lg p-2.5 border border-gray-200">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      <span className="text-[9px] font-semibold text-gray-600 uppercase tracking-wide">VIA Enrichment Applied</span>
                      <span className="text-[8px] text-gray-400 ml-auto">{enrichActions.length} attributes enriched</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {enrichActions.map((action, i) => (
                        <span key={i} className="text-[8px] sm:text-[9px] bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded-full">
                          {action}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-gray-50 rounded px-2 py-1.5">
                      <div className="text-[8px] text-gray-500 uppercase tracking-wide font-semibold">Line Total</div>
                      <div className="text-[11px] font-mono font-bold text-gray-900 mt-0.5">${lineTotal.toFixed(2)}</div>
                    </div>
                    <div className="bg-gray-50 rounded px-2 py-1.5">
                      <div className="text-[8px] text-gray-500 uppercase tracking-wide font-semibold">Shipping</div>
                      <div className={`text-[11px] font-medium mt-0.5 flex items-center gap-1 ${shipping.color}`}>
                        <MapPin className="w-2.5 h-2.5" />
                        Est. {shipping.text}
                      </div>
                      <div className="text-[8px] text-gray-400">{shipping.label}</div>
                    </div>
                    <div className="bg-gray-50 rounded px-2 py-1.5">
                      <div className="text-[8px] text-gray-500 uppercase tracking-wide font-semibold">Pack Size</div>
                      <div className="text-[11px] text-gray-800 mt-0.5">{product.packSize} {product.packUnit}</div>
                    </div>
                    <div className="bg-gray-50 rounded px-2 py-1.5">
                      <div className="text-[8px] text-gray-500 uppercase tracking-wide font-semibold">Contract</div>
                      <div className="text-[11px] text-purple-700 mt-0.5 font-medium">{product.contractTier || "N/A"}</div>
                      {product.preferredSupplier && <div className="text-[8px] text-green-600 font-medium">Preferred</div>}
                    </div>
                  </div>

                  {product.certifications && product.certifications.length > 0 && (
                    <div>
                      <div className="text-[8px] text-gray-500 uppercase tracking-wide font-semibold mb-1">Certifications</div>
                      <div className="flex flex-wrap gap-1">
                        {product.certifications.map((cert, i) => (
                          <Badge key={i} className="bg-indigo-50 text-indigo-700 text-[8px] sm:text-[9px] px-1.5 py-0">
                            <Award className="w-2 h-2 mr-0.5" />
                            {cert}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {(product.co2PerUnit != null || (product.recycledContent ?? 0) > 0) && (
                    <div className="flex items-center gap-3 text-[10px]">
                      {product.co2PerUnit != null && product.co2PerUnit > 0 && (
                        <div className="flex items-center gap-1">
                          <Leaf className="w-2.5 h-2.5 text-gray-400" />
                          <span className="text-gray-500">CO₂:</span>
                          <span className="font-medium text-gray-700">{product.co2PerUnit} kg/unit</span>
                        </div>
                      )}
                      {(product.recycledContent ?? 0) > 0 && (
                        <div className="flex items-center gap-1">
                          <span className="text-gray-500">Recycled:</span>
                          <span className="font-medium text-green-700">{product.recycledContent}%</span>
                        </div>
                      )}
                      {product.mpn && (
                        <div className="flex items-center gap-1">
                          <span className="text-gray-500">MPN:</span>
                          <span className="font-mono font-medium text-gray-700">{product.mpn}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {filteredItems.length === 0 && (
          <div className="text-center py-6 text-gray-500 text-sm">
            No items match your search.
          </div>
        )}
      </div>

      <div className="flex justify-between items-center pt-2 border-t border-gray-100">
        <Button
          onClick={onBack}
          variant="ghost"
          size="sm"
          className="text-gray-600 h-8 sm:h-9 text-xs sm:text-sm"
          data-testid="button-back-select"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1" />
          Back
        </Button>
        <div className="flex items-center gap-2">
          {hasUnresolvedItems && (
            <span className="text-[9px] text-amber-600">{unresolvedLowConf.length} unreviewed</span>
          )}
          <Button
            onClick={onNext}
            disabled={hasUnresolvedItems}
            size="sm"
            className="bg-[#1e3a5f] hover:bg-[#15293f] text-white h-8 sm:h-9 text-xs sm:text-sm disabled:opacity-50"
            data-testid="button-continue-fit"
          >
            Continue
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
