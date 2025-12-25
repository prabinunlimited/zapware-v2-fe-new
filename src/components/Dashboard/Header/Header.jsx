// src/components/Header/Header.js - COMPLETE WITH FIXES AND ORIGINAL FUNCTIONALITIES
import React, { useEffect, useRef, useCallback, useMemo, memo } from "react";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import PropTypes from "prop-types";
import {
  FaUserCircle,
  FaUsers,
  FaSignOutAlt,
  FaIdCard,
  FaUserTie,
  FaChevronRight,
  FaStar,
  FaHome,
  FaBuilding,
  FaMoneyCheckAlt,
} from "react-icons/fa";
import { RingLoader } from "react-spinners";
import { motion, AnimatePresence } from "framer-motion";

// Redux imports from headerSlice
import {
  fetchPartnerFxCurrencies,
  fetchUserProfile,
  openDropdown,
  closeDropdown,
  updateLocalStorageState,
  selectPartnerFxCurrencies,
  selectHasFxData,
  selectHeaderLoading,
  selectHeaderError,
  selectIsDropdownOpen,
  selectIsStaffLogin,
  selectStaffRole,
  selectIsOwnerLogin,
  selectOwnerId,
  selectOwnerRoleName,
  selectStaffId,
  selectIsRemittanceOnlyCustomer,
  selectIsWhitelabelledCustomerPartnerId,
  selectFetchStatus,
  selectProfileData,
  selectProfileLoading,
  selectProfileError,
} from "../Header/headerSlice";

// Import logoutUser
import { logoutUser } from "../../../features/Auth/slices/authSlice";

// Partner config hook
import { usePartnerConfig } from "../../../hooks/usePartnerConfig";

// Import centralizedApi
import { centralizedApi } from "../../../services/api";

// Debug component for partner data
const PartnerDebug = () => {
  useEffect(() => {
    console.log("🔍 HEADER DEBUG - LocalStorage State:", {
      partnerId: localStorage.getItem("whitelabelledpartnerid"),
      partnerName: localStorage.getItem("whitelabelled_customer_partnername"),
      partnerLogo: localStorage.getItem("partner_logo"),
      partnerConfig: JSON.parse(
        localStorage.getItem("partnerConfig") || "null"
      ),
      partnerDetails: JSON.parse(
        localStorage.getItem("partnerDetails") || "null"
      ),
      whitelabelledCustomer: localStorage.getItem("whitelabelled_customer"),
      isWhiteLabelledPartner: localStorage.getItem("iswhitelabelledpartner"),
      hasPartnerId: !!localStorage.getItem("whitelabelledpartnerid"),
    });
  }, []);

  return null;
};

const selectAuthToken = (state) => {
  const bearertoken = localStorage.getItem("bearertoken");
  const isValidToken =
    bearertoken &&
    bearertoken !== "undefined" &&
    bearertoken !== "null" &&
    bearertoken !== "false" &&
    typeof bearertoken === "string" &&
    bearertoken.length > 10;

  if (isValidToken) {
    return bearertoken;
  }

  const token = state.auth?.token;
  const isValidReduxToken =
    token &&
    token !== "undefined" &&
    token !== "null" &&
    token !== "false" &&
    typeof token === "string" &&
    token.length > 10;

  return isValidReduxToken ? token : null;
};

const Header = ({ customerId }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const timerRef = useRef(null);
  const hoverTimerRef = useRef(null);
  const fetchTimeoutRef = useRef(null);

  // Use the partner config hook - ALL original properties
  const {
    headerColor,
    logoUrl,
    logoAltText,
    partnerName,
    hasLogo,
    loading: partnerConfigLoading,
    error: partnerConfigError,
    refresh: refreshPartnerConfig,
    config: partnerConfig,
  } = usePartnerConfig();

  // Use individual selectors to prevent unnecessary re-renders
  const partnerFxCurrencies = useSelector(selectPartnerFxCurrencies);
  const hasFxData = useSelector(selectHasFxData);
  const headerLoading = useSelector(selectHeaderLoading);
  const headerError = useSelector(selectHeaderError);
  const isDropdownOpen = useSelector(selectIsDropdownOpen);
  const authtoken = useSelector(selectAuthToken);

  // Profile selectors
  const profileData = useSelector(selectProfileData);
  const profileLoading = useSelector(selectProfileLoading);
  const profileError = useSelector(selectProfileError);

  const isStaffLogin = useSelector(selectIsStaffLogin);
  const staffRole = useSelector(selectStaffRole);
  const isOwnerLogin = useSelector(selectIsOwnerLogin);
  const ownerId = useSelector(selectOwnerId);
  const ownerRoleName = useSelector(selectOwnerRoleName);
  const staffId = useSelector(selectStaffId);
  const isRemittanceOnlyCustomer = useSelector(selectIsRemittanceOnlyCustomer);
  const isWhitelabelledCustomerPartnerId = useSelector(
    selectIsWhitelabelledCustomerPartnerId
  );
  const fetchStatus = useSelector(selectFetchStatus);

  // Get from localStorage
  const isWhitelabelledCustomer =
    localStorage.getItem("whitelabelled_customer") || "N";
  const firstName = localStorage.getItem("firstName") || "User";
  const lastName = localStorage.getItem("lastName") || "";

  const bearertoken = localStorage.getItem("bearertoken");

  // NEW: API coordination refs
  const profileFetchSignature = useRef(null);

  useEffect(() => {
    // Create a config object that matches what DataManager expects
    profileFetchSignature.current = {
      method: "GET",
      url: `/customers/${customerId}/profile`,
      params: {},
      data: {},
    };
  }, [customerId]);

  // ==================== DEBUG LOGGING ====================
  useEffect(() => {
    console.log("🔍 Header Partner Config Debug:", {
      hasLogo,
      logoUrl,
      logoAltText,
      partnerName,
      partnerConfigLoading,
      isWhitelabelledCustomerPartnerId,
      isRemittanceOnlyCustomer,
      localStoragePartnerName: localStorage.getItem(
        "whitelabelled_customer_partnername"
      ),
      localStoragePartnerLogo: localStorage.getItem("partner_logo"),
      localStoragePartnerConfig: JSON.parse(
        localStorage.getItem("partnerConfig") || "{}"
      ),
      localStoragePartnerDetails: JSON.parse(
        localStorage.getItem("partnerDetails") || "{}"
      ),
    });
  }, [
    hasLogo,
    logoUrl,
    logoAltText,
    partnerName,
    partnerConfigLoading,
    isWhitelabelledCustomerPartnerId,
    isRemittanceOnlyCustomer,
  ]);
  // ==================== END DEBUG ====================

  // Handle logout
  const handleLogout = useCallback(async () => {
    // Clear timers
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
      fetchTimeoutRef.current = null;
    }

    // Clear API cache on logout using centralizedApi
    centralizedApi.clearAllCache();

    // Get the token for the API call
    const tokenToUse =
      authtoken ||
      localStorage.getItem("authtoken") ||
      localStorage.getItem("bearertoken");

    try {
      if (tokenToUse) {
        const response = await axios.post(
          `${import.meta.env.VITE_API_URL}/logout`,
          {},
          {
            headers: {
              Authorization: `Bearer ${tokenToUse}`,
            },
          }
        );
        console.log("✅ Logout API response:", response.data);
      } else {
        console.log("ℹ️ No token available, local logout only");
      }

      // ⭐⭐ CLEAR EVERYTHING FROM LOCALSTORAGE ⭐⭐
      localStorage.clear();
      sessionStorage.clear();

      console.log("🗑️ ALL localStorage and sessionStorage cleared");

      // Clear Redux state
      dispatch({ type: "auth/clearAuthState" });

      // Navigate to login
      navigate("/", { replace: true });

      // Force reload to clear any cached state
      window.location.reload();
    } catch (error) {
      console.error("❌ Logout error:", error);

      // ⭐⭐ EVEN IF API FAILS, CLEAR EVERYTHING LOCALLY ⭐⭐
      localStorage.clear();
      sessionStorage.clear();

      // Clear Redux state
      dispatch({ type: "auth/clearAuthState" });

      console.log("🔄 Manual fallback: All storage cleared");

      navigate("/", { replace: true });
      window.location.reload();
    }
  }, [authtoken, dispatch, navigate]);

  // Listen for header color changes
  useEffect(() => {
    const handleStorageChange = () => {
      dispatch(updateLocalStorageState());
    };

    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [dispatch]);

  // Close dropdown when clicking outside or mouse leaves
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        dispatch(closeDropdown());
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dispatch]);

  // ✅ FIXED: Aggressive Profile fetch with duplicate handling
  useEffect(() => {
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }

    fetchTimeoutRef.current = setTimeout(() => {
      console.log("🔍 Header Profile Fetch Check:", {
        bearertoken: !!bearertoken,
        customerId,
        fetchStatus: fetchStatus.profile,
        profileLoading,
        reduxFirstName: profileData?.first_name,
        storageFirstName: localStorage.getItem("firstName"),
      });

      // ✅ Check if we have VALID data (not "User" or bad values)
      const hasValidReduxData =
        profileData?.first_name &&
        profileData.first_name !== "User" &&
        profileData.first_name !== "undefined" &&
        profileData.first_name !== "null";

      const hasValidStorageData =
        localStorage.getItem("firstName") &&
        localStorage.getItem("firstName") !== "User" &&
        localStorage.getItem("firstName") !== "undefined" &&
        localStorage.getItem("firstName") !== "null";

      // ✅ Check centralizedApi coordination state
      const cacheKey = profileFetchSignature.current
        ? centralizedApi.dataManager.getCacheKey(profileFetchSignature.current)
        : null;

      const isGloballyFetching = cacheKey
        ? !!centralizedApi.dataManager.getPendingRequest(cacheKey)
        : false;

      const hasGlobalData = cacheKey
        ? centralizedApi.dataManager.get(cacheKey)
        : false;

      // ✅ SIMPLIFIED: Fetch if we don't have valid data AND not already fetching globally
      const shouldFetchProfile =
        bearertoken &&
        customerId &&
        !hasValidReduxData &&
        !hasValidStorageData &&
        !isGloballyFetching &&
        !profileLoading;

      if (shouldFetchProfile) {
        console.log("👤 Header: Fetching profile - no valid data found");

        // Reset fetch status to idle to allow the fetch
        if (fetchStatus.profile !== "idle") {
          console.log("🔄 Resetting fetch status to idle");
        }

        dispatch(fetchUserProfile({ customerId, bearertoken }));
      } else {
        console.log("🔍 Header: Profile fetch not needed", {
          hasValidReduxData,
          hasValidStorageData,
          isGloballyFetching,
          profileLoading,
          fetchStatus: fetchStatus.profile,
        });
      }
    }, 300);

    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, [
    dispatch,
    bearertoken,
    customerId,
    fetchStatus.profile,
    profileLoading,
    profileData,
  ]);

  // Navigation handlers
  const handleBeneficiariesClick = useCallback(() => {
    navigate(`/beneficiaries/${customerId}`);
    dispatch(closeDropdown());
  }, [customerId, navigate, dispatch]);

  const handleProfileClick = useCallback(() => {
    navigate(`/profile/${customerId}`);
    dispatch(closeDropdown());
  }, [customerId, navigate, dispatch]);

  const handleTeamClick = useCallback(() => {
    navigate(`/team/${customerId}`);
    dispatch(closeDropdown());
  }, [customerId, navigate, dispatch]);

  const handleChangePasswordStaff = useCallback(() => {
    navigate(`/changepasswordstaff/${staffId}`);
    dispatch(closeDropdown());
  }, [staffId, navigate, dispatch]);

  // Hover handlers
  const handleMouseEnter = useCallback(() => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    dispatch(openDropdown());
  }, [dispatch]);

  const handleMouseLeave = useCallback(() => {
    hoverTimerRef.current = setTimeout(() => {
      dispatch(closeDropdown());
    }, 300);
  }, [dispatch]);

  // Auto-logout timer
  const resetTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      handleLogout();
    }, 36000000);
  }, [handleLogout]);

  useEffect(() => {
    if (authtoken) {
      const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];
      events.forEach((event) => window.addEventListener(event, resetTimer));

      resetTimer();

      return () => {
        events.forEach((event) =>
          window.removeEventListener(event, resetTimer)
        );
        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }
      };
    }
  }, [resetTimer, authtoken]);

  // Enhanced dropdown items
  const dropdownItems = [
    {
      id: 1,
      label: "My Profile",
      icon: FaIdCard,
      color: "text-blue-600",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-200",
      onClick: handleProfileClick,
      delay: 0.1,
      description: "Manage your personal information",
    },
    {
      id: 2,
      label: "My Beneficiaries",
      icon: FaUsers,
      color: "text-green-600",
      bgColor: "bg-green-500/10",
      borderColor: "border-green-200",
      onClick: handleBeneficiariesClick,
      delay: 0.2,
      description: "View and manage beneficiaries",
    },
    {
      id: 3,
      label: "Team Members",
      icon: FaUserTie,
      color: "text-purple-600",
      bgColor: "bg-purple-500/10",
      borderColor: "border-purple-200",
      onClick: handleTeamClick,
      delay: 0.3,
      description: "Manage team access and permissions",
    },
  ];

  // ✅ FIXED: Memoized profile section with ALL original animations and features
  const ProfileSection = useMemo(() => {
    if (profileLoading && !profileData) {
      return (
        <div className="flex items-center">
          <RingLoader size={30} color={"#ffffff"} loading={true} />
          <span className="ml-2 text-white text-sm">Loading Profile...</span>
        </div>
      );
    }

    if (profileError) {
      console.error("🔍 Profile error in ProfileSection:", profileError);
    }

    const displayName =
      profileData?.first_name &&
      profileData.first_name !== "User" &&
      profileData.first_name !== "undefined" &&
      profileData.first_name !== "null"
        ? profileData.first_name
        : localStorage.getItem("firstName") &&
          localStorage.getItem("firstName") !== "User" &&
          localStorage.getItem("firstName") !== "undefined" &&
          localStorage.getItem("firstName") !== "null"
        ? localStorage.getItem("firstName")
        : "User";
    const userRole =
      isStaffLogin === "1"
        ? staffRole
        : isOwnerLogin === "1"
        ? ownerRoleName
        : "Customer";

    return (
      <div
        className="relative"
        ref={dropdownRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="flex items-center cursor-pointer bg-white/10 hover:bg-white/20 rounded-2xl px-4 py-3 transition-all duration-300 backdrop-blur-sm border border-white/20"
        >
          <motion.div
            whileHover={{ rotate: 5 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="relative"
          >
            <FaUserCircle className="w-10 h-10 text-white" />
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white"
            />
          </motion.div>
          <div className="ml-3 flex flex-col">
            <span className="font-semibold text-white text-sm leading-tight">
              {displayName}
            </span>
            <span className="text-xs text-white/80 leading-tight">
              {userRole}
            </span>
          </div>
          <motion.div
            animate={{ rotate: isDropdownOpen ? 180 : 0 }}
            transition={{ duration: 0.3 }}
            className="ml-3"
          >
            <FaChevronRight className="w-3 h-3 text-white/70" />
          </motion.div>
        </motion.div>

        <AnimatePresence>
          {isDropdownOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{
                duration: 0.2,
                type: "spring",
                stiffness: 500,
                damping: 30,
              }}
              className="absolute right-0 mt-2 w-96 bg-white/95 backdrop-blur-xl border border-white/30 rounded-3xl shadow-2xl shadow-black/30 z-50 overflow-hidden"
              style={{
                background:
                  "linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.98) 100%)",
              }}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <motion.div
                className="p-8 bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <div className="flex items-center space-x-5">
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className="relative"
                  >
                    <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center shadow-lg backdrop-blur-sm">
                      <FaUserCircle className="w-10 h-10 text-white" />
                    </div>
                    <motion.div
                      animate={{ scale: [1, 1.3, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white shadow-lg"
                    />
                  </motion.div>
                  <div className="flex-1 min-w-0">
                    <motion.p
                      className="text-xl font-bold text-white truncate"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      {displayName}
                    </motion.p>
                    <motion.p
                      className="text-blue-100 mt-1 text-sm"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      ID: {customerId}
                    </motion.p>
                    <motion.div
                      className="flex items-center mt-3"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.4 }}
                    >
                      <div className="px-3 py-1 bg-white/20 text-white text-xs font-semibold rounded-full backdrop-blur-sm">
                        {userRole}
                      </div>
                      <div className="ml-2 px-2 py-1 bg-green-500/20 text-green-100 text-xs rounded-full">
                        Active
                      </div>
                    </motion.div>
                  </div>
                </div>
              </motion.div>

              <div className="p-6">
                <div className="space-y-3">
                  {dropdownItems.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        delay: item.delay,
                        type: "spring",
                        stiffness: 500,
                      }}
                      whileHover={{
                        scale: 1.02,
                        x: 5,
                      }}
                    >
                      <button
                        onClick={item.onClick}
                        className="flex items-start w-full text-left p-5 rounded-2xl transition-all duration-300 group border border-gray-100 hover:border-gray-200 hover:shadow-lg bg-white/50 hover:bg-white"
                      >
                        <div
                          className={`p-4 rounded-xl ${item.bgColor} border ${item.borderColor} group-hover:scale-110 transition-all duration-300 shadow-sm`}
                        >
                          <item.icon className={`w-6 h-6 ${item.color}`} />
                        </div>
                        <div className="ml-5 flex-1 min-w-0">
                          <div className="flex items-center">
                            <span
                              className={`font-semibold text-gray-900 group-hover:text-gray-800 transition-colors duration-200`}
                            >
                              {item.label}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                            {item.description}
                          </p>
                        </div>
                        <FaChevronRight
                          className={`w-4 h-4 text-gray-400 group-hover:text-gray-600 mt-1 group-hover:translate-x-1 transition-all duration-200`}
                        />
                      </button>
                    </motion.div>
                  ))}
                </div>
              </div>

              <motion.div
                className="px-6 py-5 bg-gradient-to-r from-red-50 to-orange-50/50 border-t border-gray-100"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
              >
                <motion.button
                  onClick={handleLogout}
                  whileHover={{ scale: 1.02 }}
                  className="flex items-center w-full p-5 rounded-2xl bg-white border border-red-200 hover:border-red-300 hover:shadow-lg transition-all duration-300 group"
                >
                  <div className="p-4 rounded-xl bg-red-500/10 border border-red-200 group-hover:bg-red-500/20 transition-colors duration-200">
                    <FaSignOutAlt className="w-6 h-6 text-red-500" />
                  </div>
                  <div className="ml-5 flex-1 text-left">
                    <span className="font-semibold text-red-600 group-hover:text-red-700 transition-colors duration-200">
                      Logout
                    </span>
                    <p className="text-sm text-red-500/80 mt-2">
                      Sign out from your account
                    </p>
                  </div>
                  <FaChevronRight className="w-4 h-4 text-red-400 group-hover:text-red-500 mt-1 group-hover:translate-x-1 transition-all duration-200" />
                </motion.button>
              </motion.div>

              <motion.div
                className="px-8 py-5 bg-gradient-to-r from-gray-50 to-gray-100/50 border-t border-gray-100"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm text-gray-500">
                    <FaStar className="w-4 h-4 text-yellow-500 mr-2" />
                    <span>Secure Portal • v2.1.0</span>
                  </div>
                  <div className="text-xs text-gray-400">Last login: Today</div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }, [
    profileLoading,
    profileError,
    profileData,
    isDropdownOpen,
    isOwnerLogin,
    isStaffLogin,
    staffRole,
    ownerRoleName,
    customerId,
    handleProfileClick,
    handleBeneficiariesClick,
    handleTeamClick,
    handleChangePasswordStaff,
    handleLogout,
    handleMouseEnter,
    handleMouseLeave,
    dispatch,
  ]);

  useEffect(() => {
    // Try to load logo from localStorage immediately
    const cachedLogo = localStorage.getItem("partner_logo");
    const cachedPartnerName = localStorage.getItem("partner_name");

    if (cachedLogo) {
      console.log("📦 Pre-loaded logo from localStorage:", cachedLogo);
    }
  }, []);

  // ============ FIXED LOGO CONTENT ============
  const LogoContent = useMemo(() => {
    // IMMEDIATE CHECK: Always show cached logo first
    const cachedLogoUrl = localStorage.getItem("partner_logo");
    const cachedPartnerName =
      localStorage.getItem("whitelabelled_customer_partnername") ||
      "Partner Portal";

    console.log("🎯 LogoContent Debug:", {
      cachedLogoUrl,
      cachedPartnerName,
      partnerConfigLoading,
      logoUrl,
      partnerName,
      hasLogo,
    });

    // 1. Show cached logo if available (immediate display)
    if (
      cachedLogoUrl &&
      cachedLogoUrl !== "null" &&
      cachedLogoUrl !== "undefined"
    ) {
      return (
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="flex items-center justify-center"
        >
          <img
            src={cachedLogoUrl}
            alt={cachedPartnerName}
            className="h-20 w-auto object-contain max-w-[300px] max-h-[100px]"
            onLoad={() => console.log("✅ Cached logo loaded")}
            onError={(e) => {
              console.error("❌ Cached logo failed, clearing...");
              localStorage.removeItem("partner_logo");
              e.target.style.display = "none";
            }}
          />
        </motion.div>
      );
    }

    // 2. Show partner name if we have one (even without logo)
    if (cachedPartnerName && cachedPartnerName !== "Partner Portal") {
      console.log("📝 Showing partner name as text:", cachedPartnerName);
      return (
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="flex items-center justify-center"
        >
          <FaBuilding className="h-10 w-10 text-white mr-3" />
          <span className="text-white font-semibold text-lg">
            {cachedPartnerName}
          </span>
        </motion.div>
      );
    }

    // 3. Show API logo if available (from Redux)
    if (logoUrl && logoUrl !== "null" && logoUrl !== "undefined") {
      return (
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="flex items-center justify-center"
        >
          <img
            src={logoUrl}
            alt={partnerName || "Partner Logo"}
            className="h-20 w-auto object-contain max-w-[300px] max-h-[100px]"
            onLoad={() => {
              console.log("✅ API logo loaded, caching...");
              localStorage.setItem("partner_logo", logoUrl);
            }}
            onError={(e) => {
              console.error("❌ API logo failed");
              e.target.style.display = "none";
            }}
          />
        </motion.div>
      );
    }

    // 4. REMOVED LOADING SPINNER - Show fallback immediately
    console.log("⚠️ No logo available, showing fallback");

    // Choose appropriate icon
    let IconComponent = FaBuilding;
    let titleText = "Partner Portal";

    if (isRemittanceOnlyCustomer === "Y") {
      IconComponent = FaMoneyCheckAlt;
      titleText = "Remittance Portal";
    } else if (localStorage.getItem("whitelabelledpartnerid")) {
      IconComponent = FaBuilding;
      titleText = "Partner Portal";
    } else {
      IconComponent = FaHome;
      titleText = "Dashboard";
    }

    return (
      <motion.div
        whileHover={{ scale: 1.05 }}
        className="flex items-center justify-center"
      >
        <IconComponent className="h-10 w-10 text-white mr-3" />
        <span className="text-white font-semibold text-lg">{titleText}</span>
      </motion.div>
    );
  }, [
    // Minimal dependencies - only what's actually needed
    logoUrl,
    partnerName,
    isRemittanceOnlyCustomer,
    // REMOVED: partnerConfigLoading (causes unnecessary re-renders)
  ]);

  // UPDATED: Get appropriate text for the logo area
  const logoText = useMemo(() => {
    if (isRemittanceOnlyCustomer === "Y") {
      return "Remittance Portal";
    }
    if (isWhitelabelledCustomerPartnerId) {
      // Use partner name from hook (which comes from partner details API)
      return partnerName || "Partner Portal";
    }
    return "Dashboard";
  }, [isRemittanceOnlyCustomer, isWhitelabelledCustomerPartnerId, partnerName]);

  // UPDATED: Handle header color class application with better fallback
  const headerClassNames = useMemo(() => {
    const baseClasses = "w-full shadow-xl";

    // If we have a header color from partner config
    if (headerColor) {
      // Check if it's a hex color or Tailwind class
      if (headerColor.startsWith("#")) {
        return baseClasses; // Use inline style for hex colors
      }
      // It's a Tailwind class
      return `${baseClasses} ${headerColor}`;
    }

    // Default gradient
    return `${baseClasses} bg-gradient-to-r from-sky-700 via-blue-600 to-indigo-700`;
  }, [headerColor]);

  // UPDATED: Inline style for hex colors with better gradient
  const headerStyle = useMemo(() => {
    if (headerColor?.startsWith("#")) {
      // Create a gradient from the header color
      const baseColor = headerColor;
      const darkerColor = headerColor + "CC"; // 80% opacity
      const darkestColor = headerColor + "99"; // 60% opacity

      return {
        background: `linear-gradient(135deg, ${baseColor} 0%, ${darkerColor} 50%, ${darkestColor} 100%)`,
      };
    }
    return {};
  }, [headerColor]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
      }
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, []);

  // Check if we should show FX rates
  const shouldShowFxRates = useMemo(() => {
    return hasFxData && partnerFxCurrencies.length > 0;
  }, [hasFxData, partnerFxCurrencies]);

  return (
    <header className={headerClassNames} style={headerStyle}>
      <PartnerDebug />
      <div className="max-w-[2000px] mx-auto px-6 py-3 flex justify-between items-center w-full">
        <div className="flex items-center space-x-5">
          {isRemittanceOnlyCustomer === "Y" ? (
            <Link
              to={`/homeremit/${customerId}`}
              className="flex items-center space-x-5 text-white hover:text-gray-200 transition-all duration-300 group"
            >
              {LogoContent}
            </Link>
          ) : (
            <Link
              to={`/home/${customerId}`}
              className="flex items-center space-x-5 text-white hover:text-gray-200 transition-all duration-300 group"
            >
              {LogoContent}
            </Link>
          )}
        </div>

        {/* FX Rates with original animation */}
        {shouldShowFxRates && (
          <div className="hidden md:block w-full md:w-2/4 my-2 md:my-0">
            <div className="overflow-hidden px-6">
              <div className="overflow-hidden">
                <motion.div
                  className="whitespace-nowrap text-white/90 font-medium text-lg animate-marquee"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  {partnerFxCurrencies.map((fx, index) => (
                    <span key={index} className="mx-8">
                      {fx.source_currency} → {fx.destination_currency}:{" "}
                      {fx.rate ?? "N/A"}
                    </span>
                  ))}
                </motion.div>
              </div>
            </div>
          </div>
        )}

        {/* Desktop: Profile on right - Original positioning */}
        <div className="hidden md:flex justify-end md:w-1/4 items-center">
          {ProfileSection}
        </div>

        {/* Mobile: Profile menu - Original positioning */}
        <div className="md:hidden">{ProfileSection}</div>
      </div>

      {/* Enhanced Keyframe style for marquee - Original animation */}
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .animate-marquee {
          display: inline-block;
          animation: marquee 35s linear infinite;
          text-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
      `}</style>
    </header>
  );
};

Header.propTypes = {
  customerId: PropTypes.string.isRequired,
};

export default memo(Header);
