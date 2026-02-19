import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle } from "lucide-react";

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
                <div className="flex h-screen w-screen flex-col items-center justify-center bg-slate-950 p-4 text-white">
                    <div className="flex max-w-md flex-col items-center gap-4 rounded-lg border border-red-900/50 bg-red-950/20 p-8 text-center">
                        <AlertCircle className="h-12 w-12 text-red-500" />
                        <h1 className="text-xl font-bold text-red-400">Application Crashed</h1>
                        <p className="text-sm text-slate-300">
                            Something went wrong while loading the application.
                        </p>
                        <div className="mt-4 max-h-40 w-full overflow-auto rounded bg-slate-900 p-2 text-left font-mono text-xs text-red-200">
                            {this.state.error?.toString()}
                            {this.state.error?.stack && (
                                <div className="mt-2 text-slate-500">
                                    {this.state.error.stack}
                                </div>
                            )}
                        </div>
                        <button
                            onClick={() => window.location.reload()}
                            className="mt-4 rounded bg-red-600 px-4 py-2 font-bold text-white hover:bg-red-700"
                        >
                            Reload Page
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
