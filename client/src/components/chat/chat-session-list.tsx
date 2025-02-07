import { useChat } from "@/hooks/use-chat";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { PlusCircle } from "lucide-react";

export default function ChatSessionList() {
  const { messages, startNewConversation } = useChat();

  // Group messages by conversation (using createdAt date as identifier)
  const conversations = messages.reduce((acc, message) => {
    const date = message.createdAt ? new Date(message.createdAt) : new Date();
    const dateKey = format(date, 'yyyy-MM-dd HH:mm');

    if (!acc[dateKey]) {
      acc[dateKey] = {
        firstMessage: message,
        date: date,
      };
    }
    return acc;
  }, {} as Record<string, { firstMessage: typeof messages[0], date: Date }>);

  return (
    <ScrollArea className="flex-1 pr-4 -mr-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Previous Conversations</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={startNewConversation}
            className="gap-2"
          >
            <PlusCircle className="h-4 w-4" />
            New Chat
          </Button>
        </div>
        {Object.entries(conversations)
          .sort(([, a], [, b]) => b.date.getTime() - a.date.getTime())
          .map(([dateKey, { firstMessage, date }]) => (
            <Card key={dateKey} className="cursor-pointer hover:bg-accent transition-colors">
              <CardContent className="p-3">
                <div className="text-sm truncate">{firstMessage.content}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {format(date, 'MMM d, yyyy h:mm a')}
                </div>
              </CardContent>
            </Card>
          ))}
      </div>
    </ScrollArea>
  );
}