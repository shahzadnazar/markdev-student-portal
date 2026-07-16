import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { AuthProvider } from "@/context/auth-context";
import { queryClient } from "@/lib/query-client";
import { AppRouter } from "@/routes";

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppRouter />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              borderRadius: "0.75rem",
              boxShadow: "0px 12px 32px rgba(12, 90, 189, 0.12)",
            },
          }}
        />
      </AuthProvider>
    </QueryClientProvider>
  );
}
