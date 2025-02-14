import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { Message, User } from "@shared/schema";
import { v4 as uuidv4 } from "uuid";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { sages } from "@/lib/sages";

type ChatContextType = {
  user: SimplifiedUser;
  messages: SimplifiedMessage[];
  sendMessage: (content: string, sages: string[]) => Promise<void>;
  isLoading: boolean;
  isSending: boolean;
  resetChat: () => void;
};

// Simplified types for client-side use
type SimplifiedUser = {
  id: number;
  sessionId: string;
  credits: number;
};

type SimplifiedMessage = {
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

  const [messages, setMessages] = useState<SimplifiedMessage[]>(() => {
    const stored = localStorage.getItem(`messages_${sessionId}`);
    return stored ? JSON.parse(stored) : [];
  });

  const [credits, setCredits] = useState(() => {
    const stored = localStorage.getItem(`credits_${sessionId}`);
    return stored ? parseInt(stored, 10) : 10;
  });

  useEffect(() => {
    localStorage.setItem(`credits_${sessionId}`, credits.toString());
  }, [credits, sessionId]);

  useEffect(() => {
    localStorage.setItem(`messages_${sessionId}`, JSON.stringify(messages));
  }, [messages, sessionId]);

  const resetChat = () => {
    setMessages([]);
    setCredits(25);
    localStorage.removeItem(`messages_${sessionId}`);
    localStorage.setItem(`credits_${sessionId}`, "25");
    toast({
      title: "Chat Reset",
      description: "Your chat history has been cleared and credits have been reset to 25.",
    });
  };

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

      // Create new message with initial empty responses
      const newMessage: SimplifiedMessage = {
        id: Date.now(),
        content,
        sages: selectedSages,
        responses: {},
        createdAt: new Date().toISOString(),
      };

      setMessages(prev => [...prev, newMessage]);
      setCredits(prev => prev - 1);

      try {
        // Set up WebSocket connection for streaming responses
        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const wsUrl = `${protocol}//${window.location.host}/ws`;
        const socket = new WebSocket(wsUrl);
        let completedSages = new Set<string>();

        return new Promise<void>((resolve, reject) => {
          socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'stream') {
              // Update message with streamed chunk
              setMessages(prev =>
                prev.map(msg =>
                  msg.id === newMessage.id
                    ? {
                        ...msg,
                        responses: {
                          ...msg.responses,
                          [data.sageId]: (msg.responses[data.sageId] || '') + data.chunk
                        }
                      }
                    : msg
                )
              );
            } else if (data.type === 'error') {
              socket.close();
              reject(new Error(data.message));
            } else if (data.type === 'complete') {
              completedSages.add(data.sageId);

              // Update with complete response
              setMessages(prev =>
                prev.map(msg =>
                  msg.id === newMessage.id
                    ? {
                        ...msg,
                        responses: {
                          ...msg.responses,
                          [data.sageId]: data.response
                        }
                      }
                    : msg
                )
              );

              // If all selected sages have completed, close the connection
              if (completedSages.size === selectedSages.length) {
                socket.close();
                resolve();
              }
            }
          };

          socket.onopen = () => {
            socket.send(JSON.stringify({
              type: 'start_chat',
              content,
              selectedSages,
              messageId: newMessage.id,
              sessionId
            }));
          };

          socket.onerror = (error) => {
            socket.close();
            reject(error);
          };

          // Add timeout to prevent hanging connections
          setTimeout(() => {
            if (socket.readyState === WebSocket.OPEN) {
              socket.close();
              reject(new Error("Connection timed out"));
            }
          }, 30000); // 30 second timeout
        });
      } catch (error) {
        // Remove the message and refund credits on error
        setMessages(prev => prev.filter(msg => msg.id !== newMessage.id));
        setCredits(prev => prev + 1);
        throw error;
      }
    },
    onError: (error: Error) => {
      toast({
        title: "The sages couldn't process your question",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const user: SimplifiedUser = {
    id: 1,
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
        resetChat
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