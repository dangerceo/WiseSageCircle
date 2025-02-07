import { useChat } from "@/hooks/use-chat";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import SageSelector from "@/components/chat/sage-selector";
import MessageList from "@/components/chat/message-list";
import ChatInput from "@/components/chat/chat-input";
import CreditCounter from "@/components/chat/credit-counter";
import CreditPurchaseModal from "@/components/chat/credit-purchase-modal";
import ChatSessionList from "@/components/chat/chat-session-list";
import { Logo } from "@/components/ui/logo";
import { useState } from "react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

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
    <div className="h-screen bg-background flex flex-col">
      <header className="border-b p-4">
        <div className="container max-w-[1600px] mx-auto flex items-center justify-between gap-4">
          <Logo />
          <CreditCounter credits={user?.credits ?? 0} />
        </div>
      </header>

      <main className="flex-1 container max-w-[1600px] mx-auto">
        <ResizablePanelGroup direction="horizontal" className="h-full rounded-lg">
          <ResizablePanel defaultSize={25} minSize={20} maxSize={30} className="hidden md:block">
            <Card className="h-full rounded-none md:rounded-l-lg border-0 md:border">
              <div className="h-full flex flex-col p-2 sm:p-4">
                <ChatSessionList />
              </div>
            </Card>
          </ResizablePanel>

          <ResizableHandle className="hidden md:flex" />

          <ResizablePanel defaultSize={75}>
            <Card className="h-full rounded-none md:rounded-r-lg border-0 md:border">
              <div className="h-full grid grid-rows-[auto,1fr,auto] gap-2 sm:gap-4 p-2 sm:p-4">
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
              </div>
            </Card>
          </ResizablePanel>
        </ResizablePanelGroup>
      </main>

      <CreditPurchaseModal 
        open={showPurchaseModal} 
        onOpenChange={setShowPurchaseModal}
      />
    </div>
  );
}