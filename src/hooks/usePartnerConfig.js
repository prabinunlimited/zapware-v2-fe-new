// src/hooks/usePartnerConfig.js - UPDATED FOR authService INTEGRATION
import { useSelector, useDispatch } from "react-redux";
import { useEffect, useRef, useMemo, useState, useCallback } from "react";
import {
  fetchPartnerBasicSetup,
  fetchPartnerDetails,
  syncWithLocalStorage,
  selectPartnerBasicConfig,
  selectPartnerBasicConfigLoading,
  selectPartnerBasicConfigError,
  selectPartnerDetails,
  selectPartnerDetailsLoading,
  selectPartnerDetailsError,
  selectHeaderColor,
  selectTextColor,
  selectDownloadManualEnabled,
  selectWhiteLabelledPartnerId,
  selectPartnerLogo,
  selectPartnerName,
  selectHasPartnerLogo,
  selectIsPartnerPackageModule,
  selectShowRemittanceOnlyOnRegistration,
  selectBeneficiaryPortalTitle,
  selectPartnerUUID,
} from "../features/Auth/slices/partnerSlice";

// Import default logo
import DefaultLogo from "../assets/images/Logo/unlimited remit logo.png";

// Helper function with retry logic
const fetchWithRetry = async (fetchFunction, maxRetries = 3, delay = 2000) => {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await fetchFunction();
      console.log(`✅ Fetch attempt ${attempt} succeeded`);
      return result;
    } catch (error) {
      lastError = error;
      console.warn(`⚠️ Fetch attempt ${attempt} failed:`, error.message);

      if (attempt < maxRetries) {
        console.log(`⏳ Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        // Exponential backoff
        delay *= 1.5;
      }
    }
  }

  throw lastError || new Error("All retry attempts failed");
};

// Helper to check if authService has already stored partner data
const hasAuthServiceData = () => {
  const partnerId = localStorage.getItem("whitelabelledpartnerid");
  const isWhiteLabelled =
    localStorage.getItem("is_white_labelled_partner") ||
    localStorage.getItem("iswhitelabelledpartner");

  return !!(
    partnerId &&
    partnerId !== "0" &&
    partnerId !== "null" &&
    isWhiteLabelled
  );
};

// Helper to get authService data
const getAuthServiceData = () => {
  return {
    is_white_labelled_partner:
      localStorage.getItem("is_white_labelled_partner") || "N",
    partner_id: localStorage.getItem("whitelabelledpartnerid") || "0",
    partner_uuid: localStorage.getItem("partner_uuid") || "",
    isPartnerPackageModule:
      localStorage.getItem("isPartnerPackageModule") || "N",
    showRemittanceOnlyOnRegistration:
      localStorage.getItem("showRemittanceOnlyOnRegistration") || "N",
    beneficiary_portal_title:
      localStorage.getItem("beneficiary_portal_title") || "",
    partner_name: localStorage.getItem("partner_name") || "",
  };
};

// Main hook with fixes
export const usePartnerConfig = () => {
  const dispatch = useDispatch();

  // Use a stable mount ID
  const mountId = useMemo(() => {
    return `mount-${Math.random().toString(36).substr(2, 9)}-${Date.now()}`;
  }, []);

  // Use refs for tracking state
  const hasRunInitialEffect = useRef(false);
  const fetchTimeoutRef = useRef(null);
  const retryCount = useRef(0);

  // Memoize token and partner ID with validation
  const authtoken = useMemo(() => {
    try {
      const bearertoken = localStorage.getItem("bearertoken");
      const authtoken = localStorage.getItem("authtoken");

      const isValidToken = (token) =>
        token &&
        token !== "undefined" &&
        token !== "null" &&
        token !== "false" &&
        typeof token === "string" &&
        token.length > 10;

      if (isValidToken(bearertoken)) return bearertoken;
      if (isValidToken(authtoken)) return authtoken;
      return null;
    } catch (error) {
      console.error("Error getting auth token:", error);
      return null;
    }
  }, []);

  const partnerId = useMemo(() => {
    try {
      // First check the primary key from authService
      let partnerId = localStorage.getItem("whitelabelledpartnerid");

      if (!partnerId || partnerId === "0") {
        // Fallback to old key
        partnerId = localStorage.getItem("whitelabelled_customer_partnerid");
        if (partnerId && partnerId !== "0") {
          localStorage.setItem("whitelabelledpartnerid", partnerId);
        }
      }

      return partnerId;
    } catch (error) {
      console.error("Error getting partner ID:", error);
      return null;
    }
  }, []);

  // Redux selectors - ADD NEW SELECTORS
  const config = useSelector(selectPartnerBasicConfig);
  const configLoading = useSelector(selectPartnerBasicConfigLoading);
  const configError = useSelector(selectPartnerBasicConfigError);

  const partnerDetails = useSelector(selectPartnerDetails);
  const partnerDetailsLoading = useSelector(selectPartnerDetailsLoading);
  const partnerDetailsError = useSelector(selectPartnerDetailsError);

  const headerColor = useSelector(selectHeaderColor);
  const textColor = useSelector(selectTextColor);
  const downloadManualEnabled = useSelector(selectDownloadManualEnabled);
  const reduxPartnerId = useSelector(selectWhiteLabelledPartnerId);
  const logoUrl = useSelector(selectPartnerLogo);
  const partnerName = useSelector(selectPartnerName);
  const hasLogo = useSelector(selectHasPartnerLogo);

  // NEW: Selectors for authService fields
  const isPartnerPackageModule = useSelector(selectIsPartnerPackageModule);
  const showRemittanceOnlyOnRegistration = useSelector(
    selectShowRemittanceOnlyOnRegistration
  );
  const beneficiaryPortalTitle = useSelector(selectBeneficiaryPortalTitle);
  const partnerUUID = useSelector(selectPartnerUUID);

  // Local state
  const [isFetching, setIsFetching] = useState(false);
  const [localLogoUrl, setLocalLogoUrl] = useState(null);
  const [localPartnerName, setLocalPartnerName] = useState(null);
  const [isInitialFetchComplete, setIsInitialFetchComplete] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [hasAuthServiceLoaded, setHasAuthServiceLoaded] = useState(false);

  // Check if authService has loaded partner data
  useEffect(() => {
    const checkAuthServiceData = () => {
      const hasData = hasAuthServiceData();
      setHasAuthServiceLoaded(hasData);

      if (hasData) {
        console.log(`✅ ${mountId}: authService has loaded partner data`);
        // Sync Redux with localStorage
        dispatch(syncWithLocalStorage());
      }
    };

    checkAuthServiceData();

    // Listen for storage changes (in case authService updates localStorage later)
    const handleStorageChange = (e) => {
      if (
        e.key === "whitelabelledpartnerid" ||
        e.key === "is_white_labelled_partner"
      ) {
        checkAuthServiceData();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [dispatch, mountId]);

  // Check localStorage for fallback values - UPDATED
  useEffect(() => {
    if (!logoUrl) {
      const storedLogo = localStorage.getItem("partner_logo");
      if (storedLogo) {
        setLocalLogoUrl(storedLogo);
      }
    }

    if (!partnerName || partnerName === "Partner Portal") {
      // Check multiple sources for partner name
      const sources = [
        localStorage.getItem("partner_name"), // New authService key
        localStorage.getItem("whitelabelled_customer_partnername"), // Old key
        localStorage.getItem("hostname_partner_name"), // Alternative key
      ];

      for (const source of sources) {
        if (
          source &&
          source !== "Partner Portal" &&
          source !== "undefined" &&
          source !== "null"
        ) {
          setLocalPartnerName(source);
          break;
        }
      }
    }
  }, [logoUrl, partnerName]);

  // ========== UPDATED FETCH LOGIC ==========
  useEffect(() => {
    // Clear any existing timeout
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
      fetchTimeoutRef.current = null;
    }

    fetchTimeoutRef.current = setTimeout(() => {
      const currentPartnerId = localStorage.getItem("whitelabelledpartnerid");
      const isWhiteLabelled = localStorage.getItem("is_white_labelled_partner");

      console.log(`🔍 ${mountId}: Partner fetch check:`, {
        partnerId: currentPartnerId,
        isWhiteLabelled: isWhiteLabelled,
        hasAuthServiceData: hasAuthServiceData(),
        hostname: window.location.hostname,
      });

      // ✅ Check if we should fetch at all
      const shouldFetch =
        currentPartnerId &&
        currentPartnerId !== "0" &&
        currentPartnerId !== "undefined" &&
        currentPartnerId !== "null";

      if (!shouldFetch) {
        console.log(`⏳ ${mountId}: No valid partner ID found, skipping fetch`);
        setIsInitialFetchComplete(true);
        return;
      }

      // ✅ IMPORTANT: Sync Redux with localStorage first (authService may have updated it)
      dispatch(syncWithLocalStorage());

      // ✅ Check cache validity
      const isCacheValid = (cacheTimestampKey, maxAge = 300000) => {
        try {
          const timestamp = localStorage.getItem(cacheTimestampKey);
          if (!timestamp) return false;
          const age = Date.now() - parseInt(timestamp);
          return age < maxAge;
        } catch {
          return false;
        }
      };

      const cachedConfig = localStorage.getItem("partnerConfig");
      const cachedDetails = localStorage.getItem("partnerDetails");

      const isConfigCacheValid = isCacheValid("partnerConfigTimestamp");
      const isDetailsCacheValid = isCacheValid("partnerDetailsTimestamp");

      // ✅ Check if we have fresh cache
      const hasFreshCache =
        cachedConfig &&
        cachedDetails &&
        isConfigCacheValid &&
        isDetailsCacheValid;

      // ✅ Check if we already have partner data from authService
      const hasCompleteAuthServiceData = hasAuthServiceData();

      // ✅ DECISION: Should we fetch fresh data?
      // We'll fetch if:
      // 1. We don't have fresh cache AND
      // 2. We need additional data (colors, logo, etc.)
      const shouldFetchFreshData =
        !hasFreshCache || !localStorage.getItem("partner_logo");

      if (!shouldFetchFreshData && hasCompleteAuthServiceData) {
        console.log(`📦 ${mountId}: Using cached data + authService data`);
        setIsInitialFetchComplete(true);
        return;
      }

      // ✅ Fetch fresh data
      console.log(
        `🚀 ${mountId}: Fetching partner data for ID ${currentPartnerId}`
      );
      setIsFetching(true);

      const fetchData = async () => {
        try {
          // Fetch basic setup and details in parallel
          await Promise.allSettled([
            dispatch(fetchPartnerBasicSetup()).unwrap(),
            dispatch(fetchPartnerDetails()).unwrap(),
          ]);

          console.log(
            `✅ ${mountId}: Partner data fetched for ID ${currentPartnerId}`
          );
        } catch (error) {
          console.error(
            `❌ ${mountId}: Fetch error for partner ${currentPartnerId}:`,
            error.message
          );
          setFetchError(error.message || "Fetch failed");

          // Even if fetch fails, we might have authService data
          if (hasCompleteAuthServiceData) {
            console.log(`🔄 ${mountId}: Falling back to authService data`);
          }
        } finally {
          setIsFetching(false);
          setIsInitialFetchComplete(true);
        }
      };

      fetchData();
    }, 800); // Slightly longer delay to ensure authService has time

    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, [dispatch, mountId]);

  // Determine if we're actually loading
  const isLoading = useMemo(() => {
    // If we have authService data and initial fetch is complete, we're not loading
    if (hasAuthServiceLoaded && isInitialFetchComplete) return false;

    // Otherwise, show loading if any of these are true
    return configLoading || partnerDetailsLoading || isFetching;
  }, [
    configLoading,
    partnerDetailsLoading,
    isFetching,
    isInitialFetchComplete,
    hasAuthServiceLoaded,
  ]);

  // Get final values with fallbacks - UPDATED
  const finalLogoUrl = useMemo(() => {
    // Check multiple sources in priority order
    const sources = [
      localStorage.getItem("partner_logo"), // Primary source
      logoUrl, // From Redux
      localLogoUrl, // Local state
    ];

    for (const source of sources) {
      if (source && typeof source === "string" && source.length > 0) {
        return source;
      }
    }

    return null;
  }, [logoUrl, localLogoUrl]);

  // Get partner name with better fallbacks - UPDATED
  const finalPartnerName = useMemo(() => {
    // Check multiple sources in priority order
    const sources = [
      localStorage.getItem("partner_name"), // New authService key
      localStorage.getItem("hostname_partner_name"),
      partnerName, // From Redux
      localStorage.getItem("whitelabelled_customer_partnername"),
      localPartnerName, // Local state
      "Partner Portal", // Default
    ];

    for (const source of sources) {
      if (
        source &&
        source !== "Partner Portal" &&
        source !== "undefined" &&
        source !== "null" &&
        source.trim() !== ""
      ) {
        return source;
      }
    }

    return "Partner Portal";
  }, [partnerName, localPartnerName]);

  // Get beneficiary portal title
  const finalBeneficiaryPortalTitle = useMemo(() => {
    return (
      beneficiaryPortalTitle ||
      localStorage.getItem("beneficiary_portal_title") ||
      "Beneficiary Portal"
    );
  }, [beneficiaryPortalTitle]);

  // Return the default logo for fallback
  const getLogoFallback = () => {
    return DefaultLogo;
  };

  // Check if we should show remittance only
  const shouldShowRemittanceOnlyOnRegistration = useMemo(() => {
    return (
      showRemittanceOnlyOnRegistration === "Y" ||
      localStorage.getItem("showRemittanceOnlyOnRegistration") === "Y"
    );
  }, [showRemittanceOnlyOnRegistration]);

  // Check if partner package module is enabled
  const isPartnerPackageModuleEnabled = useMemo(() => {
    return (
      isPartnerPackageModule === "Y" ||
      localStorage.getItem("isPartnerPackageModule") === "Y"
    );
  }, [isPartnerPackageModule]);

  // Refresh functions - UPDATED
  const refreshBasicConfig = useCallback(() => {
    const partnerId = localStorage.getItem("whitelabelledpartnerid");
    if (partnerId && partnerId !== "0") {
      console.log(`🔃 ${mountId}: Manually refreshing partner basic config`);
      dispatch(fetchPartnerBasicSetup());
    }
  }, [dispatch, mountId]);

  const refreshPartnerDetails = useCallback(() => {
    const partnerId = localStorage.getItem("whitelabelledpartnerid");
    if (partnerId && partnerId !== "0") {
      console.log(`🔃 ${mountId}: Manually refreshing partner details`);
      dispatch(fetchPartnerDetails());
    }
  }, [dispatch, mountId]);

  const refreshAll = useCallback(() => {
    console.log(`🔄 ${mountId}: Manually refreshing all partner data`);
    refreshBasicConfig();
    refreshPartnerDetails();
  }, [refreshBasicConfig, refreshPartnerDetails]);

  // Sync with localStorage (useful when authService updates data)
  const syncWithAuthService = useCallback(() => {
    console.log(`🔄 ${mountId}: Syncing with authService data`);
    dispatch(syncWithLocalStorage());
  }, [dispatch, mountId]);

  // Return values - ENHANCED
  return {
    // Basic config
    config,
    loading: isLoading,
    error: configError || partnerDetailsError || fetchError,
    headerColor,
    textColor,
    downloadManualEnabled,

    // Partner details
    logoUrl: finalLogoUrl || getLogoFallback(),
    logoAltText: finalPartnerName,
    partnerName: finalPartnerName,
    partnerId: partnerId || reduxPartnerId,
    hasLogo: !!finalLogoUrl,

    // AuthService fields
    isWhiteLabelledPartner: hasAuthServiceData(),
    partnerUUID: partnerUUID || localStorage.getItem("partner_uuid") || "",
    isPartnerPackageModule: isPartnerPackageModuleEnabled,
    showRemittanceOnlyOnRegistration: shouldShowRemittanceOnlyOnRegistration,
    beneficiaryPortalTitle: finalBeneficiaryPortalTitle,

    // Refresh functions
    refresh: refreshAll,
    refreshBasicConfig,
    refreshPartnerDetails,
    syncWithAuthService,

    // Status flags
    isConfigured: !!config,
    hasValidConfig: !!(config && (config.header_color || config.text_color)),
    hasPartnerDetails: !!partnerDetails,
    isInitialFetchComplete,
    hasAuthServiceData: hasAuthServiceLoaded,

    // Debug info - ENHANCED
    debugInfo: {
      partnerId,
      partnerUUID: partnerUUID || localStorage.getItem("partner_uuid"),
      hasBasicConfig: !!config,
      hasPartnerDetails: !!partnerDetails,
      hasLogo: !!finalLogoUrl,
      logoUrl: finalLogoUrl,
      partnerName: finalPartnerName,
      beneficiaryPortalTitle: finalBeneficiaryPortalTitle,
      isPartnerPackageModule: isPartnerPackageModuleEnabled,
      showRemittanceOnlyOnRegistration: shouldShowRemittanceOnlyOnRegistration,
      configLoading,
      partnerDetailsLoading,
      isFetching,
      isInitialFetchComplete,
      hasAuthServiceLoaded,
      mountId,
      fetchError,
      retryCount: retryCount.current,
      localStorageCheck: {
        partnerId: localStorage.getItem("whitelabelledpartnerid"),
        partnerName: localStorage.getItem("partner_name"),
        isWhiteLabelled: localStorage.getItem("is_white_labelled_partner"),
        partnerUUID: localStorage.getItem("partner_uuid"),
        showRemittanceOnly: localStorage.getItem(
          "showRemittanceOnlyOnRegistration"
        ),
        beneficiaryPortalTitle: localStorage.getItem(
          "beneficiary_portal_title"
        ),
      },
    },
  };
};

export default usePartnerConfig;