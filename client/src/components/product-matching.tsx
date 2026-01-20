import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, AlertCircle, ArrowLeft, ArrowRight, Search, ArrowUpDown, Filter } from "lucide-react";
import type { Product } from "@shared/schema";

interface ProductMatchingProps {
  items: any[];
  onBack: () => void;
  onNext: () => void;
}

type SortField = 'name' | 'price' | 'confidence' | 'quantity';
type SortOrder = 'asc' | 'desc';

export default function ProductMatching({ items, onBack, onNext }: ProductMatchingProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [supplierFilter, setSupplierFilter] = useState<string>("all");
  const [availabilityFilter, setAvailabilityFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const { data: products } = useQuery<Product[]>({
    queryKey: ['/api/products']
  });

  const getProduct = (productId: string) => {
    return products?.find(p => p.id === productId);
  };

  const suppliers = useMemo(() => {
    const supplierSet = new Set<string>();
    items.forEach(item => {
      const product = getProduct(item.productId);
      if (product?.supplier) {
        supplierSet.add(product.supplier);
      }
    });
    return Array.from(supplierSet);
  }, [items, products]);

  const filteredAndSortedItems = useMemo(() => {
    let result = items.filter(item => {
      const product = getProduct(item.productId);
      if (!product) return false;

      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!product.name.toLowerCase().includes(query) &&
            !product.supplier.toLowerCase().includes(query)) {
          return false;
        }
      }

      if (supplierFilter !== "all" && product.supplier !== supplierFilter) {
        return false;
      }

      if (availabilityFilter !== "all" && product.availability !== availabilityFilter) {
        return false;
      }

      return true;
    });

    result.sort((a, b) => {
      const productA = getProduct(a.productId);
      const productB = getProduct(b.productId);
      if (!productA || !productB) return 0;

      let comparison = 0;
      switch (sortField) {
        case 'name':
          comparison = productA.name.localeCompare(productB.name);
          break;
        case 'price':
          comparison = parseFloat(a.unitPrice) - parseFloat(b.unitPrice);
          break;
        case 'confidence':
          comparison = parseFloat(a.confidence) - parseFloat(b.confidence);
          break;
        case 'quantity':
          comparison = a.quantity - b.quantity;
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [items, products, searchQuery, supplierFilter, availabilityFilter, sortField, sortOrder]);

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

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const getSortIndicator = (field: SortField) => {
    if (sortField !== field) return null;
    return sortOrder === 'asc' ? '↑' : '↓';
  };

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

      <div className="flex flex-wrap gap-4 items-center p-4 bg-slate-50 rounded-lg border border-slate-200">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500" />
          <span className="text-sm font-medium text-slate-700">Filters:</span>
        </div>

        <div className="relative flex-1 min-w-[200px] max-w-[300px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            data-testid="input-search"
          />
        </div>

        <Select value={supplierFilter} onValueChange={setSupplierFilter}>
          <SelectTrigger className="w-[180px]" data-testid="select-supplier">
            <SelectValue placeholder="All Suppliers" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Suppliers</SelectItem>
            {suppliers.map(supplier => (
              <SelectItem key={supplier} value={supplier}>{supplier}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
          <SelectTrigger className="w-[160px]" data-testid="select-availability">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="In Stock">In Stock</SelectItem>
            <SelectItem value="Low Stock">Low Stock</SelectItem>
          </SelectContent>
        </Select>

        {(searchQuery || supplierFilter !== "all" || availabilityFilter !== "all") && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearchQuery("");
              setSupplierFilter("all");
              setAvailabilityFilter("all");
            }}
            className="text-slate-600"
            data-testid="button-clear-filters"
          >
            Clear filters
          </Button>
        )}

        <div className="ml-auto text-sm text-slate-500">
          Showing {filteredAndSortedItems.length} of {items.length} items
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 text-left">
              <th 
                className="pb-3 text-xs font-semibold text-slate-500 uppercase cursor-pointer hover:text-slate-700"
                onClick={() => handleSort('name')}
                data-testid="sort-name"
              >
                <span className="flex items-center gap-1">
                  Item {getSortIndicator('name')}
                  <ArrowUpDown className="w-3 h-3" />
                </span>
              </th>
              <th 
                className="pb-3 text-xs font-semibold text-slate-500 uppercase cursor-pointer hover:text-slate-700"
                onClick={() => handleSort('quantity')}
                data-testid="sort-quantity"
              >
                <span className="flex items-center gap-1">
                  Quantity {getSortIndicator('quantity')}
                  <ArrowUpDown className="w-3 h-3" />
                </span>
              </th>
              <th className="pb-3 text-xs font-semibold text-slate-500 uppercase">Contract</th>
              <th className="pb-3 text-xs font-semibold text-slate-500 uppercase">Supplier</th>
              <th 
                className="pb-3 text-xs font-semibold text-slate-500 uppercase text-right cursor-pointer hover:text-slate-700"
                onClick={() => handleSort('price')}
                data-testid="sort-price"
              >
                <span className="flex items-center gap-1 justify-end">
                  Unit Price {getSortIndicator('price')}
                  <ArrowUpDown className="w-3 h-3" />
                </span>
              </th>
              <th 
                className="pb-3 text-xs font-semibold text-slate-500 uppercase text-center cursor-pointer hover:text-slate-700"
                onClick={() => handleSort('confidence')}
                data-testid="sort-confidence"
              >
                <span className="flex items-center gap-1 justify-center">
                  Confidence {getSortIndicator('confidence')}
                  <ArrowUpDown className="w-3 h-3" />
                </span>
              </th>
              <th className="pb-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredAndSortedItems.map((item, index) => {
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

        {filteredAndSortedItems.length === 0 && (
          <div className="text-center py-8 text-slate-500">
            No items match your filters. Try adjusting your search criteria.
          </div>
        )}
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
