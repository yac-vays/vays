import React, { ErrorInfo } from 'react';
import { showError } from '../../../../controller/local/ErrorNotifyController';

interface FormsErrorBoundaryState {
  hasError: boolean;
}

/**
 * A React component that acts as an error boundary for the form component.
 * It catches JavaScript errors anywhere in its child component tree,
 * logs those errors, and displays a fallback UI instead of the component tree that crashed.
 *
 *
 * @param {Object} props - The properties object.
 * @param {React.ReactNode} props.children - The child components to be rendered within the error boundary.
 *
 * @typedef {Object} FormsErrorBoundaryState
 * @property {boolean} hasError - Indicates whether an error has been caught.
 *
 * @class
 * @extends {React.Component<{ children: React.ReactNode }, FormsErrorBoundaryState>}
 * @component
 *
 * @method static getDerivedStateFromError - Updates the state to indicate an error has been caught.
 * @method componentDidCatch - Handles the error by updating the state, showing an error message, and logging the error.
 * @method render - Renders the fallback UI if an error has been caught, otherwise renders the child components.
 */
class FormsErrorBoundary extends React.Component<
  { children: React.ReactNode },
  FormsErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(_error: Error, info: ErrorInfo) {
    this.setState({ hasError: true });

    showError(
      'YAC Configuration Error: Faulty Schema',
      'Please contact your admin. Sorry for any inconveniences.',
    );
    console.error(
      'EDIT VIEW CRITICAL: Forms could not be rendererd. The error log is \n\n' +
        info.componentStack.toString(),
      'JSON Schema; Edit View',
    );
  }

  render() {
    if (this.state.hasError) {
      return <div></div>;
    }

    return this.props.children;
  }
}
export default FormsErrorBoundary;
