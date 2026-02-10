import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import OpusStorefront from "@/components/opus-storefront";
import ChatAssistantPanel from "@/components/chat-assistant-panel";

export default function OpusIntegrated() {
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [cartItemCount, setCartItemCount] = useState(0);
  const [highlightedProducts, setHighlightedProducts] = useState<string[]>([]);
  const isMobile = useIsMobile();

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50">
      {!isExpanded && (
        <div className={`flex-1 transition-all duration-300 ease-in-out ${
          isAssistantOpen && !isMobile ? 'mr-[420px]' : ''
        }`}>
          <OpusStorefront
            cartItemCount={cartItemCount}
            onOpenAssistant={() => setIsAssistantOpen(true)}
            highlightedProducts={highlightedProducts}
            isAssistantOpen={isAssistantOpen}
          />
        </div>
      )}

      <ChatAssistantPanel
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
        onCartUpdate={setCartItemCount}
        onHighlightProducts={setHighlightedProducts}
        isMobile={isMobile}
        isExpanded={isExpanded}
        onToggleExpand={() => setIsExpanded(!isExpanded)}
      />

      {isAssistantOpen && isMobile && (
        <div 
          className="fixed inset-0 bg-black/40 z-40"
          onClick={() => setIsAssistantOpen(false)}
        />
      )}
    </div>
  );
}
