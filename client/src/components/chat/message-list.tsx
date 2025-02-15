import { useChat } from "@/hooks/use-chat";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Volume2, VolumeX } from "lucide-react";
import { sages } from "@/lib/sages";
import TypingIndicator from "./typing-indicator";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function MessageList() {
  const { messages } = useChat();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [speaking, setSpeaking] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (scrollContainer) {
      scrollContainer.scrollTo({
        top: scrollContainer.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages]);

  const speakMessage = async (text: string, sageId: string, messageId: number) => {
    const uniqueKey = `${messageId}-${sageId}`;
    
    if (speaking[uniqueKey]) {
      // Stop speaking if already in progress
      window.speechSynthesis.cancel();
      setSpeaking(prev => ({ ...prev, [uniqueKey]: false }));
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Set voice preferences
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(voice => 
      voice.lang.startsWith('en') && voice.name.includes('Male')
    ) || voices[0];
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }
    
    utterance.rate = 0.9; // Slightly slower for wisdom
    utterance.pitch = 1;

    // Handle speech events
    utterance.onstart = () => {
      setSpeaking(prev => ({ ...prev, [uniqueKey]: true }));
    };

    utterance.onend = () => {
      setSpeaking(prev => ({ ...prev, [uniqueKey]: false }));
    };

    utterance.onerror = () => {
      setSpeaking(prev => ({ ...prev, [uniqueKey]: false }));
    };

    window.speechSynthesis.speak(utterance);
  };

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

              const isLatestMessage = message.id === messages[messages.length - 1]?.id;
              const isTyping = isLatestMessage && (!message.responses || message.responses[sageId] === undefined || message.responses[sageId] === '');
              const uniqueKey = `${message.id}-${sageId}`;
              const isCurrentlySpeaking = speaking[uniqueKey];

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
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center justify-between">
                            <div className="text-sm font-medium text-primary">
                              {sage.name}
                              <span className="text-xs text-muted-foreground ml-2">
                                {sage.title}
                              </span>
                            </div>
                            {message.responses[sageId] && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => speakMessage(message.responses[sageId], sageId, message.id)}
                              >
                                {isCurrentlySpeaking ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                                <span className="sr-only">
                                  {isCurrentlySpeaking ? "Stop speaking" : "Speak message"}
                                </span>
                              </Button>
                            )}
                          </div>
                          <div className="prose prose-sm dark:prose-invert max-w-none">
                            <ReactMarkdown 
                              remarkPlugins={[remarkGfm]}
                              components={{
                                p: ({ children }) => <p className="mb-2">{children}</p>,
                                h1: ({ children }) => <h1 className="text-xl font-bold mb-2">{children}</h1>,
                                h2: ({ children }) => <h2 className="text-lg font-bold mb-2">{children}</h2>,
                                ul: ({ children }) => <ul className="list-disc list-inside mb-2">{children}</ul>,
                                ol: ({ children }) => <ol className="list-decimal list-inside mb-2">{children}</ol>,
                                blockquote: ({ children }) => (
                                  <blockquote className="border-l-4 border-primary/20 pl-4 italic mb-2">
                                    {children}
                                  </blockquote>
                                ),
                              }}
                            >
                              {message.responses[sageId]}
                            </ReactMarkdown>
                          </div>
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