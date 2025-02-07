import { useChat } from "@/hooks/use-chat";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { sages } from "@/lib/sages";

export default function MessageList() {
  const { messages } = useChat();

  return (
    <ScrollArea className="h-[500px] pr-4">
      <div className="space-y-4">
        {messages.map((message) => (
          <div key={message.id} className="space-y-4">
            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <p className="text-sm">{message.content}</p>
              </CardContent>
            </Card>

            {(message.sages as string[]).map((sageId) => {
              const sage = sages.find(s => s.id === sageId);
              if (!sage || !message.responses?.[sageId]) return null;

              return (
                <div key={sageId} className="flex items-start gap-4">
                  <Avatar className="border-2 border-background">
                    <AvatarImage src={sage.image} alt={sage.name} />
                    <AvatarFallback>{sage.name[0]}</AvatarFallback>
                  </Avatar>
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
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}