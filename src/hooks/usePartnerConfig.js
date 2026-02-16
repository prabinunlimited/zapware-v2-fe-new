// src/hooks/usePartnerConfig.js - SINGLE SOURCE OF TRUTH
import { useEffect, useState, useCallback, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  selectPartnerBasicConfig,
  selectPartnerBasicConfigLoading,
  selectPartnerDetails,
  selectPartnerDetailsLoading,
  selectHeaderColor,
  selectTextColor,
  selectDownloadManualEnabled,
  selectWhiteLabelledPartnerId,
  selectPartnerLogo,
  selectPartnerName,
  selectIsWhiteLabelledPartner,
  selectPartnerUUID,
  selectIsPartnerPackageModule,
  selectShowRemittanceOnlyOnRegistration,
  selectBeneficiaryPortalTitle,
  syncWithLocalStorage,
  fetchPartnerBasicSetup,
  fetchPartnerDetails,
} from "../features/Auth/slices/partnerSlice";

// Import default logo
import DefaultLogo from "../assets/images/Logo/unlimited remit logo.png";

export const usePartnerConfig = () => {
  const dispatch = useDispatch();
  const hasInitialized = useRef(false);

  // Redux selectors
  const config = useSelector(selectPartnerBasicConfig);
  const configLoading = useSelector(selectPartnerBasicConfigLoading);
  const partnerDetails = useSelector(selectPartnerDetails);
  const partnerDetailsLoading = useSelector(selectPartnerDetailsLoading);
  const headerColor = useSelector(selectHeaderColor);
  const textColor = useSelector(selectTextColor);
  const downloadManualEnabled = useSelector(selectDownloadManualEnabled);
  const reduxPartnerId = useSelector(selectWhiteLabelledPartnerId);
  const reduxLogoUrl = useSelector(selectPartnerLogo);
  const reduxPartnerName = useSelector(selectPartnerName);
  const isWhiteLabelledPartner = useSelector(selectIsWhiteLabelledPartner);
  const partnerUUID = useSelector(selectPartnerUUID);
  const isPartnerPackageModule = useSelector(selectIsPartnerPackageModule);
  const showRemittanceOnlyOnRegistration = useSelector(
    selectShowRemittanceOnlyOnRegistration,
  );
  const beneficiaryPortalTitle = useSelector(selectBeneficiaryPortalTitle);

  // Local state for immediate UI feedback
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  // SINGLE initialization effect - runs ONCE
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const initializePartnerData = async () => {
      try {
        console.log("🚀 usePartnerConfig: Initializing...");

        // Step 1: Sync Redux with localStorage (authService already populated this)
        dispatch(syncWithLocalStorage());

        // Step 2: Check if we already have partner data
        const partnerId = localStorage.getItem("whitelabelledpartnerid");
        const hasLogo = !!localStorage.getItem("partner_logo");
        const hasPartnerName = !!localStorage.getItem("partner_name");

        console.log("🔍 usePartnerConfig: Initial state:", {
          partnerId,
          hasLogo,
          hasPartnerName,
          configExists: !!config,
          detailsExist: !!partnerDetails,
        });

        // Step 3: Only fetch if we're missing critical data
        if (partnerId && partnerId !== "0") {
          const promises = [];

          // Only fetch basic setup if we don't have it
          if (!config) {
            promises.push(dispatch(fetchPartnerBasicSetup()).unwrap());
          }

          // Only fetch partner details if we don't have logo
          if (!hasLogo) {
            promises.push(dispatch(fetchPartnerDetails()).unwrap());
          }

          if (promises.length > 0) {
            console.log(
              `🔄 usePartnerConfig: Fetching ${promises.length} missing data types`,
            );
            await Promise.allSettled(promises);
          }
        }

        setHasLoaded(true);
        console.log("✅ usePartnerConfig: Initialization complete");
      } catch (err) {
        console.error("❌ usePartnerConfig: Initialization error:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    initializePartnerData();
  }, [dispatch, config, partnerDetails]);

  // Determine actual loading state
  const actualLoading = useCallback(() => {
    // If we have the data, don't show loading even if Redux says it's loading
    if (hasLoaded) return false;

    // Otherwise, use Redux loading states
    return configLoading || partnerDetailsLoading || isLoading;
  }, [configLoading, partnerDetailsLoading, isLoading, hasLoaded]);

  // Get final logo URL with fallbacks
  const getFinalLogoUrl = useCallback(() => {
    // Priority order:
    // 1. Redux logo (from partner details)
    // 2. localStorage (set by authService)
    // 3. Default logo

    if (
      reduxLogoUrl &&
      reduxLogoUrl !== "null" &&
      reduxLogoUrl !== "undefined"
    ) {
      return reduxLogoUrl;
    }

    const storedLogo = localStorage.getItem("partner_logo");
    if (storedLogo && storedLogo !== "null" && storedLogo !== "undefined") {
      return storedLogo;
    }

    return DefaultLogo;
  }, [reduxLogoUrl]);

  // Get final partner name with fallbacks
  const getFinalPartnerName = useCallback(() => {
    // Priority order:
    // 1. Redux partner name
    // 2. localStorage (set by authService)
    // 3. Default

    if (
      reduxPartnerName &&
      reduxPartnerName !== "Partner Portal" &&
      reduxPartnerName !== "null" &&
      reduxPartnerName !== "undefined"
    ) {
      return reduxPartnerName;
    }

    const storedName = localStorage.getItem("partner_name");
    if (
      storedName &&
      storedName !== "Partner Portal" &&
      storedName !== "null" &&
      storedName !== "undefined"
    ) {
      return storedName;
    }

    const oldStoredName = localStorage.getItem(
      "whitelabelled_customer_partnername",
    );
    if (
      oldStoredName &&
      oldStoredName !== "Partner Portal" &&
      oldStoredName !== "null" &&
      oldStoredName !== "undefined"
    ) {
      return oldStoredName;
    }

    return "Partner Portal";
  }, [reduxPartnerName]);

  // Refresh functions
  const refreshBasicConfig = useCallback(() => {
    const partnerId = localStorage.getItem("whitelabelledpartnerid");
    if (partnerId && partnerId !== "0") {
      console.log("🔄 Manually refreshing partner basic config");
      dispatch(fetchPartnerBasicSetup());
    }
  }, [dispatch]);

  const refreshPartnerDetails = useCallback(() => {
    const partnerId = localStorage.getItem("whitelabelledpartnerid");
    if (partnerId && partnerId !== "0") {
      console.log("🔄 Manually refreshing partner details");
      dispatch(fetchPartnerDetails());
    }
  }, [dispatch]);

  const refreshAll = useCallback(() => {
    console.log("🔄 Manually refreshing all partner data");
    refreshBasicConfig();
    refreshPartnerDetails();
  }, [refreshBasicConfig, refreshPartnerDetails]);

  const syncWithAuthService = useCallback(() => {
    console.log("🔄 Syncing with authService data");
    dispatch(syncWithLocalStorage());
  }, [dispatch]);

  // Get partner ID
  const getPartnerId = useCallback(() => {
    return (
      reduxPartnerId || localStorage.getItem("whitelabelledpartnerid") || "0"
    );
  }, [reduxPartnerId]);

  // Get is white labelled
  const getIsWhiteLabelled = useCallback(() => {
    return (
      isWhiteLabelledPartner === "Y" ||
      isWhiteLabelledPartner === "1" ||
      localStorage.getItem("is_white_labelled_partner") === "1" ||
      localStorage.getItem("iswhitelabelledpartner") === "Y"
    );
  }, [isWhiteLabelledPartner]);

  return {
    // Config
    config,
    loading: actualLoading(),
    error: error || null,

    // UI properties
    headerColor,
    textColor,
    downloadManualEnabled,

    // Partner identity
    logoUrl: getFinalLogoUrl(),
    logoAltText: getFinalPartnerName(),
    partnerName: getFinalPartnerName(),
    partnerId: getPartnerId(),
    hasLogo: !!getFinalLogoUrl() && getFinalLogoUrl() !== DefaultLogo,

    // Partner flags
    isWhiteLabelledPartner: getIsWhiteLabelled(),
    partnerUUID: partnerUUID || localStorage.getItem("partner_uuid") || "",
    isPartnerPackageModule:
      isPartnerPackageModule === "Y" ||
      localStorage.getItem("isPartnerPackageModule") === "Y",
    showRemittanceOnlyOnRegistration:
      showRemittanceOnlyOnRegistration === "Y" ||
      localStorage.getItem("showRemittanceOnlyOnRegistration") === "Y",
    beneficiaryPortalTitle:
      beneficiaryPortalTitle ||
      localStorage.getItem("beneficiary_portal_title") ||
      "Beneficiary Portal",

    // Actions
    refresh: refreshAll,
    refreshBasicConfig,
    refreshPartnerDetails,
    syncWithAuthService,

    // Status
    isConfigured: !!config,
    hasValidConfig: !!(config?.header_color || config?.text_color),
    hasPartnerDetails: !!partnerDetails,
    hasLoaded,

    // Debug
    debugInfo: {
      partnerId: getPartnerId(),
      partnerName: getFinalPartnerName(),
      hasLogo: !!getFinalLogoUrl(),
      logoUrl: getFinalLogoUrl(),
      hasConfig: !!config,
      hasDetails: !!partnerDetails,
      isWhiteLabelled: getIsWhiteLabelled(),
      configLoading,
      partnerDetailsLoading,
      hasLoaded,
      error,
    },
  };
};

export default usePartnerConfig;
