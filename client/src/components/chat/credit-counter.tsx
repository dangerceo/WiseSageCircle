import { Card, CardContent } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CreditCounterProps {
  credits: number;
  onClick?: () => void;
}

export default function CreditCounter({ credits, onClick }: CreditCounterProps) {
  return (
    <Card 
      className={onClick ? "cursor-pointer hover:border-primary transition-colors" : ""}
      onClick={onClick}
      role={onClick ? "button" : undefined}
    >
      <CardContent className="flex items-center gap-2 p-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <span className="font-medium">{credits}</span>
        <span className="text-sm text-muted-foreground">credits remaining</span>
      </CardContent>
    </Card>
  );
}
