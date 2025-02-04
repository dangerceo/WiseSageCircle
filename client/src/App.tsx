import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { ChatProvider } from "@/hooks/use-chat";
import HomePage from "@/pages/home-page";
import ChatPage from "@/pages/chat-page";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/chat" component={ChatPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ChatProvider>
        <Router />
        <Toaster />
      </ChatProvider>
    </QueryClientProvider>
  );
}

export default App;
