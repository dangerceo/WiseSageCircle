import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLocation } from "wouter";

export default function HomePage() {
  const [, setLocation] = useLocation();

  return (
    <div 
      className="min-h-screen bg-background flex items-center justify-center p-4"
      style={{
        backgroundImage: `url(https://images.unsplash.com/photo-1487088678257-3a541e6e3922)`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      <Card className="w-full max-w-lg bg-background/95 backdrop-blur">
        <CardContent className="p-6 text-center">
          <h1 className="text-4xl font-bold mb-4 text-primary">Spiritual Council</h1>
          <p className="text-lg mb-8 text-muted-foreground">
            Seek wisdom from ancient sages and spiritual masters. Begin your journey of enlightenment.
          </p>
          <Button 
            size="lg"
            onClick={() => setLocation("/chat")}
            className="w-full sm:w-auto"
          >
            Start Your Journey
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
