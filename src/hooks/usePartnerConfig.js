import { useSelector, useDispatch } from 'react-redux';
import { useEffect, useRef } from 'react';
import { 
  fetchPartnerBasicSetup, 
  fetchPartnerDetails,
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
  setBasicConfig,
  setBasicConfigError,
  setPartnerDetails,
  setPartnerDetailsError
} from '../features/Auth/slices/partnerSlice';

// Global flags to prevent multiple fetches across components
let isFetchingBasicConfig = false;
let isFetchingPartnerDetails = false;

// Helper function to get auth token
const getAuthToken = () => {
  // Check localStorage for tokens
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
};

// Helper to get partner ID from localStorage
const getPartnerId = () => {
  let partnerId = localStorage.getItem("whitelabelledpartnerid");
  
  if (!partnerId || partnerId === "0") {
    partnerId = localStorage.getItem("whitelabelled_customer_partnerid");
    console.log("Falling back to whitelabelled_customer_partnerid:", partnerId);

    if (partnerId && partnerId !== "0") {
      localStorage.setItem("whitelabelledpartnerid", partnerId);
    }
  }

  return partnerId;
};

// Helper to check cache validity
const isCacheValid = (cacheTimestampKey, maxAge = 300000) => {
  const timestamp = localStorage.getItem(cacheTimestampKey);
  return timestamp && (Date.now() - parseInt(timestamp) < maxAge);
};

export const usePartnerConfig = () => {
  const dispatch = useDispatch();
  const basicConfigAttempted = useRef(false);
  const partnerDetailsAttempted = useRef(false);
  
  // Get token and partner ID
  const authtoken = getAuthToken();
  const partnerId = getPartnerId();
  
  // Redux selectors
  const config = useSelector(selectPartnerBasicConfig);
  const loading = useSelector(selectPartnerBasicConfigLoading);
  const error = useSelector(selectPartnerBasicConfigError);
  
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

  // Fetch basic partner config (colors, settings)
  useEffect(() => {
    // Don't fetch if already attempted in this session
    if (basicConfigAttempted.current) return;
    
    // ========== 1. CHECK LOCALSTORAGE CACHE FIRST ==========
    const cachedConfig = localStorage.getItem("partnerConfig");
    const isCacheValidBasic = isCacheValid("partnerConfigTimestamp", 300000); // 5 minutes
    
    if (cachedConfig && isCacheValidBasic && !config) {
      try {
        const parsedConfig = JSON.parse(cachedConfig);
        console.log("📦 Using cached partner config from localStorage");
        dispatch(setBasicConfig(parsedConfig));
      } catch (e) {
        console.error("Failed to parse cached partner config:", e);
      }
    }
    
    // ========== 2. CHECK IF WE SHOULD FETCH BASIC CONFIG ==========
    const shouldFetchBasicConfig = 
      partnerId && 
      partnerId !== "0" && 
      !config && 
      !loading && 
      !isFetchingBasicConfig &&
      authtoken;
    
    if (shouldFetchBasicConfig) {
      basicConfigAttempted.current = true;
      isFetchingBasicConfig = true;
      
      console.log("🔄 Fetching partner basic config with:", {
        partnerId,
        hasToken: !!authtoken,
        hasConfig: !!config,
        isFetchingBasicConfig
      });
      
      // Set a timeout to reset the global flag if fetch takes too long
      const timeoutId = setTimeout(() => {
        if (isFetchingBasicConfig) {
          console.warn("Partner basic config fetch taking too long, resetting global flag");
          isFetchingBasicConfig = false;
        }
      }, 10000);
      
      dispatch(fetchPartnerBasicSetup())
        .unwrap()
        .then(() => {
          console.log("✅ Partner basic config fetched successfully");
        })
        .catch((err) => {
          console.error("❌ Partner basic config fetch failed:", err);
          
          // Fallback to localStorage if available
          if (cachedConfig) {
            try {
              const parsedConfig = JSON.parse(cachedConfig);
              console.log("🔄 Falling back to cached basic config due to fetch error");
              dispatch(setBasicConfig(parsedConfig));
              dispatch(setBasicConfigError(null)); // Clear error since we have cache
            } catch (e) {
              console.error("Failed to parse cached basic config:", e);
            }
          }
        })
        .finally(() => {
          isFetchingBasicConfig = false;
          clearTimeout(timeoutId);
        });
    } else {
      console.log("🔍 Partner basic config fetch not needed:", {
        partnerId,
        hasConfig: !!config,
        loading,
        isFetchingBasicConfig,
        hasToken: !!authtoken
      });
    }
  }, [config, loading, dispatch, partnerId, authtoken]);

  // Fetch partner details (logo, name, etc.)
  useEffect(() => {
    // Don't fetch if already attempted in this session
    if (partnerDetailsAttempted.current) return;
    
    // ========== 1. CHECK LOCALSTORAGE CACHE FIRST ==========
    const cachedDetails = localStorage.getItem("partnerDetails");
    const isCacheValidDetails = isCacheValid("partnerDetailsTimestamp", 300000); // 5 minutes
    
    if (cachedDetails && isCacheValidDetails && !partnerDetails) {
      try {
        const parsedDetails = JSON.parse(cachedDetails);
        console.log("📦 Using cached partner details from localStorage");
        dispatch(setPartnerDetails(parsedDetails));
      } catch (e) {
        console.error("Failed to parse cached partner details:", e);
      }
    }
    
    // ========== 2. CHECK IF WE SHOULD FETCH PARTNER DETAILS ==========
    const shouldFetchPartnerDetails = 
      partnerId && 
      partnerId !== "0" && 
      !partnerDetails && 
      !partnerDetailsLoading && 
      !isFetchingPartnerDetails &&
      authtoken;
    
    if (shouldFetchPartnerDetails) {
      partnerDetailsAttempted.current = true;
      isFetchingPartnerDetails = true;
      
      console.log("🔄 Fetching partner details with:", {
        partnerId,
        hasToken: !!authtoken,
        hasDetails: !!partnerDetails,
        isFetchingPartnerDetails
      });
      
      // Set a timeout to reset the global flag if fetch takes too long
      const timeoutId = setTimeout(() => {
        if (isFetchingPartnerDetails) {
          console.warn("Partner details fetch taking too long, resetting global flag");
          isFetchingPartnerDetails = false;
        }
      }, 10000);
      
      dispatch(fetchPartnerDetails())
        .unwrap()
        .then(() => {
          console.log("✅ Partner details fetched successfully");
        })
        .catch((err) => {
          console.error("❌ Partner details fetch failed:", err);
          
          // Fallback to localStorage if available
          if (cachedDetails) {
            try {
              const parsedDetails = JSON.parse(cachedDetails);
              console.log("🔄 Falling back to cached partner details due to fetch error");
              dispatch(setPartnerDetails(parsedDetails));
              dispatch(setPartnerDetailsError(null)); // Clear error since we have cache
            } catch (e) {
              console.error("Failed to parse cached partner details:", e);
            }
          }
        })
        .finally(() => {
          isFetchingPartnerDetails = false;
          clearTimeout(timeoutId);
        });
    } else {
      console.log("🔍 Partner details fetch not needed:", {
        partnerId,
        hasDetails: !!partnerDetails,
        partnerDetailsLoading,
        isFetchingPartnerDetails,
        hasToken: !!authtoken
      });
    }
  }, [partnerDetails, partnerDetailsLoading, dispatch, partnerId, authtoken]);

  // Manual refresh functions
  const refreshBasicConfig = () => {
    if (partnerId && partnerId !== "0" && authtoken) {
      console.log("🔃 Manually refreshing partner basic config");
      basicConfigAttempted.current = false;
      isFetchingBasicConfig = false;
      dispatch(fetchPartnerBasicSetup());
    } else {
      console.warn("Cannot refresh partner basic config - missing partnerId or auth token");
    }
  };

  const refreshPartnerDetails = () => {
    if (partnerId && partnerId !== "0" && authtoken) {
      console.log("🔃 Manually refreshing partner details");
      partnerDetailsAttempted.current = false;
      isFetchingPartnerDetails = false;
      dispatch(fetchPartnerDetails());
    } else {
      console.warn("Cannot refresh partner details - missing partnerId or auth token");
    }
  };

  const refreshAll = () => {
    refreshBasicConfig();
    refreshPartnerDetails();
  };

  return {
    // Basic config
    config,
    loading: loading || partnerDetailsLoading,
    error: error || partnerDetailsError,
    headerColor,
    textColor,
    downloadManualEnabled,
    
    // Partner details
    logoUrl,
    logoAltText: partnerName,
    partnerName,
    partnerId: partnerId || reduxPartnerId,
    hasLogo,
    
    // Refresh functions
    refresh: refreshAll,
    refreshBasicConfig,
    refreshPartnerDetails,
    
    // Status flags
    isConfigured: !!config,
    hasValidConfig: !!(config && (config.header_color || config.text_color)),
    hasPartnerDetails: !!partnerDetails,
    
    // Debug info
    debugInfo: {
      partnerId,
      hasBasicConfig: !!config,
      hasPartnerDetails: !!partnerDetails,
      hasLogo,
      logoUrl,
      partnerName,
      basicConfigLoading: loading,
      detailsLoading: partnerDetailsLoading
    }
  };
};

export default usePartnerConfig;