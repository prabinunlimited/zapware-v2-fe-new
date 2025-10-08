// src/components/UnauthorizedRedirect.jsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

const UnauthorizedRedirect = ({ message = "Unauthorized Access" }) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    // If somehow authenticated while on this page, redirect to home
    if (isAuthenticated) {
      navigate("/", { replace: true });
      return;
    }

    const timer = setTimeout(() => {
      navigate("/", { replace: true });
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigate, isAuthenticated]);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
      <div className="p-6 bg-white rounded-lg shadow-md text-center">
        <h2 className="text-red-500 text-2xl font-bold mb-4">{message}</h2>
        <p className="text-gray-700 mb-2">
          You don't have permission to access this page.
        </p>
        <p className="text-gray-500">Redirecting to login page...</p>
      </div>
    </div>
  );
};

export default UnauthorizedRedirect;