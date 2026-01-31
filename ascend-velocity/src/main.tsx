import { createRoot } from "react-dom/client";
import { ThemeProvider } from "next-themes";
import App from "./App.tsx";
import "./index.css";
import { ErrorBoundary } from "./components/ErrorBoundary";

const container = document.getElementById("root");

if (container) {
  const root = createRoot(container);
  root.render(
    <ErrorBoundary>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        <App />
      </ThemeProvider>
    </ErrorBoundary>
  );
} else {
  console.error("Root element not found");
}