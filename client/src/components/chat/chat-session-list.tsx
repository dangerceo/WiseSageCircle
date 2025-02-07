import { useChat } from "@/hooks/use-chat";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";

export default function ChatSessionList() {
  const { messages } = useChat();

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
        <h2 className="font-semibold mb-4">Previous Conversations</h2>
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