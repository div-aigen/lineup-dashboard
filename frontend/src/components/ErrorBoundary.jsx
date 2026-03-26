import { Component } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-brand-bg grid-bg flex items-center justify-center">
          <div className="glass-panel rounded-md p-8 max-w-md text-center animate-fade-in">
            <AlertTriangle className="w-12 h-12 text-brand-danger mx-auto mb-4" />
            <h2 className="font-heading text-xl font-bold uppercase tracking-tight text-brand-text mb-2">
              Something went wrong
            </h2>
            <p className="text-brand-muted text-sm mb-6">
              {this.state.error?.message || "An unexpected error occurred."}
            </p>
            <button
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 bg-brand-primary text-brand-primary-fg font-bold uppercase tracking-wide rounded-sm px-6 py-2.5 text-sm hover:bg-brand-primary/90 transition-colors"
            >
              <RefreshCw size={14} />
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
