import { useChat } from "@/hooks/use-chat";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { sages } from "@/lib/sages";
import TypingIndicator from "./typing-indicator";
import { useEffect, useRef } from "react";

export default function MessageList() {
  const { messages } = useChat();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (scrollContainer) {
      scrollContainer.scrollTo({
        top: scrollContainer.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages]);

  return (
    <ScrollArea ref={scrollContainerRef} className="h-full">
      <div className="space-y-4 p-4">
        {messages.map((message) => (
          <div key={message.id} className="space-y-4">
            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <p className="text-sm">{message.content}</p>
              </CardContent>
            </Card>

            {(message.sages as string[]).map((sageId) => {
              const sage = sages.find(s => s.id === sageId);
              if (!sage) return null;

              // Only show typing indicator for the most recent message
              // and only if we haven't received a response yet
              const isLatestMessage = message.id === messages[messages.length - 1]?.id;
              const isTyping = isLatestMessage && (!message.responses || message.responses[sageId] === undefined || message.responses[sageId] === '');

              return (
                <div key={sageId} className="flex items-start gap-4">
                  <Avatar className="border-2 border-background">
                    <AvatarImage src={sage.image} alt={sage.name} />
                    <AvatarFallback>{sage.name[0]}</AvatarFallback>
                  </Avatar>
                  {isTyping ? (
                    <TypingIndicator />
                  ) : (
                    <Card className="flex-1">
                      <CardContent className="p-4">
                        <div className="flex flex-col gap-1">
                          <div className="text-sm font-medium text-primary">
                            {sage.name}
                            <span className="text-xs text-muted-foreground ml-2">
                              {sage.title}
                            </span>
                          </div>
                          <p className="text-sm italic">{message.responses[sageId]}</p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}