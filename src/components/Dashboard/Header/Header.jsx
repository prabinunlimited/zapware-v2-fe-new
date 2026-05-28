import React, { useEffect, useRef, useCallback, useMemo, memo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
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
  FaBars,
  FaTimes,
} from "react-icons/fa";
import { RingLoader } from "react-spinners";
import { motion, AnimatePresence } from "framer-motion";
import { FaKey, FaLock } from "react-icons/fa";

import {
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

import { logoutUser } from "../../../features/Auth/slices/authSlice";
import { resetNavigateSection } from "../Navigation/NavigateSectionSlice"
import { usePartnerConfig } from "../../../hooks/usePartnerConfig";
import { apiCoordinator } from "../../../services/api";

const selectAuthToken = (state) => {
  const bearertoken = localStorage.getItem("bearertoken");
  const isValidToken =
    bearertoken &&
    bearertoken !== "undefined" &&
    bearertoken !== "null" &&
    bearertoken !== "false" &&
    typeof bearertoken === "string" &&
    bearertoken.length > 10;

  if (isValidToken) return bearertoken;

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
  const mobileMenuRef = useRef(null);
  const timerRef = useRef(null);
  const hoverTimerRef = useRef(null);
  const fetchTimeoutRef = useRef(null);
  const isNavigatingRef = useRef(false);
  const navigationTimerRef = useRef(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const {
    headerColor,
    logoUrl,
    logoAltText,
    partnerName,
    hasLogo,
    loading: partnerConfigLoading,
  } = usePartnerConfig();

  const partnerFxCurrencies = useSelector(selectPartnerFxCurrencies);
  const hasFxData = useSelector(selectHasFxData);
  const isDropdownOpen = useSelector(selectIsDropdownOpen);
  const authtoken = useSelector(selectAuthToken);
  const profileData = useSelector(selectProfileData);
  const profileLoading = useSelector(selectProfileLoading);
  const profileError = useSelector(selectProfileError);
  const isStaffLogin = useSelector(selectIsStaffLogin);
  const staffRole = useSelector(selectStaffRole);
  const isOwnerLogin = useSelector(selectIsOwnerLogin);
  const ownerRoleName = useSelector(selectOwnerRoleName);
  const staffId = useSelector(selectStaffId);
  const isRemittanceOnlyCustomer = useSelector(selectIsRemittanceOnlyCustomer);
  const isWhitelabelledCustomerPartnerId = useSelector(
    selectIsWhitelabelledCustomerPartnerId
  );
  const fetchStatus = useSelector(selectFetchStatus);

  const bearertoken = localStorage.getItem("bearertoken");

  // Helper: clear coordinator locks and navigate safely
  const clearAndNavigate = useCallback(
    (path) => {
      isNavigatingRef.current = true;
      setIsMobileMenuOpen(false);

      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
        fetchTimeoutRef.current = null;
      }

      try {
        apiCoordinator.clear();
      } catch (e) {
        console.warn("apiCoordinator.clear() failed:", e);
      }

      dispatch(closeDropdown());
      navigate(path);

      if (navigationTimerRef.current) {
        clearTimeout(navigationTimerRef.current);
      }
      navigationTimerRef.current = setTimeout(() => {
        isNavigatingRef.current = false;
      }, 2000);
    },
    [dispatch, navigate]
  );

  // Handle logout - UPDATED with proper cleanup
  const handleLogout = useCallback(async () => {
    console.log("🔴 Starting logout process...");
    
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
      fetchTimeoutRef.current = null;
    }
  
    try {
      apiCoordinator.clear();
    } catch (e) {
      console.warn("API coordinator clear error:", e);
    }
  
    const tokenToUse =
      authtoken ||
      localStorage.getItem("authtoken") ||
      localStorage.getItem("bearertoken");
  
    try {
      if (tokenToUse) {
        await dispatch(logoutUser(tokenToUse)).unwrap();
      } else {
        dispatch(logoutUser());
      }
      
      dispatch(resetNavigateSection());
      localStorage.clear();
      sessionStorage.clear();
      
      console.log("✅ Logout successful, redirecting...");
      window.location.href = "/";
      
    } catch (error) {
      console.error("Logout error:", error);
      dispatch(resetNavigateSection());
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = "/";
    }
  }, [authtoken, dispatch]);

  const handleChangePassword = useCallback(() => {
    clearAndNavigate(`/change-password/${customerId}`);
  }, [customerId, clearAndNavigate]);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target) && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMobileMenuOpen]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  // Listen for header color changes
  useEffect(() => {
    const handleStorageChange = () => dispatch(updateLocalStorageState());
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [dispatch]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        dispatch(closeDropdown());
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dispatch]);

  // Save customer_type to localStorage whenever profileData loads
  useEffect(() => {
    if (profileData?.customer_type) {
      console.log("💾 Header: Saving customer_type to localStorage:", profileData.customer_type);
      localStorage.setItem('customer_type', profileData.customer_type);
    }
  }, [profileData]);

  // Profile fetch — skips when navigating
  useEffect(() => {
    if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);

    fetchTimeoutRef.current = setTimeout(() => {
      if (isNavigatingRef.current) {
        console.log("🚫 Header: Skipping profile fetch — navigation in progress");
        return;
      }

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
        console.log("👤 Header: Fetching profile");
        dispatch(fetchUserProfile({ customerId, bearertoken }));
      }
    }, 300);

    return () => {
      if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
    };
  }, [dispatch, bearertoken, customerId, profileLoading, profileData]);

  // Navigation handlers
  const handleProfileClick = useCallback(() => {
    clearAndNavigate(`/profile/${customerId}`);
  }, [customerId, clearAndNavigate]);

  const handleBeneficiariesClick = useCallback(() => {
    clearAndNavigate(`/beneficiaries/${customerId}`);
  }, [customerId, clearAndNavigate]);

  const handleTeamClick = useCallback(() => {
    clearAndNavigate(`/team/${customerId}`);
  }, [customerId, clearAndNavigate]);

  const handleChangePasswordStaff = useCallback(() => {
    clearAndNavigate(`/changepasswordstaff/${staffId}`);
  }, [staffId, clearAndNavigate]);

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
    if (timerRef.current) clearTimeout(timerRef.current);
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
        if (timerRef.current) clearTimeout(timerRef.current);
      };
    }
  }, [resetTimer, authtoken]);

  // Cleanup all timers on unmount
  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
      if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
      if (navigationTimerRef.current) clearTimeout(navigationTimerRef.current);
    };
  }, []);

  // Get customer type from profile data
  const customerType = useMemo(() => {
    if (profileData?.customer_type) {
      return profileData.customer_type;
    }
    const cachedType = localStorage.getItem('customer_type');
    if (cachedType) {
      return cachedType;
    }
    return null;
  }, [profileData]);

  // Filter dropdown items based on customer type
  const dropdownItems = useMemo(() => {
    const baseItems = [
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
        label: "Change Password",
        icon: FaKey,
        color: "text-violet-600",      
        bgColor: "bg-violet-500/10",
        borderColor: "border-violet-200",
        onClick: handleChangePassword,
        delay: 0.25,
        description: "Update your account password",
      },
    ];

    if (customerType === "institution") {
      baseItems.push({
        id: 4,
        label: "Team Members",
        icon: FaUserTie,
        color: "text-teal-600",
        bgColor: "bg-teal-500/10",
        borderColor: "border-teal-200",
        onClick: handleTeamClick,
        delay: 0.3,
        description: "Manage team access and permissions",
      });
    }

    return baseItems;
  }, [customerType, handleProfileClick, handleBeneficiariesClick, handleTeamClick]);

  // Mobile Menu Component
  const MobileMenu = () => (
    <AnimatePresence>
      {isMobileMenuOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          
          {/* Menu Panel */}
          <motion.div
            ref={mobileMenuRef}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-sm bg-white shadow-2xl z-50 md:hidden overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600 p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-white text-xl font-bold">Menu</h3>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  <FaTimes className="w-6 h-6" />
                </button>
              </div>
              
              {/* User Info */}
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                    <FaUserCircle className="w-8 h-8 text-white" />
                  </div>
                  {/* Green dot for mobile */}
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-green-400 rounded-full border-2 border-white shadow-lg"
                  />
                </div>
                <div className="flex-1">
                  <p className="text-white font-semibold text-lg">
                    {profileData?.first_name || localStorage.getItem("firstName") || "User"}
                  </p>
                  <p className="text-blue-100 text-sm mt-1">ID: {customerId}</p>
                  <div className="flex items-center mt-2 space-x-2">
                    <span className="px-2 py-1 bg-white/20 text-white text-xs rounded-full">
                      {isStaffLogin === "1" ? staffRole : isOwnerLogin === "1" ? ownerRoleName : "Customer"}
                    </span>
                    <span className="px-2 py-1 bg-green-500/20 text-green-100 text-xs rounded-full">
                      Active
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="p-4 space-y-2">
              {dropdownItems.map((item) => (
                <motion.button
                  key={item.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    item.onClick();
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center w-full p-4 rounded-xl hover:bg-gray-50 transition-all duration-200 border border-gray-100"
                >
                  <div className={`p-3 rounded-xl ${item.bgColor} ${item.borderColor}`}>
                    <item.icon className={`w-5 h-5 ${item.color}`} />
                  </div>
                  <div className="ml-4 flex-1 text-left">
                    <span className="font-semibold text-gray-900">{item.label}</span>
                    <p className="text-xs text-gray-500 mt-1">{item.description}</p>
                  </div>
                  <FaChevronRight className="w-4 h-4 text-gray-400" />
                </motion.button>
              ))}

              {/* Divider */}
              <div className="h-px bg-gray-200 my-4" />

              {/* Logout Button */}
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  handleLogout();
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center w-full p-4 rounded-xl hover:bg-red-50 transition-all duration-200 border border-red-100"
              >
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-200">
                  <FaSignOutAlt className="w-5 h-5 text-red-500" />
                </div>
                <div className="ml-4 flex-1 text-left">
                  <span className="font-semibold text-red-600">Logout</span>
                  <p className="text-xs text-red-500/80 mt-1">Sign out from your account</p>
                </div>
              </motion.button>
            </div>

            {/* Footer */}
            <div className="p-6 bg-gray-50 border-t border-gray-200 mt-4">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center text-gray-500">
                  <FaStar className="w-4 h-4 text-yellow-500 mr-2" />
                  <span>Secure Portal</span>
                </div>
                <div className="text-xs text-gray-400">v2.1.0</div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  const ProfileSection = useMemo(() => {
    if (profileLoading && !profileData) {
      return (
        <div className="flex items-center">
          <RingLoader size={30} color={"#ffffff"} loading={true} />
          <span className="ml-2 text-white text-sm hidden sm:inline">Loading Profile...</span>
        </div>
      );
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
      <>
        {/* Desktop Dropdown */}
        <div
          className="relative hidden md:block"
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
            <div className="ml-3 flex-col hidden lg:flex">
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
              className="ml-3 hidden lg:block"
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
                  background: "linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.98) 100%)",
                  maxHeight: "calc(100vh - 100px)",
                  overflowY: "auto",
                }}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              >
                {/* Profile Header */}
                <motion.div
                  className="p-8 bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600 sticky top-0 z-10"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <div className="flex items-center space-x-5">
                    <motion.div whileHover={{ scale: 1.1, rotate: 5 }} className="relative">
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
                        className="flex items-center mt-3 space-x-2"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                      >
                        <div className="px-3 py-1 bg-white/20 text-white text-xs font-semibold rounded-full backdrop-blur-sm">
                          {userRole}
                        </div>
                        <div className="px-2 py-1 bg-green-500/20 text-green-100 text-xs rounded-full">
                          Active
                        </div>
                      </motion.div>
                    </div>
                  </div>
                </motion.div>

                {/* Menu Items */}
                <div className="overflow-y-auto" style={{ maxHeight: "400px" }}>
                  <div className="p-6">
                    <div className="space-y-3">
                      {dropdownItems.map((item) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: item.delay, type: "spring", stiffness: 500 }}
                          whileHover={{ scale: 1.02, x: 5 }}
                        >
                          <button
                            onClick={item.onClick}
                            className="flex items-start w-full text-left p-5 rounded-2xl transition-all duration-300 group border border-gray-100 hover:border-gray-200 hover:shadow-lg bg-white/50 hover:bg-white"
                          >
                            <div className={`p-4 rounded-xl ${item.bgColor} border ${item.borderColor} group-hover:scale-110 transition-all duration-300 shadow-sm`}>
                              <item.icon className={`w-6 h-6 ${item.color}`} />
                            </div>
                            <div className="ml-5 flex-1 min-w-0">
                              <span className="font-semibold text-gray-900 group-hover:text-gray-800 transition-colors duration-200">
                                {item.label}
                              </span>
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

                  {/* Logout */}
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
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Mobile Avatar Button with Green Dot */}
        <div className="md:hidden relative">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="flex items-center justify-center w-10 h-10 bg-white/10 rounded-full hover:bg-white/20 transition-all duration-200 relative"
          >
            <FaUserCircle className="w-6 h-6 text-white" />
          </button>
          {/* Green dot for mobile avatar button */}
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white shadow-lg"
          />
        </div>
      </>
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
    customerType,
    dropdownItems,
    handleLogout,
    handleMouseEnter,
    handleMouseLeave,
    dispatch,
  ]);

  const LogoContent = useMemo(() => {
    if (partnerConfigLoading) {
      return (
        <div className="flex items-center">
          <RingLoader size={40} color={"#ffffff"} loading={true} />
        </div>
      );
    }

    if (hasLogo && logoUrl) {
      return (
        <motion.div
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 300 }}
          className="flex items-center justify-center"
        >
          <img
            src={logoUrl}
            alt={logoAltText}
            className="h-12 sm:h-16 md:h-20 w-auto object-contain"
            style={{ maxWidth: "200px", maxHeight: "80px" }}
            onError={(e) => {
              console.error("Failed to load partner logo:", logoUrl);
              e.target.style.display = "none";
            }}
          />
        </motion.div>
      );
    }

    let IconComponent = FaHome;
    if (isRemittanceOnlyCustomer === "Y") {
      IconComponent = FaMoneyCheckAlt;
    } else if (isWhitelabelledCustomerPartnerId) {
      IconComponent = FaBuilding;
    }

    return (
      <motion.div
        whileHover={{ scale: 1.05 }}
        transition={{ type: "spring", stiffness: 300 }}
        className="flex items-center justify-center"
      >
        <IconComponent
          className="h-16 sm:h-20 md:h-24 w-auto text-white"
          style={{ minWidth: "60px" }}
        />
      </motion.div>
    );
  }, [
    partnerConfigLoading,
    logoUrl,
    logoAltText,
    hasLogo,
    isRemittanceOnlyCustomer,
    isWhitelabelledCustomerPartnerId,
  ]);

  const headerClassNames = useMemo(() => {
    const baseClasses = "w-full shadow-xl";
    if (headerColor) {
      if (headerColor.startsWith("#")) return baseClasses;
      return `${baseClasses} ${headerColor}`;
    }
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

  return (
    <>
      <header className={headerClassNames} style={headerStyle}>
        <div className="max-w-[2000px] mx-auto px-4 sm:px-6 py-3 flex justify-between items-center w-full">
          {/* Logo Section */}
          <div className="flex items-center flex-shrink-0">
            {isRemittanceOnlyCustomer === "Y" ? (
              <Link
                to={`/homeremit/${customerId}`}
                className="flex items-center text-white hover:text-gray-200 transition-all duration-300 group"
              >
                {LogoContent}
              </Link>
            ) : (
              <Link
                to={`/home/${customerId}`}
                className="flex items-center text-white hover:text-gray-200 transition-all duration-300 group"
              >
                {LogoContent}
              </Link>
            )}
          </div>

          {/* FX Rates - Hide on mobile, show on tablet/desktop */}
          {hasFxData && partnerFxCurrencies.length > 0 && (
            <div className="hidden md:block flex-1 mx-4">
              <div className="overflow-hidden">
                <div className="overflow-hidden">
                  <motion.div
                    className="whitespace-nowrap text-white/90 font-medium text-sm lg:text-lg animate-marquee"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    {partnerFxCurrencies.map((fx, index) => (
                      <span key={index} className="mx-4 lg:mx-8">
                        {fx.source_currency} → {fx.destination_currency}:{" "}
                        {fx.rate ?? "N/A"}
                      </span>
                    ))}
                  </motion.div>
                </div>
              </div>
            </div>
          )}

          {/* Profile Section */}
          <div className="flex items-center">
            {ProfileSection}
          </div>
        </div>

        {/* Mobile FX Rates - Optional horizontal scroll */}
        {hasFxData && partnerFxCurrencies.length > 0 && (
          <div className="md:hidden px-4 pb-3 overflow-x-auto">
            <div className="flex space-x-4">
              {partnerFxCurrencies.map((fx, index) => (
                <div key={index} className="flex-shrink-0 text-white/80 text-xs bg-white/10 px-3 py-1 rounded-full">
                  <span>{fx.source_currency} → {fx.destination_currency}: </span>
                  <span className="font-semibold">{fx.rate ?? "N/A"}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* Mobile Menu */}
      <MobileMenu />

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        @media (max-width: 768px) {
          @keyframes marquee {
            0% { transform: translateX(50%); }
            100% { transform: translateX(-50%); }
          }
        }
        .animate-marquee {
          display: inline-block;
          animation: marquee 35s linear infinite;
          text-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        @media (max-width: 768px) {
          .animate-marquee {
            animation-duration: 25s;
          }
        }
      `}</style>
    </>
  );
};

Header.propTypes = {
  customerId: PropTypes.string.isRequired,
};

export default memo(Header);