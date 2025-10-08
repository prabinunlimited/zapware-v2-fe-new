// src/features/Auth/Unauthorized/UnauthorizedRedirect.jsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const UnauthorizedRedirect = ({ message = "Unauthorized Access" }) => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to login after a short delay
    const timer = setTimeout(() => {
      navigate("/", { replace: true });
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-red-600 mb-2">{message}</h1>
        <p className="text-gray-600">Redirecting to login page...</p>
      </div>
    </div>
  );
};

export default UnauthorizedRedirect;
