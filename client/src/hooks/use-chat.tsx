import { createContext, ReactNode, useContext, useEffect, useState, useRef } from "react";
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

  const wsRef = useRef<WebSocket | null>(null);
  const [streamingResponses, setStreamingResponses] = useState<Record<number, Record<string, string>>>({});

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    function connect() {
      const ws = new WebSocket(wsUrl);

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'stream') {
          setStreamingResponses(prev => ({
            ...prev,
            [data.messageId]: {
              ...prev[data.messageId],
              [data.sageId]: (prev[data.messageId]?.[data.sageId] || '') + data.chunk
            }
          }));
        } else if (data.type === 'complete') {
          // When a sage completes their response, we'll leave it in streaming state
          // until all sages are done, then the full response will come from the server
        }
      };

      ws.onclose = () => {
        // Reconnect on close
        setTimeout(connect, 1000);
      };

      wsRef.current = ws;
    }

    connect();
    return () => wsRef.current?.close();
  }, []);

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

  // Combine stored messages with streaming responses
  const enhancedMessages = messages.map(msg => ({
    ...msg,
    responses: streamingResponses[msg.id] || msg.responses
  }));

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
      const message = await res.json();

      // Start streaming responses
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'start_chat',
          sessionId,
          messageId: message.id,
          content,
          selectedSages: sages,
        }));
      }

      return message;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages", sessionId] });
      queryClient.invalidateQueries({ queryKey: ["/api/session"] });
    },
    onError: (error: Error) => {
      toast({
        title: "The sages couldn't process your question",
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
        messages: enhancedMessages,
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