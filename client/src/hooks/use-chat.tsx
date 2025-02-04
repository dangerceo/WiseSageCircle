import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { Message, User } from "@shared/schema";
import { v4 as uuidv4 } from "uuid";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type ChatContextType = {
  user: User | null;
  messages: Message[];
  sendMessage: (content: string, sages: string[]) => Promise<void>;
  isLoading: boolean;
  isSending: boolean;
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

  const { data: user, isLoading: isUserLoading } = useQuery<User>({
    queryKey: ["/api/session"],
    queryFn: async () => {
      const res = await apiRequest("POST", "/api/session", { sessionId });
      return res.json();
    },
  });

  const { data: messages = [], isLoading: isMessagesLoading } = useQuery<Message[]>({
    queryKey: ["/api/messages", sessionId],
    queryFn: async () => {
      const res = await fetch(`/api/messages/${sessionId}`);
      if (!res.ok) throw new Error("Failed to fetch messages");
      return res.json();
    },
    enabled: !!user,
  });

  const messageMutation = useMutation({
    mutationFn: async ({
      content,
      sages,
    }: {
      content: string;
      sages: string[];
    }) => {
      const res = await apiRequest("POST", "/api/messages", {
        sessionId,
        message: { content, sages },
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages", sessionId] });
      queryClient.invalidateQueries({ queryKey: ["/api/session"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error sending message",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const sendMessage = async (content: string, sages: string[]) => {
    await messageMutation.mutateAsync({ content, sages });
  };

  return (
    <ChatContext.Provider
      value={{
        user: user ?? null,
        messages,
        sendMessage,
        isLoading: isUserLoading || isMessagesLoading,
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
