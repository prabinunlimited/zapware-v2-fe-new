// src/components/PartnerFetchManager.jsx
import { useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { tokenService } from "../services/authService";
import { centralizedApi } from "../services/api";

/**
 * SINGLE SOURCE OF TRUTH for partner data fetching
 * This component should be mounted ONCE at the app root
 * Prevents multiple components from fetching the same data
 */
const PartnerFetchManager = () => {
  const dispatch = useDispatch();
  const hasFetchedRef = useRef(false);
  const fetchPromiseRef = useRef(null);

  useEffect(() => {
    // Prevent multiple fetches
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    const fetchPartnerData = async () => {
      // Prevent concurrent fetches
      if (fetchPromiseRef.current) {
        return fetchPromiseRef.current;
      }

      console.log("🚀 PartnerFetchManager: Starting single partner data fetch");

      fetchPromiseRef.current = (async () => {
        try {
          const hostname = window.location.hostname;
          const partnerId = tokenService.getPartnerId();

          // Only fetch if we're on a partner domain
          if (
            hostname.includes("unlimitedremit.com") ||
            hostname !== "localhost"
          ) {
            // 1. Get partner details
            try {
              await centralizedApi.getPartnerByHostname(hostname);
              console.log("✅ PartnerFetchManager: Partner details fetched");
            } catch (error) {
              console.warn(
                "⚠️ PartnerFetchManager: Partner details fetch failed",
                error.message,
              );
            }

            // 2. Get partner basic setup if we have partner ID
            if (partnerId) {
              try {
                await centralizedApi.getPartnerBasicSetup(partnerId);
                console.log(
                  "✅ PartnerFetchManager: Partner basic setup fetched",
                );
              } catch (error) {
                console.warn(
                  "⚠️ PartnerFetchManager: Partner setup fetch failed",
                  error.message,
                );
              }
            }
          }

          console.log("✅ PartnerFetchManager: All partner data fetched");
        } catch (error) {
          console.error("❌ PartnerFetchManager: Fatal error", error);
        } finally {
          fetchPromiseRef.current = null;
        }
      })();

      return fetchPromiseRef.current;
    };

    fetchPartnerData();
  }, []);

  // This component renders nothing
  return null;
};

export default PartnerFetchManager;
