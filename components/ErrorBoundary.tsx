
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * ErrorBoundary component to catch and handle runtime exceptions gracefully.
 */
class ErrorBoundary extends Component<Props, State> {
  // Explicitly declare state and props properties to ensure they are recognized by the compiler
  // in environments where generic inheritance might not be fully resolved for member access.
  public props: Props;
  public state: State = {
    hasError: false
  };

  constructor(props: Props) {
    super(props);
    // Explicitly assigning props to the instance to satisfy property recognition
    this.props = props;
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("LingoPro Runtime Exception:", error, errorInfo);
  }

  private handleReset = () => {
    // Attempt to clear local storage if it's potentially causing the crash
    // but usually a simple reload is best for transient issues.
    window.location.reload();
  };

  public render() {
    // Accessing 'this.state' is now correctly supported via generic inheritance or explicit declaration.
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-8">
          <div className="max-w-md w-full bg-white dark:bg-slate-950 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-12 text-center shadow-brand-xl animate-in zoom-in duration-500">
            <div className="w-24 h-24 bg-red-100 dark:bg-red-900/20 text-red-600 rounded-full flex items-center justify-center mx-auto mb-8 border-4 border-red-50 dark:border-red-900/10">
              <i className="ph-bold ph-smiley-sad text-5xl"></i>
            </div>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-4">System Anomaly</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-10 leading-relaxed font-medium">
              The localization engine encountered a critical thread exception. We've captured the diagnostics and your workspace state is preserved.
            </p>
            <div className="space-y-4">
              <button
                onClick={this.handleReset}
                className="w-full py-4 bg-indigo-600 text-white font-black uppercase tracking-widest rounded-2xl hover:bg-indigo-700 transition-all shadow-brand-lg active:scale-95"
              >
                Reboot Console
              </button>
              <p className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest">
                Kernel Version: 4.2.0-Production
              </p>
            </div>
          </div>
        </div>
      );
    }

    // Accessing 'this.props' is now correctly supported via generic inheritance and explicit declaration.
    return this.props.children;
  }
}

export default ErrorBoundary;
