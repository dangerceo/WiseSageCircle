import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, Check, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const CREDIT_PACKAGES = [
  {
    credits: 50,
    price: 5,
    id: "credit-50",
    name: "Seeker",
    features: ["50 conversations with sages", "Access to all spiritual guides", "24/7 availability"],
  },
  {
    credits: 100,
    price: 9,
    id: "credit-100",
    name: "Devotee",
    features: [
      "100 conversations with sages",
      "Access to all spiritual guides",
      "24/7 availability",
      "Priority response time",
    ],
    popular: true,
  },
  {
    credits: 200,
    price: 15,
    id: "credit-200",
    name: "Enlightened",
    features: [
      "200 conversations with sages",
      "Access to all spiritual guides",
      "24/7 availability",
      "Priority response time",
      "Extended conversation length",
    ],
  },
];

interface CreditPurchaseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreditPurchaseModal({
  open,
  onOpenChange,
}: CreditPurchaseModalProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const { toast } = useToast();

  const handlePurchase = async (packageId: string) => {
    try {
      setLoading(packageId);
      const response = await apiRequest("POST", "/api/create-checkout-session", {
        priceId: packageId,
      });
      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to initiate checkout. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-32px)] sm:w-auto sm:max-w-[900px] h-[calc(100vh-32px)] sm:h-auto p-4 sm:p-6">
        <ScrollArea className="h-full pr-4">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl text-center">Choose Your Spiritual Journey</DialogTitle>
            <DialogDescription className="text-center text-lg">
              Select a credit package to continue your path to enlightenment
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {CREDIT_PACKAGES.map((pkg) => (
              <Card
                key={pkg.id}
                className={cn(
                  "relative",
                  pkg.popular && "border-primary shadow-lg"
                )}
              >
                {pkg.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-primary text-primary-foreground text-sm font-medium px-3 py-1 rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-xl text-center">{pkg.name}</CardTitle>
                  <div className="text-center space-y-1">
                    <div className="text-3xl font-bold">${pkg.price}</div>
                    <div className="text-muted-foreground">
                      {pkg.credits} credits
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {pkg.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-primary shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={() => handlePurchase(pkg.id)}
                    disabled={!!loading}
                    variant={pkg.popular ? "default" : "outline"}
                  >
                    {loading === pkg.id ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="mr-2 h-4 w-4" />
                    )}
                    Get Started
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}