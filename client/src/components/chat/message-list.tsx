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
        {messages.map((message) => {
          const messageSages = sages.filter(sage => 
            (message.sages as string[]).includes(sage.id)
          );

          return (
            <div key={message.id} className="space-y-4">
              <Card className="bg-muted/50">
                <CardContent className="p-4">
                  <p className="text-sm">{message.content}</p>
                </CardContent>
              </Card>

              <div className="flex items-start gap-4">
                <div className="flex -space-x-2">
                  {messageSages.map((sage) => (
                    <Avatar key={sage.id} className="border-2 border-background">
                      <AvatarImage src={sage.image} alt={sage.name} />
                      <AvatarFallback>{sage.name[0]}</AvatarFallback>
                    </Avatar>
                  ))}
                </div>
                <Card className="flex-1">
                  <CardContent className="p-4">
                    <p className="text-sm italic">{message.response}</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
