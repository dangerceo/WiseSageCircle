import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements
} from "@stripe/react-stripe-js";
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
import { useChat } from "@/hooks/use-chat";
import { Loader2, Check, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error("Missing Stripe public key");
}

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

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

const PaymentForm = ({ productId, onSuccess }: { productId: string, onSuccess: () => void }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/chat`,
        },
        redirect: "if_required"
      });

      if (error) {
        toast({
          title: "Payment Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Payment Successful",
          description: "Your credits have been added to your account!",
        });
        onSuccess();
      }
    } catch (error: any) {
      toast({
        title: "Payment Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <Button 
        type="submit" 
        className="w-full" 
        disabled={isProcessing || !stripe || !elements}
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <Sparkles className="mr-2 h-4 w-4" />
            Pay Now
          </>
        )}
      </Button>
    </form>
  );
};

interface CreditPurchaseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreditPurchaseModal({
  open,
  onOpenChange,
}: CreditPurchaseModalProps) {
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const { user } = useChat();
  const { toast } = useToast();

  const handlePackageSelect = async (packageId: string) => {
    try {
      const response = await fetch("/_api/purchase-credits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: packageId,
          sessionId: user.sessionId
        }),
      });

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      setClientSecret(data.clientSecret);
      setSelectedPackage(packageId);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSuccess = () => {
    setSelectedPackage(null);
    setClientSecret(null);
    onOpenChange(false);
    // The credits will be updated through websocket connection
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-32px)] sm:w-auto sm:max-w-[900px] h-[calc(100vh-32px)] sm:h-auto p-4 sm:p-6">
        <ScrollArea className="h-full pr-4">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl text-center">Choose Your Spiritual Journey</DialogTitle>
            <DialogDescription className="text-center text-lg">
              Select a package to continue your path to enlightenment
            </DialogDescription>
          </DialogHeader>

          {!selectedPackage ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {CREDIT_PACKAGES.map((pkg) => (
                <Card
                  key={pkg.id}
                  className={`relative ${pkg.popular ? "border-primary shadow-lg" : ""}`}
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
                      onClick={() => handlePackageSelect(pkg.id)}
                      variant={pkg.popular ? "default" : "outline"}
                    >
                      <Sparkles className="mr-2 h-4 w-4" />
                      Select Package
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : clientSecret ? (
            <div className="max-w-md mx-auto">
              <Elements 
                stripe={stripePromise} 
                options={{ 
                  clientSecret,
                  appearance: { theme: 'stripe' }
                }}
              >
                <PaymentForm 
                  productId={selectedPackage} 
                  onSuccess={handleSuccess}
                />
              </Elements>
            </div>
          ) : (
            <div className="flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}