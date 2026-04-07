// src/components/Dashboard/Footer/Footer.jsx
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import { usePartnerConfig } from "../../../hooks/usePartnerConfig";

const API_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_URL;

const Footer = () => {
  const [partnerName, setPartnerName] = useState(null);
  const [loading, setLoading] = useState(false);
  const [apiPartnerData, setApiPartnerData] = useState(null);

  // Safe Redux access (works even if auth state doesn't exist)
  const whiteLabelInfo = useSelector((state) => state.auth?.whiteLabelInfo);
  const { config: partnerConfig, loading: partnerConfigLoading } =
    usePartnerConfig();

  const hostName = window.location.hostname;

  useEffect(() => {
    const detectPartner = async () => {
      // Skip if we already have partner info from Redux or partnerConfig
      if (whiteLabelInfo?.partnerName || partnerConfig?.name) {
        return;
      }

      // Check localStorage first
      const cachedPartnerName = localStorage.getItem(
        "whitelabelled_customer_partnername",
      );
      if (cachedPartnerName) {
        setPartnerName(cachedPartnerName);
        return;
      }

      // Check if we already have partner data from the slice
      const storedPartnerDetails = localStorage.getItem("partnerDetails");
      if (storedPartnerDetails) {
        try {
          const details = JSON.parse(storedPartnerDetails);
          if (details?.profile?.name) {
            setPartnerName(details.profile.name);
            return;
          }
        } catch (e) {
          console.error("Error parsing stored partner details:", e);
        }
      }

      // Fetch partner details from API
      try {
        setLoading(true);
        const payload = { hostName };
        const res = await axios.post(
          `${API_URL}/partners/detail-by-slug`,
          payload,
        );

        if (res.data?.data?.name) {
          const detectedPartnerName = res.data.data.name;
          // Store in multiple locations for consistency
          localStorage.setItem(
            "whitelabelled_customer_partnername",
            detectedPartnerName,
          );
          localStorage.setItem("partner_name", detectedPartnerName);
          setPartnerName(detectedPartnerName);
          setApiPartnerData(res.data.data);

          console.log("✅ Partner detected:", detectedPartnerName);
        } else if (res.data?.partner_name) {
          // Fallback for different response structure
          const detectedPartnerName = res.data.partner_name;
          localStorage.setItem(
            "whitelabelled_customer_partnername",
            detectedPartnerName,
          );
          localStorage.setItem("partner_name", detectedPartnerName);
          setPartnerName(detectedPartnerName);

          console.log(
            "✅ Partner detected (alternative format):",
            detectedPartnerName,
          );
        }
      } catch (error) {
        console.error("Error detecting partner:", error);
      } finally {
        setLoading(false);
      }
    };

    detectPartner();
  }, [hostName, whiteLabelInfo, partnerConfig]);

  // Get partner name with proper priority
  const getDisplayPartnerName = () => {
    // Priority 1: From Redux auth state
    if (
      whiteLabelInfo?.partnerName &&
      whiteLabelInfo.partnerName !== "Loading..."
    ) {
      return whiteLabelInfo.partnerName;
    }

    // Priority 2: From partnerConfig hook
    if (partnerConfig?.name && partnerConfig.name !== "Loading...") {
      return partnerConfig.name;
    }

    // Priority 3: From API data state
    if (apiPartnerData?.name) {
      return apiPartnerData.name;
    }

    // Priority 4: From partnerName state
    if (partnerName && partnerName !== "Loading...") {
      return partnerName;
    }

    // Priority 5: From localStorage (multiple possible keys)
    const storedName =
      localStorage.getItem("partner_name") ||
      localStorage.getItem("whitelabelled_customer_partnername") ||
      localStorage.getItem("whitelabelled_customer_name");

    if (storedName && storedName !== "Loading...") {
      return storedName;
    }

    // Priority 6: Default fallback
    return "Unlimited Remit";
  };

  const displayPartnerName = getDisplayPartnerName();

  // Determine if we're still loading (but don't show loading if we have a name)
  const isLoading =
    (loading || partnerConfigLoading) &&
    !displayPartnerName &&
    displayPartnerName !== "Unlimited Remit";

  return (
    <footer className="w-full mt-auto">
      <div className="px-6 py-2 text-center w-full bg-gray-800 text-white">
        {isLoading ? (
          <div className="flex items-center justify-center">
            <span className="mr-2">Loading</span>
            <div className="flex space-x-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-1 h-1 bg-current rounded-full animate-pulse"
                  style={{ animationDelay: `${i * 0.2}s` }}
                ></div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-xs">
            &copy; {new Date().getFullYear()} {displayPartnerName}. All rights
            reserved.
          </p>
        )}
      </div>
    </footer>
  );
};

export default Footer;
