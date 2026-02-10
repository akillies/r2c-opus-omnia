import { useState, useEffect } from "react";
import { X, Minimize2, Maximize2, Bot, Sparkles, MessageSquare, ChevronLeft, Clock, TrendingDown, ShieldCheck, Leaf, Expand, Shrink } from "lucide-react";
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

interface ChatAssistantPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onCartUpdate: (count: number) => void;
  onHighlightProducts: (productIds: string[]) => void;
  isMobile?: boolean;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
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

  const { data: orderData, refetch: refetchOrder } = useQuery<OrderData>({
    queryKey: ['/api/orders', orderId],
    enabled: !!orderId,
    refetchOnMount: true
  });

  const createOrderMutation = useMutation({
    mutationFn: async ({ fileName, matchedItems }: { fileName: string; matchedItems?: any[] }) => {
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
    onCartUpdate(0);
    onHighlightProducts([]);
    queryClient.clear();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const steps = [
    { label: 'Upload', icon: '📄', desc: 'Parse RFQ' },
    { label: 'Match', icon: '🔍', desc: 'Find products' },
    { label: 'Optimize', icon: '⚡', desc: 'Find savings' },
    { label: 'Finalize', icon: '✅', desc: 'Submit PO' },
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
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                        index < currentStep ? 'bg-green-500 text-white shadow-sm shadow-green-200' :
                        index === currentStep ? 'bg-[#1e3a5f] text-white shadow-sm shadow-blue-200 scale-110' : 
                        'bg-gray-100 text-gray-400'
                      }`}>
                        {index < currentStep ? '✓' : step.icon}
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
                  onBack={() => setCurrentStep(0)}
                  onNext={() => setCurrentStep(2)}
                  elapsedTime={elapsedTime}
                />
              )}

              {currentStep === 2 && orderData && (
                <SmartSwaps
                  swaps={orderData.swaps || []}
                  onBack={() => setCurrentStep(1)}
                  onNext={() => setCurrentStep(3)}
                  onAcceptSwap={handleAcceptSwap}
                  onOpenComparison={handleOpenComparison}
                  isAccepting={acceptSwapMutation.isPending}
                />
              )}

              {currentStep === 3 && orderData && (
                <CartSummary
                  items={orderData.items}
                  swaps={orderData.swaps || []}
                  onBack={() => setCurrentStep(2)}
                  onSubmit={handleSubmitOrder}
                  isSubmitting={submitOrderMutation.isPending}
                  elapsedTime={elapsedTime}
                  orderId={orderId || undefined}
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
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs transition-all ${
                  index < currentStep ? 'bg-green-500 text-white' :
                  index === currentStep ? 'bg-[#1e3a5f] text-white scale-110' :
                  'bg-gray-100 text-gray-400'
                }`}
                title={step.label}
              >
                {index < currentStep ? '✓' : step.icon}
              </div>
            ))}
          </div>
        )}

        {!isMinimized && (
          <div className="shrink-0 px-3 py-1.5 border-t border-gray-100 flex items-center justify-between">
            <a href="https://www.earley.com" target="_blank" rel="noopener noreferrer" className="text-[9px] text-gray-300 hover:text-gray-400 transition-colors" data-testid="link-earley">
              earley.com
            </a>
            <span className="text-[9px] text-gray-200 select-none" data-testid="text-credit">
              Conceived by Alexander Kline, AI Innovation Architect
            </span>
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
      />

      <Dialog open={isSuccessModalOpen} onOpenChange={setIsSuccessModalOpen}>
        <DialogContent className="sm:max-w-md" aria-describedby="success-dialog-description">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-green-700">
              <CheckCircle2 className="w-8 h-8" />
              Order Submitted!
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4" id="success-dialog-description">
            <p className="text-gray-600">
              Your purchase order has been optimized using VIA-enriched data against OMNIA Partners cooperative master agreements and submitted.
            </p>
            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
              <div>
                <div className="text-sm text-gray-500">Purchase Order</div>
                <div className="text-xl font-bold text-gray-900" data-testid="order-number">{orderNumber}</div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-white rounded-lg p-2 border">
                  <Clock className="w-4 h-4 mx-auto text-blue-600 mb-1" />
                  <div className="text-xs font-bold text-gray-900">{formatTime(elapsedTime)}</div>
                  <div className="text-[10px] text-gray-500">Processing</div>
                </div>
                <div className="bg-white rounded-lg p-2 border">
                  <TrendingDown className="w-4 h-4 mx-auto text-green-600 mb-1" />
                  <div className="text-xs font-bold text-gray-900">~18%</div>
                  <div className="text-[10px] text-gray-500">Cost Savings</div>
                </div>
                <div className="bg-white rounded-lg p-2 border">
                  <ShieldCheck className="w-4 h-4 mx-auto text-purple-600 mb-1" />
                  <div className="text-xs font-bold text-gray-900">100%</div>
                  <div className="text-[10px] text-gray-500">Cooperative</div>
                </div>
              </div>
              <div className="text-[11px] text-gray-500 text-center italic">
                All items matched against VIA-enriched catalog data and verified against publicly awarded cooperative contracts
              </div>
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
