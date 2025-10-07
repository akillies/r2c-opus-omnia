import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import StepProgress from "@/components/step-progress";
import FileUpload from "@/components/file-upload";
import ProductMatching from "@/components/product-matching";
import SmartSwaps from "@/components/smart-swaps";
import CartSummary from "@/components/cart-summary";
import ComparisonDrawer from "@/components/comparison-drawer";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CheckCircle2, ShoppingCart } from "lucide-react";

interface OrderData {
  order: any;
  items: any[];
  swaps?: any[];
}

export default function ProcurementWorkflow() {
  const [currentStep, setCurrentStep] = useState(0);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedSwap, setSelectedSwap] = useState<any>(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: orderData, refetch: refetchOrder } = useQuery<OrderData>({
    queryKey: ['/api/orders', orderId],
    enabled: !!orderId,
    refetchOnMount: true
  });

  const createOrderMutation = useMutation({
    mutationFn: async (fileName: string) => {
      const response = await apiRequest("POST", "/api/orders", {
        fileName,
        status: "processing"
      });
      return await response.json();
    },
    onSuccess: (data) => {
      setOrderId(data.order.id);
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      setTimeout(() => {
        setCurrentStep(1);
      }, 2500);
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

  const handleFileUpload = (fileName: string) => {
    createOrderMutation.mutate(fileName);
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
    queryClient.clear();
  };

  const steps = ['Select', 'Check', 'Fit', 'Lock'];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div>
              <div className="text-2xl font-bold text-slate-900">OPUS</div>
              <div className="text-xs text-slate-600">by Omnia Partners</div>
            </div>
            <div className="h-8 w-px bg-slate-300"></div>
            <div className="flex items-center gap-2">
              <i className="fas fa-bolt text-blue-600 text-sm"></i>
              <span className="text-sm font-semibold text-slate-900">Requirements 2 Cart</span>
              <span className="text-xs text-slate-500">powered by VIA™</span>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-xs text-slate-500">Earley Information Science</div>
            <div className="h-6 w-px bg-slate-300"></div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-sm font-semibold text-slate-900">M. Martigan</div>
                <div className="text-xs text-slate-500">Procurement Manager</div>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white font-semibold shadow-sm">
                MM
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Progress Steps */}
        <StepProgress 
          steps={steps}
          currentStep={currentStep}
          onStepClick={setCurrentStep}
        />

        {/* Step Content */}
        <div className="bg-white rounded-lg border border-slate-200 p-8 shadow-sm">
          {currentStep === 0 && (
            <FileUpload 
              onUpload={handleFileUpload}
              isUploading={createOrderMutation.isPending}
              onNext={() => setCurrentStep(1)}
            />
          )}

          {currentStep === 1 && orderData && (
            <ProductMatching
              items={orderData.items}
              onBack={() => setCurrentStep(0)}
              onNext={() => setCurrentStep(2)}
            />
          )}

          {currentStep === 2 && orderData && (
            <SmartSwaps
              swaps={orderData.swaps || []}
              onAcceptSwap={handleAcceptSwap}
              onOpenComparison={handleOpenComparison}
              onBack={() => setCurrentStep(1)}
              onNext={() => setCurrentStep(3)}
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
            />
          )}
        </div>
      </main>

      {/* Comparison Drawer */}
      <ComparisonDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        swap={selectedSwap}
        onAcceptSwap={handleAcceptSwap}
      />

      {/* Success Modal */}
      <Dialog open={isSuccessModalOpen} onOpenChange={setIsSuccessModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <DialogTitle className="text-center text-2xl font-bold mb-2">
              Order Submitted!
            </DialogTitle>
          </DialogHeader>
          <div className="text-center space-y-4">
            <p className="text-slate-600">
              Your optimized procurement order has been submitted for approval. 
              You'll receive a confirmation email shortly.
            </p>
            <div className="bg-slate-50 rounded-lg p-4">
              <div className="text-sm text-slate-600 mb-1">Order ID</div>
              <div className="text-lg font-mono font-semibold text-slate-900">
                {orderNumber}
              </div>
            </div>
            <Button 
              onClick={handleNewOrder} 
              className="w-full btn-primary"
              data-testid="button-new-order"
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Create New Order
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
