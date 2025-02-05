import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";

const CREDIT_PACKAGES = [
  { credits: 50, price: 5, id: "credit-50" },
  { credits: 100, price: 9, id: "credit-100" },
  { credits: 200, price: 15, id: "credit-200" },
];

interface CreditPurchaseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreditPurchaseModal({
  open,
  onOpenChange,
}: CreditPurchaseModalProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handlePurchase = async (packageId: string) => {
    try {
      setLoading(true);
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
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Purchase Credits</DialogTitle>
          <DialogDescription>
            Choose a credit package to continue your spiritual journey
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {CREDIT_PACKAGES.map((pkg) => (
            <Button
              key={pkg.id}
              onClick={() => handlePurchase(pkg.id)}
              disabled={loading}
              className="w-full"
              variant="outline"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {pkg.credits} Credits for ${pkg.price}
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
