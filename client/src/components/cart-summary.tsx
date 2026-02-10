import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ShoppingCart, RotateCcw, Download, FileText, FileSpreadsheet, TrendingDown, Clock, ShieldCheck, Leaf, Zap, AlertTriangle, Users, Award, BarChart3 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { Product } from "@shared/schema";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface CartSummaryProps {
  items: any[];
  swaps: any[];
  onBack: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  elapsedTime?: number;
  orderId?: string;
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

export default function CartSummary({ items, swaps, onBack, onSubmit, isSubmitting, elapsedTime, orderId }: CartSummaryProps) {
  const { data: products } = useQuery<Product[]>({
    queryKey: ['/api/products']
  });

  const { data: valueMetrics } = useQuery<ValueMetrics>({
    queryKey: ['/api/orders', orderId, 'value-metrics'],
    enabled: !!orderId
  });

  const getProduct = (productId: string) => products?.find(p => p.id === productId);

  const getSwapByOriginalProduct = (productId: string) => {
    return swaps.find(swap => swap.originalProductId === productId && swap.isAccepted);
  };

  const calculateTotals = () => {
    let originalTotal = 0;
    let finalTotal = 0;
    
    items.forEach(item => {
      const originalProduct = getProduct(item.originalProductId || item.productId);
      const currentProduct = getProduct(item.productId);
      
      if (originalProduct && currentProduct) {
        originalTotal += parseFloat(originalProduct.unitPrice) * item.quantity;
        finalTotal += parseFloat(currentProduct.unitPrice) * item.quantity;
      }
    });

    const totalSavings = originalTotal - finalTotal;
    return { originalTotal, finalTotal, totalSavings };
  };

  const { originalTotal, finalTotal, totalSavings } = calculateTotals();
  const acceptedSwaps = swaps.filter(s => s.isAccepted).length;
  const ecoSwaps = swaps.filter(s => s.isAccepted && s.swapType === 'sustainability').length;
  const stockRisksAvoided = swaps.filter(s => s.isAccepted && s.swapType === 'stock').length;
  const savingsPercent = originalTotal > 0 ? ((totalSavings / originalTotal) * 100).toFixed(0) : '0';
  const manualEstimateMin = Math.max(15, items.length * 4);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const exportToCSV = () => {
    const headers = ['Product Name', 'Quantity', 'Unit', 'Supplier', 'Contract', 'Unit Price', 'Line Total', 'Swapped'];
    const rows = items.map(item => {
      const product = getProduct(item.productId);
      if (!product) return null;
      const swap = getSwapByOriginalProduct(item.originalProductId || item.productId);
      const lineTotal = parseFloat(product.unitPrice) * item.quantity;
      return [product.name, item.quantity, product.unitOfMeasure, product.supplier, product.contract, `$${parseFloat(product.unitPrice).toFixed(2)}`, `$${lineTotal.toFixed(2)}`, swap ? 'Yes' : 'No'];
    }).filter(Boolean);

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
      const product = getProduct(item.productId);
      if (!product) return null;
      const swap = getSwapByOriginalProduct(item.originalProductId || item.productId);
      const lineTotal = parseFloat(product.unitPrice) * item.quantity;
      return [product.name, item.quantity.toString(), product.unitOfMeasure, product.supplier, `$${parseFloat(product.unitPrice).toFixed(2)}`, `$${lineTotal.toFixed(2)}`, swap ? 'Yes' : 'No'];
    }).filter(Boolean);

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

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-gray-900 mb-0.5 text-sm sm:text-base">Order Summary</h3>
          <p className="text-[10px] sm:text-xs text-gray-500">{items.length} items ready to submit</p>
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
        <div className="flex items-center gap-1.5 mb-1.5">
          <Zap className="w-3.5 h-3.5 text-emerald-600" />
          <span className="text-xs font-semibold text-emerald-800">Agent Impact Summary</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
          <div className="bg-white/80 rounded-lg p-1.5 border border-white">
            <Clock className="w-3.5 h-3.5 mx-auto text-blue-600 mb-0.5" />
            <div className="text-xs font-bold text-gray-900">{elapsedTime ? formatTime(elapsedTime) : '< 5 min'}</div>
            <div className="text-[8px] sm:text-[9px] text-gray-500">vs ~{manualEstimateMin}min manual</div>
          </div>
          <div className="bg-white/80 rounded-lg p-1.5 border border-white">
            <TrendingDown className="w-3.5 h-3.5 mx-auto text-green-600 mb-0.5" />
            <div className="text-xs font-bold text-gray-900">{savingsPercent}%</div>
            <div className="text-[8px] sm:text-[9px] text-gray-500">cost reduction</div>
          </div>
          <div className="bg-white/80 rounded-lg p-1.5 border border-white">
            <ShieldCheck className="w-3.5 h-3.5 mx-auto text-purple-600 mb-0.5" />
            <div className="text-xs font-bold text-gray-900">{valueMetrics?.contractCompliance.rate ?? 100}%</div>
            <div className="text-[8px] sm:text-[9px] text-gray-500">cooperative compliant</div>
          </div>
          <div className="bg-white/80 rounded-lg p-1.5 border border-white">
            <Leaf className="w-3.5 h-3.5 mx-auto text-green-600 mb-0.5" />
            <div className="text-xs font-bold text-gray-900">{ecoSwaps}</div>
            <div className="text-[8px] sm:text-[9px] text-gray-500">eco swaps</div>
          </div>
        </div>
      </div>

      {valueMetrics && (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-2.5">
          <div className="flex items-center gap-1.5 mb-1.5">
            <BarChart3 className="w-3.5 h-3.5 text-indigo-600" />
            <span className="text-xs font-semibold text-indigo-800">Multi-Dimensional Value</span>
          </div>
          <div className="space-y-1.5 text-[10px] sm:text-[11px]">
            {valueMetrics.directSavings > 0 && (
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1 text-gray-700">
                  <TrendingDown className="w-3 h-3 text-green-500" />
                  Direct cost savings
                </span>
                <span className="font-bold text-green-700">${valueMetrics.directSavings.toFixed(2)}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1 text-gray-700">
                <ShieldCheck className="w-3 h-3 text-purple-500" />
                Maverick spend avoided
              </span>
              <span className="font-bold text-purple-700">${valueMetrics.maverickSpendAvoided.toFixed(0)}</span>
            </div>
            {valueMetrics.stockoutCostAvoided > 0 && (
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1 text-gray-700">
                  <AlertTriangle className="w-3 h-3 text-amber-500" />
                  Stockout cost avoidance
                </span>
                <span className="font-bold text-amber-700">${valueMetrics.stockoutCostAvoided.toFixed(0)}</span>
              </div>
            )}
            {valueMetrics.sustainability.co2ReductionKg > 0 && (
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1 text-gray-700">
                  <Leaf className="w-3 h-3 text-green-500" />
                  CO₂ reduction
                </span>
                <span className="font-bold text-green-700">{valueMetrics.sustainability.co2ReductionKg} kg</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1 text-gray-700">
                <Users className="w-3 h-3 text-blue-500" />
                Supplier consolidation
              </span>
              <span className="font-bold text-blue-700">{valueMetrics.spendConsolidation.supplierCount} suppliers / {valueMetrics.spendConsolidation.categoryCount} categories</span>
            </div>
            {valueMetrics.sustainability.certifiedItemCount > 0 && (
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1 text-gray-700">
                  <Award className="w-3 h-3 text-indigo-500" />
                  Certified products
                </span>
                <span className="font-bold text-indigo-700">{valueMetrics.sustainability.certifiedItemCount}/{items.length} items</span>
              </div>
            )}
            <div className="pt-1 mt-1 border-t border-indigo-200 flex items-center justify-between">
              <span className="font-semibold text-indigo-900">Total value created</span>
              <span className="font-bold text-indigo-900 text-xs">${valueMetrics.totalValueCreated.toFixed(0)}</span>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        {totalSavings > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg px-2.5 sm:px-3 py-2 text-center">
            <div className="text-[9px] sm:text-[10px] text-green-600 uppercase font-semibold tracking-wide flex items-center justify-center gap-1">
              <TrendingDown className="w-3 h-3" />
              Savings
            </div>
            <div className="text-base sm:text-lg font-bold text-green-900" data-testid="total-savings">${totalSavings.toFixed(2)}</div>
          </div>
        )}
        <div className={`bg-[#1e3a5f]/5 border border-[#1e3a5f]/20 rounded-lg px-2.5 sm:px-3 py-2 text-center ${totalSavings <= 0 ? 'col-span-2' : ''}`}>
          <div className="text-[9px] sm:text-[10px] text-[#1e3a5f] uppercase font-semibold tracking-wide">Final Total</div>
          <div className="text-base sm:text-lg font-bold text-[#1e3a5f]" data-testid="final-total">${finalTotal.toFixed(2)}</div>
        </div>
      </div>

      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="max-h-[200px] sm:max-h-[220px] overflow-y-auto divide-y divide-gray-100">
          {items.map((item, index) => {
            const product = getProduct(item.productId);
            const swap = getSwapByOriginalProduct(item.originalProductId || item.productId);
            if (!product) return null;
            const lineTotal = parseFloat(product.unitPrice) * item.quantity;

            return (
              <div key={index} className="p-2.5 sm:p-3 hover:bg-gray-50 transition-colors" data-testid={`cart-item-${index}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <h4 className="font-medium text-gray-900 text-[11px] sm:text-sm truncate">{product.name}</h4>
                      {swap && (
                        <Badge className="bg-green-100 text-green-700 text-[8px] sm:text-[10px] px-1 py-0 shrink-0 flex items-center gap-0.5">
                          <RotateCcw className="w-2 h-2 sm:w-2.5 sm:h-2.5" />
                          Swapped
                        </Badge>
                      )}
                    </div>
                    <p className="text-[10px] text-gray-500">
                      {item.quantity} {product.unitOfMeasure} @ ${parseFloat(product.unitPrice).toFixed(2)} — {product.supplier}
                    </p>
                  </div>
                  <span className="font-mono font-semibold text-gray-900 text-[11px] sm:text-sm shrink-0">${lineTotal.toFixed(2)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-2 pt-2 border-t border-gray-100">
        <Button
          onClick={onSubmit}
          disabled={isSubmitting}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white h-9 sm:h-10 font-semibold text-xs sm:text-sm"
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
