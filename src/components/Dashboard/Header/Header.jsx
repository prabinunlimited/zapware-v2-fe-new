// src/components/Dashboard/Header/Header.jsx - WITH CENTERED TICKER LAYOUT
import React, {
  useEffect,
  useRef,
  useCallback,
  useMemo,
  memo,
  useState,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import PropTypes from "prop-types";
import {
  FaUserCircle,
  FaSignOutAlt,
  FaIdCard,
  FaUserTie,
  FaChevronRight,
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
  selectIsDropdownOpen,
  selectIsStaffLogin,
  selectStaffRole,
  selectIsOwnerLogin,
  selectOwnerRoleName,
  selectIsRemittanceOnlyCustomer,
  selectProfileData,
  selectProfileLoading,
  selectIsBeneficiaryUser,
} from "../Header/headerSlice";

// Partner config hook
import { usePartnerConfig } from "../../../hooks/usePartnerConfig";

// Import centralizedApi
import { centralizedApi } from "../../../services/api";

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

// Add ticker animation styles - PURE CSS NO FRAMER MOTION INTERFERENCE
const tickerStyles = `
  @keyframes ticker-smooth {
    0% {
      transform: translateX(0);
    }
    100% {
      transform: translateX(-50%);
    }
  }
  
  .ticker-wrapper {
    overflow: hidden;
    position: relative;
    width: 100%;
  }
  
  .ticker-track {
    display: flex;
    width: fit-content;
    animation: ticker-smooth var(--duration, 30s) linear infinite !important;
    will-change: transform;
    backface-visibility: hidden;
    transform-style: preserve-3d;
  }
  
  /* Prevent Framer Motion from interfering with ticker */
  .ticker-track,
  .ticker-track * {
    transform: translateZ(0) !important;
  }
  
  /* Override any inline transforms */
  .ticker-track[style*="transform"]:not([style*="animation"]) {
    transform: none !important;
  }
  
  .ticker-track.paused {
    animation-play-state: paused !important;
  }
  
  .ticker-item {
    backface-visibility: hidden;
    transform: translateZ(0);
    white-space: nowrap;
  }
`;

const Header = ({ customerId }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const timerRef = useRef(null);
  const hoverTimerRef = useRef(null);
  const fetchTimeoutRef = useRef(null);
  const tickerTrackRef = useRef(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [animationDuration, setAnimationDuration] = useState(30);
  const [isDropdownOpen, setIsDropdownOpenLocal] = useState(false);

  // Partner config hook
  const {
    headerColor,
    logoUrl,
    partnerName,
    loading: partnerConfigLoading,
  } = usePartnerConfig();

  // Redux selectors
  const partnerFxCurrencies = useSelector(selectPartnerFxCurrencies);
  const hasFxData = useSelector(selectHasFxData);
  const headerLoading = useSelector(selectHeaderLoading);
  const authtoken = useSelector(selectAuthToken);

  const profileData = useSelector(selectProfileData);
  const profileLoading = useSelector(selectProfileLoading);
  const isBeneficiaryUser = useSelector(selectIsBeneficiaryUser);

  const isStaffLogin = useSelector(selectIsStaffLogin);
  const staffRole = useSelector(selectStaffRole);
  const isOwnerLogin = useSelector(selectIsOwnerLogin);
  const ownerRoleName = useSelector(selectOwnerRoleName);
  const isRemittanceOnlyCustomer = useSelector(selectIsRemittanceOnlyCustomer);

  const bearertoken = localStorage.getItem("bearertoken");

  // Profile fetch signature ref
  const profileFetchSignature = useRef(null);

  useEffect(() => {
    profileFetchSignature.current = {
      method: "GET",
      url: `/customers/${customerId}/profile`,
      params: {},
      data: {},
    };
  }, [customerId]);

  // Calculate animation duration based on content width
  useEffect(() => {
    if (tickerTrackRef.current && partnerFxCurrencies.length > 0) {
      const contentWidth = tickerTrackRef.current.scrollWidth;
      const containerWidth =
        tickerTrackRef.current.parentElement?.clientWidth || 800;

      const speed = 50;
      const totalWidth = contentWidth / 2;
      const duration = Math.max(15, Math.min(60, totalWidth / speed));

      setAnimationDuration(duration);
    }
  }, [partnerFxCurrencies]);

  // Profile fetch logic
  useEffect(() => {
    const beneficiaryLogin =
      localStorage.getItem("beneficaryLogin") ||
      localStorage.getItem("beneficiaryLogin");
    if (beneficiaryLogin === "Y") {
      return;
    }

    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }

    fetchTimeoutRef.current = setTimeout(() => {
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

      const shouldFetchProfile =
        bearertoken &&
        customerId &&
        !hasValidReduxData &&
        !hasValidStorageData &&
        !profileLoading;

      if (shouldFetchProfile) {
        dispatch(fetchUserProfile({ customerId, bearertoken }));
      }
    }, 300);

    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, [dispatch, bearertoken, customerId, profileLoading, profileData]);

  // FX Rates fetch logic
  useEffect(() => {
    if (isBeneficiaryUser || !bearertoken) return;

    const shouldFetchFx = !hasFxData && !headerLoading;
    if (shouldFetchFx) {
      dispatch(fetchPartnerFxCurrencies({ bearertoken, forceRefresh: false }));
    }
  }, [dispatch, bearertoken, hasFxData, headerLoading, isBeneficiaryUser]);

  // Handle logout
  const handleLogout = useCallback(async () => {
    setIsLoggingOut(true);
    setIsDropdownOpenLocal(false);
    dispatch(closeDropdown());

    if (timerRef.current) clearTimeout(timerRef.current);
    if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);

    centralizedApi.clearAllCache();

    const tokenToUse =
      authtoken ||
      localStorage.getItem("authtoken") ||
      localStorage.getItem("bearertoken");

    try {
      if (tokenToUse) {
        await axios.post(
          `${import.meta.env.VITE_API_URL}/logout`,
          {},
          { headers: { Authorization: `Bearer ${tokenToUse}` } },
        );
      }

      localStorage.clear();
      sessionStorage.clear();
      dispatch({ type: "auth/clearAuthState" });
      navigate("/", { replace: true });
      window.location.reload();
    } catch (error) {
      localStorage.clear();
      sessionStorage.clear();
      dispatch({ type: "auth/clearAuthState" });
      navigate("/", { replace: true });
      window.location.reload();
    }
  }, [authtoken, dispatch, navigate]);

  // Navigation handlers
  const handleProfileClick = useCallback(() => {
    navigate(`/profile/${customerId}`);
    setIsDropdownOpenLocal(false);
    dispatch(closeDropdown());
  }, [customerId, navigate, dispatch]);

  const handleTeamClick = useCallback(() => {
    navigate(`/team/${customerId}`);
    setIsDropdownOpenLocal(false);
    dispatch(closeDropdown());
  }, [customerId, navigate, dispatch]);

  // Dropdown handlers
  const handleMouseEnter = useCallback(() => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    setIsDropdownOpenLocal(true);
    dispatch(openDropdown());
  }, [dispatch]);

  const handleMouseLeave = useCallback(() => {
    hoverTimerRef.current = setTimeout(() => {
      setIsDropdownOpenLocal(false);
      dispatch(closeDropdown());
    }, 300);
  }, [dispatch]);

  // Auto-logout timer
  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => handleLogout(), 36000000);
  }, [handleLogout]);

  useEffect(() => {
    if (authtoken) {
      const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];
      events.forEach((event) => window.addEventListener(event, resetTimer));
      resetTimer();
      return () => {
        events.forEach((event) =>
          window.removeEventListener(event, resetTimer),
        );
        if (timerRef.current) clearTimeout(timerRef.current);
      };
    }
  }, [resetTimer, authtoken]);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpenLocal(false);
        dispatch(closeDropdown());
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dispatch]);

  // Storage listener
  useEffect(() => {
    const handleStorageChange = () => dispatch(updateLocalStorageState());
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [dispatch]);

  // Dropdown items
  const dropdownItems = [
    {
      id: 1,
      label: "My Profile",
      icon: FaIdCard,
      color: "text-blue-600",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-200",
      onClick: handleProfileClick,
      description: "Manage your personal information",
    },
    {
      id: 3,
      label: "Team Members",
      icon: FaUserTie,
      color: "text-purple-600",
      bgColor: "bg-purple-500/10",
      borderColor: "border-purple-200",
      onClick: handleTeamClick,
      description: "Manage team access and permissions",
    },
  ];

  // Create duplicated array for smooth infinite scroll with unique keys
  const duplicatedFxRates = useMemo(() => {
    if (!partnerFxCurrencies.length) return [];
    return [...partnerFxCurrencies, ...partnerFxCurrencies].map((fx, idx) => ({
      ...fx,
      uniqueKey: `${fx.source_currency}-${fx.destination_currency}-${idx}-${Date.now()}`,
      displayRate: fx.rate
        ? typeof fx.rate === "number"
          ? fx.rate.toFixed(4)
          : fx.rate
        : "N/A",
    }));
  }, [partnerFxCurrencies]);

  // Profile Section Component - WITH MOTION FOR HOVER EFFECTS
  const ProfileSection = useMemo(() => {
    if (isBeneficiaryUser) {
      const beneficiaryName =
        localStorage.getItem("beneficiary_firstName") || "Beneficiary";
      return (
        <div className="relative">
          <div className="flex items-center cursor-default bg-white/10 rounded-2xl px-4 py-3">
            <FaUserCircle className="w-10 h-10 text-white" />
            <div className="ml-3 flex flex-col">
              <span className="font-semibold text-white text-sm">
                {beneficiaryName}
              </span>
              <span className="text-xs text-white/80">Beneficiary</span>
            </div>
          </div>
        </div>
      );
    }

    if (profileLoading && !profileData) {
      return (
        <div className="flex items-center">
          <RingLoader size={30} color="#ffffff" loading={true} />
          <span className="ml-2 text-white text-sm">Loading...</span>
        </div>
      );
    }

    const displayName =
      profileData?.first_name && profileData.first_name !== "User"
        ? profileData.first_name
        : localStorage.getItem("firstName") || "User";

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
        {/* Profile Button with Motion */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 400, duration: 0.2 }}
          className="flex items-center cursor-pointer bg-white/10 hover:bg-white/20 rounded-2xl px-4 py-3 backdrop-blur-sm border border-white/20"
        >
          <div className="relative">
            <FaUserCircle className="w-10 h-10 text-white" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white animate-pulse" />
          </div>
          <div className="ml-3 flex flex-col">
            <span className="font-semibold text-white text-sm">
              {displayName}
            </span>
            <span className="text-xs text-white/80">{userRole}</span>
          </div>
          <motion.div
            animate={{ rotate: isDropdownOpen ? 90 : 0 }}
            transition={{ duration: 0.2 }}
            className="ml-3"
          >
            <FaChevronRight className="w-3 h-3 text-white/70" />
          </motion.div>
        </motion.div>

        {/* Dropdown Menu with AnimatePresence */}
        <AnimatePresence>
          {isDropdownOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 mt-2 w-96 bg-white rounded-3xl shadow-2xl z-[9999] overflow-visible"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <div className="p-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-t-3xl">
                <div className="flex items-center space-x-5">
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                    <FaUserCircle className="w-10 h-10 text-white" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-white">
                      {displayName}
                    </p>
                    <p className="text-blue-100 text-sm">ID: {customerId}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="px-2 py-1 bg-white/20 text-white text-xs rounded-full">
                        {userRole}
                      </span>
                      <span className="px-2 py-1 bg-green-500/20 text-green-100 text-xs rounded-full">
                        Active
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-3">
                {dropdownItems.map((item, index) => (
                  <motion.button
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.02, x: 5 }}
                    onClick={item.onClick}
                    className="flex items-center w-full text-left p-4 rounded-2xl hover:bg-gray-50 transition-all border border-gray-100 group"
                  >
                    <div
                      className={`p-3 rounded-xl ${item.bgColor} group-hover:scale-110 transition-transform duration-200`}
                    >
                      <item.icon className={`w-5 h-5 ${item.color}`} />
                    </div>
                    <div className="ml-4 flex-1">
                      <span className="font-semibold text-gray-800">
                        {item.label}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">
                        {item.description}
                      </p>
                    </div>
                    <FaChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform duration-200" />
                  </motion.button>
                ))}
              </div>

              <div className="p-5 border-t rounded-b-3xl">
                <motion.button
                  onClick={handleLogout}
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 400 }}
                  className="flex items-center w-full p-4 rounded-2xl bg-red-50 border border-red-200 hover:bg-red-100 transition-all group"
                >
                  <div className="p-3 rounded-xl bg-red-100 group-hover:scale-110 transition-transform duration-200">
                    <FaSignOutAlt className="w-5 h-5 text-red-500" />
                  </div>
                  <div className="ml-4 text-left">
                    <span className="font-semibold text-red-600">Logout</span>
                    <p className="text-xs text-red-500/80">
                      Sign out from your account
                    </p>
                  </div>
                  <FaChevronRight className="ml-auto w-4 h-4 text-red-400 group-hover:translate-x-1 transition-transform duration-200" />
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }, [
    isBeneficiaryUser,
    profileLoading,
    profileData,
    isDropdownOpen,
    isStaffLogin,
    staffRole,
    isOwnerLogin,
    ownerRoleName,
    customerId,
    handleProfileClick,
    handleTeamClick,
    handleLogout,
    handleMouseEnter,
    handleMouseLeave,
  ]);

  // Logo Content - with simple CSS hover (no motion to avoid conflicts)
  const LogoContent = useMemo(() => {
    const cachedLogoUrl = localStorage.getItem("partner_logo");
    const cachedPartnerName =
      localStorage.getItem("whitelabelled_customer_partnername") ||
      "Partner Portal";

    if (
      cachedLogoUrl &&
      cachedLogoUrl !== "null" &&
      cachedLogoUrl !== "undefined"
    ) {
      return (
        <div className="transition-transform duration-300 hover:scale-105">
          <img
            src={cachedLogoUrl}
            alt={cachedPartnerName}
            className="h-12 w-auto object-contain"
          />
        </div>
      );
    }

    if (logoUrl && logoUrl !== "null" && logoUrl !== "undefined") {
      return (
        <div className="transition-transform duration-300 hover:scale-105">
          <img
            src={logoUrl}
            alt={partnerName || "Logo"}
            className="h-12 w-auto object-contain"
          />
        </div>
      );
    }

    let IconComponent = FaBuilding;
    let titleText = "Portal";

    if (isRemittanceOnlyCustomer === "Y") {
      IconComponent = FaMoneyCheckAlt;
      titleText = "Remittance";
    } else if (localStorage.getItem("whitelabelledpartnerid")) {
      titleText = cachedPartnerName;
    } else {
      IconComponent = FaHome;
      titleText = "Dashboard";
    }

    return (
      <div className="flex items-center transition-transform duration-300 hover:scale-105">
        <IconComponent className="h-8 w-8 text-white mr-2" />
        <span className="text-white font-semibold text-lg">{titleText}</span>
      </div>
    );
  }, [logoUrl, partnerName, isRemittanceOnlyCustomer]);

  // Header styles
  const headerClassNames = useMemo(() => {
    const baseClasses = "w-full shadow-xl sticky top-0 z-50";
    if (headerColor && headerColor.startsWith("#")) return baseClasses;
    if (headerColor) return `${baseClasses} ${headerColor}`;
    return `${baseClasses} bg-gradient-to-r from-sky-700 via-blue-600 to-indigo-700`;
  }, [headerColor]);

  const headerStyle = useMemo(() => {
    if (headerColor?.startsWith("#")) {
      return {
        background: `linear-gradient(135deg, ${headerColor} 0%, ${headerColor}CC 50%, ${headerColor}99 100%)`,
      };
    }
    return {};
  }, [headerColor]);

  const shouldShowFxRates = hasFxData && partnerFxCurrencies.length > 0;

  return (
    <>
      {/* Inject ticker styles */}
      <style>{tickerStyles}</style>

      {/* Logout Overlay with AnimatePresence */}
      <AnimatePresence>
        {isLoggingOut && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-10 flex flex-col items-center shadow-2xl"
            >
              <RingLoader size={60} color="#3B82F6" />
              <h3 className="text-xl font-bold text-gray-800 mt-4">
                Logging Out
              </h3>
              <p className="text-gray-500 text-sm">Please wait...</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header - Static header element */}
      <header className={headerClassNames} style={headerStyle}>
        <div className="w-full px-4 md:px-6 py-3 overflow-visible">
          <div className="flex items-center justify-between gap-4 md:gap-8 w-full overflow-visible">
            {/* Logo - Left with specific width */}
            <div className="flex-shrink-0" style={{ minWidth: "120px" }}>
              <Link
                to={
                  isRemittanceOnlyCustomer === "Y"
                    ? `/homeremit/${customerId}`
                    : `/home/${customerId}`
                }
              >
                {LogoContent}
              </Link>
            </div>

            {/* FX Ticker - Center - expands to fill space */}
            <div className="flex-1 flex justify-center min-w-0">
              {shouldShowFxRates && (
                <div className="w-full max-w-3xl ticker-wrapper">
                  <div
                    ref={tickerTrackRef}
                    className={`ticker-track ${isPaused ? "paused" : ""}`}
                    style={{ "--duration": `${animationDuration}s` }}
                    onMouseEnter={() => setIsPaused(true)}
                    onMouseLeave={() => setIsPaused(false)}
                  >
                    {duplicatedFxRates.map((fx) => (
                      <span
                        key={fx.uniqueKey}
                        className="ticker-item inline-flex items-center gap-2 mx-2 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full text-sm text-white/90 font-medium hover:bg-white/20 hover:scale-105 transition-all duration-200 cursor-default shadow-sm"
                        title={`1 ${fx.source_currency} = ${fx.displayRate} ${fx.destination_currency}`}
                      >
                        <span className="font-bold text-white">
                          {fx.source_currency}
                        </span>
                        <svg
                          className="w-3 h-3 text-white/40"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 7l5 5m0 0l-5 5m5-5H6"
                          />
                        </svg>
                        <span className="font-bold text-white">
                          {fx.destination_currency}
                        </span>
                        <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-mono font-semibold">
                          {fx.displayRate}
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Show empty centered div when no FX rates to maintain layout */}
              {!shouldShowFxRates && <div className="w-full max-w-3xl"></div>}
            </div>

            {/* Profile - Right with specific width */}
            <div className="flex-shrink-0" style={{ minWidth: "120px" }}>
              <div className="flex justify-end">
                <div className="hidden md:block">{ProfileSection}</div>
                <div className="md:hidden">{ProfileSection}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Static Border Line */}
        <div className="h-0.5 bg-gradient-to-r from-transparent via-white/50 to-transparent" />
      </header>
    </>
  );
};

Header.propTypes = {
  customerId: PropTypes.string.isRequired,
};

export default memo(Header);
