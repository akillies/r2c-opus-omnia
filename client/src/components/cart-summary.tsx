import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ShoppingCart, RotateCcw, Download, FileText, FileSpreadsheet, TrendingDown } from "lucide-react";
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
}

export default function CartSummary({ items, swaps, onBack, onSubmit, isSubmitting }: CartSummaryProps) {
  const { data: products } = useQuery<Product[]>({
    queryKey: ['/api/products']
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
    doc.text('by Omnia Partners', 14, 26);
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-gray-900 mb-1">Order Summary</h3>
          <p className="text-xs text-gray-500">{items.length} items ready to submit</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-7 text-xs" data-testid="button-export">
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

      <div className="grid grid-cols-2 gap-2">
        {totalSavings > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-center">
            <div className="text-[10px] text-green-600 uppercase font-semibold tracking-wide flex items-center justify-center gap-1">
              <TrendingDown className="w-3 h-3" />
              Savings
            </div>
            <div className="text-lg font-bold text-green-900" data-testid="total-savings">${totalSavings.toFixed(2)}</div>
          </div>
        )}
        <div className={`bg-[#1e3a5f]/5 border border-[#1e3a5f]/20 rounded-lg px-3 py-2 text-center ${totalSavings <= 0 ? 'col-span-2' : ''}`}>
          <div className="text-[10px] text-[#1e3a5f] uppercase font-semibold tracking-wide">Final Total</div>
          <div className="text-lg font-bold text-[#1e3a5f]" data-testid="final-total">${finalTotal.toFixed(2)}</div>
        </div>
      </div>

      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="max-h-[280px] overflow-y-auto divide-y divide-gray-100">
          {items.map((item, index) => {
            const product = getProduct(item.productId);
            const swap = getSwapByOriginalProduct(item.originalProductId || item.productId);
            if (!product) return null;
            const lineTotal = parseFloat(product.unitPrice) * item.quantity;

            return (
              <div key={index} className="p-3 hover:bg-gray-50 transition-colors" data-testid={`cart-item-${index}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <h4 className="font-medium text-gray-900 text-sm truncate">{product.name}</h4>
                      {swap && (
                        <Badge className="bg-green-100 text-green-700 text-[10px] px-1 py-0 shrink-0 flex items-center gap-0.5">
                          <RotateCcw className="w-2.5 h-2.5" />
                          Swapped
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      {item.quantity} {product.unitOfMeasure} @ ${parseFloat(product.unitPrice).toFixed(2)}
                    </p>
                  </div>
                  <span className="font-mono font-semibold text-gray-900 text-sm shrink-0">${lineTotal.toFixed(2)}</span>
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
          className="w-full bg-orange-500 hover:bg-orange-600 text-white h-10 font-semibold"
          data-testid="button-submit-order"
        >
          <ShoppingCart className="w-4 h-4 mr-2" />
          {isSubmitting ? 'Submitting...' : 'Submit Purchase Order'}
        </Button>
        <Button
          onClick={onBack}
          variant="ghost"
          className="w-full text-gray-500 h-9 text-sm"
          data-testid="button-back-optimize"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Optimize
        </Button>
      </div>
    </div>
  );
}
