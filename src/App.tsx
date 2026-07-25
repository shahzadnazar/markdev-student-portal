import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/context/auth-context";
import { queryClient } from "@/lib/query-client";
import { AppRouter } from "@/routes";

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider delayDuration={200}>
          <AppRouter />
        </TooltipProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              borderRadius: "0.75rem",
              boxShadow: "var(--shadow-elevated)",
            },
          }}
        />
      </AuthProvider>
    </QueryClientProvider>
  );
}
