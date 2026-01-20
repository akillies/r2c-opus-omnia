import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Save, ShoppingCart, RotateCcw, Download, FileText, FileSpreadsheet } from "lucide-react";
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

  const getProduct = (productId: string) => {
    return products?.find(p => p.id === productId);
  };

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
      
      return [
        product.name,
        item.quantity,
        product.unitOfMeasure,
        product.supplier,
        product.contract,
        `$${parseFloat(product.unitPrice).toFixed(2)}`,
        `$${lineTotal.toFixed(2)}`,
        swap ? 'Yes' : 'No'
      ];
    }).filter(Boolean);

    rows.push(['', '', '', '', '', '', '', '']);
    rows.push(['', '', '', '', '', 'Subtotal:', `$${finalTotal.toFixed(2)}`, '']);
    if (totalSavings > 0) {
      rows.push(['', '', '', '', '', 'Savings:', `$${totalSavings.toFixed(2)}`, '']);
    }

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row!.map(cell => `"${cell}"`).join(','))
    ].join('\n');

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
      
      return [
        product.name,
        item.quantity.toString(),
        product.unitOfMeasure,
        product.supplier,
        `$${parseFloat(product.unitPrice).toFixed(2)}`,
        `$${lineTotal.toFixed(2)}`,
        swap ? 'Yes' : 'No'
      ];
    }).filter(Boolean);

    autoTable(doc, {
      startY: 62,
      head: [['Product', 'Qty', 'Unit', 'Supplier', 'Unit Price', 'Total', 'Swapped']],
      body: tableData as string[][],
      theme: 'striped',
      headStyles: { 
        fillColor: [30, 58, 138],
        fontSize: 9 
      },
      bodyStyles: { fontSize: 9 },
      columnStyles: {
        0: { cellWidth: 50 },
        4: { halign: 'right' },
        5: { halign: 'right' }
      }
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold mb-2 text-slate-900">
            Review & Finalize Order
          </h2>
          <p className="text-slate-600">
            Your optimized cart is ready. Review and submit to create purchase orders.
          </p>
        </div>
        <div className="flex gap-4">
          <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2 text-center">
            <div className="text-sm text-green-700">Total Savings</div>
            <div className="text-2xl font-bold text-green-900" data-testid="total-savings">
              ${Math.abs(totalSavings).toFixed(2)}
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 text-center">
            <div className="text-sm text-blue-700">Final Total</div>
            <div className="text-2xl font-bold text-blue-900" data-testid="final-total">
              ${finalTotal.toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <div className="bg-slate-50 px-6 py-3 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">Order Summary</h3>
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-600">{items.length} Items</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" data-testid="button-export">
                    <Download className="w-4 h-4 mr-2" />
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
          </div>
        </div>
        
        <div className="divide-y divide-slate-100">
          {items.map((item, index) => {
            const product = getProduct(item.productId);
            const swap = getSwapByOriginalProduct(item.originalProductId || item.productId);
            
            if (!product) return null;

            const lineTotal = parseFloat(product.unitPrice) * item.quantity;

            return (
              <div key={index} className="p-6" data-testid={`cart-item-${index}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold text-slate-900">{product.name}</h4>
                      {swap && (
                        <Badge className="bg-green-100 text-green-700 flex items-center gap-1">
                          <RotateCcw className="w-3 h-3" />
                          Swapped
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-slate-600">
                      {item.quantity} {product.unitOfMeasure} • {product.supplier} • {product.contract}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-semibold text-slate-900">
                      ${lineTotal.toFixed(2)}
                    </div>
                    <div className="text-sm text-slate-500">
                      ${parseFloat(product.unitPrice).toFixed(2)} × {item.quantity}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-slate-50 px-6 py-4 border-t-2 border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-slate-600">Subtotal</div>
              {totalSavings > 0 && (
                <div className="text-xs text-slate-500">
                  Original: ${originalTotal.toFixed(2)} • Saved: ${totalSavings.toFixed(2)}
                </div>
              )}
            </div>
            <div className="text-2xl font-bold text-slate-900" data-testid="cart-subtotal">
              ${finalTotal.toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center pt-4">
        <Button
          onClick={onBack}
          variant="outline"
          className="btn-secondary flex items-center gap-2"
          data-testid="button-back-optimize"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Optimize
        </Button>
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="btn-secondary flex items-center gap-2"
            data-testid="button-save-draft"
          >
            <Save className="w-4 h-4" />
            Save Draft
          </Button>
          <Button
            onClick={onSubmit}
            disabled={isSubmitting}
            className="btn-primary flex items-center gap-2"
            data-testid="button-submit-order"
          >
            <ShoppingCart className="w-4 h-4" />
            {isSubmitting ? 'Submitting...' : 'Submit Order'}
          </Button>
        </div>
      </div>
    </div>
  );
}
