import { useChat } from "@/hooks/use-chat";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import SageSelector from "@/components/chat/sage-selector";
import MessageList from "@/components/chat/message-list";
import ChatInput from "@/components/chat/chat-input";
import CreditCounter from "@/components/chat/credit-counter";
import CreditPurchaseModal from "@/components/chat/credit-purchase-modal";
import { useState } from "react";

export default function ChatPage() {
  const { user, isLoading } = useChat();
  const [selectedSages, setSelectedSages] = useState<string[]>([]);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-2 py-4 sm:p-4 flex flex-col items-center">
      <div className="w-full max-w-3xl flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 justify-between">
          <h1 className="text-xl sm:text-2xl font-bold text-primary">Spiritual Council</h1>
          <div className="shrink-0">
            <CreditCounter credits={user?.credits ?? 0} />
          </div>
        </div>

        <Card className="flex-1 grid grid-rows-[auto,1fr,auto] gap-2 sm:gap-4 p-2 sm:p-4">
          <SageSelector
            selected={selectedSages}
            onChange={setSelectedSages}
          />
          <MessageList />
          <ChatInput
            selectedSages={selectedSages}
            disabled={selectedSages.length === 0}
            onNeedCredits={() => setShowPurchaseModal(true)}
            hasCredits={(user?.credits ?? 0) > 0}
          />
        </Card>

        <CreditPurchaseModal 
          open={showPurchaseModal} 
          onOpenChange={setShowPurchaseModal}
        />
      </div>
    </div>
  );
}