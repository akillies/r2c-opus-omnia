import { useState } from "react";
import { Search, ShoppingCart, User, Menu, ChevronDown, Star, Truck, Shield, Plus, Heart, Bell, HelpCircle, X, Bot, SprayCan, Paintbrush, FileText, Hand, Coffee, Trash2, Lightbulb, Cross, Leaf, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useIsMobile } from "@/hooks/use-mobile";

interface OpusStorefrontProps {
  cartItemCount: number;
  onOpenAssistant: () => void;
  highlightedProducts?: string[];
  isAssistantOpen?: boolean;
}

const featuredProducts = [
  {
    id: "prod-01",
    name: "Heavy-Duty Floor Cleaner Concentrate",
    supplier: "Grainger",
    brand: "Diversey",
    price: "18.50",
    originalPrice: "22.00",
    icon: SprayCan,
    rating: 4.8,
    reviews: 124,
    contract: "OMNIA R-GR-JC-20001",
    inStock: true,
    category: "Janitorial"
  },
  {
    id: "prod-03",
    name: "Microfiber Cleaning Cloths 16x16",
    supplier: "Network Distribution",
    brand: "Rubbermaid",
    price: "24.99",
    icon: Paintbrush,
    rating: 4.6,
    reviews: 89,
    contract: "OMNIA R-ND-JC-20003",
    inStock: true,
    category: "Janitorial"
  },
  {
    id: "prod-13",
    name: "Multi-Purpose Copy Paper 8.5x11 20lb",
    supplier: "ODP Business Solutions",
    brand: "GP Pro",
    price: "42.00",
    icon: FileText,
    rating: 4.9,
    reviews: 312,
    contract: "OMNIA R-OD-OS-20010",
    inStock: true,
    category: "Office"
  },
  {
    id: "prod-23",
    name: "Nitrile Exam Gloves Powder-Free",
    supplier: "Medline",
    brand: "Medline",
    price: "14.99",
    icon: Hand,
    rating: 4.7,
    reviews: 256,
    contract: "OMNIA R-MM-NR-20005",
    inStock: true,
    category: "Safety"
  },
  {
    id: "prod-33",
    name: "Hot Cups 12oz Paper White",
    supplier: "ODP Business Solutions",
    brand: "Dart",
    price: "58.00",
    icon: Coffee,
    rating: 4.4,
    reviews: 67,
    contract: "OMNIA R-OD-BF-20011",
    inStock: true,
    category: "Breakroom"
  },
  {
    id: "prod-09",
    name: "Trash Can Liners 55 Gallon (100ct)",
    supplier: "Global Industrial",
    brand: "Heritage",
    price: "45.00",
    icon: Trash2,
    rating: 4.5,
    reviews: 178,
    contract: "OMNIA R-GI-JC-20004",
    inStock: true,
    isEco: false,
    category: "Janitorial"
  },
  {
    id: "prod-41",
    name: "LED T8 Tube Light 4ft 18W",
    supplier: "Grainger",
    brand: "Philips",
    price: "8.99",
    icon: Lightbulb,
    rating: 4.3,
    reviews: 95,
    contract: "OMNIA R-GR-FM-20008",
    inStock: true,
    isEco: true,
    category: "Facility"
  },
  {
    id: "prod-30",
    name: "First Aid Kit 50-Person ANSI A+",
    supplier: "Safeware",
    brand: "First Aid Only",
    price: "89.99",
    icon: Cross,
    rating: 4.8,
    reviews: 42,
    contract: "OMNIA R-SW-SP-20007",
    inStock: true,
    category: "Safety"
  }
];

const categories = [
  "All Categories",
  "Janitorial & Cleaning",
  "Office Supplies",
  "Safety & PPE",
  "Breakroom & Food Service",
  "Facility Maintenance",
  "Medical & Lab"
];

export default function OpusStorefront({ cartItemCount, onOpenAssistant, highlightedProducts = [], isAssistantOpen }: OpusStorefrontProps) {
  const [hoveredProduct, setHoveredProduct] = useState<string | null>(null);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [addedToCart, setAddedToCart] = useState<string[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isMobile = useIsMobile();

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
        <div className="px-3 sm:px-4 lg:px-6 py-2 sm:py-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-4 lg:gap-6">
              <button
                className="p-1.5 hover:bg-white/10 rounded lg:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                data-testid="button-mobile-menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
              <div className="flex items-center gap-2">
                <div className="text-xl lg:text-2xl font-bold tracking-tight">OPUS</div>
                <div className="text-[10px] opacity-70 hidden sm:block">by OMNIA Partners</div>
              </div>
              <nav className="hidden lg:flex items-center gap-3 ml-4 text-sm">
                <button className="flex items-center gap-1 hover:text-orange-300 transition-colors px-2 py-1 rounded hover:bg-white/10">
                  Browse
                  <ChevronDown className="w-3 h-3" />
                </button>
                <button className="flex items-center gap-1 hover:text-orange-300 transition-colors px-2 py-1 rounded hover:bg-white/10">
                  Contracts
                </button>
                <button className="hover:text-orange-300 transition-colors px-2 py-1 rounded hover:bg-white/10">
                  Suppliers
                </button>
                <button className="hover:text-orange-300 transition-colors px-2 py-1 rounded hover:bg-white/10">
                  Orders
                </button>
              </nav>
            </div>

            <div className="flex-1 max-w-[200px] sm:max-w-md lg:max-w-xl mx-2 sm:mx-4 lg:mx-8">
              <div className="relative">
                <Search className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder={isMobile ? "Search..." : "Search 7.5M+ products, contracts, suppliers..."}
                  className="pl-8 sm:pl-10 pr-4 bg-white/95 text-gray-900 border-0 h-8 sm:h-9 text-sm focus:bg-white"
                  data-testid="input-storefront-search"
                />
              </div>
            </div>

            <div className="flex items-center gap-0.5 sm:gap-1">
              <button className="p-1.5 sm:p-2 hover:bg-white/10 rounded-lg transition-colors hidden sm:block" data-testid="button-notifications">
                <Bell className="w-4 h-4" />
              </button>
              <button className="p-1.5 sm:p-2 hover:bg-white/10 rounded-lg transition-colors hidden sm:block">
                <HelpCircle className="w-4 h-4" />
              </button>
              <button className="relative p-1.5 sm:p-2 hover:bg-white/10 rounded-lg transition-colors" data-testid="button-cart">
                <ShoppingCart className="w-4 h-4" />
                {cartItemCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-orange-500 rounded-full text-[10px] flex items-center justify-center font-bold animate-in zoom-in duration-200">
                    {cartItemCount}
                  </span>
                )}
              </button>
              <button className="p-1.5 sm:p-2 hover:bg-white/10 rounded-lg transition-colors hidden sm:block">
                <User className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-white/10 px-3 py-2 space-y-1 animate-in slide-in-from-top duration-200">
            {['Browse', 'Contracts', 'Suppliers', 'Orders', 'QuickConnect', 'Account'].map(item => (
              <button key={item} className="block w-full text-left px-3 py-2 text-sm hover:bg-white/10 rounded">
                {item}
              </button>
            ))}
          </div>
        )}

        <div className="bg-[#15293f] px-3 sm:px-4 lg:px-6 py-1.5 flex items-center justify-between overflow-x-auto">
          <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 text-xs">
            {categories.map((cat, i) => (
              <button
                key={i}
                className={`whitespace-nowrap transition-colors py-0.5 border-b-2 ${
                  i === 0 
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
        <div className="p-3 sm:p-4 lg:p-6">
          <div className="mb-4 sm:mb-5 bg-gradient-to-r from-[#1e3a5f] via-[#2d5a87] to-[#1e3a5f] rounded-xl p-4 sm:p-5 lg:p-6 text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDE4YzAtOS45NC04LjA2LTE4LTE4LTE4djM2YzkuOTQgMCAxOC04LjA2IDE4LTE4eiIvPjwvZz48L2c+PC9zdmc+')] opacity-50"></div>
            <div className="relative">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                      <Bot className="w-4 h-4" />
                    </div>
                    <h2 className="text-base sm:text-lg lg:text-xl font-bold">Requirements 2 Cart</h2>
                  </div>
                  <p className="text-blue-100 text-xs sm:text-sm mb-2.5 sm:mb-3 max-w-md">
                    Upload your RFQ and let AI match products using VIA-enriched data across cooperative master agreements, find savings, and ensure compliance automatically.
                  </p>
                  <div className="flex items-center gap-2 sm:gap-3 mb-3">
                    <div className="flex items-center gap-1 text-[10px] sm:text-xs text-blue-200">
                      <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                      AI Agent Active
                    </div>
                    <span className="text-blue-400">|</span>
                    <div className="text-[10px] sm:text-xs text-blue-200">Avg. 18% savings per order</div>
                  </div>
                  <Button
                    onClick={onOpenAssistant}
                    className="bg-orange-500 hover:bg-orange-600 text-white shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] active:scale-95 h-8 sm:h-9 text-xs sm:text-sm"
                    data-testid="button-open-assistant"
                  >
                    {isAssistantOpen ? 'Return to Assistant \u2192' : 'Open R2C Assistant \u2192'}
                  </Button>
                </div>
                <div className="flex sm:flex-col items-center gap-3 sm:gap-4 text-xs sm:text-sm text-blue-200">
                  <div className="text-center">
                    <div className="text-lg sm:text-2xl font-bold text-white">7.5M+</div>
                    <div className="text-[10px] sm:text-xs">Products</div>
                  </div>
                  <div className="w-px h-6 sm:h-px sm:w-10 bg-white/20 hidden sm:block"></div>
                  <div className="text-center">
                    <div className="text-lg sm:text-2xl font-bold text-white">630+</div>
                    <div className="text-[10px] sm:text-xs">Suppliers</div>
                  </div>
                  <div className="w-px h-6 sm:h-px sm:w-10 bg-white/20 hidden sm:block"></div>
                  <div className="text-center">
                    <div className="text-lg sm:text-2xl font-bold text-white">120+</div>
                    <div className="text-[10px] sm:text-xs">Categories</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-semibold text-gray-900">Featured Products</h3>
              <Badge className="bg-gray-100 text-gray-600 text-[10px] sm:text-xs">Cooperative Contracts</Badge>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-xs text-gray-500">
              <button className="px-2 py-1 rounded bg-[#1e3a5f] text-white text-xs">Grid</button>
              <button className="px-2 py-1 rounded hover:bg-gray-200 text-xs">List</button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3">
            {featuredProducts.map((product) => {
              const isHighlighted = highlightedProducts.includes(product.id);
              const isHovered = hoveredProduct === product.id;
              const isInCart = addedToCart.includes(product.id);
              const isWishlisted = wishlist.includes(product.id);

              return (
                <div
                  key={product.id}
                  className={`bg-white rounded-lg border p-2 sm:p-3 cursor-pointer transition-all duration-200 relative group ${
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
                      <div className="bg-orange-500 text-white text-[8px] sm:text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-sm animate-in zoom-in duration-300">
                        MATCHED
                      </div>
                    </div>
                  )}

                  <button
                    onClick={(e) => toggleWishlist(product.id, e)}
                    className={`absolute top-1.5 sm:top-2 right-1.5 sm:right-2 p-1 rounded-full transition-all z-10 ${
                      isWishlisted 
                        ? 'text-red-500 bg-red-50' 
                        : isMobile ? 'text-gray-300' : 'text-gray-300 opacity-0 group-hover:opacity-100 hover:text-red-400 hover:bg-red-50'
                    }`}
                    data-testid={`button-wishlist-${product.id}`}
                  >
                    <Heart className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${isWishlisted ? 'fill-current' : ''}`} />
                  </button>

                  <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-3">
                    <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-slate-100 flex items-center justify-center transition-transform duration-200 ${isHovered ? 'scale-110' : ''} self-center sm:self-start shrink-0`}>
                      <product.icon className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-slate-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 text-[11px] sm:text-xs leading-tight line-clamp-2 mb-0.5 sm:mb-1">{product.name}</h4>
                      <p className="text-[10px] text-gray-500">{product.supplier} <span className="text-gray-300">|</span> {product.brand}</p>

                      <div className="flex items-center gap-1 mt-0.5 sm:mt-1">
                        <div className="flex">
                          {[1,2,3,4,5].map(star => (
                            <Star key={star} className={`w-2 h-2 sm:w-2.5 sm:h-2.5 ${star <= Math.round(product.rating) ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-200 text-gray-200'}`} />
                          ))}
                        </div>
                        <span className="text-[9px] sm:text-[10px] text-gray-400">({product.reviews})</span>
                      </div>

                      <div className="mt-1 sm:mt-2 flex items-center justify-between">
                        <div>
                          <span className="text-xs sm:text-sm font-bold text-gray-900">${product.price}</span>
                          {product.originalPrice && (
                            <span className="text-[9px] sm:text-[10px] text-gray-400 line-through ml-1">${product.originalPrice}</span>
                          )}
                        </div>
                      </div>

                      <div className="mt-1 sm:mt-1.5 flex items-center gap-1 text-[9px] sm:text-[10px] flex-wrap">
                        {product.inStock ? (
                          <span className="text-green-600 flex items-center gap-0.5">
                            <Truck className="w-2 h-2 sm:w-2.5 sm:h-2.5" />
                            In Stock
                          </span>
                        ) : (
                          <span className="text-amber-600 font-medium">Low Stock</span>
                        )}
                        <span className="text-gray-300 hidden sm:inline">|</span>
                        <span className="text-gray-500 items-center gap-0.5 hidden sm:flex">
                          <Shield className="w-2.5 h-2.5" />
                          Cooperative
                        </span>
                        {product.isEco && (
                          <>
                            <span className="text-gray-300">|</span>
                            <Leaf className="w-3 h-3 text-green-600" />
                          </>
                        )}
                      </div>

                      <Button
                        size="sm"
                        onClick={(e) => handleAddToCart(product.id, e)}
                        className={`w-full mt-1.5 sm:mt-2 h-6 sm:h-7 text-[10px] sm:text-[11px] transition-all duration-200 ${
                          isInCart 
                            ? 'bg-green-500 hover:bg-green-600 text-white'
                            : isMobile
                              ? 'bg-[#1e3a5f] hover:bg-[#15293f] text-white'
                              : 'bg-[#1e3a5f] hover:bg-[#15293f] text-white opacity-0 group-hover:opacity-100'
                        }`}
                        data-testid={`button-add-cart-${product.id}`}
                      >
                        {isInCart ? (
                          <><Check className="w-3 h-3 mr-1" /> Added</>
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

      {isMobile && !isAssistantOpen && (
        <div className="fixed bottom-4 right-4 z-30">
          <Button
            onClick={onOpenAssistant}
            className="w-14 h-14 rounded-full bg-orange-500 hover:bg-orange-600 text-white shadow-xl hover:shadow-2xl transition-all active:scale-95 p-0"
            data-testid="button-open-assistant-fab"
          >
            <Bot className="w-6 h-6" />
          </Button>
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
        </div>
      )}
    </div>
  );
}
