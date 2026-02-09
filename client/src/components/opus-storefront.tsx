import { useState } from "react";
import { Search, ShoppingCart, User, Menu, ChevronDown, Star, Truck, Shield, Plus, Heart, Bell, HelpCircle } from "lucide-react";
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
    inStock: true,
    category: "Cleaning"
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
    inStock: true,
    category: "Cleaning"
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
    inStock: true,
    category: "Sanitization"
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
    inStock: false,
    category: "Cleaning"
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
    isEco: true,
    category: "Waste Mgmt"
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
    inStock: true,
    category: "Sanitization"
  },
  {
    id: "prod-7",
    name: "Anti-Bacterial Wipes (200ct)",
    supplier: "Hygiene Plus",
    price: "12.99",
    image: "🧻",
    rating: 4.3,
    reviews: 95,
    contract: "STATE-EDU-ABC",
    inStock: true,
    category: "Sanitization"
  },
  {
    id: "prod-8",
    name: "Vacuum Bags Universal (10pk)",
    supplier: "CleanPro Supply",
    price: "6.75",
    image: "🫧",
    rating: 4.1,
    reviews: 42,
    contract: "STATE-EDU-ABC",
    inStock: true,
    category: "Cleaning"
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
  const [hoveredProduct, setHoveredProduct] = useState<string | null>(null);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [addedToCart, setAddedToCart] = useState<string[]>([]);

  const toggleWishlist = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setWishlist(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleAddToCart = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!addedToCart.includes(id)) {
      setAddedToCart(prev => [...prev, id]);
      setTimeout(() => setAddedToCart(prev => prev.filter(x => x !== id)), 2000);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <header className="bg-[#1e3a5f] text-white shadow-lg shrink-0">
        <div className="px-4 lg:px-6 py-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 lg:gap-6">
              <div className="flex items-center gap-2">
                <div className="text-xl lg:text-2xl font-bold tracking-tight">OPUS</div>
                <div className="text-[10px] opacity-70 hidden sm:block">by OMNIA Partners</div>
              </div>
              <nav className="hidden lg:flex items-center gap-3 ml-4 text-sm">
                <button className="flex items-center gap-1 hover:text-orange-300 transition-colors px-2 py-1 rounded hover:bg-white/10">
                  <Menu className="w-3.5 h-3.5" />
                  Browse
                </button>
                <button className="flex items-center gap-1 hover:text-orange-300 transition-colors px-2 py-1 rounded hover:bg-white/10">
                  Contracts
                  <ChevronDown className="w-3 h-3" />
                </button>
                <button className="hover:text-orange-300 transition-colors px-2 py-1 rounded hover:bg-white/10">
                  Suppliers
                </button>
                <button className="hover:text-orange-300 transition-colors px-2 py-1 rounded hover:bg-white/10">
                  Orders
                </button>
              </nav>
            </div>

            <div className="flex-1 max-w-md lg:max-w-xl mx-4 lg:mx-8">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search products, contracts, suppliers..."
                  className="pl-10 pr-4 bg-white/95 text-gray-900 border-0 h-9 text-sm focus:bg-white"
                  data-testid="input-storefront-search"
                />
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button className="p-2 hover:bg-white/10 rounded-lg transition-colors hidden sm:block" data-testid="button-notifications">
                <Bell className="w-4 h-4" />
              </button>
              <button className="p-2 hover:bg-white/10 rounded-lg transition-colors hidden sm:block">
                <HelpCircle className="w-4 h-4" />
              </button>
              <button className="relative p-2 hover:bg-white/10 rounded-lg transition-colors" data-testid="button-cart">
                <ShoppingCart className="w-4 h-4" />
                {cartItemCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-orange-500 rounded-full text-[10px] flex items-center justify-center font-bold animate-in zoom-in duration-200">
                    {cartItemCount}
                  </span>
                )}
              </button>
              <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                <User className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="bg-[#15293f] px-4 lg:px-6 py-1.5 flex items-center justify-between">
          <div className="flex items-center gap-3 lg:gap-4 text-xs overflow-x-auto">
            {categories.map((cat, i) => (
              <button
                key={i}
                className={`whitespace-nowrap transition-colors py-0.5 border-b-2 ${
                  i === 1 
                    ? 'text-orange-400 font-semibold border-orange-400' 
                    : 'hover:text-blue-200 border-transparent hover:border-blue-300'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-auto">
        <div className="p-4 lg:p-6">
          <div className="mb-5 bg-gradient-to-r from-[#1e3a5f] via-[#2d5a87] to-[#1e3a5f] rounded-xl p-5 lg:p-6 text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDE4YzAtOS45NC04LjA2LTE4LTE4LTE4djM2YzkuOTQgMCAxOC04LjA2IDE4LTE4eiIvPjwvZz48L2c+PC9zdmc+')] opacity-50"></div>
            <div className="relative flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                    <span className="text-lg">🤖</span>
                  </div>
                  <h2 className="text-lg lg:text-xl font-bold">Requirements 2 Cart</h2>
                </div>
                <p className="text-blue-100 text-sm mb-3 max-w-md">
                  Upload your RFQ and let AI match products, find savings, and optimize your order automatically.
                </p>
                <Button
                  onClick={onOpenAssistant}
                  className="bg-orange-500 hover:bg-orange-600 text-white shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] active:scale-95 h-9 text-sm"
                  data-testid="button-open-assistant"
                >
                  Open Assistant →
                </Button>
              </div>
              <div className="hidden lg:flex items-center gap-4 text-sm text-blue-200">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">6M+</div>
                  <div className="text-xs">Products</div>
                </div>
                <div className="w-px h-10 bg-white/20"></div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">300+</div>
                  <div className="text-xs">Suppliers</div>
                </div>
                <div className="w-px h-10 bg-white/20"></div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">650+</div>
                  <div className="text-xs">Contracts</div>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-gray-900">Cleaning Supplies</h3>
              <Badge className="bg-gray-100 text-gray-600 text-xs">{featuredProducts.length} products</Badge>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <button className="px-2 py-1 rounded bg-[#1e3a5f] text-white text-xs">Grid</button>
              <button className="px-2 py-1 rounded hover:bg-gray-200 text-xs">List</button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {featuredProducts.map((product) => {
              const isHighlighted = highlightedProducts.includes(product.id);
              const isHovered = hoveredProduct === product.id;
              const isInCart = addedToCart.includes(product.id);
              const isWishlisted = wishlist.includes(product.id);

              return (
                <div
                  key={product.id}
                  className={`bg-white rounded-lg border p-3 cursor-pointer transition-all duration-200 relative group ${
                    isHighlighted 
                      ? 'ring-2 ring-orange-500 ring-offset-1 border-orange-300 shadow-md shadow-orange-100' 
                      : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
                  }`}
                  onMouseEnter={() => setHoveredProduct(product.id)}
                  onMouseLeave={() => setHoveredProduct(null)}
                  data-testid={`storefront-product-${product.id}`}
                >
                  {isHighlighted && (
                    <div className="absolute -top-2 -right-2 z-10">
                      <div className="bg-orange-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-sm animate-in zoom-in duration-300">
                        MATCHED
                      </div>
                    </div>
                  )}

                  <button
                    onClick={(e) => toggleWishlist(product.id, e)}
                    className={`absolute top-2 right-2 p-1 rounded-full transition-all z-10 ${
                      isWishlisted 
                        ? 'text-red-500 bg-red-50' 
                        : 'text-gray-300 opacity-0 group-hover:opacity-100 hover:text-red-400 hover:bg-red-50'
                    }`}
                    data-testid={`button-wishlist-${product.id}`}
                  >
                    <Heart className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-current' : ''}`} />
                  </button>

                  <div className="flex items-start gap-3">
                    <div className={`text-3xl transition-transform duration-200 ${isHovered ? 'scale-110' : ''}`}>
                      {product.image}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 text-xs leading-tight line-clamp-2 mb-1">{product.name}</h4>
                      <p className="text-[10px] text-gray-500">{product.supplier}</p>

                      <div className="flex items-center gap-1 mt-1">
                        <div className="flex">
                          {[1,2,3,4,5].map(star => (
                            <Star key={star} className={`w-2.5 h-2.5 ${star <= Math.round(product.rating) ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-200 text-gray-200'}`} />
                          ))}
                        </div>
                        <span className="text-[10px] text-gray-400">({product.reviews})</span>
                      </div>

                      <div className="mt-2 flex items-center justify-between">
                        <div>
                          <span className="text-sm font-bold text-gray-900">${product.price}</span>
                          {product.originalPrice && (
                            <span className="text-[10px] text-gray-400 line-through ml-1">${product.originalPrice}</span>
                          )}
                        </div>
                      </div>

                      <div className="mt-1.5 flex items-center gap-1 text-[10px] flex-wrap">
                        {product.inStock ? (
                          <span className="text-green-600 flex items-center gap-0.5">
                            <Truck className="w-2.5 h-2.5" />
                            In Stock
                          </span>
                        ) : (
                          <span className="text-amber-600 font-medium">Low Stock</span>
                        )}
                        <span className="text-gray-300">|</span>
                        <span className="text-gray-500 flex items-center gap-0.5">
                          <Shield className="w-2.5 h-2.5" />
                          Compliant
                        </span>
                        {product.isEco && (
                          <>
                            <span className="text-gray-300">|</span>
                            <span className="text-green-600 font-medium">🌱 Eco</span>
                          </>
                        )}
                      </div>

                      <Button
                        size="sm"
                        onClick={(e) => handleAddToCart(product.id, e)}
                        className={`w-full mt-2 h-7 text-[11px] transition-all duration-200 ${
                          isInCart 
                            ? 'bg-green-500 hover:bg-green-600 text-white'
                            : 'bg-[#1e3a5f] hover:bg-[#15293f] text-white opacity-0 group-hover:opacity-100'
                        }`}
                        data-testid={`button-add-cart-${product.id}`}
                      >
                        {isInCart ? (
                          <>✓ Added</>
                        ) : (
                          <><Plus className="w-3 h-3 mr-1" /> Add to Cart</>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
