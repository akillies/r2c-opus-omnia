import { useState } from "react";
import OpusStorefront from "@/components/opus-storefront";
import ChatAssistantPanel from "@/components/chat-assistant-panel";

export default function OpusIntegrated() {
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [cartItemCount, setCartItemCount] = useState(0);
  const [highlightedProducts, setHighlightedProducts] = useState<string[]>([]);

  return (
    <div className="h-screen flex overflow-hidden">
      <div className={`flex-1 transition-all duration-300 ${isAssistantOpen ? 'mr-[480px]' : ''}`}>
        <OpusStorefront
          cartItemCount={cartItemCount}
          onOpenAssistant={() => setIsAssistantOpen(true)}
          highlightedProducts={highlightedProducts}
        />
      </div>

      <ChatAssistantPanel
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
        onCartUpdate={setCartItemCount}
        onHighlightProducts={setHighlightedProducts}
      />
    </div>
  );
}
