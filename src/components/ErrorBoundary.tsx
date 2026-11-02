import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

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
    console.error('YASMIN UI Error caught by boundary:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full bg-neutral-950 text-white flex flex-col items-center justify-center p-6 text-center select-none font-sans">
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 mb-6 shadow-[0_0_40px_rgba(244,63,94,0.2)]">
            <AlertTriangle className="w-12 h-12 mx-auto animate-pulse" />
          </div>
          <h2 className="text-2xl font-black text-rose-300 font-mono tracking-tight mb-2">
            NEURAL SYNAPSE RE-ROUTING REQUIRED
          </h2>
          <p className="text-sm text-neutral-400 max-w-md mb-4 font-mono">
            YASMIN encountered a temporary matrix disturbance:
            <br />
            <span className="text-rose-400/90 text-xs mt-1 block bg-neutral-900/80 p-2 rounded border border-neutral-800">
              {this.state.error?.message || 'Unknown quantum fluctuation'}
            </span>
          </p>
          <button
            type="button"
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-bold font-mono text-sm hover:brightness-110 shadow-[0_0_20px_rgba(0,240,255,0.4)] transition cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            RE-CALIBRATE YASMIN
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
