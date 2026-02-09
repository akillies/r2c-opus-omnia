import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { CheckCircle, AlertCircle, ArrowLeft, ArrowRight, Search, Package } from "lucide-react";
import type { Product } from "@shared/schema";

interface ProductMatchingProps {
  items: any[];
  onBack: () => void;
  onNext: () => void;
}

export default function ProductMatching({ items, onBack, onNext }: ProductMatchingProps) {
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

  const getConfidenceColor = (confidence: string) => {
    const conf = parseFloat(confidence);
    if (conf >= 0.95) return "text-green-700 bg-green-50";
    if (conf >= 0.8) return "text-amber-700 bg-amber-50";
    return "text-red-700 bg-red-50";
  };

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-bold text-gray-900">Matched Items</h3>
          <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-50 rounded-md">
            <span className="text-xs text-blue-700">Avg match:</span>
            <span className="text-xs font-bold text-blue-900">{(avgConfidence * 100).toFixed(0)}%</span>
          </div>
        </div>
        <p className="text-xs text-gray-500">{items.length} items matched from your RFQ</p>
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

      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
        {filteredItems.map((item, index) => {
          const product = getProduct(item.productId);
          if (!product) return null;
          const conf = parseFloat(item.confidence);

          return (
            <div 
              key={index} 
              className="p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all group"
              data-testid={`product-row-${index}`}
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-blue-50 transition-colors">
                  <Package className="w-4 h-4 text-gray-500 group-hover:text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-medium text-gray-900 text-sm leading-tight">{product.name}</h4>
                    <span className={`text-xs font-semibold px-1.5 py-0.5 rounded shrink-0 flex items-center gap-1 ${getConfidenceColor(item.confidence)}`}>
                      {conf >= 0.95 ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                      {(conf * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-xs text-gray-500">{product.supplier}</span>
                    <span className="text-xs text-gray-300">|</span>
                    <span className="text-xs text-gray-500">Qty: {item.quantity}</span>
                    <span className="text-xs text-gray-300">|</span>
                    <span className="text-xs font-mono font-semibold text-gray-900">${parseFloat(item.unitPrice).toFixed(2)}/ea</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <Badge className="bg-purple-100 text-purple-700 text-[10px] px-1.5 py-0">{product.contract}</Badge>
                    <Badge className={`text-[10px] px-1.5 py-0 ${product.availability === "In Stock" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                      {product.availability}
                    </Badge>
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
          className="text-gray-600 h-9"
          data-testid="button-back-select"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back
        </Button>
        <Button
          onClick={onNext}
          size="sm"
          className="bg-[#1e3a5f] hover:bg-[#15293f] text-white h-9"
          data-testid="button-continue-fit"
        >
          Continue
          <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
