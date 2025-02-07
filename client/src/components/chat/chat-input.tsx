import { useState } from "react";
import { useChat } from "@/hooks/use-chat";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SendHorizonal, Loader2 } from "lucide-react";

interface ChatInputProps {
  selectedSages: string[];
  disabled: boolean;
  hasCredits: boolean;
  onNeedCredits: () => void;
}

export default function ChatInput({ selectedSages, disabled, hasCredits, onNeedCredits }: ChatInputProps) {
  const [content, setContent] = useState("");
  const { sendMessage, isSending } = useChat();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || disabled || isSending) return;

    if (!hasCredits) {
      onNeedCredits();
      return;
    }

    try {
      await sendMessage(content.trim(), selectedSages);
      setContent("");
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 px-1">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={disabled ? "Select a sage to begin..." : "Ask your question..."}
        disabled={disabled}
        className="min-h-[80px] resize-none"
      />
      <Button 
        type="submit" 
        disabled={!content.trim() || disabled || isSending}
        size="icon"
        className="shrink-0"
      >
        {isSending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <SendHorizonal className="h-4 w-4" />
        )}
      </Button>
    </form>
  );
}