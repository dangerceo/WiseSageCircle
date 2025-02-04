import { Card, CardContent } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

interface CreditCounterProps {
  credits: number;
}

export default function CreditCounter({ credits }: CreditCounterProps) {
  return (
    <Card>
      <CardContent className="flex items-center gap-2 p-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <span className="font-medium">{credits}</span>
        <span className="text-sm text-muted-foreground">credits remaining</span>
      </CardContent>
    </Card>
  );
}
