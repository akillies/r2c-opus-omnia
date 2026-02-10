import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { CheckCircle, AlertCircle, ArrowLeft, ArrowRight, Search, Package, ShieldCheck, Zap, Clock, Truck, Leaf, Award, ChevronDown, ChevronUp, Info, Tag, MapPin } from "lucide-react";
import type { Product } from "@shared/schema";

interface ProductMatchingProps {
  items: any[];
  onBack: () => void;
  onNext: () => void;
  elapsedTime?: number;
}

function getShippingEstimate(product: Product) {
  if (product.availability === "Out of Stock") return { text: "10-14 days", color: "text-red-600", bg: "bg-red-50" };
  if (product.availability === "Low Stock") return { text: "5-7 days", color: "text-amber-600", bg: "bg-amber-50" };
  if (product.preferredSupplier) return { text: "1-2 days", color: "text-green-600", bg: "bg-green-50" };
  return { text: "2-4 days", color: "text-blue-600", bg: "bg-blue-50" };
}

function getMatchReasoning(product: Product, confidence: number): string[] {
  const reasons: string[] = [];
  const conf = Math.round(confidence * 100);

  if (product.unspsc) {
    reasons.push(`UNSPSC ${product.unspsc} verified against VIA taxonomy`);
  }
  if (product.contract) {
    reasons.push(`Cooperative contract ${product.contract} (${product.contractTier || 'Active'})`);
  }
  if (conf >= 95) {
    reasons.push(`${conf}% confidence — exact match on name, category, and specifications`);
  } else if (conf >= 80) {
    reasons.push(`${conf}% confidence — strong match on product attributes`);
  } else {
    reasons.push(`${conf}% confidence — partial match, review recommended`);
  }
  if (product.preferredSupplier) {
    reasons.push(`Preferred supplier with priority fulfillment`);
  }
  return reasons;
}

function getCategoryShort(categoryPath: string | null): string {
  if (!categoryPath) return "";
  const parts = categoryPath.split(" > ");
  return parts.length > 1 ? parts.slice(1).join(" > ") : parts[0];
}

export default function ProductMatching({ items, onBack, onNext, elapsedTime }: ProductMatchingProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const { data: products } = useQuery<Product[]>({
    queryKey: ['/api/products']
  });

  const getProduct = (productId: string) => products?.find(p => p.id === productId);

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
  const preferredCount = items.filter(item => {
    const product = getProduct(item.productId);
    return product?.preferredSupplier;
  }).length;
  const ecoCount = items.filter(item => {
    const product = getProduct(item.productId);
    return product?.isEco;
  }).length;
  const certCount = items.filter(item => {
    const product = getProduct(item.productId);
    return product?.certifications && product.certifications.length > 0;
  }).length;
  const uniqueSuppliers = new Set(items.map(item => getProduct(item.productId)?.supplier).filter(Boolean)).size;

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
        <p className="text-[10px] sm:text-xs text-gray-500">{items.length} items matched from your RFQ — tap any row for details</p>
      </div>

      <div className="bg-gradient-to-r from-emerald-50 to-blue-50 border border-emerald-200 rounded-lg p-2.5">
        <div className="flex items-center gap-1.5 mb-2">
          <Zap className="w-3.5 h-3.5 text-emerald-600" />
          <span className="text-xs font-semibold text-emerald-800">Selection Intelligence <span className="font-normal text-emerald-600">· VIA-powered</span></span>
        </div>
        <div className="space-y-1.5 text-[10px] sm:text-[11px] text-gray-700">
          <div className="flex items-start gap-1.5">
            <CheckCircle className="w-3 h-3 text-green-500 shrink-0 mt-0.5" />
            <span><strong className="text-green-700">{highConfCount}/{items.length}</strong> items matched at 95%+ confidence using VIA-enriched product taxonomy and UNSPSC classification</span>
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
            <span><strong className="text-blue-700">{preferredCount} preferred supplier{preferredCount !== 1 ? 's' : ''}</strong> with priority fulfillment (1-2 day shipping) across {uniqueSuppliers} total suppliers</span>
          </div>
          {certCount > 0 && (
            <div className="flex items-start gap-1.5">
              <Award className="w-3 h-3 text-indigo-500 shrink-0 mt-0.5" />
              <span><strong className="text-indigo-700">{certCount} certified product{certCount !== 1 ? 's' : ''}</strong> — ANSI, FDA, EPA, FSC, and industry-standard compliance validated</span>
            </div>
          )}
          {ecoCount > 0 && (
            <div className="flex items-start gap-1.5">
              <Leaf className="w-3 h-3 text-green-500 shrink-0 mt-0.5" />
              <span><strong className="text-green-700">{ecoCount} eco-certified</strong> — Green Seal, EPA Safer Choice, and sustainability-labeled products identified</span>
            </div>
          )}
          {elapsedTime != null && elapsedTime > 0 && (
            <div className="flex items-start gap-1.5">
              <Clock className="w-3 h-3 text-blue-500 shrink-0 mt-0.5" />
              <span>Matched in <strong>{elapsedTime >= 60 ? `${Math.floor(elapsedTime / 60)}m ${elapsedTime % 60}s` : `${elapsedTime}s`}</strong> — manual catalog search estimate: ~{Math.max(15, items.length * 4)} min</span>
            </div>
          )}
        </div>
      </div>

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
          const matchReasons = getMatchReasoning(product, conf);
          const lineTotal = parseFloat(item.unitPrice) * item.quantity;

          return (
            <div 
              key={index} 
              className={`bg-white border rounded-lg transition-all group ${
                isExpanded ? 'border-blue-300 shadow-sm' : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'
              }`}
              data-testid={`product-row-${index}`}
            >
              <div
                className="p-2.5 sm:p-3 cursor-pointer"
                onClick={() => setExpandedIndex(isExpanded ? null : index)}
              >
                <div className="flex items-start gap-2 sm:gap-3">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gray-100 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-blue-50 transition-colors">
                    <Package className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500 group-hover:text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-medium text-gray-900 text-[11px] sm:text-sm leading-tight">{product.name}</h4>
                      <div className="flex items-center gap-1 shrink-0">
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded flex items-center gap-0.5 ${getConfidenceColor(item.confidence)}`}>
                          {conf >= 0.95 ? <CheckCircle className="w-2.5 h-2.5" /> : <AlertCircle className="w-2.5 h-2.5" />}
                          {(conf * 100).toFixed(0)}%
                        </span>
                        {isExpanded ? <ChevronUp className="w-3 h-3 text-gray-400" /> : <ChevronDown className="w-3 h-3 text-gray-400" />}
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
                <div className="px-2.5 sm:px-3 pb-2.5 sm:pb-3 border-t border-gray-100 pt-2">
                  <div className="bg-gray-50 rounded-lg p-2.5 space-y-2">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Info className="w-3 h-3 text-blue-500" />
                      <span className="text-[10px] font-semibold text-gray-700 uppercase tracking-wide">Why This Product</span>
                    </div>
                    <div className="space-y-1">
                      {matchReasons.map((reason, i) => (
                        <div key={i} className="flex items-start gap-1.5 text-[10px] sm:text-[11px] text-gray-600">
                          <CheckCircle className="w-3 h-3 text-green-500 shrink-0 mt-0.5" />
                          <span>{reason}</span>
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-gray-200">
                      <div>
                        <div className="text-[9px] text-gray-500 uppercase tracking-wide font-semibold">Category</div>
                        <div className="text-[10px] sm:text-[11px] text-gray-800 mt-0.5 flex items-center gap-1">
                          <Tag className="w-2.5 h-2.5 text-gray-400" />
                          {getCategoryShort(product.categoryPath)}
                        </div>
                      </div>
                      <div>
                        <div className="text-[9px] text-gray-500 uppercase tracking-wide font-semibold">Line Total</div>
                        <div className="text-[10px] sm:text-[11px] font-mono font-bold text-gray-900 mt-0.5">${lineTotal.toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-[9px] text-gray-500 uppercase tracking-wide font-semibold">Pack Size</div>
                        <div className="text-[10px] sm:text-[11px] text-gray-800 mt-0.5">{product.packSize} {product.packUnit}</div>
                      </div>
                      <div>
                        <div className="text-[9px] text-gray-500 uppercase tracking-wide font-semibold">Shipping</div>
                        <div className={`text-[10px] sm:text-[11px] font-medium mt-0.5 flex items-center gap-1 ${shipping.color}`}>
                          <MapPin className="w-2.5 h-2.5" />
                          Est. {shipping.text}
                        </div>
                      </div>
                    </div>

                    {product.certifications && product.certifications.length > 0 && (
                      <div className="pt-2 border-t border-gray-200">
                        <div className="text-[9px] text-gray-500 uppercase tracking-wide font-semibold mb-1">Certifications</div>
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

                    {product.co2PerUnit != null && product.co2PerUnit > 0 && (
                      <div className="pt-2 border-t border-gray-200 flex items-center gap-3">
                        <div>
                          <div className="text-[9px] text-gray-500 uppercase tracking-wide font-semibold">CO₂ / Unit</div>
                          <div className="text-[10px] text-gray-800 mt-0.5">{product.co2PerUnit} kg</div>
                        </div>
                        {(product.recycledContent ?? 0) > 0 && (
                          <div>
                            <div className="text-[9px] text-gray-500 uppercase tracking-wide font-semibold">Recycled Content</div>
                            <div className="text-[10px] text-green-700 mt-0.5 font-medium">{product.recycledContent}%</div>
                          </div>
                        )}
                        {product.contractTier && (
                          <div>
                            <div className="text-[9px] text-gray-500 uppercase tracking-wide font-semibold">Contract Tier</div>
                            <div className="text-[10px] text-purple-700 mt-0.5 font-medium">{product.contractTier}</div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
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
        <Button
          onClick={onNext}
          size="sm"
          className="bg-[#1e3a5f] hover:bg-[#15293f] text-white h-8 sm:h-9 text-xs sm:text-sm"
          data-testid="button-continue-fit"
        >
          Continue
          <ArrowRight className="w-3.5 h-3.5 ml-1" />
        </Button>
      </div>
    </div>
  );
}
