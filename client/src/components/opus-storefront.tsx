import { Search, ShoppingCart, User, Menu, ChevronDown, Star, Truck, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface OpusStorefrontProps {
  cartItemCount: number;
  onOpenAssistant: () => void;
  highlightedProducts?: string[];
}

const featuredProducts = [
  {
    id: "prod-1",
    name: "Heavy-Duty Floor Cleaner Concentrate",
    supplier: "CleanPro Supply",
    price: "18.50",
    originalPrice: "22.00",
    image: "🧴",
    rating: 4.8,
    reviews: 124,
    contract: "STATE-EDU-ABC",
    inStock: true
  },
  {
    id: "prod-2",
    name: "Microfiber Cleaning Cloths (12-Pack)",
    supplier: "CleanPro Supply",
    price: "2.75",
    image: "🧹",
    rating: 4.6,
    reviews: 89,
    contract: "STATE-EDU-ABC",
    inStock: true
  },
  {
    id: "prod-3",
    name: "Disinfectant Spray Bottles",
    supplier: "Hygiene Plus",
    price: "4.25",
    image: "🧼",
    rating: 4.9,
    reviews: 256,
    contract: "STATE-EDU-ABC",
    inStock: true
  },
  {
    id: "prod-4",
    name: "Industrial Mop Heads",
    supplier: "CleanPro Supply",
    price: "8.50",
    image: "🪣",
    rating: 4.4,
    reviews: 67,
    contract: "STATE-EDU-ABC",
    inStock: false
  },
  {
    id: "prod-5",
    name: "Trash Can Liners 55gal (100ct)",
    supplier: "EcoSupply Co",
    price: "0.45",
    image: "🗑️",
    rating: 4.7,
    reviews: 312,
    contract: "STATE-EDU-ABC",
    inStock: true,
    isEco: true
  },
  {
    id: "prod-6",
    name: "Hand Sanitizer Dispenser",
    supplier: "Hygiene Plus",
    price: "24.99",
    image: "🧴",
    rating: 4.5,
    reviews: 178,
    contract: "STATE-EDU-ABC",
    inStock: true
  }
];

const categories = [
  "All Categories",
  "Cleaning Supplies",
  "Office Supplies",
  "Safety Equipment",
  "IT & Electronics",
  "Furniture",
  "MRO Supplies"
];

export default function OpusStorefront({ cartItemCount, onOpenAssistant, highlightedProducts = [] }: OpusStorefrontProps) {
  return (
    <div className="flex flex-col h-full bg-gray-50">
      <header className="bg-[#1e3a5f] text-white shadow-lg">
        <div className="px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="text-2xl font-bold tracking-tight">OPUS</div>
                <div className="text-xs opacity-80">by OMNIA Partners</div>
              </div>
              <nav className="hidden lg:flex items-center gap-4 ml-8">
                <button className="flex items-center gap-1 text-sm hover:text-blue-200 transition-colors">
                  <Menu className="w-4 h-4" />
                  Browse
                </button>
                <button className="flex items-center gap-1 text-sm hover:text-blue-200 transition-colors">
                  Contracts
                  <ChevronDown className="w-3 h-3" />
                </button>
                <button className="text-sm hover:text-blue-200 transition-colors">
                  Suppliers
                </button>
                <button className="text-sm hover:text-blue-200 transition-colors">
                  QuickConnect
                </button>
              </nav>
            </div>

            <div className="flex-1 max-w-xl mx-8">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search 6+ million products across 300+ suppliers..."
                  className="pl-10 pr-4 bg-white text-gray-900 border-0 h-10"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button className="relative p-2 hover:bg-white/10 rounded-lg transition-colors">
                <ShoppingCart className="w-5 h-5" />
                {cartItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 rounded-full text-xs flex items-center justify-center font-semibold">
                    {cartItemCount}
                  </span>
                )}
              </button>
              <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                <User className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="bg-[#15293f] px-6 py-2">
          <div className="flex items-center gap-4 text-xs">
            {categories.map((cat, i) => (
              <button
                key={i}
                className={`hover:text-blue-200 transition-colors ${i === 1 ? 'text-orange-400 font-semibold' : ''}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-6">
        <div className="mb-6 bg-gradient-to-r from-[#1e3a5f] to-[#2d5a87] rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">Smart Procurement Assistant</h2>
              <p className="text-blue-100 mb-4">
                Upload your RFQ and let AI match products, find savings, and optimize your order
              </p>
              <Button
                onClick={onOpenAssistant}
                className="bg-orange-500 hover:bg-orange-600 text-white"
                data-testid="button-open-assistant"
              >
                Open Requirements Assistant →
              </Button>
            </div>
            <div className="hidden lg:block text-6xl">🤖</div>
          </div>
        </div>

        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Cleaning Supplies</h3>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>650+ contracts</span>
            <span>•</span>
            <span>300+ suppliers</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {featuredProducts.map((product) => (
            <div
              key={product.id}
              className={`bg-white rounded-lg border p-4 hover:shadow-lg transition-all cursor-pointer ${
                highlightedProducts.includes(product.id) ? 'ring-2 ring-orange-500 ring-offset-2' : 'border-gray-200'
              }`}
              data-testid={`storefront-product-${product.id}`}
            >
              <div className="flex items-start gap-4">
                <div className="text-4xl">{product.image}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-medium text-gray-900 text-sm line-clamp-2">{product.name}</h4>
                    {product.isEco && (
                      <Badge className="bg-green-100 text-green-700 text-xs shrink-0">Eco</Badge>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{product.supplier}</p>

                  <div className="flex items-center gap-1 mt-2">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    <span className="text-xs text-gray-600">{product.rating}</span>
                    <span className="text-xs text-gray-400">({product.reviews})</span>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <div>
                      <span className="text-lg font-bold text-gray-900">${product.price}</span>
                      {product.originalPrice && (
                        <span className="text-xs text-gray-400 line-through ml-2">${product.originalPrice}</span>
                      )}
                    </div>
                    <Badge className="bg-purple-100 text-purple-700 text-xs">
                      {product.contract}
                    </Badge>
                  </div>

                  <div className="mt-2 flex items-center gap-2 text-xs">
                    {product.inStock ? (
                      <span className="text-green-600 flex items-center gap-1">
                        <Truck className="w-3 h-3" />
                        In Stock
                      </span>
                    ) : (
                      <span className="text-amber-600">Low Stock</span>
                    )}
                    <span className="text-gray-400">•</span>
                    <span className="text-gray-500 flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      Compliant
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
