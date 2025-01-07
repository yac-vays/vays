import React, { ErrorInfo } from 'react';
import { showError } from '../../../../controller/local/ErrorNotifyController';
import { logError } from '../../../../utils/logger';

interface FormsErrorBoundaryState {
  hasError: boolean;
}

class FormsErrorBoundary extends React.Component<
  { children: React.ReactNode },
  FormsErrorBoundaryState
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: string) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Example "componentStack":
    //   in ComponentThatThrows (created by App)
    //   in ErrorBoundary (created by App)
    //   in div (created by App)
    //   in App
    this.setState({ hasError: true });

    showError(
      'YAC Configuration Error: Faulty Schema',
      'Please contact your admin. Sorry for any inconveniences.',
    );
    logError(
      'Forms could not be rendererd. The error log is \n\n' + info.componentStack.toString(),
      'JSON Schema; Edit View',
    );
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return <div></div>;
    }

    return this.props.children;
  }
}
export default FormsErrorBoundary;
