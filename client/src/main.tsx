import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { AssistantProvider } from "./context/AssistantContext";

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <AssistantProvider>
      <App />
    </AssistantProvider>
  </QueryClientProvider>
);
