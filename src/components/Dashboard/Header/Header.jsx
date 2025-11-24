// src/components/Dashboard/Header/Header.jsx
import React, { useEffect, useRef, useCallback, useMemo, memo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import PropTypes from "prop-types";
import {
  FaUserCircle,
  FaUser,
  FaUsers,
  FaSignOutAlt,
  FaUserFriends,
  FaHome,
  FaBuilding,
  FaMoneyCheckAlt,
  FaIdCard,
  FaUserTie,
  FaShieldAlt,
  FaChevronRight,
  FaStar,
} from "react-icons/fa";
import { ClipLoader } from "react-spinners";
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
} from "./headerSlice";

// FIXED: Only import logoutUser, use local selectAuthToken
import { logoutUser } from "../../../features/Auth/slices/authSlice";

// Partner config hook
import { usePartnerConfig } from "../../../hooks/usePartnerConfig";

const selectAuthToken = (state) => {
  // Use bearertoken from localStorage for API calls
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

  // Fallback to Redux token
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
  console.log("🔍 Header component rendering");
  console.log("🔍 customerId prop:", customerId);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const timerRef = useRef(null);
  const hoverTimerRef = useRef(null);
  const fetchTimeoutRef = useRef(null);

  // Use the partner config hook
  const {
    headerColor,
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
    localStorage.getItem("isWhitelabelledCustomer") || "N";
  const firstName = localStorage.getItem("firstName") || "User";
  const lastName = localStorage.getItem("lastName") || "";

  const bearertoken = localStorage.getItem("bearertoken");

  // 🔍 REDUX PROFILE STORAGE DEBUG EFFECT
  useEffect(() => {
    console.log("🔍 REDUX PROFILE STORAGE CHECK:", {
      profileData, // Should change from null → object when fetched
      profileLoading, // Should be false when done
      fetchStatus: fetchStatus.profile, // Should be 'succeeded'
      storedInRedux: !!profileData,
      dataStructure: profileData ? Object.keys(profileData) : "null",
    });
  }, [profileData, profileLoading, fetchStatus.profile]);

  // 🔍 COMPREHENSIVE DEBUG EFFECT
  useEffect(() => {
    console.log("🔍 ========== HEADER DEBUG INFO ==========");
    console.log("🔍 customerId prop:", customerId);
    console.log("🔍 authtoken from Redux:", authtoken);
    console.log("🔍 bearertoken from localStorage:", bearertoken);
    console.log("🔍 isStaffLogin:", isStaffLogin);
    console.log("🔍 staffId:", staffId);
    console.log(
      "🔍 Current localStorage firstName:",
      localStorage.getItem("firstName")
    );
    console.log("🔍 profileLoading:", profileLoading);
    console.log("🔍 fetchStatus.profile:", fetchStatus.profile);
    console.log("🔍 profileData:", profileData);
    console.log("🔍 profileError:", profileError);
    console.log("🔍 =======================================");
  }, [
    authtoken,
    customerId,
    isStaffLogin,
    staffId,
    bearertoken,
    profileLoading,
    fetchStatus.profile,
    profileData,
    profileError,
  ]);

  // Handle logout
  const handleLogout = useCallback(async () => {
    console.log("🔍 Logout initiated");
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
      fetchTimeoutRef.current = null;
    }

    if (authtoken) {
      try {
        await dispatch(logoutUser(authtoken)).unwrap();
        navigate("/");
      } catch (error) {
        console.error("Logout error:", error);
        // Even if API call fails, clear local storage and redirect
        localStorage.removeItem("authtoken");
        localStorage.removeItem("authcustomer_id");
        localStorage.removeItem("bearertoken");
        localStorage.removeItem("is_staff_login");
        localStorage.removeItem("staff_role");
        localStorage.removeItem("is_owner_login");
        localStorage.removeItem("owner_id");
        localStorage.removeItem("owner_role_name");
        localStorage.removeItem("firstName");
        localStorage.removeItem("lastName");
        localStorage.removeItem("middleName");
        navigate("/");
      }
    } else {
      // No token, just redirect to login
      navigate("/");
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

  // Fetch FX currencies on mount
  useEffect(() => {
    if (
      bearertoken &&
      fetchStatus.fx !== "loading" &&
      fetchStatus.fx !== "succeeded"
    ) {
      dispatch(fetchPartnerFxCurrencies(bearertoken));
    }
  }, [dispatch, bearertoken, fetchStatus.fx]);

  // 🔍 UPDATED: Profile fetch effect with proper conditions
  useEffect(() => {
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }

    fetchTimeoutRef.current = setTimeout(() => {
      console.log("🔍 Profile Fetch Effect - Current State:", {
        bearertoken: !!bearertoken,
        customerId: !!customerId,
        fetchStatus: fetchStatus.profile,
        profileLoading,
        profileData: !!profileData,
        hasFirstName: !!localStorage.getItem("firstName"),
      });

      // Fetch profile data if we don't have it in Redux
      const shouldFetchProfile =
        bearertoken &&
        customerId &&
        fetchStatus.profile === "idle" &&
        !profileLoading &&
        !profileData; // Only fetch if we don't have data in Redux

      if (shouldFetchProfile) {
        console.log("🔍 Dispatching fetchUserProfile - need to populate Redux");
        dispatch(fetchUserProfile({ customerId, bearertoken }));
      } else {
        console.log("🔍 Profile fetch skipped", {
          reason: profileData
            ? "Already have profileData in Redux"
            : "Other conditions not met",
          hasProfileData: !!profileData,
          hasBearer: !!bearertoken,
          hasCustomerId: !!customerId,
          fetchStatus: fetchStatus.profile,
          isLoading: profileLoading,
        });
      }
    }, 100);

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
    console.log("🔍 Navigating to profile page for customer:", customerId);
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
    // Clear any pending close timer
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }

    // Open dropdown immediately on hover
    dispatch(openDropdown());
  }, [dispatch]);

  const handleMouseLeave = useCallback(() => {
    // Set a small delay before closing to allow moving to dropdown
    hoverTimerRef.current = setTimeout(() => {
      dispatch(closeDropdown());
    }, 300); // 300ms delay
  }, [dispatch]);

  // Auto-logout timer
  const resetTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      console.log("🕒 Auto-logout timer expired");
      handleLogout();
    }, 180000); // 3 minutes
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

  // Enhanced dropdown items with bigger padding and better UX
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
    // {
    //     id: 4,
    //     label: "Change Password",
    //     icon: FaShieldAlt,
    //     color: "text-red-600",
    //     bgColor: "bg-red-500/10",
    //     borderColor: "border-red-200",
    //     onClick: handleChangePasswordStaff,
    //     delay: 0.4,
    //     description: "Update your password"
    // },
  ];

  // Memoized profile section - updated with profile loading
  const ProfileSection = useMemo(() => {
    if (profileLoading) {
      return (
        <div className="flex items-center">
          <ClipLoader size={30} color={"#ffffff"} loading={true} />
          <span className="ml-2 text-white text-sm">Loading Profile...</span>
        </div>
      );
    }

    if (profileError) {
      console.error("🔍 Profile error in ProfileSection:", profileError);
    }

    // Use data from Redux if available, otherwise fallback to localStorage
    const displayName =
      profileData?.first_name || localStorage.getItem("firstName") || "User";
    const userRole =
      isStaffLogin === "1"
        ? staffRole
        : isOwnerLogin === "1"
        ? ownerRoleName
        : "Customer";

    console.log(
      "🔍 ProfileSection rendering with name:",
      displayName,
      "from Redux:",
      !!profileData
    );

    return (
      <div
        className="relative"
        ref={dropdownRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Profile Trigger Button - REMOVED onClick */}
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

        {/* Enhanced Animated Dropdown */}
        <AnimatePresence>
          {isDropdownOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{
                duration: 0.2, // Faster animation for hover
                type: "spring",
                stiffness: 500,
                damping: 30,
              }}
              className="absolute right-0 mt-2 w-96 bg-white/95 backdrop-blur-xl border border-white/30 rounded-3xl shadow-2xl shadow-black/30 z-50 overflow-hidden"
              style={{
                background:
                  "linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.98) 100%)",
              }}
              onMouseEnter={handleMouseEnter} // Keep open when hovering dropdown
              onMouseLeave={handleMouseLeave} // Close when leaving dropdown
            >
              {/* Header with user info */}
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

              {/* Menu Items with Bigger Padding */}
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
                      Sign out from your account
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

  // Determine which icon to use based on customer type
  const LogoIcon = useMemo(() => {
    if (isRemittanceOnlyCustomer === "Y") {
      return FaMoneyCheckAlt;
    }
    if (isWhitelabelledCustomerPartnerId) {
      return FaBuilding;
    }
    return FaHome;
  }, [isRemittanceOnlyCustomer, isWhitelabelledCustomerPartnerId]);

  // Get appropriate text for the logo area
  const logoText = useMemo(() => {
    if (isRemittanceOnlyCustomer === "Y") {
      return "Remittance Portal";
    }
    if (isWhitelabelledCustomerPartnerId) {
      return partnerConfig?.name || "Partner Portal";
    }
    return "Dashboard";
  }, [
    isRemittanceOnlyCustomer,
    isWhitelabelledCustomerPartnerId,
    partnerConfig,
  ]);

  // Handle header color class application
  const headerClassNames = useMemo(() => {
    const baseClasses = "w-full shadow-xl";
    if (headerColor && !headerColor.startsWith("#")) {
      return `${baseClasses} ${headerColor}`;
    }
    return `${baseClasses} bg-gradient-to-r from-sky-700 via-blue-600 to-indigo-700`;
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
    };
  }, []);

  return (
    <header className={headerClassNames} style={headerStyle}>
      <div className="max-w-[2000px] mx-auto px-8 py-4 flex justify-between items-center w-full">
        <div className="flex items-center space-x-5">
          {isRemittanceOnlyCustomer === "Y" ? (
            <Link
              to={`/homeremit/${customerId}`}
              className="flex items-center space-x-5 text-white hover:text-gray-200 transition-all duration-300 group"
            >
              {partnerConfigLoading ? (
                <ClipLoader size={30} color={"#ffffff"} loading={true} />
              ) : (
                <>
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <LogoIcon className="w-12 h-12 text-white group-hover:text-blue-200 transition-colors duration-300" />
                  </motion.div>
                  <div className="flex flex-col">
                    <span className="font-bold text-2xl tracking-tight">
                      {logoText}
                    </span>
                    <span className="text-sm opacity-90 font-medium mt-1">
                      Customer ID: {customerId}
                    </span>
                  </div>
                </>
              )}
            </Link>
          ) : (
            <Link
              to={`/home/${customerId}`}
              className="flex items-center space-x-5 text-white hover:text-gray-200 transition-all duration-300 group"
            >
              {partnerConfigLoading ? (
                <ClipLoader size={30} color={"#ffffff"} loading={true} />
              ) : (
                <>
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <LogoIcon className="w-12 h-12 text-white group-hover:text-blue-200 transition-colors duration-300" />
                  </motion.div>
                  <div className="flex flex-col">
                    <span className="font-bold text-2xl tracking-tight">
                      {logoText}
                    </span>
                    <span className="text-sm opacity-90 font-medium mt-1">
                      Customer ID: {customerId}
                    </span>
                  </div>
                </>
              )}
            </Link>
          )}
        </div>

        {/* FX Rates */}
        {hasFxData && partnerFxCurrencies.length > 0 && (
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

        {/* Desktop: Profile on right */}
        <div className="hidden md:flex justify-end md:w-1/4 items-center">
          {ProfileSection}
        </div>

        {/* Mobile: Profile menu */}
        <div className="md:hidden">{ProfileSection}</div>
      </div>

      {/* Enhanced Keyframe style */}
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
