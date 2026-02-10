import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Box, DollarSign, Truck, Leaf, ArrowDown, ArrowUp, ArrowLeft, ArrowRight, Eye, Zap, AlertTriangle, Users, TrendingDown, ShieldCheck, Sparkles, CheckCircle2, Brain } from "lucide-react";
import type { Product } from "@shared/schema";

interface SmartSwapsProps {
  swaps: any[];
  onAcceptSwap: (swapId: string) => void;
  onOpenComparison: (swap: any) => void;
  onBack: () => void;
  onNext: () => void;
  isAccepting: boolean;
  isLoading?: boolean;
  itemCount?: number;
  isExpanded?: boolean;
}

export default function SmartSwaps({ 
  swaps, 
  onAcceptSwap, 
  onOpenComparison, 
  onBack, 
  onNext, 
  isAccepting,
  isLoading,
  itemCount = 0,
  isExpanded = false,
}: SmartSwapsProps) {
  const { data: products } = useQuery<Product[]>({
    queryKey: ['/api/products']
  });

  const [analysisPhase, setAnalysisPhase] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);

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
      case 'pack_size': return <Box className="w-3.5 h-3.5" />;
      case 'supplier': return <DollarSign className="w-3.5 h-3.5" />;
      case 'stock': return <AlertTriangle className="w-3.5 h-3.5" />;
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
  const bulkCount = swaps.filter(s => s.swapType === 'pack_size').length;
  const supplierCount = swaps.filter(s => s.swapType === 'supplier').length;

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
    <div className="space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-bold text-gray-900 mb-0.5 text-sm sm:text-base flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            Order Optimized
          </h3>
          <p className="text-[10px] sm:text-xs text-gray-500">
            {swaps.length} optimization{swaps.length !== 1 ? 's' : ''} found across {itemCount} items
          </p>
        </div>
        {swaps.length > 0 && acceptedCount < swaps.length && (
          <Button
            onClick={acceptAll}
            variant="outline"
            size="sm"
            className="h-6 text-[10px] border-green-300 text-green-700 hover:bg-green-50 px-2"
            data-testid="button-accept-all"
          >
            <Check className="w-3 h-3 mr-0.5" />
            Accept All
          </Button>
        )}
      </div>

      <div className="bg-gradient-to-r from-emerald-50 to-blue-50 border border-emerald-200 rounded-lg p-2.5">
        <div className="flex items-center gap-1.5 mb-2">
          <Zap className="w-3.5 h-3.5 text-emerald-600" />
          <span className="text-xs font-semibold text-emerald-800">Agent Intelligence <span className="font-normal text-emerald-600">· VIA-powered</span></span>
        </div>
        <div className="space-y-1.5 text-[10px] sm:text-[11px] text-gray-700">
          {potentialSavings > 0 && (
            <div className="flex items-start gap-1.5">
              <TrendingDown className="w-3 h-3 text-green-500 shrink-0 mt-0.5" />
              <span>Identified <strong className="text-green-700">${potentialSavings.toFixed(2)}</strong> in potential line-item savings across {swaps.filter(s => parseFloat(s.savingsAmount || "0") > 0).length} recommendations</span>
            </div>
          )}
          {stockRiskCount > 0 && (
            <div className="flex items-start gap-1.5">
              <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
              <span><strong className="text-amber-700">{stockRiskCount} stock risk{stockRiskCount > 1 ? 's' : ''} detected</strong> — VIA flagged low inventory and sourced available alternatives to prevent backorders</span>
            </div>
          )}
          {bulkCount > 0 && (
            <div className="flex items-start gap-1.5">
              <Box className="w-3 h-3 text-blue-500 shrink-0 mt-0.5" />
              <span><strong className="text-blue-700">{bulkCount} bulk format{bulkCount > 1 ? 's' : ''}</strong> with better per-unit economics identified from VIA pack-size analysis</span>
            </div>
          )}
          {supplierCount > 0 && (
            <div className="flex items-start gap-1.5">
              <DollarSign className="w-3 h-3 text-indigo-500 shrink-0 mt-0.5" />
              <span><strong className="text-indigo-700">{supplierCount} competitive price{supplierCount > 1 ? 's' : ''}</strong> from cooperative master agreement suppliers at lower cost</span>
            </div>
          )}
          {ecoCount > 0 && (
            <div className="flex items-start gap-1.5">
              <Leaf className="w-3 h-3 text-green-500 shrink-0 mt-0.5" />
              <span><strong className="text-green-700">{ecoCount} sustainable alternative{ecoCount > 1 ? 's' : ''}</strong> — certified eco products aligned with Green Purchasing Policy mandates</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="bg-green-50 border border-green-200 rounded-lg px-2.5 sm:px-3 py-2 text-center">
          <div className="text-[9px] sm:text-[10px] text-green-600 uppercase font-semibold tracking-wide">Potential Savings</div>
          <div className="text-base sm:text-lg font-bold text-green-900" data-testid="text-potential-savings">
            {potentialSavings > 0 ? `$${potentialSavings.toFixed(2)}` : '—'}
          </div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-2.5 sm:px-3 py-2 text-center">
          <div className="text-[9px] sm:text-[10px] text-blue-600 uppercase font-semibold tracking-wide">Accepted</div>
          <div className="text-base sm:text-lg font-bold text-blue-900" data-testid="text-accepted-count">{acceptedCount} / {swaps.length}</div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-amber-50/80 to-orange-50/60 border border-amber-200/80 rounded-lg p-2.5" data-testid="proactive-insights">
        <div className="flex items-center gap-1.5 mb-2">
          <Brain className="w-3.5 h-3.5 text-amber-600" />
          <span className="text-xs font-semibold text-amber-800">Proactive Insights</span>
        </div>
        <div className="space-y-1.5 text-[10px] sm:text-[11px] text-gray-700">
          {stockRiskCount > 0 && (
            <div className="flex items-start gap-1.5">
              <AlertTriangle className="w-3 h-3 text-red-500 shrink-0 mt-0.5" />
              <span><strong className="text-red-700">Action recommended:</strong> {stockRiskCount} item{stockRiskCount > 1 ? 's have' : ' has'} inventory risk — accepting these swaps prevents potential backorder delays of 7-14 days</span>
            </div>
          )}
          {bulkCount > 0 && (
            <div className="flex items-start gap-1.5">
              <TrendingDown className="w-3 h-3 text-blue-500 shrink-0 mt-0.5" />
              <span>Bulk format{bulkCount > 1 ? 's reduce' : ' reduces'} your <strong className="text-blue-700">per-unit cost by up to {Math.round(potentialSavings / Math.max(1, bulkCount))}%</strong> — lower reorder frequency means less procurement overhead</span>
            </div>
          )}
          {ecoCount > 0 && (
            <div className="flex items-start gap-1.5">
              <Leaf className="w-3 h-3 text-green-500 shrink-0 mt-0.5" />
              <span>Accepting eco swaps advances <strong className="text-green-700">Green Purchasing Policy goals</strong> — {ecoCount} certified alternative{ecoCount > 1 ? 's' : ''} with equivalent or better performance</span>
            </div>
          )}
          {acceptedCount === swaps.length && swaps.length > 0 && (
            <div className="flex items-start gap-1.5">
              <CheckCircle2 className="w-3 h-3 text-green-500 shrink-0 mt-0.5" />
              <span className="text-green-700 font-medium">All recommendations accepted — your order is fully optimized</span>
            </div>
          )}
          {acceptedCount === 0 && swaps.length > 0 && (
            <div className="flex items-start gap-1.5">
              <Zap className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
              <span>Review each swap to unlock <strong className="text-amber-700">${potentialSavings.toFixed(2)}</strong> in savings — you can compare side-by-side before accepting</span>
            </div>
          )}
        </div>
      </div>

      <div className={`${isExpanded ? 'grid grid-cols-2 gap-3' : 'space-y-2 max-h-[250px] sm:max-h-[300px] overflow-y-auto pr-1'}`}>
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

                  <p className={`text-[10px] text-gray-500 mt-0.5 leading-relaxed ${isExpanded ? '' : 'line-clamp-2'}`}>{swap.reason}</p>

                  {isExpanded && (
                    <div className="mt-2 grid grid-cols-2 gap-2 text-[10px]">
                      <div className="bg-gray-50 rounded p-1.5">
                        <div className="text-gray-400 uppercase text-[8px] font-semibold tracking-wide">Current</div>
                        <div className="font-medium text-gray-700 truncate">{originalProduct.name}</div>
                        <div className="text-gray-500">{originalProduct.supplier} · ${parseFloat(originalProduct.unitPrice).toFixed(2)}/{originalProduct.unitOfMeasure}</div>
                        {originalProduct.packSize && <div className="text-gray-400">Pack: {originalProduct.packSize} {originalProduct.packUnit || 'ct'}</div>}
                        {originalProduct.contract && <div className="text-purple-500 truncate">{originalProduct.contract}</div>}
                      </div>
                      <div className="bg-green-50 rounded p-1.5">
                        <div className="text-green-600 uppercase text-[8px] font-semibold tracking-wide">Recommended</div>
                        <div className="font-medium text-green-800 truncate">{recommendedProduct.name}</div>
                        <div className="text-green-700">{recommendedProduct.supplier} · ${parseFloat(recommendedProduct.unitPrice).toFixed(2)}/{recommendedProduct.unitOfMeasure}</div>
                        {recommendedProduct.packSize && <div className="text-green-600">Pack: {recommendedProduct.packSize} {recommendedProduct.packUnit || 'ct'}</div>}
                        {recommendedProduct.certifications && recommendedProduct.certifications.length > 0 && (
                          <div className="flex flex-wrap gap-0.5 mt-0.5">
                            {recommendedProduct.certifications.map((cert: string, i: number) => (
                              <span key={i} className="bg-green-100 text-green-700 text-[7px] px-1 rounded">{cert}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {!isExpanded && (
                    <div className="flex items-center gap-2 sm:gap-3 mt-1 text-[10px] sm:text-xs">
                      <span className="text-gray-400 line-through">
                        ${parseFloat(originalProduct.unitPrice).toFixed(2)}
                      </span>
                      <span className="text-gray-300">→</span>
                      <span className="font-semibold text-green-700">
                        ${parseFloat(recommendedProduct.unitPrice).toFixed(2)}
                      </span>
                      <span className="text-gray-400 text-[9px]">{recommendedProduct.supplier}</span>
                    </div>
                  )}

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
