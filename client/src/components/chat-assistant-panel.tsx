import { useState, useEffect, useRef } from "react";
import { X, Minimize2, Maximize2, Bot, Sparkles, MessageSquare, ChevronLeft, Clock, TrendingDown, ShieldCheck, Leaf, Expand, Shrink, FileUp, Search, Zap, Check, CircleCheck, Send, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import FileUpload from "./file-upload";
import ProductMatching from "./product-matching";
import SmartSwaps from "./smart-swaps";
import CartSummary from "./cart-summary";
import ComparisonDrawer from "./comparison-drawer";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CheckCircle2 } from "lucide-react";

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatAssistantPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onCartUpdate: (count: number) => void;
  onHighlightProducts: (productIds: string[]) => void;
  isMobile?: boolean;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

interface MatchDetails {
  exactTerms: string[];
  fuzzyTerms: string[];
  synonymTerms: string[];
  categoryBoost: boolean;
}

interface MatchedItemMeta {
  productId: string;
  requestedName: string;
  matchDetails: MatchDetails;
}

interface OrderData {
  order: any;
  items: any[];
  swaps?: any[];
}

export default function ChatAssistantPanel({ isOpen, onClose, onCartUpdate, onHighlightProducts, isMobile = false, isExpanded = false, onToggleExpand }: ChatAssistantPanelProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedSwap, setSelectedSwap] = useState<any>(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [matchMeta, setMatchMeta] = useState<MatchedItemMeta[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (startTime) {
      const interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [startTime]);

  const { data: orderData, refetch: refetchOrder, isLoading: isOrderLoading } = useQuery<OrderData>({
    queryKey: ['/api/orders', orderId],
    enabled: !!orderId,
    staleTime: 0,
  });

  const createOrderMutation = useMutation({
    mutationFn: async ({ fileName, matchedItems }: { fileName: string; matchedItems?: any[] }) => {
      if (matchedItems) {
        const meta: MatchedItemMeta[] = matchedItems
          .filter((m: any) => m.matchedProduct)
          .map((m: any) => ({
            productId: m.matchedProduct.id,
            requestedName: m.requestedItem?.name || "",
            matchDetails: m.matchDetails || { exactTerms: [], fuzzyTerms: [], synonymTerms: [], categoryBoost: false },
          }));
        setMatchMeta(meta);
      } else {
        setMatchMeta(getDemoMatchMeta());
      }
      const response = await apiRequest("POST", "/api/orders", {
        fileName,
        matchedItems,
        status: "processing"
      });
      return await response.json();
    },
    onSuccess: (data) => {
      setOrderId(data.order.id);
      onCartUpdate(data.items?.length || 0);
      const productIds = data.items?.map((item: any) => item.productId) || [];
      onHighlightProducts(productIds);
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
    },
    onError: () => {
      toast({
        title: "Upload Failed",
        description: "Failed to process the uploaded file. Please try again.",
        variant: "destructive"
      });
    }
  });

  const acceptSwapMutation = useMutation({
    mutationFn: async ({ swapId }: { swapId: string }) => {
      const response = await apiRequest("POST", `/api/orders/${orderId}/swaps/${swapId}/accept`);
      return await response.json();
    },
    onSuccess: () => {
      refetchOrder();
      toast({
        title: "Swap Accepted",
        description: "The product swap has been applied to your order."
      });
    }
  });

  const rejectSwapMutation = useMutation({
    mutationFn: async ({ swapId }: { swapId: string }) => {
      const response = await apiRequest("POST", `/api/orders/${orderId}/swaps/${swapId}/reject`);
      return await response.json();
    },
    onSuccess: () => {
      refetchOrder();
      toast({ title: "Swap Declined", description: "The recommendation has been declined." });
    }
  });

  const revertSwapMutation = useMutation({
    mutationFn: async ({ swapId }: { swapId: string }) => {
      const response = await apiRequest("POST", `/api/orders/${orderId}/swaps/${swapId}/revert`);
      return await response.json();
    },
    onSuccess: () => {
      refetchOrder();
      toast({ title: "Swap Reverted", description: "The item has been reverted to the original product." });
    }
  });

  const updateQuantityMutation = useMutation({
    mutationFn: async ({ itemId, quantity }: { itemId: string; quantity: number }) => {
      const response = await apiRequest("PATCH", `/api/orders/${orderId}/items/${itemId}`, { quantity });
      return await response.json();
    },
    onSuccess: () => {
      refetchOrder();
    }
  });

  const removeItemMutation = useMutation({
    mutationFn: async ({ itemId }: { itemId: string }) => {
      const response = await apiRequest("DELETE", `/api/orders/${orderId}/items/${itemId}`);
      return await response.json();
    },
    onSuccess: () => {
      refetchOrder();
      toast({ title: "Item Removed", description: "The item has been removed from your order." });
    }
  });

  const selectAlternativeMutation = useMutation({
    mutationFn: async ({ swapId, alternativeProductId }: { swapId: string; alternativeProductId: string }) => {
      const response = await apiRequest("POST", `/api/orders/${orderId}/swaps/${swapId}/select-alternative`, { alternativeProductId });
      return await response.json();
    },
    onSuccess: () => {
      refetchOrder();
      toast({ title: "Alternative Selected", description: "Your chosen product has been applied to the order." });
    }
  });

  const submitOrderMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/orders/${orderId}/submit`);
      return await response.json();
    },
    onSuccess: (data) => {
      setOrderNumber(data.orderNumber);
      setIsSuccessModalOpen(true);
    }
  });

  const handleFileUpload = (fileName: string, matchedItems?: any[]) => {
    if (!startTime) setStartTime(Date.now());
    createOrderMutation.mutate({ fileName, matchedItems });
  };

  const handleAcceptSwap = (swapId: string) => {
    acceptSwapMutation.mutate({ swapId });
  };

  const handleRejectSwap = (swapId: string) => {
    rejectSwapMutation.mutate({ swapId });
  };

  const handleRevertSwap = (swapId: string) => {
    revertSwapMutation.mutate({ swapId });
  };

  const handleUpdateQuantity = (itemId: string, quantity: number) => {
    updateQuantityMutation.mutate({ itemId, quantity });
  };

  const handleRemoveItem = (itemId: string) => {
    removeItemMutation.mutate({ itemId });
  };

  const handleSelectAlternative = (swapId: string, alternativeProductId: string) => {
    selectAlternativeMutation.mutate({ swapId, alternativeProductId });
  };

  const handleOpenComparison = (swap: any) => {
    setSelectedSwap(swap);
    setIsDrawerOpen(true);
  };

  const handleSubmitOrder = () => {
    submitOrderMutation.mutate();
  };

  const handleNewOrder = () => {
    setCurrentStep(0);
    setOrderId(null);
    setIsSuccessModalOpen(false);
    setOrderNumber("");
    setStartTime(null);
    setElapsedTime(0);
    setMatchMeta([]);
    setChatMessages([]);
    setChatInput("");
    onCartUpdate(0);
    onHighlightProducts([]);
    queryClient.clear();
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const generateResponse = (userMessage: string): string => {
    const msg = userMessage.toLowerCase();
    const itemCount = orderData?.items?.length || 0;
    const swapCount = orderData?.swaps?.length || 0;
    const acceptedCount = orderData?.swaps?.filter((s: any) => s.isAccepted).length || 0;

    if (msg.includes('how many') && (msg.includes('item') || msg.includes('product'))) {
      return `Your current order has ${itemCount} line items matched from the uploaded RFQ, sourced across ${new Set(orderData?.items?.map((i: any) => i.productId).filter(Boolean)).size} unique products from cooperative suppliers.`;
    }
    if (msg.includes('swap') || msg.includes('recommendation') || msg.includes('optimization')) {
      if (currentStep < 2) return `I've identified swap opportunities for your order. Move to the Optimize step to review ${swapCount} recommendations covering stock risks, bulk savings, and sustainability upgrades.`;
      return `There are ${swapCount} swap recommendations for this order. ${acceptedCount} have been accepted so far. These include stock risk mitigations, bulk format savings, supplier alternatives, and sustainability upgrades.`;
    }
    if (msg.includes('saving') || msg.includes('cost') || msg.includes('price') || msg.includes('total') || msg.includes('amount')) {
      if (!orderData) return `Upload an RFQ first and I'll calculate your optimized totals with savings from cooperative pricing, bulk formats, and supplier alternatives.`;
      let total = 0;
      orderData.items?.forEach((item: any) => { total += parseFloat(item.unitPrice || "0") * item.quantity; });
      return `Your current order total is $${total.toFixed(2)} across ${itemCount} items. ${acceptedCount > 0 ? `With ${acceptedCount} optimizations applied, you're saving through cooperative contract pricing, bulk formats, and smarter supplier selection.` : 'Review swap recommendations in the Optimize step to find potential savings.'}`;
    }
    if (msg.includes('supplier') || msg.includes('vendor')) {
      const suppliers = new Set(orderData?.items?.map((i: any) => i.productId).filter(Boolean));
      return `Your order spans products from multiple cooperative suppliers across the OPUS network. All items are sourced under OMNIA Partners master agreements from 630+ approved suppliers, ensuring competitive pricing and compliance.`;
    }
    if (msg.includes('compliance') || msg.includes('contract') || msg.includes('compliant')) {
      return `All items in your order are verified against OMNIA Partners cooperative master agreements. R2C automatically ensures contract compliance, approved vendor lists, and regulatory requirements are met for every line item.`;
    }
    if (msg.includes('sustainability') || msg.includes('eco') || msg.includes('green') || msg.includes('carbon')) {
      return `R2C evaluates sustainability across every product — tracking certifications (Green Seal, EPA Safer Choice), CO₂ per unit, and recycled content. Eco swap recommendations are available in the Optimize step to advance your green purchasing goals.`;
    }
    if (msg.includes('export') || msg.includes('download') || msg.includes('pdf') || msg.includes('csv')) {
      return `You can export your finalized order as PDF or CSV from the Finalize step. The export includes all line items, suppliers, contract references, quantities, and pricing — ready for your procurement system or approval workflow.`;
    }
    if (msg.includes('help') || msg.includes('what can you do') || msg.includes('how does')) {
      return `I'm your R2C procurement agent. I can:\n• Parse RFQ documents (CSV/Excel) and match items to our catalog\n• Accept natural language requests (e.g. "I need 10 copy paper and 5 pens")\n• Find cost-saving swap recommendations\n• Verify contract compliance across all items\n• Track sustainability metrics and certifications\n• Generate purchase orders with full audit trails\n\nUpload an RFQ, type your items below, or ask me about your current order.`;
    }
    if (msg.includes('status') || msg.includes('where') || msg.includes('step')) {
      const stepNames = ['Upload', 'Match', 'Optimize', 'Finalize'];
      return `You're currently on the ${stepNames[currentStep]} step (${currentStep + 1} of 4).${currentStep === 0 ? ' Upload an RFQ document or try the demo to get started.' : currentStep === 1 ? ' Review matched products and continue to optimization.' : currentStep === 2 ? ' Review and accept swap recommendations, then finalize.' : ' Review your optimized order and submit the purchase order.'}`;
    }
    if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey')) {
      return `Hello! I'm your R2C procurement agent, powered by VIA-enriched data. ${orderId ? `I see you have an active order with ${itemCount} items. How can I help?` : 'Upload an RFQ document and I\'ll match products, find savings, and prepare an optimized purchase order for you.'}`;
    }
    if (orderId) {
      return `I understand you're asking about "${userMessage}". Based on your current order with ${itemCount} items, I can help with pricing details, swap recommendations, compliance verification, sustainability metrics, or export options. What would you like to know more about?`;
    }
    return `I'm ready to help with your procurement needs. Upload an RFQ document to get started, or ask me about cooperative suppliers, compliance, sustainability, or how R2C works.`;
  };

  const isNaturalLanguageRFQ = (text: string): boolean => {
    const msg = text.toLowerCase();
    const hasQuantity = /\d+\s+(of\s+)?[a-z]/i.test(text) || /[a-z]+\s*[x×]\s*\d+/i.test(text);
    const hasProcurementTerms = /(need|order|buy|purchase|get|want|request|require)/i.test(msg);
    const hasProductTerms = /(paper|pen|tape|gloves|sanitizer|towel|soap|cleaner|wipes|markers|folders|binder|stapl|clip|envelop|label|battery|light|bulb|bag|box|tissue|cup|plate|napkin)/i.test(msg);
    return hasQuantity && (hasProcurementTerms || hasProductTerms);
  };

  const handleNaturalLanguageOrder = async (text: string) => {
    try {
      const response = await fetch('/api/parse-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });

      if (!response.ok) {
        const err = await response.json();
        return err.message || 'Could not parse your request';
      }

      const result = await response.json();
      if (result.matchedItems && result.matchedItems.length > 0) {
        setStartTime(Date.now());
        createOrderMutation.mutate({ fileName: 'text-input', matchedItems: result.matchedItems });
        setCurrentStep(1);
        return `Got it! I found ${result.matchedItems.length} item${result.matchedItems.length > 1 ? 's' : ''} from your request and matched them to our catalog. ${result.parseStats?.duplicatesFound > 0 ? `(${result.parseStats.duplicatesFound} duplicates consolidated.) ` : ''}Review the matches and continue when ready.`;
      }
      return 'I could not identify specific items from your text. Try listing items with quantities, like "10 copy paper, 5 ballpoint pens, 3 hand sanitizer."';
    } catch {
      return 'Something went wrong processing your request. Please try uploading a file instead.';
    }
  };

  const handleChatSubmit = () => {
    const message = chatInput.trim();
    if (!message) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: new Date()
    };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput("");
    setIsTyping(true);

    if (currentStep === 0 && !orderId && isNaturalLanguageRFQ(message)) {
      handleNaturalLanguageOrder(message).then(response => {
        const assistantMsg: ChatMessage = {
          id: `msg-${Date.now()}-reply`,
          role: 'assistant',
          content: response,
          timestamp: new Date()
        };
        setChatMessages(prev => [...prev, assistantMsg]);
        setIsTyping(false);
      });
      return;
    }

    setTimeout(() => {
      const response = generateResponse(message);
      const assistantMsg: ChatMessage = {
        id: `msg-${Date.now()}-reply`,
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, assistantMsg]);
      setIsTyping(false);
    }, 600 + Math.random() * 800);
  };

  function getDemoMatchMeta(): MatchedItemMeta[] {
    return [
      { productId: "prod-01", requestedName: "Floor Cleaner Concentrate", matchDetails: { exactTerms: ["floor", "cleaner", "concentrate"], fuzzyTerms: [], synonymTerms: ["cleaning", "detergent", "solution"], categoryBoost: true } },
      { productId: "prod-03", requestedName: "Microfiber Cleaning Cloths 16\"", matchDetails: { exactTerms: ["microfiber", "cleaning", "cloth"], fuzzyTerms: ["cloth≈cloths"], synonymTerms: ["wipe", "rag", "towel"], categoryBoost: true } },
      { productId: "prod-05", requestedName: "Disinfectant Spray 32oz Quat", matchDetails: { exactTerms: ["disinfectant", "spray", "32oz"], fuzzyTerms: [], synonymTerms: ["sanitizer", "antimicrobial"], categoryBoost: true } },
      { productId: "prod-07", requestedName: "Cotton Mop Heads #24", matchDetails: { exactTerms: ["mop", "head", "cotton"], fuzzyTerms: ["mop≈mops"], synonymTerms: ["mopping", "floor mop"], categoryBoost: true } },
      { productId: "prod-09", requestedName: "Trash Bags 55 Gallon Heavy Duty", matchDetails: { exactTerms: ["trash", "55", "gallon"], fuzzyTerms: [], synonymTerms: ["garbage", "waste", "liner", "bag"], categoryBoost: true } },
      { productId: "prod-11", requestedName: "Copy Paper 8.5x11 Ream", matchDetails: { exactTerms: ["copy", "paper", "8.5x11"], fuzzyTerms: [], synonymTerms: ["sheets", "ream", "letter size"], categoryBoost: true } },
      { productId: "prod-15", requestedName: "Invisible Tape 3/4 inch", matchDetails: { exactTerms: ["invisible", "tape"], fuzzyTerms: ["tape≈tapes"], synonymTerms: ["adhesive", "scotch"], categoryBoost: true } },
      { productId: "prod-21", requestedName: "Nitrile Gloves Medium Powder-Free", matchDetails: { exactTerms: ["nitrile", "gloves", "medium"], fuzzyTerms: [], synonymTerms: ["glove", "hand protection", "exam"], categoryBoost: true } },
      { productId: "prod-27", requestedName: "Hard Hat White Type I", matchDetails: { exactTerms: ["hard", "hat", "white"], fuzzyTerms: [], synonymTerms: ["helmet", "head protection"], categoryBoost: true } },
      { productId: "prod-29", requestedName: "Paper Coffee Cups 12oz", matchDetails: { exactTerms: ["cup", "12oz", "paper"], fuzzyTerms: ["cup≈cups"], synonymTerms: ["hot cup", "beverage"], categoryBoost: true } },
      { productId: "prod-31", requestedName: "Coffee Ground Medium Roast", matchDetails: { exactTerms: ["coffee", "medium", "roast"], fuzzyTerms: [], synonymTerms: ["brew", "ground coffee", "fraction pack"], categoryBoost: true } },
      { productId: "prod-35", requestedName: "AA Batteries Bulk Pack", matchDetails: { exactTerms: ["batteries", "aa"], fuzzyTerms: ["battery≈batteries"], synonymTerms: ["alkaline", "cells", "power"], categoryBoost: true } },
      { productId: "prod-37", requestedName: "HVAC Air Filters 20x25x1", matchDetails: { exactTerms: ["air", "filter", "20x25x1"], fuzzyTerms: ["filter≈filters"], synonymTerms: ["hvac", "pleated", "furnace"], categoryBoost: true } },
      { productId: "prod-39", requestedName: "LED Light Tubes T8 4ft", matchDetails: { exactTerms: ["led", "tube", "t8", "4ft"], fuzzyTerms: ["light≈lighting"], synonymTerms: ["lamp", "fluorescent replacement"], categoryBoost: true } },
      { productId: "prod-41", requestedName: "N95 Respirator Masks NIOSH", matchDetails: { exactTerms: ["n95", "respirator"], fuzzyTerms: ["mask≈masks"], synonymTerms: ["dust mask", "breathing protection"], categoryBoost: true } },
      { productId: "prod-43", requestedName: "First Aid Kit 50 Person", matchDetails: { exactTerms: ["first", "aid", "kit"], fuzzyTerms: [], synonymTerms: ["medical", "emergency", "ansi"], categoryBoost: true } },
      { productId: "prod-46", requestedName: "Foam Hand Soap Refill 1250mL", matchDetails: { exactTerms: ["foam", "hand", "soap"], fuzzyTerms: [], synonymTerms: ["wash", "cleanser", "dispenser refill"], categoryBoost: true } },
      { productId: "prod-50", requestedName: "Instant Cold Packs First Aid", matchDetails: { exactTerms: ["cold", "pack", "instant"], fuzzyTerms: [], synonymTerms: ["ice pack", "compress"], categoryBoost: true } },
    ];
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const stepIcons = [FileUp, Search, Zap, CircleCheck];
  const steps = [
    { label: 'Upload', desc: 'Parse RFQ' },
    { label: 'Match', desc: 'Find products' },
    { label: 'Optimize', desc: 'Find savings' },
    { label: 'Finalize', desc: 'Submit PO' },
  ];

  if (!isOpen) return null;

  const panelClasses = isMobile
    ? `fixed inset-0 bg-white flex flex-col z-50 animate-in slide-in-from-bottom duration-300`
    : isExpanded
    ? `fixed inset-0 bg-white flex flex-col z-50 transition-all duration-300 ease-in-out`
    : `fixed right-0 top-0 h-full bg-white shadow-2xl border-l border-gray-200 flex flex-col z-50 transition-all duration-300 ease-in-out ${
        isMinimized ? 'w-[56px]' : 'w-[420px]'
      }`;

  return (
    <>
      <div className={panelClasses} data-testid="chat-assistant-panel">
        <div className="bg-gradient-to-r from-[#1e3a5f] to-[#2d5a87] text-white px-3 py-2 sm:py-2.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 sm:gap-2.5">
            {isMobile && (
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-white/20 rounded transition-colors"
                data-testid="button-back-storefront"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
            {isExpanded && (
              <div className="flex items-center gap-3 mr-3">
                <div>
                  <div className="text-lg font-bold leading-tight">OPUS</div>
                  <div className="text-[9px] text-blue-200">by OMNIA Partners</div>
                </div>
                <div className="h-6 w-px bg-white/30"></div>
              </div>
            )}
            <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
              {isMinimized ? <MessageSquare className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>
            {!isMinimized && (
              <div>
                <div className="font-semibold text-sm leading-tight">R2C Agent</div>
                <div className="text-[10px] text-blue-200 flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" />
                  Powered by VIA
                </div>
              </div>
            )}
            {isExpanded && (
              <a href="https://www.earley.com" target="_blank" rel="noopener noreferrer" className="ml-3 text-[10px] text-blue-200 hover:text-white transition-colors hidden sm:block">Earley Information Science</a>
            )}
          </div>
          <div className="flex items-center gap-0.5">
            {startTime && !isMinimized && (
              <div className="flex items-center gap-1 text-[10px] text-blue-200 mr-2 bg-white/10 rounded px-2 py-0.5">
                <Clock className="w-2.5 h-2.5" />
                {formatTime(elapsedTime)}
              </div>
            )}
            {!isMobile && !isExpanded && (
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1.5 hover:bg-white/20 rounded transition-colors"
                data-testid="button-minimize"
              >
                {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
              </button>
            )}
            {!isMinimized && !isMobile && onToggleExpand && (
              <button
                onClick={onToggleExpand}
                className="p-1.5 hover:bg-white/20 rounded transition-colors"
                data-testid="button-expand"
                title={isExpanded ? "Exit full screen" : "Full screen"}
              >
                {isExpanded ? <Shrink className="w-3.5 h-3.5" /> : <Expand className="w-3.5 h-3.5" />}
              </button>
            )}
            {!isMinimized && !isMobile && !isExpanded && (
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-white/20 rounded transition-colors"
                data-testid="button-close-assistant"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {!isMinimized && (
          <>
            <div className="bg-white px-3 py-2 border-b border-gray-100 shrink-0">
              <div className="flex items-center gap-0.5">
                {steps.map((step, index) => (
                  <div key={step.label} className="flex items-center flex-1">
                    <div className="flex flex-col items-center flex-1">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 ${
                        index < currentStep ? 'bg-green-500 text-white shadow-sm shadow-green-200' :
                        index === currentStep ? 'bg-[#1e3a5f] text-white shadow-sm shadow-blue-200 scale-110' : 
                        'bg-gray-100 text-gray-400'
                      }`}>
                        {index < currentStep
                          ? <Check className="w-3.5 h-3.5" strokeWidth={3} />
                          : (() => { const Icon = stepIcons[index]; return <Icon className="w-3.5 h-3.5" />; })()
                        }
                      </div>
                      <span className={`text-[10px] mt-0.5 font-medium hidden sm:block ${
                        index <= currentStep ? 'text-[#1e3a5f]' : 'text-gray-400'
                      }`}>{step.label}</span>
                      <span className="text-[9px] text-gray-400 hidden lg:block">{step.desc}</span>
                    </div>
                    {index < steps.length - 1 && (
                      <div className={`h-0.5 w-full mx-0.5 rounded-full transition-all duration-500 ${
                        index < currentStep ? 'bg-green-400' : 'bg-gray-200'
                      }`} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className={`flex-1 overflow-auto p-3 ${isExpanded ? 'max-w-4xl mx-auto w-full' : ''}`}>
              {currentStep === 0 && (
                <div className="space-y-3">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-xs sm:text-sm text-blue-800">
                      <strong>Your AI procurement agent is ready.</strong> Upload an RFQ and I'll match products against VIA-enriched data from 630+ cooperative suppliers, enforce contract compliance, find savings, and prepare your optimized PO.
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-[10px] text-blue-600 flex-wrap">
                      <span className="flex items-center gap-1"><TrendingDown className="w-3 h-3" /> Avg 18% savings</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> 10 min vs 3 hrs</span>
                      <span className="flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> Cooperative compliant</span>
                    </div>
                  </div>
                  <FileUpload
                    onUpload={handleFileUpload}
                    isUploading={createOrderMutation.isPending}
                    onNext={() => setCurrentStep(1)}
                  />
                </div>
              )}

              {currentStep === 1 && orderData?.items && (
                <ProductMatching
                  items={orderData.items}
                  matchMeta={matchMeta}
                  onBack={() => setCurrentStep(0)}
                  onNext={() => { refetchOrder(); setCurrentStep(2); }}
                  elapsedTime={elapsedTime}
                />
              )}

              {currentStep === 2 && (
                <SmartSwaps
                  swaps={orderData?.swaps || []}
                  onBack={() => setCurrentStep(1)}
                  onNext={() => setCurrentStep(3)}
                  onAcceptSwap={handleAcceptSwap}
                  onRejectSwap={handleRejectSwap}
                  onRevertSwap={handleRevertSwap}
                  onOpenComparison={handleOpenComparison}
                  onHoverSwap={onHighlightProducts}
                  isAccepting={acceptSwapMutation.isPending || rejectSwapMutation.isPending || revertSwapMutation.isPending}
                  isLoading={isOrderLoading || !orderData}
                  itemCount={orderData?.items?.length || 0}
                  isExpanded={isExpanded}
                />
              )}

              {currentStep === 3 && orderData && (
                <CartSummary
                  items={orderData.items}
                  swaps={orderData.swaps || []}
                  matchMeta={matchMeta}
                  onBack={() => setCurrentStep(2)}
                  onSubmit={handleSubmitOrder}
                  onUpdateQuantity={handleUpdateQuantity}
                  onRemoveItem={handleRemoveItem}
                  onRevertSwap={handleRevertSwap}
                  isSubmitting={submitOrderMutation.isPending}
                  elapsedTime={elapsedTime}
                  orderId={orderId || undefined}
                  isExpanded={isExpanded}
                />
              )}
            </div>
          </>
        )}

        {isMinimized && (
          <div className="flex-1 flex flex-col items-center pt-3 gap-2">
            {steps.map((step, index) => (
              <div
                key={step.label}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                  index < currentStep ? 'bg-green-500 text-white' :
                  index === currentStep ? 'bg-[#1e3a5f] text-white scale-110' :
                  'bg-gray-100 text-gray-400'
                }`}
                title={step.label}
              >
                {index < currentStep
                  ? <Check className="w-3.5 h-3.5" strokeWidth={3} />
                  : (() => { const Icon = stepIcons[index]; return <Icon className="w-3.5 h-3.5" />; })()
                }
              </div>
            ))}
          </div>
        )}

        {!isMinimized && (
          <div className="shrink-0 border-t border-gray-200">
            {chatMessages.length > 0 && (
              <div className="max-h-[200px] overflow-y-auto px-3 py-2 space-y-2 bg-gray-50/50">
                {chatMessages.map(msg => (
                  <div key={msg.id} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`} data-testid={`chat-message-${msg.id}`}>
                    {msg.role === 'assistant' && (
                      <div className="w-5 h-5 rounded-full bg-[#1e3a5f] flex items-center justify-center shrink-0 mt-0.5">
                        <Bot className="w-3 h-3 text-white" />
                      </div>
                    )}
                    <div className={`max-w-[85%] rounded-lg px-2.5 py-1.5 text-[11px] leading-relaxed whitespace-pre-line ${
                      msg.role === 'user'
                        ? 'bg-[#1e3a5f] text-white rounded-br-sm'
                        : 'bg-white border border-gray-200 text-gray-700 rounded-bl-sm shadow-sm'
                    }`}>
                      {msg.content}
                    </div>
                    {msg.role === 'user' && (
                      <div className="w-5 h-5 rounded-full bg-gray-300 flex items-center justify-center shrink-0 mt-0.5">
                        <User className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                ))}
                {isTyping && (
                  <div className="flex gap-2 justify-start">
                    <div className="w-5 h-5 rounded-full bg-[#1e3a5f] flex items-center justify-center shrink-0 mt-0.5">
                      <Bot className="w-3 h-3 text-white" />
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg rounded-bl-sm px-3 py-2 shadow-sm">
                      <div className="flex gap-1">
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
            )}
            <div className="px-3 py-2 bg-white">
              <div className="flex items-center gap-2">
                <input
                  ref={chatInputRef}
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleChatSubmit(); } }}
                  placeholder="Ask R2C about your order..."
                  className="flex-1 text-xs bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#1e3a5f]/30 focus:border-[#1e3a5f]/40 placeholder:text-gray-400"
                  data-testid="input-chat"
                />
                <button
                  onClick={handleChatSubmit}
                  disabled={!chatInput.trim() || isTyping}
                  className="w-8 h-8 rounded-lg bg-[#1e3a5f] text-white flex items-center justify-center hover:bg-[#2d5a87] transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                  data-testid="button-chat-send"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex items-center justify-between mt-1">
                <a href="https://www.earley.com" target="_blank" rel="noopener noreferrer" className="text-[8px] text-gray-300 hover:text-gray-400 transition-colors" data-testid="link-earley">
                  earley.com
                </a>
                <span className="text-[8px] text-gray-200 select-none" data-testid="text-credit">
                  Conceived by Alexander Kline, AI Innovation Architect
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      <ComparisonDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        swap={selectedSwap}
        onAcceptSwap={(swapId: string) => {
          handleAcceptSwap(swapId);
          setIsDrawerOpen(false);
        }}
        onSelectAlternative={(swapId: string, altProductId: string) => {
          handleSelectAlternative(swapId, altProductId);
          setIsDrawerOpen(false);
        }}
      />

      <Dialog open={isSuccessModalOpen} onOpenChange={setIsSuccessModalOpen}>
        <DialogContent className="sm:max-w-md" aria-describedby="success-dialog-description">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <div className="text-green-700 text-lg">Order Submitted</div>
                <div className="text-xs text-gray-500 font-normal">Optimized and compliance-verified</div>
              </div>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4" id="success-dialog-description">
            <div className="bg-gradient-to-r from-[#1e3a5f] to-[#2d5a87] rounded-lg p-4 text-white">
              <div className="text-xs text-white/60 uppercase tracking-wider font-semibold">Purchase Order</div>
              <div className="text-2xl font-bold mt-0.5" data-testid="order-number">{orderNumber}</div>
              <div className="text-xs text-white/70 mt-1">OMNIA Partners Cooperative Agreement</div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-blue-50 rounded-lg p-2.5 border border-blue-100">
                <Clock className="w-4 h-4 mx-auto text-blue-600 mb-1" />
                <div className="text-sm font-bold text-gray-900">{formatTime(elapsedTime)}</div>
                <div className="text-[9px] text-gray-500">vs ~{Math.max(15, (orderData?.items?.length || 10) * 4)} min</div>
              </div>
              <div className="bg-green-50 rounded-lg p-2.5 border border-green-100">
                <TrendingDown className="w-4 h-4 mx-auto text-green-600 mb-1" />
                <div className="text-sm font-bold text-green-700">{orderData?.swaps?.filter((s: any) => s.isAccepted).length || 0}</div>
                <div className="text-[9px] text-gray-500">Optimizations</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-2.5 border border-purple-100">
                <ShieldCheck className="w-4 h-4 mx-auto text-purple-600 mb-1" />
                <div className="text-sm font-bold text-gray-900">100%</div>
                <div className="text-[9px] text-gray-500">Compliant</div>
              </div>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 space-y-1.5">
              <div className="text-[10px] text-emerald-700 font-semibold uppercase tracking-wide">What R2C did for you</div>
              <div className="text-[11px] text-gray-700 space-y-1">
                <div className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Parsed your RFQ and matched {orderData?.items?.length || 0} items against VIA-enriched catalog</span>
                </div>
                <div className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Verified every item against cooperative master agreements</span>
                </div>
                <div className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Evaluated stock risks, bulk savings, and sustainability upgrades</span>
                </div>
                <div className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0 mt-0.5" />
                  <span>Full decision trail recorded for audit traceability</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 flex items-center justify-between">
              <div className="text-[10px] text-slate-500">Every decision is traceable and auditable</div>
              <div className="text-[9px] text-slate-400 font-medium">Powered by VIA</div>
            </div>

            <div className="flex gap-3">
              <Button onClick={handleNewOrder} variant="outline" className="flex-1" data-testid="button-new-order">
                New Order
              </Button>
              <Button onClick={() => setIsSuccessModalOpen(false)} className="flex-1 bg-[#1e3a5f] hover:bg-[#15293f]">
                Done
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
