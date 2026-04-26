// src/components/Beneficiaries/Header/BeneficiariesHeader.jsx
import React, { useEffect, useRef, useCallback, useMemo, memo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import PropTypes from "prop-types";
import {
  FaUserCircle,
  FaSignOutAlt,
  FaIdCard,
  FaChevronRight,
  FaStar,
  FaHome,
  FaBuilding,
  FaMoneyCheckAlt,
  FaAddressBook,
  FaUsers,
  FaUserTie,
} from "react-icons/fa";
import { ClipLoader } from "react-spinners";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";

// Redux imports
import {
  fetchMerchantBeneficiary,
  fetchBeneficiaryProfile,
  openDropdown,
  closeDropdown,
  updateLocalStorageState,
  selectIsDropdownOpen,
  selectMerchantData,
  selectMerchantLoading,
  selectMerchantError,
  selectBeneficiaryProfile,
  selectProfileLoading,
  selectProfileError,
  selectBenefCode,
  selectDisplayName,
  selectBeneficiaryRole,
  selectFetchStatus,
} from "./BeneficiariesHeaderSlice";

// Custom hooks
import { usePartnerConfig } from "../../../hooks/usePartnerConfig";

const BeneficiariesHeader = ({ beneficiaryId }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const timerRef = useRef(null);
  const hoverTimerRef = useRef(null);
  const fetchTimeoutRef = useRef(null);

  // Redux selectors
  const isDropdownOpen = useSelector(selectIsDropdownOpen);
  const merchantData = useSelector(selectMerchantData);
  const merchantLoading = useSelector(selectMerchantLoading);
  const merchantError = useSelector(selectMerchantError);
  const beneficiaryProfile = useSelector(selectBeneficiaryProfile);
  const profileLoading = useSelector(selectProfileLoading);
  const profileError = useSelector(selectProfileError);
  const benefCode = useSelector(selectBenefCode);
  const displayName = useSelector(selectDisplayName);
  const beneficiaryRole = useSelector(selectBeneficiaryRole);
  const fetchStatus = useSelector(selectFetchStatus);

  // Use the partner config hook (for partner-specific styling)
  const {
    headerColor,
    loading: partnerConfigLoading,
    config: partnerConfig,
  } = usePartnerConfig();

  // Get from localStorage
  const bearertoken = localStorage.getItem("bearertoken");
  const isStaffLogin = localStorage.getItem("is_staff_login") || "0";
  const staffId = localStorage.getItem("staff_id") || "";
  const isOwnerLogin = localStorage.getItem("is_owner_login") || "0";
  const isRemittanceOnlyCustomer =
    localStorage.getItem("isRemittanceOnlyCustomer") || "N";
  const isWhitelabelledCustomer =
    localStorage.getItem("isWhitelabelledCustomer") || "N";

  // 🔍 DEBUG EFFECT
  useEffect(() => {
    console.log("🔍 Beneficiaries Header Redux - State:", {
      beneficiaryId,
      benefCode,
      displayName,
      beneficiaryRole,
      merchantLoading,
      fetchStatus: fetchStatus.merchant,
      hasBearerToken: !!bearertoken,
      hasMerchantData: !!merchantData,
      hasBeneficiaryProfile: !!beneficiaryProfile,
    });
  }, [
    beneficiaryId,
    benefCode,
    displayName,
    beneficiaryRole,
    merchantLoading,
    fetchStatus.merchant,
    bearertoken,
    merchantData,
    beneficiaryProfile,
  ]);

  // Handle logout
  const handleLogout = useCallback(async () => {
    console.log("🔍 Beneficiaries Logout initiated");

    // Clear timers
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
      fetchTimeoutRef.current = null;
    }

    if (bearertoken) {
      try {
        // Clear all local storage
        const itemsToKeep = ["language", "theme"]; // Add any items you want to keep
        const currentStorage = { ...localStorage };

        // Restore items you want to keep
        itemsToKeep.forEach((key) => {
          if (currentStorage[key]) {
            localStorage.setItem(key, currentStorage[key]);
          }
        });

        sessionStorage.clear();

        // Navigate to login
        navigate("/");

        // Force reload to clear any cached state
        window.location.reload();
      } catch (error) {
        console.error("Beneficiaries Logout error:", error);
        // Even if API call fails, clear everything
        sessionStorage.clear();
        navigate("/");
        window.location.reload();
      }
    } else {
      navigate("/");
    }
  }, [bearertoken, navigate]);

  // Close dropdown when clicking outside
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

  // Fetch beneficiary data with improved logic - UPDATED
  useEffect(() => {
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }

    fetchTimeoutRef.current = setTimeout(() => {
      console.log("🔍 Beneficiary data fetch check:", {
        beneficiaryId,
        bearertoken: !!bearertoken,
        fetchStatus: fetchStatus.merchant,
        hasMerchantData: !!merchantData,
      });

      // ✅ SIMPLIFIED: Only check merchant data since profile is derived from it
      const shouldFetch =
        bearertoken &&
        beneficiaryId &&
        !merchantLoading &&
        fetchStatus.merchant === "idle" &&
        !merchantData;

      if (shouldFetch) {
        console.log("🔍 Fetching merchant beneficiary data");
        // Both fetchMerchantBeneficiary and fetchBeneficiaryProfile are the same now
        dispatch(fetchMerchantBeneficiary(beneficiaryId));
        // No need to call fetchBeneficiaryProfile - it's the same function!
      }
    }, 500); // Increased delay to ensure proper loading

    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, [
    dispatch,
    bearertoken,
    beneficiaryId,
    merchantLoading,
    merchantData,
    fetchStatus.merchant,
  ]);

  const handleProfileClick = useCallback(() => {
    if (!beneficiaryId) {
      toast.error("No beneficiary ID available");
      return;
    }
    console.log("🔍 Navigating to profile page with ID:", beneficiaryId);

    // Use the new clean route: /beneficiary/profile/:id
    navigate(`/beneficiary/profile/${beneficiaryId}`);

    dispatch(closeDropdown());
  }, [beneficiaryId, navigate, dispatch]);

  const handleDashboardClick = useCallback(() => {
    if (!beneficiaryId) {
      toast.error("No beneficiary ID available");
      return;
    }
    console.log("🔍 Navigating to dashboard with ID:", beneficiaryId);

    // Use the new clean route: /beneficiary/homepage/:id
    navigate(`/beneficiary/homepage/${beneficiaryId}`);

    dispatch(closeDropdown());
  }, [beneficiaryId, navigate, dispatch]);

  // Update the other navigation handlers to use proper beneficiary routes
  const handleBeneficiariesClick = useCallback(() => {
    // This should navigate to a beneficiary-specific requests page
    // If you don't have one yet, create it or use homepage
    navigate(`/beneficiary/homepage/${beneficiaryId}`);
    dispatch(closeDropdown());
  }, [beneficiaryId, navigate, dispatch]);

  const handleTeamClick = useCallback(() => {
    // Team management for beneficiary portal
    // Create a beneficiary-specific team component if needed
    navigate(`/beneficiary/homepage/${beneficiaryId}`);
    dispatch(closeDropdown());
  }, [beneficiaryId, navigate, dispatch]);

  const handleChangePasswordStaff = useCallback(() => {
    if (staffId) {
      navigate(`/changepasswordstaff/${staffId}`);
      dispatch(closeDropdown());
    }
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
      console.log("🕒 Beneficiaries Auto-logout timer expired");
      handleLogout();
    }, 180000); // 3 minutes
  }, [handleLogout]);

  // Setup auto-logout listeners
  useEffect(() => {
    if (bearertoken) {
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
  }, [resetTimer, bearertoken]);

  // Dropdown items for beneficiaries
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
      description: "Manage your beneficiary information",
    },
    {
      id: 2,
      label: "Beneficiary Dashboard",
      icon: FaHome,
      color: "text-green-600",
      bgColor: "bg-green-500/10",
      borderColor: "border-green-200",
      onClick: handleDashboardClick,
      delay: 0.2,
      description: "View your beneficiary dashboard",
    },
    {
      id: 3,
      label: "My Beneficiary Requests",
      icon: FaAddressBook,
      color: "text-purple-600",
      bgColor: "bg-purple-500/10",
      borderColor: "border-purple-200",
      onClick: handleBeneficiariesClick,
      delay: 0.3,
      description: "View and manage beneficiary requests",
    },
  ];

  // Add team members and change password for staff/owners
  if (isStaffLogin === "1" || isOwnerLogin === "1") {
    dropdownItems.push({
      id: 4,
      label: "Team Members",
      icon: FaUserTie,
      color: "text-amber-600",
      bgColor: "bg-amber-500/10",
      borderColor: "border-amber-200",
      onClick: handleTeamClick,
      delay: 0.4,
      description: "Manage team access and permissions",
    });

    if (isStaffLogin === "1" && staffId) {
      dropdownItems.push({
        id: 5,
        label: "Change Password",
        icon: FaUsers,
        color: "text-indigo-600",
        bgColor: "bg-indigo-500/10",
        borderColor: "border-indigo-200",
        onClick: handleChangePasswordStaff,
        delay: 0.5,
        description: "Update your account password",
      });
    }
  }

  // Memoized profile section - UPDATED
  const ProfileSection = useMemo(() => {
    const isLoading = merchantLoading; // profileLoading is the same as merchantLoading

    if (isLoading && !merchantData) {
      // Don't check beneficiaryProfile separately since it's derived from merchantData
      return (
        <div className="flex items-center">
          <ClipLoader size={30} color={"#ffffff"} loading={true} />
          <span className="ml-2 text-white text-sm">Loading...</span>
        </div>
      );
    }

    // Show any errors
    if (merchantError || profileError) {
      console.error("🔍 Beneficiary header errors:", {
        merchantError,
        profileError,
      });
    }

    const userRole = beneficiaryRole;

    return (
      <div
        className="relative"
        ref={dropdownRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Profile Trigger Button */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="flex items-center cursor-pointer bg-white/10 hover:bg-white/20 rounded-2xl px-4 py-3 transition-all duration-300 backdrop-blur-sm border border-white/20 min-w-[200px]"
        >
          <motion.div
            whileHover={{ rotate: 5 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="relative flex-shrink-0"
          >
            <FaUserCircle className="w-10 h-10 text-white" />
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white"
            />
          </motion.div>

          {/* User info */}
          <div className="ml-3 flex flex-col flex-1 min-w-0">
            <span className="font-semibold text-white text-sm leading-tight truncate">
              {displayName}
            </span>
            <span className="text-xs text-white/80 leading-tight truncate">
              {userRole}
            </span>
          </div>

          <motion.div
            animate={{ rotate: isDropdownOpen ? 180 : 0 }}
            transition={{ duration: 0.3 }}
            className="ml-2 flex-shrink-0"
          >
            <FaChevronRight className="w-3 h-3 text-white/70" />
          </motion.div>
        </motion.div>

        {/* Dropdown */}
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
              {/* Header with user info */}
              <motion.div
                className="p-8 bg-gradient-to-br from-green-500 via-green-600 to-blue-600"
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
                      className="text-green-100 mt-1 text-sm"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      Beneficiary Code: {benefCode || "N/A"}
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
                        Beneficiaries Portal
                      </div>
                      {merchantData?.status === 1 && (
                        <div className="ml-2 px-2 py-1 bg-green-500/30 text-green-100 text-xs rounded-full">
                          Active
                        </div>
                      )}
                    </motion.div>
                  </div>
                </div>
              </motion.div>

              {/* Menu Items */}
              <div className="p-6">
                <div className="space-y-3">
                  {dropdownItems.map((item) => (
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
                            <span className="font-semibold text-gray-900 group-hover:text-gray-800 transition-colors duration-200">
                              {item.label}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                            {item.description}
                          </p>
                        </div>
                        <FaChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 mt-1 group-hover:translate-x-1 transition-all duration-200" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Logout Section */}
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
                      Sign out from beneficiaries portal
                    </p>
                  </div>
                  <FaChevronRight className="w-4 h-4 text-red-400 group-hover:text-red-500 mt-1 group-hover:translate-x-1 transition-all duration-200" />
                </motion.button>
              </motion.div>

              {/* Footer */}
              <motion.div
                className="px-8 py-5 bg-gradient-to-r from-gray-50 to-gray-100/50 border-t border-gray-100"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm text-gray-500">
                    <FaStar className="w-4 h-4 text-yellow-500 mr-2" />
                    <span>Beneficiaries Portal • v2.1.0</span>
                  </div>
                  <div className="text-xs text-gray-400">
                    {beneficiaryProfile?.created_at
                      ? `Member since ${new Date(
                          beneficiaryProfile.created_at
                        ).toLocaleDateString()}`
                      : "Last login: Today"}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }, [
    merchantLoading,
    merchantData,
    beneficiaryProfile,
    merchantError,
    profileError,
    displayName,
    beneficiaryRole,
    isDropdownOpen,
    benefCode,
    dropdownItems,
    handleLogout,
    handleMouseEnter,
    handleMouseLeave,
    dispatch,
  ]);

  // Determine which icon to use based on customer type
  const LogoIcon = useMemo(() => {
    if (isRemittanceOnlyCustomer === "Y") {
      return FaMoneyCheckAlt;
    }
    if (isWhitelabelledCustomer === "Y") {
      return FaBuilding;
    }
    return FaAddressBook; // Default for beneficiaries
  }, [isRemittanceOnlyCustomer, isWhitelabelledCustomer]);

  // Get appropriate text for the logo area
  const logoText = useMemo(() => {
    if (isRemittanceOnlyCustomer === "Y") {
      return "Remittance Beneficiaries";
    }
    if (isWhitelabelledCustomer === "Y") {
      return partnerConfig?.name
        ? `${partnerConfig.name} Beneficiaries`
        : "Partner Beneficiaries";
    }
    return "Beneficiaries Portal";
  }, [isRemittanceOnlyCustomer, isWhitelabelledCustomer, partnerConfig]);

  // Handle header color class application
  const headerClassNames = useMemo(() => {
    const baseClasses = "w-full shadow-xl";
    if (headerColor && !headerColor.startsWith("#")) {
      return `${baseClasses} ${headerColor}`;
    }
    return `${baseClasses} bg-gradient-to-r from-green-700 via-emerald-600 to-blue-700`;
  }, [headerColor]);

  // Inline style for hex colors
  const headerStyle = useMemo(() => {
    if (headerColor?.startsWith("#")) {
      return {
        background: `linear-gradient(135deg, ${headerColor} 0%, ${headerColor}99 50%, ${headerColor}80 100%)`,
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
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  // Sync localStorage with Redux on mount
  useEffect(() => {
    dispatch(updateLocalStorageState());
  }, [dispatch]);

  return (
    <header className={headerClassNames} style={headerStyle}>
      <div className="max-w-[2000px] mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex justify-between items-center w-full">
        <div className="flex items-center space-x-3 sm:space-x-5">
          {/* Logo linking to beneficiary homepage */}
          <Link
            to={`/benefhomepage/${beneficiaryId}`}
            className="flex items-center space-x-3 sm:space-x-5 text-white hover:text-gray-200 transition-all duration-300 group"
          >
            {partnerConfigLoading ? (
              <ClipLoader size={30} color={"#ffffff"} loading={true} />
            ) : (
              <>
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="flex-shrink-0"
                >
                  <LogoIcon className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-white group-hover:text-green-200 transition-colors duration-300" />
                </motion.div>
                <div className="flex flex-col">
                  <span className="font-bold text-lg sm:text-xl lg:text-2xl tracking-tight">
                    {logoText}
                  </span>
                  {benefCode && (
                    <span className="text-xs sm:text-sm text-white/80 mt-0.5 sm:mt-1">
                      ID: {benefCode}
                    </span>
                  )}
                </div>
              </>
            )}
          </Link>
        </div>

        {/* Desktop: Profile on right */}
        <div className="hidden md:flex justify-end md:w-1/4 items-center">
          {ProfileSection}
        </div>

        {/* Mobile: Profile menu */}
        <div className="md:hidden">
          <div className="flex items-center">{ProfileSection}</div>
        </div>
      </div>
    </header>
  );
};

BeneficiariesHeader.propTypes = {
  beneficiaryId: PropTypes.string.isRequired,
};

export default memo(BeneficiariesHeader);
