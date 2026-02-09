import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Box, DollarSign, Truck, Leaf, ArrowDown, ArrowUp, ArrowLeft, ArrowRight, Eye, Zap, AlertTriangle, Users } from "lucide-react";
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

  const getProduct = (productId: string) => products?.find(p => p.id === productId);

  const getSwapIcon = (swapType: string) => {
    switch (swapType) {
      case 'pack_size': return <Box className="w-3.5 h-3.5" />;
      case 'supplier': return <DollarSign className="w-3.5 h-3.5" />;
      case 'stock': return <Truck className="w-3.5 h-3.5" />;
      case 'sustainability': return <Leaf className="w-3.5 h-3.5" />;
      case 'consolidation': return <Users className="w-3.5 h-3.5" />;
      default: return <Box className="w-3.5 h-3.5" />;
    }
  };

  const getSwapColor = (swapType: string) => {
    switch (swapType) {
      case 'pack_size': return 'bg-blue-100 text-blue-600';
      case 'supplier': return 'bg-indigo-100 text-indigo-600';
      case 'stock': return 'bg-amber-100 text-amber-600';
      case 'sustainability': return 'bg-green-100 text-green-600';
      case 'consolidation': return 'bg-purple-100 text-purple-600';
      default: return 'bg-blue-100 text-blue-600';
    }
  };

  const getSwapLabel = (swapType: string) => {
    switch (swapType) {
      case 'pack_size': return 'Bulk Savings';
      case 'supplier': return 'Better Price';
      case 'stock': return 'Stock Risk';
      case 'sustainability': return 'Eco Option';
      case 'consolidation': return 'Consolidation';
      default: return 'Alternative';
    }
  };

  const potentialSavings = swaps.reduce((acc, swap) => acc + Math.max(0, parseFloat(swap.savingsAmount || "0")), 0);
  const acceptedCount = swaps.filter(s => s.isAccepted).length;
  const stockRiskCount = swaps.filter(s => s.swapType === 'stock').length;
  const ecoCount = swaps.filter(s => s.swapType === 'sustainability').length;

  return (
    <div className="space-y-3">
      <div>
        <h3 className="font-bold text-gray-900 mb-0.5 text-sm sm:text-base">Optimize Your Order</h3>
        <p className="text-[10px] sm:text-xs text-gray-500">{swaps.length} optimization opportunities found by the agent</p>
      </div>

      <div className="bg-gradient-to-r from-emerald-50 to-blue-50 border border-emerald-200 rounded-lg p-2.5">
        <div className="flex items-center gap-1.5 mb-1.5">
          <Zap className="w-3.5 h-3.5 text-emerald-600" />
          <span className="text-xs font-semibold text-emerald-800">Agent Intelligence</span>
        </div>
        <div className="space-y-1 text-[10px] sm:text-[11px] text-gray-700">
          {potentialSavings > 0 && (
            <div className="flex items-center gap-1.5">
              <DollarSign className="w-3 h-3 text-green-500 shrink-0" />
              <span>Found <strong>${potentialSavings.toFixed(2)}</strong> in potential savings across {swaps.length} items</span>
            </div>
          )}
          {stockRiskCount > 0 && (
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" />
              <span>{stockRiskCount} stock risk{stockRiskCount > 1 ? 's' : ''} detected — alternatives available to avoid backorders</span>
            </div>
          )}
          {ecoCount > 0 && (
            <div className="flex items-center gap-1.5">
              <Leaf className="w-3 h-3 text-green-500 shrink-0" />
              <span>{ecoCount} eco-friendly alternative{ecoCount > 1 ? 's' : ''} align with sustainability policy</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="bg-green-50 border border-green-200 rounded-lg px-2.5 sm:px-3 py-2 text-center">
          <div className="text-[9px] sm:text-[10px] text-green-600 uppercase font-semibold tracking-wide">Potential Savings</div>
          <div className="text-base sm:text-lg font-bold text-green-900" data-testid="text-potential-savings">${potentialSavings.toFixed(2)}</div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-2.5 sm:px-3 py-2 text-center">
          <div className="text-[9px] sm:text-[10px] text-blue-600 uppercase font-semibold tracking-wide">Accepted</div>
          <div className="text-base sm:text-lg font-bold text-blue-900" data-testid="text-accepted-count">{acceptedCount} / {swaps.length}</div>
        </div>
      </div>

      <div className="space-y-2 max-h-[250px] sm:max-h-[300px] overflow-y-auto pr-1">
        {swaps.map((swap, index) => {
          const originalProduct = getProduct(swap.originalProductId);
          const recommendedProduct = getProduct(swap.recommendedProductId);
          if (!originalProduct || !recommendedProduct) return null;

          const savings = parseFloat(swap.savingsAmount || "0");

          return (
            <div
              key={swap.id}
              className={`border rounded-lg p-2.5 sm:p-3 transition-all hover:shadow-sm ${
                swap.isAccepted ? 'border-green-300 bg-green-50/50' : 'border-gray-200 bg-white hover:border-blue-300'
              }`}
              data-testid={`swap-card-${index}`}
            >
              <div className="flex items-start gap-2">
                <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center shrink-0 ${getSwapColor(swap.swapType)}`}>
                  {getSwapIcon(swap.swapType)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-1">
                    <div>
                      <h4 className="font-medium text-gray-900 text-[11px] sm:text-sm leading-tight">{originalProduct.name}</h4>
                      <Badge className={`mt-0.5 text-[8px] sm:text-[9px] px-1 py-0 ${getSwapColor(swap.swapType)}`}>
                        {getSwapLabel(swap.swapType)}
                      </Badge>
                    </div>
                    {savings > 0 ? (
                      <Badge className="bg-green-100 text-green-700 text-[9px] sm:text-[10px] px-1.5 py-0 shrink-0 flex items-center gap-0.5">
                        <ArrowDown className="w-2.5 h-2.5" />
                        ${savings.toFixed(2)}
                      </Badge>
                    ) : savings < 0 ? (
                      <Badge className="bg-amber-100 text-amber-700 text-[9px] sm:text-[10px] px-1.5 py-0 shrink-0 flex items-center gap-0.5">
                        <ArrowUp className="w-2.5 h-2.5" />
                        +${Math.abs(savings).toFixed(2)}
                      </Badge>
                    ) : null}
                  </div>

                  <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-1">{swap.reason}</p>

                  <div className="flex items-center gap-2 sm:gap-3 mt-1 text-[10px] sm:text-xs">
                    <span className="text-gray-500 line-through">
                      ${parseFloat(originalProduct.unitPrice).toFixed(2)}
                    </span>
                    <span className="text-gray-400">→</span>
                    <span className="font-semibold text-green-700">
                      ${parseFloat(recommendedProduct.unitPrice).toFixed(2)}
                    </span>
                    <span className="text-gray-400">({recommendedProduct.supplier})</span>
                  </div>

                  {!swap.isAccepted ? (
                    <div className="flex items-center gap-2 mt-2">
                      <Button
                        onClick={() => onAcceptSwap(swap.id)}
                        disabled={isAccepting}
                        size="sm"
                        className="h-6 sm:h-7 text-[10px] sm:text-xs bg-[#1e3a5f] hover:bg-[#15293f] text-white px-2 sm:px-3"
                        data-testid={`button-accept-swap-${index}`}
                      >
                        <Check className="w-3 h-3 mr-1" />
                        Accept
                      </Button>
                      <Button
                        onClick={() => onOpenComparison(swap)}
                        variant="ghost"
                        size="sm"
                        className="h-6 sm:h-7 text-[10px] sm:text-xs text-gray-600 px-2"
                        data-testid={`button-browse-options-${index}`}
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        Compare
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 mt-2 text-green-700">
                      <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 text-white" />
                      </div>
                      <span className="text-[10px] sm:text-xs font-medium">Swap accepted</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-between items-center pt-2 border-t border-gray-100">
        <Button
          onClick={onBack}
          variant="ghost"
          size="sm"
          className="text-gray-600 h-8 sm:h-9 text-xs sm:text-sm"
          data-testid="button-back-check"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1" />
          Back
        </Button>
        <Button
          onClick={onNext}
          size="sm"
          className="bg-[#1e3a5f] hover:bg-[#15293f] text-white h-8 sm:h-9 text-xs sm:text-sm"
          data-testid="button-continue-lock"
        >
          Continue
          <ArrowRight className="w-3.5 h-3.5 ml-1" />
        </Button>
      </div>
    </div>
  );
}
