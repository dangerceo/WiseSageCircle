import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLocation } from "wouter";
import { Logo } from "@/components/ui/logo";
import { Sparkles, Feather, Heart, Moon } from "lucide-react";

export default function HomePage() {
  const [, setLocation] = useLocation();

  return (
    <div 
      className="min-h-screen bg-background flex items-center justify-center p-4"
      style={{
        backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.9)), url(https://images.unsplash.com/photo-1600019246742-3b66977db044)`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      <div className="container max-w-6xl mx-auto grid md:grid-cols-2 gap-8 items-center">
        <div className="text-center md:text-left space-y-6">
          <div className="mb-8">
            <Logo className="justify-center md:justify-start" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Your Personal Spiritual Guide</h1>
          <p className="text-xl text-muted-foreground leading-relaxed">
            Connect with ancient wisdom through AI-powered conversations with spiritual masters and sages. Find guidance, peace, and enlightenment on your journey.
          </p>
          <div className="grid grid-cols-2 gap-4 pt-6">
            <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-primary/5">
              <Heart className="h-6 w-6 text-primary" />
              <span className="text-sm font-medium">Personalized Guidance</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-primary/5">
              <Moon className="h-6 w-6 text-primary" />
              <span className="text-sm font-medium">Ancient Wisdom</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-primary/5">
              <Sparkles className="h-6 w-6 text-primary" />
              <span className="text-sm font-medium">Divine Insights</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-primary/5">
              <Feather className="h-6 w-6 text-primary" />
              <span className="text-sm font-medium">Inner Peace</span>
            </div>
          </div>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold text-center mb-6">Begin Your Spiritual Journey</h2>
              <p className="text-muted-foreground">
                Chat with enlightened masters including:
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li>• Buddha - The Enlightened One</li>
                <li>• Lao Tzu - Founder of Taoism</li>
                <li>• Rumi - The Mystic Poet</li>
                <li>• Jesus Christ - The Light of the World</li>
                <li>• Lord Shiva - The Transformer</li>
              </ul>
              <div className="pt-6">
                <Button 
                  size="lg"
                  onClick={() => setLocation("/chat")}
                  className="w-full"
                >
                  Start Your Journey
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}