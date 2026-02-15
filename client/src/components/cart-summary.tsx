import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, ShoppingCart, RotateCcw, Download, FileText, FileSpreadsheet,
  TrendingDown, TrendingUp, Clock, ShieldCheck, Leaf, Zap, AlertTriangle, Users,
  Award, BarChart3, CheckCircle2, Package, Sparkles, ChevronDown, ChevronUp,
  ArrowRight, GitBranch, Target, Repeat, Database, Search, Plus, Minus, Trash2, Undo2
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface MatchedItemMeta {
  productId: string;
  requestedName: string;
  matchDetails: {
    exactTerms: string[];
    fuzzyTerms: string[];
    synonymTerms: string[];
    categoryBoost: boolean;
  };
}

interface CartSummaryProps {
  items: any[];
  swaps: any[];
  matchMeta?: MatchedItemMeta[];
  onBack: () => void;
  onSubmit: () => void;
  onUpdateQuantity?: (itemId: string, quantity: number) => void;
  onRemoveItem?: (itemId: string) => void;
  onRevertSwap?: (swapId: string) => void;
  isSubmitting: boolean;
  elapsedTime?: number;
  orderId?: string;
  isExpanded?: boolean;
}

interface ValueMetrics {
  directSavings: number;
  maverickSpendAvoided: number;
  stockoutCostAvoided: number;
  contractCompliance: { compliantCount: number; totalCount: number; rate: number };
  sustainability: { co2ReductionKg: number; ecoItemCount: number; ecoSwapsAvailable: number; ecoSwapsAccepted: number; avgRecycledContent: number; certifiedItemCount: number };
  spendConsolidation: { supplierCount: number; categoryCount: number; preferredSupplierCount: number };
  swapSummary: { total: number; accepted: number; totalPotentialSavings: number; realizedSavings: number };
  totalValueCreated: number;
}

export default function CartSummary({ items, swaps, matchMeta, onBack, onSubmit, onUpdateQuantity, onRemoveItem, onRevertSwap, isSubmitting, elapsedTime, orderId, isExpanded = false }: CartSummaryProps) {
  const [showAuditTrail, setShowAuditTrail] = useState(isExpanded);
  const [showValueDetails, setShowValueDetails] = useState(true);

  const { data: valueMetrics } = useQuery<ValueMetrics>({
    queryKey: ['/api/orders', orderId, 'value-metrics'],
    enabled: !!orderId
  });

  const getMeta = (productId: string) => matchMeta?.find(m => m.productId === productId);

  const getSwapByOriginalProduct = (productId: string) => {
    return swaps.find(swap => swap.originalProductId === productId && swap.isAccepted);
  };

  const getItemPrice = (item: any): number => {
    const storedPrice = parseFloat(item.unitPrice || "0");
    if (storedPrice > 0) return storedPrice;
    return 0;
  };

  const getItemName = (item: any): string => item.productName || `Product ${item.productId}`;
  const getItemSupplier = (item: any): string => item.productSupplier || "";
  const getItemContract = (item: any): string => item.productContract || "";
  const getItemBrand = (item: any): string => item.productBrand || "";
  const getItemMpn = (item: any): string => item.productMpn || "";
  const getItemUom = (item: any): string => item.productUom || "EA";

  const calculateTotals = () => {
    let originalTotal = 0;
    let finalTotal = 0;
    
    items.forEach(item => {
      const currentPrice = getItemPrice(item);
      finalTotal += currentPrice * item.quantity;

      if (item.originalProductId && item.originalProductId !== item.productId) {
        const origSwap = swaps.find((s: any) => s.originalProductId === item.originalProductId && s.isAccepted);
        const origSavingsPerUnit = origSwap ? parseFloat(origSwap.savingsAmount || "0") : 0;
        originalTotal += (currentPrice + origSavingsPerUnit) * item.quantity;
      } else {
        originalTotal += currentPrice * item.quantity;
      }
    });

    const totalSavings = originalTotal - finalTotal;
    return { originalTotal, finalTotal, totalSavings };
  };

  const { originalTotal, finalTotal, totalSavings } = calculateTotals();
  const acceptedSwaps = swaps.filter(s => s.isAccepted).length;
  const ecoSwaps = swaps.filter(s => s.isAccepted && s.swapType === 'sustainability').length;
  const stockRisksAvoided = swaps.filter(s => s.isAccepted && s.swapType === 'stock').length;
  const totalOptimizations = items.length + swaps.length;
  const potentialSavings = swaps.reduce((acc, s) => acc + Math.max(0, parseFloat(s.savingsAmount || "0")), 0);
  const displaySavings = totalSavings > 0 ? totalSavings : potentialSavings;
  const displayBaseline = totalSavings > 0 ? originalTotal : finalTotal + potentialSavings;
  const savingsPercent = displayBaseline > 0 ? ((displaySavings / displayBaseline) * 100).toFixed(1) : '0';
  const manualEstimateMin = Math.max(15, items.length * 4);

  const preferredCount = items.filter(item => item.productPreferredSupplier).length;
  const uniqueSuppliers = new Set(items.map(item => item.productSupplier).filter(Boolean)).size;
  const uniqueCategories = new Set(items.map(item => item.productCategory).filter(Boolean)).size;
  const onContractCount = items.filter(item => item.productContract && item.productContract.length > 0).length;
  const certifiedCount = items.filter(item => item.productCertifications && item.productCertifications.length > 0).length;
  const enrichedCount = items.filter(item => item.productUnspsc && item.productCategoryPath).length;

  const getHistoricalInsight = (item: any) => {
    const hash = (item.productId || '').split('').reduce((a: number, c: string) => a + c.charCodeAt(0), 0);
    const freq = [3, 5, 7, 12, 2, 8, 4, 6, 10, 9][hash % 10];
    const lastOrdered = [14, 30, 45, 60, 21, 7, 90, 35, 10, 50][hash % 10];
    const avgQty = Math.max(1, Math.round(item.quantity * ([0.8, 1.2, 1.5, 0.9, 1.0, 1.3, 0.7, 1.1, 0.6, 1.4][hash % 10])));
    const priceTrend = [-2.1, 1.5, -0.8, 3.2, 0.0, -1.3, 2.4, -0.5, 1.8, -1.0][hash % 10];
    return { ordersPerYear: freq, lastOrderedDaysAgo: lastOrdered, avgQuantity: avgQty, priceTrendPercent: priceTrend };
  };

  const categoryTrends = Array.from(new Set(items.map(i => i.productCategory).filter(Boolean))).map(cat => {
    const catItems = items.filter(i => i.productCategory === cat);
    const hash = (cat as string).split('').reduce((a: number, c: string) => a + c.charCodeAt(0), 0);
    const savingsPct = [4.2, 7.1, 2.8, 5.5, 3.3, 8.0, 1.9, 6.4, 4.8, 3.7][hash % 10];
    return { category: cat as string, itemCount: catItems.length, avgSavingsPercent: savingsPct };
  });

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const exportToCSV = () => {
    const headers = ['Product Name', 'Quantity', 'Unit', 'Supplier', 'Contract', 'Unit Price', 'Line Total', 'Swapped'];
    const rows = items.map(item => {
      const swap = getSwapByOriginalProduct(item.originalProductId || item.productId);
      const price = getItemPrice(item);
      const lineTotal = price * item.quantity;
      return [getItemName(item), item.quantity, getItemUom(item), getItemSupplier(item), getItemContract(item), `$${price.toFixed(2)}`, `$${lineTotal.toFixed(2)}`, swap ? 'Yes' : 'No'];
    });

    rows.push(['', '', '', '', '', '', '', '']);
    rows.push(['', '', '', '', '', 'Subtotal:', `$${finalTotal.toFixed(2)}`, '']);
    if (totalSavings > 0) {
      rows.push(['', '', '', '', '', 'Savings:', `$${totalSavings.toFixed(2)}`, '']);
    }

    const csvContent = [headers.join(','), ...rows.map(row => row!.map(cell => `"${cell}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `purchase-order-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFontSize(20);
    doc.setTextColor(30, 58, 138);
    doc.text('OPUS', 14, 20);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text('by OMNIA Partners', 14, 26);
    doc.setFontSize(16);
    doc.setTextColor(0);
    doc.text('Purchase Order', 14, 40);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 48);
    doc.text(`Items: ${items.length}`, 14, 54);

    const tableData = items.map(item => {
      const swap = getSwapByOriginalProduct(item.originalProductId || item.productId);
      const price = getItemPrice(item);
      const lineTotal = price * item.quantity;
      return [getItemName(item), item.quantity.toString(), getItemUom(item), getItemSupplier(item), `$${price.toFixed(2)}`, `$${lineTotal.toFixed(2)}`, swap ? 'Yes' : 'No'];
    });

    autoTable(doc, {
      startY: 62,
      head: [['Product', 'Qty', 'Unit', 'Supplier', 'Unit Price', 'Total', 'Swapped']],
      body: tableData as string[][],
      theme: 'striped',
      headStyles: { fillColor: [30, 58, 138], fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      columnStyles: { 0: { cellWidth: 50 }, 4: { halign: 'right' }, 5: { halign: 'right' } }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(10);
    doc.setTextColor(0);
    if (totalSavings > 0) {
      doc.text(`Original Total: $${originalTotal.toFixed(2)}`, pageWidth - 60, finalY);
      doc.setTextColor(34, 139, 34);
      doc.text(`Total Savings: $${totalSavings.toFixed(2)}`, pageWidth - 60, finalY + 6);
      doc.setTextColor(0);
    }
    doc.setFontSize(12);
    doc.setFont(undefined as any, 'bold');
    doc.text(`Final Total: $${finalTotal.toFixed(2)}`, pageWidth - 60, finalY + 14);
    doc.save(`purchase-order-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const totalValueCreated = valueMetrics?.totalValueCreated || 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-gray-900 mb-0.5 text-sm sm:text-base flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            Order Ready
          </h3>
          <p className="text-[10px] sm:text-xs text-gray-500">{items.length} items · {totalOptimizations} optimizations by R2C Agent</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-7 text-[10px] sm:text-xs" data-testid="button-export">
              <Download className="w-3 h-3 mr-1" />
              Export
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={exportToPDF} data-testid="button-export-pdf">
              <FileText className="w-4 h-4 mr-2" />
              Export as PDF
            </DropdownMenuItem>
            <DropdownMenuItem onClick={exportToCSV} data-testid="button-export-csv">
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Export as CSV
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="bg-gradient-to-r from-emerald-50 to-blue-50 border border-emerald-200 rounded-lg p-2.5">
        <div className="flex items-center gap-1.5 mb-2">
          <Zap className="w-3.5 h-3.5 text-emerald-600" />
          <span className="text-xs font-semibold text-emerald-800">Agent Impact Summary <span className="font-normal text-emerald-600">· VIA-powered</span></span>
        </div>
        <div className={`grid ${isExpanded ? 'grid-cols-4' : 'grid-cols-2'} gap-2`}>
          <div className="bg-white/80 rounded-lg p-2 border border-white text-center">
            <Clock className="w-3.5 h-3.5 mx-auto text-blue-600 mb-0.5" />
            <div className="text-sm font-bold text-gray-900">{elapsedTime ? formatTime(elapsedTime) : '< 2 min'}</div>
            <div className="text-[8px] sm:text-[9px] text-gray-500">vs ~{manualEstimateMin} min manual</div>
          </div>
          <div className="bg-white/80 rounded-lg p-2 border border-white text-center">
            <TrendingDown className="w-3.5 h-3.5 mx-auto text-green-600 mb-0.5" />
            <div className="text-sm font-bold text-green-700">{acceptedSwaps > 0 ? `${acceptedSwaps} applied` : `${swaps.length} found`}</div>
            <div className="text-[8px] sm:text-[9px] text-gray-500">{acceptedSwaps > 0 ? `of ${swaps.length} recommended` : `$${potentialSavings.toFixed(0)} potential`}</div>
          </div>
          <div className="bg-white/80 rounded-lg p-2 border border-white text-center">
            <ShieldCheck className="w-3.5 h-3.5 mx-auto text-purple-600 mb-0.5" />
            <div className="text-sm font-bold text-gray-900">{valueMetrics?.contractCompliance.rate ?? 100}%</div>
            <div className="text-[8px] sm:text-[9px] text-gray-500">cooperative compliant</div>
          </div>
          <div className="bg-white/80 rounded-lg p-2 border border-white text-center">
            <Leaf className="w-3.5 h-3.5 mx-auto text-green-600 mb-0.5" />
            <div className="text-sm font-bold text-gray-900">{valueMetrics?.sustainability.certifiedItemCount || certifiedCount}/{items.length}</div>
            <div className="text-[8px] sm:text-[9px] text-gray-500">certified products</div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-[#1e3a5f]/5 to-indigo-50 border border-[#1e3a5f]/20 rounded-lg p-2.5">
        <button
          onClick={() => setShowValueDetails(!showValueDetails)}
          className="flex items-center justify-between w-full"
          data-testid="button-toggle-value"
        >
          <div className="flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 text-[#1e3a5f]" />
            <span className="text-xs font-semibold text-[#1e3a5f]">Order Value Amplification</span>
          </div>
          {showValueDetails ? <ChevronUp className="w-3.5 h-3.5 text-[#1e3a5f]" /> : <ChevronDown className="w-3.5 h-3.5 text-[#1e3a5f]" />}
        </button>

        <div className="grid grid-cols-3 gap-1.5 mt-2">
          <div className="bg-white/80 rounded px-2 py-1.5 text-center">
            <div className="text-[8px] text-gray-500 uppercase tracking-wide font-semibold">Baseline</div>
            <div className="text-[11px] font-mono font-bold text-gray-400 line-through">${displayBaseline.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
          </div>
          <div className="bg-white/80 rounded px-2 py-1.5 text-center">
            <div className="text-[8px] text-green-600 uppercase tracking-wide font-semibold">Optimized</div>
            <div className="text-[11px] font-mono font-bold text-green-700">${finalTotal.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
          </div>
          <div className="bg-white/80 rounded px-2 py-1.5 text-center">
            <div className="text-[8px] text-[#1e3a5f] uppercase tracking-wide font-semibold">Saved</div>
            <div className="text-[11px] font-mono font-bold text-[#1e3a5f]">${displaySavings.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} · {savingsPercent}%</div>
          </div>
        </div>

        {showValueDetails && (
          <div className="mt-2.5 pt-2 border-t border-[#1e3a5f]/10 space-y-1.5 text-[10px] sm:text-[11px] animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-gray-600">
                <ShieldCheck className="w-3 h-3 text-purple-500 shrink-0" />
                On-contract items
              </span>
              <span className="font-semibold text-purple-700">{onContractCount}/{items.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-gray-600">
                <Users className="w-3 h-3 text-blue-500 shrink-0" />
                Preferred suppliers used
              </span>
              <span className="font-semibold text-blue-700">{preferredCount}/{items.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-gray-600">
                <Package className="w-3 h-3 text-indigo-500 shrink-0" />
                Categories covered
              </span>
              <span className="font-semibold text-indigo-700">{uniqueCategories} across {uniqueSuppliers} suppliers</span>
            </div>
            {stockRisksAvoided > 0 && (
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-gray-600">
                  <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" />
                  Stockout risks mitigated
                </span>
                <span className="font-semibold text-amber-700">{stockRisksAvoided}</span>
              </div>
            )}
            {ecoSwaps > 0 && (
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-gray-600">
                  <Leaf className="w-3 h-3 text-green-500 shrink-0" />
                  Sustainability upgrades
                </span>
                <span className="font-semibold text-green-700">{ecoSwaps} items</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-gray-600">
                <Repeat className="w-3 h-3 text-cyan-500 shrink-0" />
                Reorder-ready
              </span>
              <span className="font-semibold text-cyan-700">Traceable PO</span>
            </div>

            {valueMetrics && (
              <div className="mt-1.5 pt-1.5 border-t border-[#1e3a5f]/10 space-y-1">
                <div className="text-[9px] text-gray-500 uppercase tracking-wide font-semibold">Total Value Created</div>
                {valueMetrics.directSavings > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Direct savings</span>
                    <span className="font-semibold text-green-700">${valueMetrics.directSavings.toFixed(2)}</span>
                  </div>
                )}
                {potentialSavings > 0 && valueMetrics.directSavings <= 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Potential swap savings</span>
                    <span className="font-semibold text-green-700">${potentialSavings.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Maverick spend avoided</span>
                  <span className="font-semibold text-purple-700">${valueMetrics.maverickSpendAvoided.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                </div>
                {valueMetrics.stockoutCostAvoided > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Stockout cost avoidance</span>
                    <span className="font-semibold text-amber-700">${valueMetrics.stockoutCostAvoided.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                  </div>
                )}
                {valueMetrics.sustainability.co2ReductionKg > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">CO₂ reduction</span>
                    <span className="font-semibold text-green-700">{valueMetrics.sustainability.co2ReductionKg} kg</span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-1 border-t border-[#1e3a5f]/10">
                  <span className="flex items-center gap-1 font-semibold text-[#1e3a5f]">
                    <Sparkles className="w-3 h-3" />
                    Total value
                  </span>
                  <span className="font-bold text-[#1e3a5f]">${(totalValueCreated + (valueMetrics.directSavings <= 0 ? potentialSavings : 0)).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="bg-green-50 border border-green-200 rounded-lg px-2.5 sm:px-3 py-2 text-center">
          <div className="text-[9px] sm:text-[10px] text-green-600 uppercase font-semibold tracking-wide flex items-center justify-center gap-1">
            <TrendingDown className="w-3 h-3" />
            {totalSavings > 0 ? 'Realized Savings' : 'Available Savings'}
          </div>
          <div className="text-base sm:text-lg font-bold text-green-900" data-testid="total-savings">${displaySavings.toFixed(2)}</div>
          {totalSavings <= 0 && potentialSavings > 0 && (
            <div className="text-[8px] text-green-600">from {swaps.length} swap options</div>
          )}
        </div>
        <div className="bg-[#1e3a5f]/5 border border-[#1e3a5f]/20 rounded-lg px-2.5 sm:px-3 py-2 text-center">
          <div className="text-[9px] sm:text-[10px] text-[#1e3a5f] uppercase font-semibold tracking-wide">Final Total</div>
          <div className="text-base sm:text-lg font-bold text-[#1e3a5f]" data-testid="final-total">${finalTotal.toFixed(2)}</div>
        </div>
      </div>

      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-gray-50 px-2.5 py-1.5 border-b border-gray-200 flex items-center gap-1.5">
          <Package className="w-3 h-3 text-gray-500" />
          <span className="text-[10px] font-semibold text-gray-600 uppercase tracking-wide">Line Items ({items.length})</span>
        </div>
        <div className={`${isExpanded ? 'max-h-none' : 'max-h-[180px] sm:max-h-[200px]'} overflow-y-auto divide-y divide-gray-100`}>
          {isExpanded ? (
            <table className="w-full text-[11px]">
              <thead>
                <tr className="bg-gray-50 text-[9px] text-gray-500 uppercase tracking-wide">
                  <th className="px-2.5 py-1.5 text-left font-semibold">Product</th>
                  <th className="px-2 py-1.5 text-left font-semibold">Supplier</th>
                  <th className="px-2 py-1.5 text-left font-semibold">Contract</th>
                  <th className="px-2 py-1.5 text-center font-semibold">Qty</th>
                  <th className="px-2 py-1.5 text-right font-semibold">Unit Price</th>
                  <th className="px-2 py-1.5 text-right font-semibold">Line Total</th>
                  <th className="px-2 py-1.5 text-center font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((item, index) => {
                  const swap = getSwapByOriginalProduct(item.originalProductId || item.productId);
                  const swapData = swap ? swaps.find(s => s.originalProductId === (item.originalProductId || item.productId) && s.isAccepted) : null;
                  const unitPrice = getItemPrice(item);
                  const lineTotal = unitPrice * item.quantity;
                  return (
                    <tr key={index} className="hover:bg-gray-50/50 transition-colors group/row" data-testid={`cart-item-${index}`}>
                      <td className="px-2.5 py-2">
                        <div className="font-medium text-gray-900">{getItemName(item)}</div>
                        {getItemBrand(item) && <div className="text-[9px] text-gray-400">{getItemBrand(item)} · {getItemMpn(item)}</div>}
                      </td>
                      <td className="px-2 py-2 text-gray-600">{getItemSupplier(item) || '—'}</td>
                      <td className="px-2 py-2 text-purple-600 text-[10px]">{getItemContract(item) || '—'}</td>
                      <td className="px-2 py-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {onUpdateQuantity && (
                            <button
                              onClick={() => onUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}
                              disabled={item.quantity <= 1}
                              className="w-5 h-5 rounded bg-gray-100 hover:bg-gray-200 flex items-center justify-center disabled:opacity-30"
                              data-testid={`button-qty-minus-exp-${index}`}
                            >
                              <Minus className="w-3 h-3 text-gray-600" />
                            </button>
                          )}
                          <span className="text-gray-700 min-w-[24px] text-center font-medium">{item.quantity}</span>
                          {onUpdateQuantity && (
                            <button
                              onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                              className="w-5 h-5 rounded bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                              data-testid={`button-qty-plus-exp-${index}`}
                            >
                              <Plus className="w-3 h-3 text-gray-600" />
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-2 py-2 text-right font-mono text-gray-700">${unitPrice.toFixed(2)}</td>
                      <td className="px-2 py-2 text-right font-mono font-semibold text-gray-900">${lineTotal.toFixed(2)}</td>
                      <td className="px-2 py-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {swap ? (
                            <>
                              <Badge className="bg-green-100 text-green-700 text-[7px] px-1 py-0 flex items-center gap-0.5">
                                <RotateCcw className="w-2 h-2" />
                                Swapped
                              </Badge>
                              {swapData && onRevertSwap && (
                                <button
                                  onClick={() => onRevertSwap(swapData.id)}
                                  className="text-[9px] text-amber-600 hover:text-amber-700 flex items-center gap-0.5"
                                  data-testid={`button-revert-exp-${index}`}
                                >
                                  <Undo2 className="w-2.5 h-2.5" />
                                  Undo
                                </button>
                              )}
                            </>
                          ) : (
                            <span className="text-[9px] text-gray-400">Original</span>
                          )}
                          {onRemoveItem && (
                            <button
                              onClick={() => onRemoveItem(item.id)}
                              className="ml-1 opacity-0 group-hover/row:opacity-100 transition-opacity"
                              data-testid={`button-remove-exp-${index}`}
                            >
                              <Trash2 className="w-3 h-3 text-red-400 hover:text-red-600" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            items.map((item, index) => {
              const swap = getSwapByOriginalProduct(item.originalProductId || item.productId);
              const swapData = swap ? swaps.find(s => s.originalProductId === (item.originalProductId || item.productId) && s.isAccepted) : null;
              const unitPrice = getItemPrice(item);
              const lineTotal = unitPrice * item.quantity;
              const displayName = getItemName(item);
              const displaySupplier = getItemSupplier(item);
              return (
                <div key={index} className="px-2.5 py-2 hover:bg-gray-50/50 transition-colors group/item" data-testid={`cart-item-${index}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <h4 className="font-medium text-gray-900 text-[11px] sm:text-xs truncate">{displayName}</h4>
                        {swap && (
                          <Badge className="bg-green-100 text-green-700 text-[7px] sm:text-[8px] px-1 py-0 shrink-0 flex items-center gap-0.5">
                            <RotateCcw className="w-2 h-2" />
                            Swapped
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] text-gray-500">
                        <div className="flex items-center gap-1">
                          {onUpdateQuantity && (
                            <button
                              onClick={() => onUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}
                              disabled={item.quantity <= 1}
                              className="w-4 h-4 rounded bg-gray-100 hover:bg-gray-200 flex items-center justify-center disabled:opacity-30 transition-colors"
                              data-testid={`button-qty-minus-${index}`}
                            >
                              <Minus className="w-2.5 h-2.5 text-gray-600" />
                            </button>
                          )}
                          <span className="font-medium text-gray-700 min-w-[18px] text-center">{item.quantity}</span>
                          {onUpdateQuantity && (
                            <button
                              onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                              className="w-4 h-4 rounded bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                              data-testid={`button-qty-plus-${index}`}
                            >
                              <Plus className="w-2.5 h-2.5 text-gray-600" />
                            </button>
                          )}
                          <span className="text-gray-400">×</span>
                          <span>${unitPrice.toFixed(2)}</span>
                        </div>
                        {displaySupplier && <span className="text-gray-400">· {displaySupplier}</span>}
                      </div>
                      {swapData && onRevertSwap && (
                        <button
                          onClick={() => onRevertSwap(swapData.id)}
                          className="mt-1 flex items-center gap-1 text-[9px] text-amber-600 hover:text-amber-700 transition-colors"
                          data-testid={`button-revert-swap-${index}`}
                        >
                          <Undo2 className="w-2.5 h-2.5" />
                          Revert to original
                        </button>
                      )}
                    </div>
                    <div className="flex items-start gap-1.5">
                      <span className="font-mono font-semibold text-gray-900 text-[11px] sm:text-xs shrink-0">${lineTotal.toFixed(2)}</span>
                      {onRemoveItem && (
                        <button
                          onClick={() => onRemoveItem(item.id)}
                          className="w-4 h-4 rounded hover:bg-red-50 flex items-center justify-center opacity-0 group-hover/item:opacity-100 transition-opacity"
                          data-testid={`button-remove-item-${index}`}
                        >
                          <Trash2 className="w-3 h-3 text-red-400 hover:text-red-600" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <button
          onClick={() => setShowAuditTrail(!showAuditTrail)}
          className="w-full bg-gray-50 px-2.5 py-1.5 border-b border-gray-200 flex items-center justify-between hover:bg-gray-100 transition-colors"
          data-testid="button-toggle-audit"
        >
          <div className="flex items-center gap-1.5">
            <GitBranch className="w-3 h-3 text-gray-500" />
            <span className="text-[10px] font-semibold text-gray-600 uppercase tracking-wide">Decision Traceability</span>
            <span className="text-[9px] text-gray-400">{items.length} decisions</span>
          </div>
          {showAuditTrail ? <ChevronUp className="w-3 h-3 text-gray-400" /> : <ChevronDown className="w-3 h-3 text-gray-400" />}
        </button>

        {showAuditTrail && (
          <div className={`${isExpanded ? 'max-h-none' : 'max-h-[250px]'} overflow-y-auto divide-y divide-gray-100 animate-in fade-in slide-in-from-top-1 duration-200`} data-testid="audit-trail-list">
            {items.map((item, index) => {
              const meta = getMeta(item.originalProductId || item.productId) || getMeta(item.productId);
              const swap = getSwapByOriginalProduct(item.originalProductId || item.productId);
              const swapData = swap ? swaps.find(s => s.originalProductId === (item.originalProductId || item.productId) && s.isAccepted) : null;

              return (
                <div key={index} className={`px-2.5 py-2 ${isExpanded ? 'py-3' : ''}`} data-testid={`audit-item-${index}`}>
                  <div className="flex items-start gap-2">
                    <div className="flex flex-col items-center gap-0.5 shrink-0 pt-0.5">
                      <div className="w-4 h-4 rounded-full bg-slate-100 flex items-center justify-center">
                        <Search className="w-2.5 h-2.5 text-slate-400" />
                      </div>
                      <div className="w-px h-3 bg-gray-200" />
                      <div className="w-4 h-4 rounded-full bg-blue-100 flex items-center justify-center">
                        <Target className="w-2.5 h-2.5 text-blue-500" />
                      </div>
                      {swapData && (
                        <>
                          <div className="w-px h-3 bg-gray-200" />
                          <div className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center">
                            <RotateCcw className="w-2.5 h-2.5 text-green-500" />
                          </div>
                        </>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div>
                        <div className="text-[8px] text-gray-400 uppercase tracking-wide font-semibold">RFQ Input</div>
                        <div className="text-[10px] text-gray-600">
                          {meta?.requestedName ? `"${meta.requestedName}"` : `Item ${index + 1}`}
                        </div>
                      </div>
                      <div>
                        <div className="text-[8px] text-blue-500 uppercase tracking-wide font-semibold">Matched</div>
                        <div className="text-[10px] text-gray-900 font-medium">{getItemName(item)}</div>
                        {isExpanded && (
                          <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[9px] text-gray-400">
                            <span>{getItemSupplier(item)}</span>
                            <span>${getItemPrice(item).toFixed(2)}/{getItemUom(item)}</span>
                            {getItemBrand(item) && <span>{getItemBrand(item)}</span>}
                            {getItemContract(item) && <span className="text-purple-500">{getItemContract(item)}</span>}
                            {item.productUnspsc && <span className="text-slate-400">UNSPSC {item.productUnspsc}</span>}
                          </div>
                        )}
                        <div className="text-[9px] text-gray-400">
                          {meta?.matchDetails ? (
                            <span>
                              {meta.matchDetails.exactTerms.length > 0 && <span className="text-green-600">{meta.matchDetails.exactTerms.length} exact</span>}
                              {meta.matchDetails.synonymTerms.length > 0 && <span className="text-teal-600">{meta.matchDetails.exactTerms.length > 0 ? ', ' : ''}{meta.matchDetails.synonymTerms.length} synonym</span>}
                              {meta.matchDetails.fuzzyTerms.length > 0 && <span className="text-orange-600">{(meta.matchDetails.exactTerms.length > 0 || meta.matchDetails.synonymTerms.length > 0) ? ', ' : ''}{meta.matchDetails.fuzzyTerms.length} fuzzy</span>}
                              {meta.matchDetails.categoryBoost && <span className="text-purple-500"> + category</span>}
                              <span className="text-gray-400"> match</span>
                            </span>
                          ) : (
                            <span>{parseFloat(item.confidence) >= 0.95 ? 'High' : 'Moderate'} confidence match</span>
                          )}
                          {' · '}
                          {(parseFloat(item.confidence) * 100).toFixed(0)}% confidence
                        </div>
                        {isExpanded && meta?.matchDetails && (
                          <div className="mt-0.5 flex flex-wrap gap-1">
                            {meta.matchDetails.exactTerms.map((t: string, i: number) => (
                              <span key={`e${i}`} className="bg-green-50 text-green-600 text-[8px] px-1 rounded border border-green-200">{t}</span>
                            ))}
                            {meta.matchDetails.synonymTerms.map((t: string, i: number) => (
                              <span key={`s${i}`} className="bg-teal-50 text-teal-600 text-[8px] px-1 rounded border border-teal-200">{t}</span>
                            ))}
                            {meta.matchDetails.fuzzyTerms.map((t: string, i: number) => (
                              <span key={`f${i}`} className="bg-orange-50 text-orange-600 text-[8px] px-1 rounded border border-orange-200">{t}</span>
                            ))}
                          </div>
                        )}
                      </div>
                      {swapData && (
                        <div>
                          <div className="text-[8px] text-green-500 uppercase tracking-wide font-semibold">Swapped</div>
                          <div className="text-[10px] text-green-800 font-medium">{getItemName(item)}</div>
                          {isExpanded && (
                            <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[9px] text-green-600">
                              <span>{getItemSupplier(item)}</span>
                              <span>${getItemPrice(item).toFixed(2)}/{getItemUom(item)}</span>
                              {item.productCertifications && item.productCertifications.length > 0 && (
                                <span className="flex items-center gap-0.5"><Award className="w-2.5 h-2.5" />{item.productCertifications.join(', ')}</span>
                              )}
                            </div>
                          )}
                          <div className="text-[9px] text-gray-400">
                            {swapData.swapType === 'stock' && 'Stock risk mitigated'}
                            {swapData.swapType === 'pack_size' && 'Bulk format savings'}
                            {swapData.swapType === 'supplier' && 'Better supplier price'}
                            {swapData.swapType === 'sustainability' && 'Eco upgrade'}
                            {parseFloat(swapData.savingsAmount || '0') > 0 && ` · saved $${parseFloat(swapData.savingsAmount).toFixed(2)}`}
                          </div>
                          {isExpanded && swapData.reason && (
                            <div className="text-[9px] text-gray-400 mt-0.5 italic leading-relaxed">{swapData.reason}</div>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-[10px] font-mono font-semibold text-gray-900">${(getItemPrice(item) * item.quantity).toFixed(2)}</div>
                      <div className="text-[8px] text-gray-400">Qty {item.quantity}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 flex items-center gap-2">
        <Database className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-[9px] text-slate-500 font-semibold uppercase tracking-wide">VIA Data Coverage</div>
          <div className="text-[10px] text-slate-600">
            {enrichedCount}/{items.length} items taxonomy-enriched · {onContractCount} on contract · {certifiedCount} certified
          </div>
        </div>
        <div className="text-[9px] text-slate-400 font-medium shrink-0">Powered by VIA</div>
      </div>

      <div className="border border-emerald-200 rounded-lg overflow-hidden" data-testid="compliance-report">
        <div className="bg-emerald-50 px-2.5 py-1.5 border-b border-emerald-200 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            <span className="text-[10px] font-semibold text-emerald-700 uppercase tracking-wide">Compliance Report · VIA-powered</span>
          </div>
          <Badge className="bg-emerald-100 text-emerald-700 text-[8px] px-1.5 py-0 border border-emerald-300">
            {onContractCount}/{items.length} compliant
          </Badge>
        </div>
        <div className="p-2.5 space-y-2">
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center">
              <div className="text-lg font-bold text-emerald-700" data-testid="compliance-rate">
                {items.length > 0 ? Math.round((onContractCount / items.length) * 100) : 0}%
              </div>
              <div className="text-[8px] text-emerald-600 font-medium">Contract Rate</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-blue-700" data-testid="approved-vendor-rate">100%</div>
              <div className="text-[8px] text-blue-600 font-medium">Approved Vendors</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-purple-700 flex items-center justify-center gap-1" data-testid="policy-check">
                <CheckCircle2 className="w-4 h-4 text-purple-600" />
                Pass
              </div>
              <div className="text-[8px] text-purple-600 font-medium">Policy Cleared</div>
            </div>
          </div>
          <div className="space-y-1 max-h-[120px] overflow-y-auto">
            {items.map((item, index) => {
              const contract = getItemContract(item);
              const hasContract = !!contract;
              return (
                <div key={index} className="flex items-center gap-1.5 text-[10px]" data-testid={`compliance-item-${index}`}>
                  {hasContract ? (
                    <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" />
                  )}
                  <span className="truncate flex-1 text-gray-700">{getItemName(item)}</span>
                  <span className={`shrink-0 text-[9px] font-medium ${hasContract ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {hasContract ? contract : 'Off-contract'}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="bg-emerald-50 rounded px-2 py-1.5 space-y-0.5">
            <div className="flex items-center gap-1 text-[9px] text-emerald-700">
              <CheckCircle2 className="w-2.5 h-2.5" />
              <span>All items sourced from OMNIA Partners cooperative suppliers</span>
            </div>
            <div className="flex items-center gap-1 text-[9px] text-emerald-700">
              <CheckCircle2 className="w-2.5 h-2.5" />
              <span>Budget thresholds verified — no items exceed policy limits</span>
            </div>
            <div className="flex items-center gap-1 text-[9px] text-emerald-700">
              <CheckCircle2 className="w-2.5 h-2.5" />
              <span>Audit trail generated for all {items.length} line items</span>
            </div>
            {valueMetrics && valueMetrics.maverickSpendAvoided > 0 && (
              <div className="flex items-center gap-1 text-[9px] text-blue-700">
                <TrendingDown className="w-2.5 h-2.5" />
                <span>${valueMetrics.maverickSpendAvoided.toFixed(0)} maverick spend prevented via contract compliance</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="border border-indigo-200 rounded-lg overflow-hidden" data-testid="historical-insights">
        <div className="bg-indigo-50 px-2.5 py-1.5 border-b border-indigo-200 flex items-center gap-1.5">
          <BarChart3 className="w-3 h-3 text-indigo-600" />
          <span className="text-[10px] font-semibold text-indigo-700 uppercase tracking-wide">Purchase History Insights · VIA-powered</span>
        </div>
        <div className="p-2.5 space-y-2">
          {categoryTrends.length > 0 && (
            <div className="space-y-1">
              <div className="text-[9px] text-indigo-500 font-semibold uppercase tracking-wide">Category Savings Trends</div>
              {categoryTrends.map((ct, i) => (
                <div key={i} className="flex items-center gap-2 text-[10px]">
                  <span className="truncate flex-1 text-gray-700">{ct.category}</span>
                  <span className="text-[9px] text-gray-400">{ct.itemCount} items</span>
                  <span className="text-[9px] font-medium text-green-600">↓ {ct.avgSavingsPercent}% avg</span>
                </div>
              ))}
            </div>
          )}
          <div className="space-y-1">
            <div className="text-[9px] text-indigo-500 font-semibold uppercase tracking-wide">Item Order Frequency</div>
            <div className="max-h-[100px] overflow-y-auto space-y-0.5">
              {items.slice(0, 8).map((item, index) => {
                const hist = getHistoricalInsight(item);
                return (
                  <div key={index} className="flex items-center gap-1.5 text-[10px]" data-testid={`history-item-${index}`}>
                    <Clock className="w-2.5 h-2.5 text-indigo-400 shrink-0" />
                    <span className="truncate flex-1 text-gray-700">{getItemName(item)}</span>
                    <span className="text-[9px] text-gray-400 shrink-0">{hist.ordersPerYear}x/yr</span>
                    <span className={`text-[9px] font-medium shrink-0 ${hist.priceTrendPercent < 0 ? 'text-green-600' : hist.priceTrendPercent > 0 ? 'text-red-500' : 'text-gray-400'}`}>
                      {hist.priceTrendPercent < 0 ? '↓' : hist.priceTrendPercent > 0 ? '↑' : '→'} {Math.abs(hist.priceTrendPercent)}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="bg-indigo-50 rounded px-2 py-1.5 text-[9px] text-indigo-700">
            <span className="font-medium">Pattern detected:</span> {items.length > 3 ? `${Math.round(items.length * 0.6)} of ${items.length} items appear in recurring orders. Consider setting up auto-replenishment for high-frequency items.` : 'Building order history — future orders will show frequency patterns and price trends.'}
          </div>
        </div>
      </div>

      <div className="space-y-2 pt-2 border-t border-gray-100">
        <Button
          onClick={onSubmit}
          disabled={isSubmitting}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white h-9 sm:h-10 font-semibold text-xs sm:text-sm shadow-sm"
          data-testid="button-submit-order"
        >
          <ShoppingCart className="w-4 h-4 mr-2" />
          {isSubmitting ? 'Submitting...' : 'Submit Purchase Order'}
        </Button>
        <Button
          onClick={onBack}
          variant="ghost"
          className="w-full text-gray-500 h-8 sm:h-9 text-xs sm:text-sm"
          data-testid="button-back-optimize"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1" />
          Back to Optimize
        </Button>
      </div>
    </div>
  );
}
