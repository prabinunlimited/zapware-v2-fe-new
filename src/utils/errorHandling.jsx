/**
 * Utility function to safely extract error messages from various error formats
 */
export const extractErrorMessage = (error) => {
    if (!error) return "An unexpected error occurred";
    
    // Handle string errors
    if (typeof error === 'string') return error;
    
    // Handle Error objects
    if (error instanceof Error) return error.message;
    
    // Handle objects with message property
    if (error.message) {
      if (typeof error.message === 'string') return error.message;
      if (typeof error.message === 'object') return JSON.stringify(error.message);
    }
    
    // Handle Redux Toolkit rejected actions
    if (error.payload) {
      if (typeof error.payload === 'string') return error.payload;
      if (error.payload.message) return error.payload.message;
    }
    
    // Handle API response errors
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    
    // Handle Axios errors
    if (error.request && !error.response) {
      return "No response from server. Please check your connection.";
    }
    
    // Fallback - stringify the error
    try {
      return JSON.stringify(error);
    } catch {
      return "An unexpected error occurred";
    }
  };
  
  /**
   * Safe error display for React components
   */
  export const SafeErrorDisplay = ({ error, className = "text-red-500 text-center p-4" }) => {
    const errorMessage = extractErrorMessage(error);
    return <div className={className}>{errorMessage}</div>;
  };
  
  /**
   * Validate if value can be safely rendered in JSX
   */
  export const canRenderSafely = (value) => {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return true;
    if (React.isValidElement(value)) return true;
    return false;
  };