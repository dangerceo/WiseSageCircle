import { useChat } from "@/hooks/use-chat";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import SageSelector from "@/components/chat/sage-selector";
import MessageList from "@/components/chat/message-list";
import ChatInput from "@/components/chat/chat-input";
import CreditCounter from "@/components/chat/credit-counter";
import { useState } from "react";

export default function ChatPage() {
  const { user, isLoading } = useChat();
  const [selectedSages, setSelectedSages] = useState<string[]>([]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col p-4 gap-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-primary">Spiritual Council</h1>
        <CreditCounter credits={user?.credits ?? 0} />
      </div>

      <Card className="flex-1 grid grid-rows-[auto,1fr,auto] gap-4 p-4">
        <SageSelector
          selected={selectedSages}
          onChange={setSelectedSages}
        />
        <MessageList />
        <ChatInput
          selectedSages={selectedSages}
          disabled={selectedSages.length === 0 || (user?.credits ?? 0) <= 0}
        />
      </Card>
    </div>
  );
}
