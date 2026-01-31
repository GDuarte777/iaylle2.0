import React, { Component, ErrorInfo, ReactNode } from "react";
import { NeonButton } from "./NeonButton";
import { RefreshCcw } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-black text-white p-8">
          <div className="max-w-2xl w-full space-y-4">
            <h1 className="text-3xl font-bold text-red-500">Algo deu errado.</h1>
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg overflow-auto">
              <p className="font-mono text-sm text-red-300">
                {this.state.error?.message}
              </p>
            </div>
            <NeonButton 
              onClick={() => window.location.reload()}
              variant="glass"
              className="w-full sm:w-auto"
            >
              <RefreshCcw className="w-4 h-4 mr-2" />
              Recarregar Página
            </NeonButton>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
