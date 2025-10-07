import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Save, ShoppingCart, RotateCcw } from "lucide-react";
import type { Product } from "@shared/schema";

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

      {/* Cart Summary */}
      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <div className="bg-slate-50 px-6 py-3 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">Order Summary</h3>
            <span className="text-sm text-slate-600">{items.length} Items</span>
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

        {/* Total */}
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

      {/* Action Buttons */}
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
