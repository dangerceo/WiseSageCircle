import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { sages } from "@/lib/sages";
import { apiRequest } from "@/lib/queryClient";

type ChatContextType = {
  user: LocalUser;
  messages: LocalMessage[];
  sendMessage: (content: string, sages: string[]) => Promise<void>;
  isLoading: boolean;
  isSending: boolean;
};

type LocalUser = {
  sessionId: string;
  credits: number;
};

type LocalMessage = {
  id: number;
  content: string;
  sages: string[];
  responses: Record<string, string>;
  createdAt: string;
};

const ChatContext = createContext<ChatContextType | null>(null);

export function ChatProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [sessionId] = useState(() => {
    const stored = localStorage.getItem("sessionId");
    if (stored) return stored;
    const newId = uuidv4();
    localStorage.setItem("sessionId", newId);
    return newId;
  });

  const [messages, setMessages] = useState<LocalMessage[]>(() => {
    const stored = localStorage.getItem(`messages_${sessionId}`);
    return stored ? JSON.parse(stored) : [];
  });

  const [credits, setCredits] = useState(() => {
    const stored = localStorage.getItem("credits");
    return stored ? parseInt(stored, 10) : 10;
  });

  useEffect(() => {
    localStorage.setItem("credits", credits.toString());
  }, [credits]);

  const messageMutation = useMutation({
    mutationFn: async ({
      content,
      sages: selectedSages,
    }: {
      content: string;
      sages: string[];
    }) => {
      if (credits <= 0) {
        throw new Error("No credits remaining");
      }
      setCredits(prev => prev - 1);

      const newMessage: LocalMessage = {
        id: Date.now(),
        content,
        sages: selectedSages,
        responses: {},
        createdAt: new Date().toISOString(),
      };

      setMessages(prev => [...prev, newMessage]);

      try {
        const response = await apiRequest("POST", "/api/messages", {
          sessionId,
          message: {
            content,
            sages: selectedSages
          }
        });

        const { responses } = await response.json();

        setMessages(prev =>
          prev.map(msg =>
            msg.id === newMessage.id
              ? { ...msg, responses }
              : msg
          )
        );

        return newMessage;
      } catch (error) {
        // Remove the message on error
        setMessages(prev => prev.filter(msg => msg.id !== newMessage.id));
        throw error;
      }
    },
    onError: (error: Error) => {
      setCredits(prev => prev + 1);
      toast({
        title: "The sages couldn't process your question",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    localStorage.setItem(`messages_${sessionId}`, JSON.stringify(messages));
  }, [messages, sessionId]);

  const user: LocalUser = {
    sessionId,
    credits
  };

  return (
    <ChatContext.Provider
      value={{
        user,
        messages,
        sendMessage: async (content, sages) => {
          await messageMutation.mutateAsync({ content, sages });
        },
        isLoading: false,
        isSending: messageMutation.isPending,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
}