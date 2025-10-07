import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Box, DollarSign, Truck, Leaf, ArrowDown, ArrowUp, ArrowLeft, ArrowRight } from "lucide-react";
import type { Product } from "@shared/schema";

interface SmartSwapsProps {
  swaps: any[];
  onAcceptSwap: (swapId: string) => void;
  onOpenComparison: (swap: any) => void;
  onBack: () => void;
  onNext: () => void;
  isAccepting: boolean;
}

export default function SmartSwaps({ 
  swaps, 
  onAcceptSwap, 
  onOpenComparison, 
  onBack, 
  onNext, 
  isAccepting 
}: SmartSwapsProps) {
  const { data: products } = useQuery<Product[]>({
    queryKey: ['/api/products']
  });

  const getProduct = (productId: string) => {
    return products?.find(p => p.id === productId);
  };

  const getSwapIcon = (swapType: string) => {
    switch (swapType) {
      case 'pack_size': return <Box className="w-5 h-5 text-blue-600" />;
      case 'supplier': return <DollarSign className="w-5 h-5 text-blue-600" />;
      case 'stock': return <Truck className="w-5 h-5 text-amber-600" />;
      case 'sustainability': return <Leaf className="w-5 h-5 text-green-600" />;
      default: return <Box className="w-5 h-5 text-blue-600" />;
    }
  };

  const getSavingsBadge = (amount: string) => {
    const savings = parseFloat(amount);
    if (savings > 0) {
      return (
        <Badge className="bg-green-100 text-green-700 flex items-center gap-1">
          <ArrowDown className="w-3 h-3" />
          Save ${Math.abs(savings).toFixed(2)}
        </Badge>
      );
    } else if (savings < 0) {
      return (
        <Badge className="bg-amber-100 text-amber-700 flex items-center gap-1">
          <ArrowUp className="w-3 h-3" />
          +${Math.abs(savings).toFixed(2)}
        </Badge>
      );
    }
    return null;
  };

  const getCardStyle = (swapType: string) => {
    switch (swapType) {
      case 'stock': return 'border-amber-200 bg-amber-50';
      case 'sustainability': return 'border-green-200 bg-green-50';
      default: return 'border-slate-200';
    }
  };

  const totalSavings = swaps.reduce((acc, swap) => {
    if (swap.isAccepted) {
      return acc + parseFloat(swap.savingsAmount || "0");
    }
    return acc;
  }, 0);

  const potentialSavings = swaps.reduce((acc, swap) => {
    return acc + Math.max(0, parseFloat(swap.savingsAmount || "0"));
  }, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold mb-2 text-slate-900">
            Optimize Your Order
          </h2>
          <p className="text-slate-600">
            We found {swaps.length} smart swap opportunities to save money or improve delivery.
          </p>
        </div>
        <div className="flex gap-4">
          <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2 text-center">
            <div className="text-sm text-green-700">Potential Savings</div>
            <div className="text-2xl font-bold text-green-900">
              ${potentialSavings.toFixed(2)}
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 text-center">
            <div className="text-sm text-blue-700">Budget</div>
            <div className="text-2xl font-bold text-blue-900">$2,107</div>
          </div>
        </div>
      </div>

      {/* Swap Recommendations */}
      <div className="space-y-4">
        {swaps.map((swap, index) => {
          const originalProduct = getProduct(swap.originalProductId);
          const recommendedProduct = getProduct(swap.recommendedProductId);
          
          if (!originalProduct || !recommendedProduct) return null;

          return (
            <div
              key={swap.id}
              className={`swap-card border rounded-lg p-6 hover:shadow-lg transition-all ${getCardStyle(swap.swapType)}`}
              data-testid={`swap-card-${index}`}
            >
              <div className="flex items-start justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      {getSwapIcon(swap.swapType)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">{originalProduct.name}</h3>
                      <p className="text-sm text-slate-500">
                        {originalProduct.unitOfMeasure} → {recommendedProduct.unitOfMeasure} ({recommendedProduct.supplier})
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-3">
                    {getSavingsBadge(swap.savingsAmount)}
                    <span className="text-sm text-slate-600">• {swap.reason}</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-slate-500">Current:</span>
                      <span className="font-semibold text-slate-900 ml-2">
                        ${parseFloat(originalProduct.unitPrice).toFixed(2)}/unit
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">New:</span>
                      <span className="font-semibold text-green-700 ml-2">
                        ${parseFloat(recommendedProduct.unitPrice).toFixed(2)}/unit
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col gap-2">
                  {!swap.isAccepted ? (
                    <>
                      <Button
                        onClick={() => onAcceptSwap(swap.id)}
                        disabled={isAccepting}
                        className="btn-primary whitespace-nowrap"
                        data-testid={`button-accept-swap-${index}`}
                      >
                        Accept Swap
                      </Button>
                      <Button
                        onClick={() => onOpenComparison(swap)}
                        variant="outline"
                        className="btn-secondary whitespace-nowrap"
                        data-testid={`button-browse-options-${index}`}
                      >
                        Browse Options
                      </Button>
                    </>
                  ) : (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2 text-green-700">
                        <Check className="w-4 h-4" />
                        <span className="font-medium">Swap accepted</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-between items-center pt-4 border-t border-slate-200">
        <Button
          onClick={onBack}
          variant="outline"
          className="btn-secondary flex items-center gap-2"
          data-testid="button-back-check"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <Button
          onClick={onNext}
          className="btn-primary flex items-center gap-2"
          data-testid="button-continue-lock"
        >
          Continue to Lock
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
