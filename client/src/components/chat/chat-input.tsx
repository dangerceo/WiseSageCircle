import { useState } from "react";
import { useChat } from "@/hooks/use-chat";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SendHorizonal, Loader2 } from "lucide-react";

interface ChatInputProps {
  selectedSages: string[];
  disabled: boolean;
}

export default function ChatInput({ selectedSages, disabled }: ChatInputProps) {
  const [content, setContent] = useState("");
  const { sendMessage, isSending } = useChat();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || disabled || isSending) return;

    try {
      await sendMessage(content.trim(), selectedSages);
      setContent("");
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={disabled ? "Select a sage to begin..." : "Ask your question..."}
        disabled={disabled}
        className="min-h-[80px]"
      />
      <Button 
        type="submit" 
        disabled={!content.trim() || disabled || isSending}
        size="icon"
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
