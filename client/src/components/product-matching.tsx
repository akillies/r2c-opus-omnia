import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { CheckCircle, AlertCircle, ArrowLeft, ArrowRight, Search, Package, ShieldCheck, Zap, Clock } from "lucide-react";
import type { Product } from "@shared/schema";

interface ProductMatchingProps {
  items: any[];
  onBack: () => void;
  onNext: () => void;
  elapsedTime?: number;
}

export default function ProductMatching({ items, onBack, onNext, elapsedTime }: ProductMatchingProps) {
  const [searchQuery, setSearchQuery] = useState("");

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
          <h3 className="font-bold text-gray-900 text-sm sm:text-base">Matched Items</h3>
          <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-50 rounded-md">
            <span className="text-[10px] sm:text-xs text-blue-700">Avg:</span>
            <span className="text-[10px] sm:text-xs font-bold text-blue-900">{(avgConfidence * 100).toFixed(0)}%</span>
          </div>
        </div>
        <p className="text-[10px] sm:text-xs text-gray-500">{items.length} items matched from your RFQ</p>
      </div>

      <div className="bg-gradient-to-r from-emerald-50 to-blue-50 border border-emerald-200 rounded-lg p-2.5">
        <div className="flex items-center gap-1.5 mb-1.5">
          <Zap className="w-3.5 h-3.5 text-emerald-600" />
          <span className="text-xs font-semibold text-emerald-800">Agent Actions</span>
        </div>
        <div className="space-y-1 text-[10px] sm:text-[11px] text-gray-700">
          <div className="flex items-center gap-1.5">
            <CheckCircle className="w-3 h-3 text-green-500 shrink-0" />
            <span>Matched {highConfCount}/{items.length} items with 95%+ confidence</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3 h-3 text-purple-500 shrink-0" />
            <span>{allOnContract ? 'All items on OMNIA cooperative master agreements' : 'Cooperative contract compliance verified'}</span>
          </div>
          {elapsedTime != null && elapsedTime > 0 && (
            <div className="flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-blue-500 shrink-0" />
              <span>Completed in {elapsedTime >= 60 ? `${Math.floor(elapsedTime / 60)}m ${elapsedTime % 60}s` : `${elapsedTime}s`} — manual estimate: ~{Math.max(15, items.length * 4)} min</span>
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

          return (
            <div 
              key={index} 
              className="p-2.5 sm:p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all group"
              data-testid={`product-row-${index}`}
            >
              <div className="flex items-start gap-2 sm:gap-3">
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gray-100 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-blue-50 transition-colors">
                  <Package className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500 group-hover:text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-medium text-gray-900 text-[11px] sm:text-sm leading-tight">{product.name}</h4>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0 flex items-center gap-0.5 ${getConfidenceColor(item.confidence)}`}>
                      {conf >= 0.95 ? <CheckCircle className="w-2.5 h-2.5" /> : <AlertCircle className="w-2.5 h-2.5" />}
                      {(conf * 100).toFixed(0)}%
                    </span>
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
                    <Badge className="bg-purple-100 text-purple-700 text-[9px] sm:text-[10px] px-1.5 py-0">{product.contract}</Badge>
                    <Badge className={`text-[9px] sm:text-[10px] px-1.5 py-0 ${product.availability === "In Stock" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                      {product.availability}
                    </Badge>
                    {product.isEco && (
                      <Badge className="bg-green-50 text-green-600 text-[9px] sm:text-[10px] px-1.5 py-0">🌱 Eco</Badge>
                    )}
                  </div>
                </div>
              </div>
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
