import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertCircle, ArrowLeft, ArrowRight } from "lucide-react";
import type { Product } from "@shared/schema";

interface ProductMatchingProps {
  items: any[];
  onBack: () => void;
  onNext: () => void;
}

export default function ProductMatching({ items, onBack, onNext }: ProductMatchingProps) {
  const { data: products } = useQuery<Product[]>({
    queryKey: ['/api/products']
  });

  const getProduct = (productId: string) => {
    return products?.find(p => p.id === productId);
  };

  const getConfidenceIcon = (confidence: string) => {
    const conf = parseFloat(confidence);
    if (conf >= 0.95) {
      return <CheckCircle className="w-4 h-4 text-green-600" />;
    }
    return <AlertCircle className="w-4 h-4 text-amber-600" />;
  };

  const getConfidenceColor = (confidence: string) => {
    const conf = parseFloat(confidence);
    if (conf >= 0.95) return "text-green-700";
    return "text-amber-700";
  };

  const getAvailabilityBadge = (availability: string) => {
    if (availability === "In Stock") {
      return <Badge className="bg-green-100 text-green-700">In Stock</Badge>;
    }
    return <Badge className="bg-amber-100 text-amber-700">Low Stock</Badge>;
  };

  const avgConfidence = items.reduce((acc, item) => {
    return acc + parseFloat(item.confidence || "0");
  }, 0) / items.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold mb-2 text-slate-900">
            Review Detected Items
          </h2>
          <p className="text-slate-600">
            We've matched {items.length} items from your RFQ to contracted products. Verify accuracy before proceeding.
          </p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
          <div className="text-sm text-blue-700">Avg. Confidence</div>
          <div className="text-2xl font-bold text-blue-900">
            {(avgConfidence * 100).toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 text-left">
              <th className="pb-3 text-xs font-semibold text-slate-500 uppercase">Item</th>
              <th className="pb-3 text-xs font-semibold text-slate-500 uppercase">Quantity</th>
              <th className="pb-3 text-xs font-semibold text-slate-500 uppercase">Contract</th>
              <th className="pb-3 text-xs font-semibold text-slate-500 uppercase">Supplier</th>
              <th className="pb-3 text-xs font-semibold text-slate-500 uppercase text-right">Unit Price</th>
              <th className="pb-3 text-xs font-semibold text-slate-500 uppercase text-center">Confidence</th>
              <th className="pb-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item, index) => {
              const product = getProduct(item.productId);
              if (!product) return null;

              return (
                <tr key={index} className="hover:bg-slate-50 transition-colors" data-testid={`product-row-${index}`}>
                  <td className="py-4">
                    <div className="font-semibold text-slate-900">{product.name}</div>
                    <div className="text-sm text-slate-500">{product.unitOfMeasure}</div>
                  </td>
                  <td className="py-4 text-slate-900">{item.quantity}</td>
                  <td className="py-4">
                    <Badge className="bg-purple-100 text-purple-700">
                      {product.contract}
                    </Badge>
                  </td>
                  <td className="py-4 text-slate-900">{product.supplier}</td>
                  <td className="py-4 text-right font-mono text-slate-900">
                    ${parseFloat(item.unitPrice).toFixed(2)}
                  </td>
                  <td className="py-4 text-center">
                    <span className={`inline-flex items-center gap-1 text-sm font-semibold ${getConfidenceColor(item.confidence)}`}>
                      {getConfidenceIcon(item.confidence)}
                      {(parseFloat(item.confidence) * 100).toFixed(0)}%
                    </span>
                  </td>
                  <td className="py-4">
                    {getAvailabilityBadge(product.availability)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-center pt-4 border-t border-slate-200">
        <Button
          onClick={onBack}
          variant="outline"
          className="btn-secondary flex items-center gap-2"
          data-testid="button-back-select"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <Button
          onClick={onNext}
          className="btn-primary flex items-center gap-2"
          data-testid="button-continue-fit"
        >
          Continue to Fit
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
