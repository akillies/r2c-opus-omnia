import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, ArrowDown, ArrowUp, Leaf } from "lucide-react";
import type { Product } from "@shared/schema";

interface ComparisonDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  swap: any;
  onAcceptSwap: (swapId: string) => void;
}

export default function ComparisonDrawer({ isOpen, onClose, swap, onAcceptSwap }: ComparisonDrawerProps) {
  const { data: products } = useQuery<Product[]>({
    queryKey: ['/api/products']
  });

  if (!swap || !products) return null;

  const originalProduct = products.find(p => p.id === swap.originalProductId);
  const recommendedProduct = products.find(p => p.id === swap.recommendedProductId);
  
  // Get alternative products (simplified for demo)
  const alternatives = products.filter(p => 
    p.category === originalProduct?.category && 
    p.id !== swap.originalProductId &&
    p.id !== swap.recommendedProductId
  ).slice(0, 3);

  const getSavingsBadge = (currentPrice: number, originalPrice: number) => {
    const diff = originalPrice - currentPrice;
    if (diff > 0) {
      return (
        <Badge className="bg-green-100 text-green-700 flex items-center gap-1">
          <ArrowDown className="w-3 h-3" />
          Save ${diff.toFixed(2)}/unit
        </Badge>
      );
    } else if (diff < 0) {
      return (
        <Badge className="bg-red-100 text-red-700 flex items-center gap-1">
          <ArrowUp className="w-3 h-3" />
          +${Math.abs(diff).toFixed(2)}/unit
        </Badge>
      );
    }
    return null;
  };

  if (!originalProduct) return null;

  return (
    <>
      <div 
        className={`drawer-overlay ${isOpen ? 'active' : ''}`}
        onClick={onClose}
        data-testid="drawer-overlay"
      />

      <div className={`drawer ${isOpen ? 'active' : ''}`} data-testid="comparison-drawer">
        <div className="flex flex-col h-full">
          <div className="flex-shrink-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-slate-900">Browse Alternatives</h3>
              <p className="text-sm text-slate-600 mt-1">
                Compare products and select the best option
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="w-8 h-8 p-0 hover:bg-slate-100 flex-shrink-0"
              data-testid="button-close-drawer"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
          {/* Current Selection */}
          <div className="mb-6">
            <div className="text-sm font-semibold text-slate-700 mb-2">Currently Selected</div>
            <div className="border-2 border-blue-200 bg-blue-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-slate-900">{originalProduct.name}</h4>
                  <p className="text-sm text-slate-600 mt-1">
                    {originalProduct.unitOfMeasure} • {originalProduct.supplier}
                  </p>
                </div>
                <div className="text-right">
                  <div className="font-mono font-semibold text-blue-900">
                    ${parseFloat(originalProduct.unitPrice).toFixed(2)}
                  </div>
                  <div className="text-xs text-blue-700">per unit</div>
                </div>
              </div>
            </div>
          </div>

          {/* Recommended Alternative */}
          {recommendedProduct && (
            <div className="mb-6">
              <div className="text-sm font-semibold text-slate-700 mb-2">Recommended Alternative</div>
              <div className="border-2 border-green-200 bg-green-50 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-900">{recommendedProduct.name}</h4>
                    <p className="text-sm text-slate-600 mt-1">
                      {recommendedProduct.unitOfMeasure} • {recommendedProduct.supplier}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">{swap.reason}</p>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-semibold text-slate-900">
                      ${parseFloat(recommendedProduct.unitPrice).toFixed(2)}
                    </div>
                    <div className="text-xs text-slate-500">per unit</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 mb-3">
                  {getSavingsBadge(
                    parseFloat(recommendedProduct.unitPrice),
                    parseFloat(originalProduct.unitPrice)
                  )}
                  <Badge className="bg-purple-100 text-purple-700">{recommendedProduct.contract}</Badge>
                  <Badge className="bg-green-100 text-green-700">{recommendedProduct.availability}</Badge>
                </div>
                <Button
                  onClick={() => {
                    onAcceptSwap(swap.id);
                    onClose();
                  }}
                  className="btn-primary w-full"
                  data-testid="button-accept-recommended"
                >
                  Accept This Alternative
                </Button>
              </div>
            </div>
          )}

          {/* Other Alternatives */}
          {alternatives.length > 0 && (
            <div>
              <div className="text-sm font-semibold text-slate-700 mb-3">Other Available Options</div>
              <div className="space-y-3">
                {alternatives.map((alt, index) => (
                  <div
                    key={alt.id}
                    className="border border-slate-200 rounded-lg p-4 hover:border-blue-300 hover:bg-blue-50 transition-all cursor-pointer"
                    data-testid={`alternative-option-${index}`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-slate-900">{alt.name}</h4>
                        <p className="text-sm text-slate-600 mt-1">
                          {alt.unitOfMeasure} • {alt.supplier}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">{alt.description}</p>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-semibold text-slate-900">
                          ${parseFloat(alt.unitPrice).toFixed(2)}
                        </div>
                        <div className="text-xs text-slate-500">per unit</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getSavingsBadge(
                        parseFloat(alt.unitPrice),
                        parseFloat(originalProduct.unitPrice)
                      )}
                      <Badge className="bg-purple-100 text-purple-700">{alt.contract}</Badge>
                      <Badge className="bg-green-100 text-green-700">{alt.availability}</Badge>
                      {alt.isEco && (
                        <Badge className="bg-green-100 text-green-700 inline-flex items-center gap-1">
                          <Leaf className="w-3 h-3" />
                          Eco
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          </div>
        </div>
      </div>
    </>
  );
}
