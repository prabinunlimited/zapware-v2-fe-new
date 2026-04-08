// src/components/AppInitializer.jsx
import React, { useEffect, useRef, useState } from "react";
import { RingLoader } from "react-spinners";
import { initializeAppWithPartnerData } from "../services/authService";

const AppInitializer = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState(null);

  const hasInitializedRef = useRef(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    const initApp = async () => {
      try {
        console.log("🚀 AppInitializer: Starting initialization...");

        await initializeAppWithPartnerData();

        if (!isMountedRef.current) return;

        console.log("✅ AppInitializer: Initialization complete");
      } catch (error) {
        console.error("❌ AppInitializer: Initialization failed:", error);
        if (isMountedRef.current) {
          setInitError(error?.message || "Initialization failed");
        }
      } finally {
        if (isMountedRef.current) {
          setIsInitialized(true);
        }
      }
    };

    initApp();
  }, []);

  // 🔄 Loader
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50">
        <RingLoader
          color="#2563eb" // tailwind blue-600
          size={80}
          speedMultiplier={1.2}
        />
        <p className="mt-6 text-gray-600 font-medium">Initializing app...</p>
        <p className="text-sm text-gray-500 mt-1">
          Loading partner configuration
        </p>
      </div>
    );
  }

  if (initError && process.env.NODE_ENV === "development") {
    console.warn("⚠️ Initialization warning:", initError);
  }

  return children;
};

export default AppInitializer;
