import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  private handleReset = () => {
    localStorage.clear();
    window.location.reload();
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-bg-deep flex flex-col items-center justify-center p-6 text-center">
          <div className="w-full max-w-md bg-bg-card border border-red-500/30 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-red-500/30" />
            
            <div className="mb-6 flex justify-center">
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/20">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
            </div>

            <h2 className="text-2xl font-adventure text-red-400 tracking-widest mb-4 uppercase">System Error</h2>
            
            <div className="bg-bg-deep/50 rounded-xl p-4 mb-8 text-left border border-white/5">
              <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-2">Error Details:</p>
              <p className="text-xs text-gray-400 font-mono break-words">
                {this.state.error?.message || "An unexpected error occurred."}
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={this.handleReload}
                className="w-full flex items-center justify-center gap-2 bg-primary/10 border border-primary/30 text-primary font-adventure tracking-widest rounded-xl py-3 px-6 hover:bg-primary/20 transition-all uppercase text-sm"
              >
                <RefreshCw className="w-4 h-4" />
                Reload Application
              </button>
              
              <button
                onClick={this.handleReset}
                className="w-full flex items-center justify-center gap-2 bg-white/5 border border-white/10 text-gray-500 font-adventure tracking-widest rounded-xl py-3 px-6 hover:bg-white/10 hover:text-white transition-all uppercase text-sm"
              >
                <Home className="w-4 h-4" />
                Reset & Return to Menu
              </button>
            </div>
            
            <p className="mt-6 text-[9px] text-gray-600 leading-relaxed">
              오류가 지속될 경우 브라우저 캐시를 삭제하거나<br/>
              관리자에게 문의해 주세요.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
