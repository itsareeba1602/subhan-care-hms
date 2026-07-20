import { Component } from 'react';
import { AlertTriangle } from 'lucide-react';
import Button from './Button';
import './ErrorBoundary.css';

// Class component is required here — React only supports catching render
// errors via getDerivedStateFromError/componentDidCatch, there's no Hook
// equivalent. Wraps <App /> in main.jsx so any uncaught error anywhere in
// the tree (a bad API response shape, a null-reference bug, a third-party
// component crash) shows a recoverable screen instead of the blank white
// page a React error unwinds to by default — this is the 500-equivalent
// "Error Pages" deliverable for a frontend-only app with no backend to
// return an actual HTTP 500.
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // MOCK ONLY: with a real backend this reports to an error-tracking
    // service (Sentry, etc.) instead of just the browser console.
    console.error('Unhandled application error:', error, info);
  }

  handleReload = () => {
    this.setState({ hasError: false });
    window.location.href = '/dashboard';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary-page">
          <AlertTriangle size={40} className="error-boundary-icon" aria-hidden="true" />
          <h1 className="error-boundary-title">Something went wrong</h1>
          <p className="error-boundary-text">
            An unexpected error occurred. This has been logged — try going back to the dashboard, and if it keeps happening, let your administrator know.
          </p>
          <Button onClick={this.handleReload}>Back to dashboard</Button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
