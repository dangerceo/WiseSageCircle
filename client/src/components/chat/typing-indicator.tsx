import { Card, CardContent } from "@/components/ui/card";

export default function TypingIndicator() {
  return (
    <Card className="w-16">
      <CardContent className="p-2 flex items-center gap-1">
        <div className="w-2 h-2 rounded-full bg-primary/50 animate-[bounce_1.4s_infinite_.2s]" />
        <div className="w-2 h-2 rounded-full bg-primary/50 animate-[bounce_1.4s_infinite_.4s]" />
        <div className="w-2 h-2 rounded-full bg-primary/50 animate-[bounce_1.4s_infinite_.6s]" />
      </CardContent>
    </Card>
  );
}
