import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Box, DollarSign, Truck, Leaf, ArrowDown, ArrowUp, ArrowLeft, ArrowRight, Eye, Zap, AlertTriangle, Users, TrendingDown, ShieldCheck, Sparkles, CheckCircle2, Brain, X, Undo2, ChevronDown, ChevronUp, ArrowRightLeft } from "lucide-react";
import type { Product } from "@shared/schema";

interface SmartSwapsProps {
  swaps: any[];
  onAcceptSwap: (swapId: string) => void;
  onRejectSwap: (swapId: string) => void;
  onRevertSwap: (swapId: string) => void;
  onOpenComparison: (swap: any) => void;
  onBack: () => void;
  onNext: () => void;
  isAccepting: boolean;
  isLoading?: boolean;
  itemCount?: number;
  isExpanded?: boolean;
  onHoverSwap?: (productIds: string[]) => void;
}

export default function SmartSwaps({ 
  swaps, 
  onAcceptSwap, 
  onRejectSwap,
  onRevertSwap,
  onOpenComparison, 
  onBack, 
  onNext, 
  isAccepting,
  isLoading,
  itemCount = 0,
  isExpanded = false,
  onHoverSwap,
}: SmartSwapsProps) {
  const { data: products } = useQuery<Product[]>({
    queryKey: ['/api/products']
  });

  const [analysisPhase, setAnalysisPhase] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [showInsights, setShowInsights] = useState(false);

  useEffect(() => {
    if (isLoading) {
      setShowResults(false);
      setAnalysisComplete(false);
      setAnalysisPhase(0);
      const phases = [
        setTimeout(() => setAnalysisPhase(1), 400),
        setTimeout(() => setAnalysisPhase(2), 1200),
        setTimeout(() => setAnalysisPhase(3), 2000),
        setTimeout(() => setAnalysisPhase(4), 2800),
        setTimeout(() => setAnalysisComplete(true), 3400),
      ];
      return () => phases.forEach(clearTimeout);
    } else if (!showResults) {
      setAnalysisPhase(0);
      const phases = [
        setTimeout(() => setAnalysisPhase(1), 300),
        setTimeout(() => setAnalysisPhase(2), 800),
        setTimeout(() => setAnalysisPhase(3), 1300),
        setTimeout(() => setAnalysisPhase(4), 1800),
        setTimeout(() => { setAnalysisComplete(true); setShowResults(true); }, 2200),
      ];
      return () => phases.forEach(clearTimeout);
    }
  }, [isLoading]);

  useEffect(() => {
    if (!isLoading && analysisComplete && !showResults) {
      const t = setTimeout(() => setShowResults(true), 300);
      return () => clearTimeout(t);
    }
  }, [isLoading, analysisComplete, showResults]);

  const getProduct = (productId: string) => products?.find(p => p.id === productId);

  const getSwapIcon = (swapType: string) => {
    switch (swapType) {
      case 'pack_size': return <Box className="w-3 h-3" />;
      case 'supplier': return <DollarSign className="w-3 h-3" />;
      case 'stock': return <AlertTriangle className="w-3 h-3" />;
      case 'sustainability': return <Leaf className="w-3 h-3" />;
      case 'consolidation': return <Users className="w-3 h-3" />;
      default: return <Box className="w-3 h-3" />;
    }
  };

  const getSwapColor = (swapType: string) => {
    switch (swapType) {
      case 'pack_size': return 'bg-blue-100 text-blue-700';
      case 'supplier': return 'bg-indigo-100 text-indigo-700';
      case 'stock': return 'bg-amber-100 text-amber-700';
      case 'sustainability': return 'bg-emerald-100 text-emerald-700';
      case 'consolidation': return 'bg-purple-100 text-purple-700';
      default: return 'bg-blue-100 text-blue-700';
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

  const getSwapAccentColor = (swapType: string) => {
    switch (swapType) {
      case 'pack_size': return 'border-l-blue-400';
      case 'supplier': return 'border-l-indigo-400';
      case 'stock': return 'border-l-amber-400';
      case 'sustainability': return 'border-l-emerald-400';
      case 'consolidation': return 'border-l-purple-400';
      default: return 'border-l-blue-400';
    }
  };

  const potentialSavings = swaps.reduce((acc, swap) => acc + Math.max(0, parseFloat(swap.savingsAmount || "0")), 0);
  const acceptedCount = swaps.filter(s => s.isAccepted).length;
  const rejectedCount = swaps.filter(s => s.status === 'rejected').length;
  const pendingCount = swaps.length - acceptedCount - rejectedCount;
  const stockRiskCount = swaps.filter(s => s.swapType === 'stock').length;
  const ecoCount = swaps.filter(s => s.swapType === 'sustainability').length;
  const bulkCount = swaps.filter(s => s.swapType === 'pack_size').length;
  const supplierCount = swaps.filter(s => s.swapType === 'supplier').length;
  const acceptedSavings = swaps.filter(s => s.isAccepted).reduce((acc: number, s: any) => acc + Math.max(0, parseFloat(s.savingsAmount || "0")), 0);

  const analysisSteps = [
    { text: "Scanning VIA-enriched catalog across 630+ suppliers...", icon: <Sparkles className="w-3 h-3" /> },
    { text: "Cross-referencing stock levels and lead times...", icon: <Truck className="w-3 h-3" /> },
    { text: "Evaluating cooperative contract pricing tiers...", icon: <ShieldCheck className="w-3 h-3" /> },
    { text: "Analyzing sustainability certifications and bulk formats...", icon: <Leaf className="w-3 h-3" /> },
  ];

  if (!showResults) {
    return (
      <div className="space-y-3">
        <div>
          <h3 className="font-bold text-gray-900 mb-0.5 text-sm sm:text-base">Optimizing Your Order</h3>
          <p className="text-[10px] sm:text-xs text-gray-500">
            Agent is analyzing {itemCount} items against 7.5M+ enriched catalog products
          </p>
        </div>

        <div className="bg-gradient-to-br from-[#1e3a5f]/5 to-indigo-50 border border-[#1e3a5f]/20 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-[#1e3a5f] rounded-lg flex items-center justify-center">
              <Brain className="w-4 h-4 text-white animate-pulse" />
            </div>
            <div>
              <div className="text-xs font-semibold text-[#1e3a5f]">R2C Agent Working</div>
              <div className="text-[10px] text-gray-500">VIA intelligence engine active</div>
            </div>
          </div>
          <div className="space-y-2">
            {analysisSteps.map((step, i) => (
              <div
                key={i}
                className={`flex items-center gap-2 text-[11px] transition-all duration-500 ${
                  i < analysisPhase ? 'text-green-700 opacity-100' : i === analysisPhase ? 'text-[#1e3a5f] opacity-100' : 'text-gray-300 opacity-50'
                }`}
              >
                <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${
                  i < analysisPhase ? 'bg-green-100' : i === analysisPhase ? 'bg-[#1e3a5f]/10' : 'bg-gray-100'
                }`}>
                  {i < analysisPhase ? <Check className="w-3 h-3 text-green-600" /> : step.icon}
                </div>
                <span className={i === analysisPhase ? 'font-medium' : ''}>{step.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-between items-center pt-2 border-t border-gray-100">
          <Button onClick={onBack} variant="ghost" size="sm" className="text-gray-600 h-8 sm:h-9 text-xs sm:text-sm" data-testid="button-back-check">
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            Back
          </Button>
        </div>
      </div>
    );
  }

  const acceptAll = () => {
    swaps.filter(s => !s.isAccepted).forEach(s => onAcceptSwap(s.id));
  };

  if (swaps.length === 0) {
    return (
      <div className="space-y-3">
        <div>
          <h3 className="font-bold text-gray-900 mb-0.5 text-sm sm:text-base flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            Analysis Complete
          </h3>
          <p className="text-[10px] sm:text-xs text-gray-500">
            Your order is already well-optimized
          </p>
        </div>
        <div className="bg-gradient-to-r from-emerald-50 to-blue-50 border border-emerald-200 rounded-lg p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <Zap className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-xs font-semibold text-emerald-800">Agent Intelligence <span className="font-normal text-emerald-600">· VIA-powered</span></span>
          </div>
          <p className="text-[11px] text-gray-700">
            R2C analyzed your {itemCount} items against 7.5M+ VIA-enriched catalog products across 630+ cooperative suppliers. All items are optimally priced with no stock risks, sustainability upgrades, or bulk format improvements available.
          </p>
        </div>
        <div className="flex justify-between items-center pt-2 border-t border-gray-100">
          <Button onClick={onBack} variant="ghost" size="sm" className="text-gray-600 h-8 sm:h-9 text-xs sm:text-sm" data-testid="button-back-check">
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            Back
          </Button>
          <Button onClick={onNext} size="sm" className="bg-[#1e3a5f] hover:bg-[#15293f] text-white h-8 sm:h-9 text-xs sm:text-sm" data-testid="button-continue-lock">
            Continue
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-sm leading-none">{swaps.length} Swap{swaps.length !== 1 ? 's' : ''} Found</h3>
            <p className="text-[10px] text-gray-500 mt-0.5">{acceptedCount} accepted · {pendingCount} pending</p>
          </div>
        </div>
        {acceptedCount < swaps.length && (
          <Button
            onClick={acceptAll}
            size="sm"
            className="h-7 text-[10px] bg-green-600 hover:bg-green-700 text-white px-2.5 shadow-sm"
            data-testid="button-accept-all"
          >
            <Check className="w-3 h-3 mr-1" />
            Accept All
          </Button>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        {potentialSavings > 0 && (
          <div className="flex items-center gap-1 bg-green-50 border border-green-200 rounded-full px-2 py-0.5">
            <TrendingDown className="w-3 h-3 text-green-600" />
            <span className="text-[10px] font-semibold text-green-700" data-testid="text-potential-savings">${potentialSavings.toFixed(2)} potential</span>
          </div>
        )}
        {acceptedSavings > 0 && (
          <div className="flex items-center gap-1 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
            <Check className="w-3 h-3 text-emerald-600" />
            <span className="text-[10px] font-semibold text-emerald-700">${acceptedSavings.toFixed(2)} locked in</span>
          </div>
        )}
      </div>

      {stockRiskCount > 0 && (
        <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-md px-2.5 py-1.5">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span className="text-[10px] text-amber-800 font-medium">{stockRiskCount} item{stockRiskCount > 1 ? 's have' : ' has'} stock risk — swap to avoid 7-14 day backorder delays</span>
        </div>
      )}

      <button
        onClick={() => setShowInsights(!showInsights)}
        className="flex items-center gap-1.5 text-[10px] text-gray-500 hover:text-gray-700 transition-colors w-full"
        data-testid="button-toggle-insights"
      >
        <Zap className="w-3 h-3" />
        <span>VIA Intelligence Summary</span>
        {showInsights ? <ChevronUp className="w-3 h-3 ml-auto" /> : <ChevronDown className="w-3 h-3 ml-auto" />}
      </button>

      {showInsights && (
        <div className="bg-gradient-to-r from-slate-50 to-blue-50/50 border border-slate-200 rounded-lg p-2.5 space-y-1.5 text-[10px] text-gray-600 animate-in slide-in-from-top-1 duration-200">
          {potentialSavings > 0 && (
            <div className="flex items-start gap-1.5">
              <TrendingDown className="w-3 h-3 text-green-500 shrink-0 mt-0.5" />
              <span>Identified <strong className="text-green-700">${potentialSavings.toFixed(2)}</strong> in potential savings across {swaps.filter(s => parseFloat(s.savingsAmount || "0") > 0).length} recommendations</span>
            </div>
          )}
          {bulkCount > 0 && (
            <div className="flex items-start gap-1.5">
              <Box className="w-3 h-3 text-blue-500 shrink-0 mt-0.5" />
              <span><strong className="text-blue-700">{bulkCount} bulk format{bulkCount > 1 ? 's' : ''}</strong> with better per-unit economics</span>
            </div>
          )}
          {ecoCount > 0 && (
            <div className="flex items-start gap-1.5">
              <Leaf className="w-3 h-3 text-green-500 shrink-0 mt-0.5" />
              <span><strong className="text-green-700">{ecoCount} eco alternative{ecoCount > 1 ? 's' : ''}</strong> aligned with Green Purchasing Policy</span>
            </div>
          )}
          {supplierCount > 0 && (
            <div className="flex items-start gap-1.5">
              <DollarSign className="w-3 h-3 text-indigo-500 shrink-0 mt-0.5" />
              <span><strong className="text-indigo-700">{supplierCount} competitive price{supplierCount > 1 ? 's' : ''}</strong> from cooperative suppliers</span>
            </div>
          )}
          {acceptedCount === swaps.length && (
            <div className="flex items-start gap-1.5">
              <CheckCircle2 className="w-3 h-3 text-green-500 shrink-0 mt-0.5" />
              <span className="text-green-700 font-medium">All recommendations accepted — order fully optimized</span>
            </div>
          )}
        </div>
      )}

      <div className={`${isExpanded ? 'grid grid-cols-2 gap-3' : 'space-y-2'}`}>
        {swaps.map((swap, index) => {
          const originalProduct = getProduct(swap.originalProductId);
          const recommendedProduct = getProduct(swap.recommendedProductId);
          if (!originalProduct || !recommendedProduct) return null;

          const savings = parseFloat(swap.savingsAmount || "0");

          if (swap.isAccepted) {
            return (
              <div
                key={swap.id}
                className="border border-green-200 bg-green-50/60 rounded-lg px-3 py-2 transition-all"
                data-testid={`swap-card-${index}`}
                onMouseEnter={() => onHoverSwap?.([originalProduct.name, recommendedProduct.name])}
                onMouseLeave={() => onHoverSwap?.([])}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[11px] font-medium text-green-800 truncate">{recommendedProduct.name}</div>
                      <div className="text-[9px] text-green-600">
                        {savings > 0 ? `Saving $${savings.toFixed(2)}/unit` : 'Swapped'} · {recommendedProduct.supplier}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    <Button
                      onClick={() => onOpenComparison(swap)}
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-green-600 hover:bg-green-100"
                      data-testid={`button-compare-accepted-${index}`}
                    >
                      <Eye className="w-3 h-3" />
                    </Button>
                    <Button
                      onClick={() => onRevertSwap(swap.id)}
                      disabled={isAccepting}
                      variant="ghost"
                      size="sm"
                      className="h-6 text-[10px] text-amber-600 hover:bg-amber-50 px-1.5"
                      data-testid={`button-undo-swap-${index}`}
                    >
                      <Undo2 className="w-3 h-3 mr-0.5" />
                      Undo
                    </Button>
                  </div>
                </div>
              </div>
            );
          }

          return (
            <div
              key={swap.id}
              className={`border border-gray-200 rounded-lg overflow-hidden transition-all hover:shadow-md hover:border-blue-300 border-l-[3px] ${getSwapAccentColor(swap.swapType)}`}
              data-testid={`swap-card-${index}`}
              onMouseEnter={() => onHoverSwap?.([originalProduct.name, recommendedProduct.name])}
              onMouseLeave={() => onHoverSwap?.([])}
            >
              <div className="px-3 pt-2.5 pb-2">
                <div className="flex items-center justify-between mb-1.5">
                  <Badge className={`text-[8px] px-1.5 py-0 font-semibold ${getSwapColor(swap.swapType)}`}>
                    {getSwapIcon(swap.swapType)}
                    <span className="ml-1">{getSwapLabel(swap.swapType)}</span>
                  </Badge>
                  {savings > 0 ? (
                    <span className="text-[10px] font-bold text-green-600 flex items-center gap-0.5">
                      <ArrowDown className="w-2.5 h-2.5" />
                      Save ${savings.toFixed(2)}
                    </span>
                  ) : savings < 0 ? (
                    <span className="text-[10px] font-medium text-amber-600 flex items-center gap-0.5">
                      <ArrowUp className="w-2.5 h-2.5" />
                      +${Math.abs(savings).toFixed(2)}
                    </span>
                  ) : null}
                </div>

                <div className="grid grid-cols-[1fr,auto,1fr] gap-1 items-start mb-2">
                  <div className="bg-gray-50 rounded-md p-1.5">
                    <div className="text-[8px] uppercase font-semibold text-gray-400 tracking-wider mb-0.5">Current</div>
                    <div className="text-[10px] font-medium text-gray-800 leading-tight line-clamp-2">{originalProduct.name}</div>
                    <div className="text-[10px] font-mono font-semibold text-gray-600 mt-0.5">${parseFloat(originalProduct.unitPrice).toFixed(2)}</div>
                    <div className="text-[9px] text-gray-400 truncate">{originalProduct.supplier}</div>
                  </div>
                  <div className="flex items-center justify-center self-center pt-3">
                    <ArrowRightLeft className="w-3 h-3 text-gray-300" />
                  </div>
                  <div className="bg-blue-50/80 rounded-md p-1.5 border border-blue-100">
                    <div className="text-[8px] uppercase font-semibold text-blue-500 tracking-wider mb-0.5">Recommended</div>
                    <div className="text-[10px] font-medium text-gray-800 leading-tight line-clamp-2">{recommendedProduct.name}</div>
                    <div className="text-[10px] font-mono font-semibold text-blue-700 mt-0.5">${parseFloat(recommendedProduct.unitPrice).toFixed(2)}</div>
                    <div className="text-[9px] text-gray-400 truncate">{recommendedProduct.supplier}</div>
                  </div>
                </div>

                <p className="text-[9px] text-gray-500 leading-relaxed line-clamp-2 mb-2">{swap.reason}</p>

                <div className="flex items-center gap-1.5">
                  <Button
                    onClick={() => onAcceptSwap(swap.id)}
                    disabled={isAccepting}
                    size="sm"
                    className="h-7 flex-1 text-[11px] bg-[#1e3a5f] hover:bg-[#15293f] text-white font-medium shadow-sm"
                    data-testid={`button-accept-swap-${index}`}
                  >
                    <Check className="w-3 h-3 mr-1" />
                    Accept Swap
                  </Button>
                  <Button
                    onClick={() => onOpenComparison(swap)}
                    variant="outline"
                    size="sm"
                    className="h-7 text-[10px] text-gray-600 border-gray-200 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 px-2"
                    data-testid={`button-browse-options-${index}`}
                  >
                    <Eye className="w-3 h-3 mr-0.5" />
                    Compare
                  </Button>
                  <button
                    onClick={() => onRejectSwap(swap.id)}
                    disabled={isAccepting}
                    className="text-[10px] text-gray-400 hover:text-red-500 transition-colors px-1"
                    data-testid={`button-decline-swap-${index}`}
                  >
                    Skip
                  </button>
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
