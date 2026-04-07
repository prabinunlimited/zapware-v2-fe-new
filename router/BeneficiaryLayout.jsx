import React, { useEffect, useRef } from "react";
import { Outlet, useNavigate, useParams, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";

// Import components
import BeneficiariesHeader from "../src/components/RequestRemit/Header/BeneficiariesHeader";
import NavigateSectionBenef from "../src/components/RequestRemit/Navigation/BeneficiaryNavigation";

// Import Redux slices
import {
  fetchBeneficiaryData,
  selectMerchantData,
  selectFetchStatus,
  selectHasFetched,
} from "../src/components/RequestRemit/Header/BeneficiariesHeaderSlice";
import {
  initializeNavigation,
  selectNavigationStatus,
  selectBeneficiaryName,
} from "../src/components/RequestRemit/Navigation/Slices/BeneficiaryNavigationSlice";

// Import centralized API
import { centralizedApi } from "../src/services/api";

const BeneficiaryLayout = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const params = useParams();

  // Track initialization state
  const isInitializedRef = useRef(false);
  const fetchAttemptRef = useRef(0);
  const MAX_FETCH_ATTEMPTS = 2;

  // Get Redux state from header slice
  const merchantData = useSelector(selectMerchantData);
  const fetchStatus = useSelector(selectFetchStatus);
  const hasFetched = useSelector(selectHasFetched);

  // Get Redux state from navigation slice
  const beneficiaryName = useSelector(selectBeneficiaryName);
  const navigationStatus = useSelector(selectNavigationStatus);

  // Extract beneficiary ID from ALL possible parameter names
  const routeBeneficiaryId =
    params.id || params.beneficiaryId || params.beneficiaryid;

  // Fall back to localStorage if no route parameter
  const beneficiaryId =
    routeBeneficiaryId ||
    localStorage.getItem("beneficaryId") ||
    localStorage.getItem("beneficiaryId");

  // ✅ ADD AUTH CHECK
  const bearertoken =
    localStorage.getItem("bearertoken") || localStorage.getItem("authtoken");

  console.log("🔍 BENEFICIARY LAYOUT DEBUG:", {
    location: location.pathname,
    params,
    routeBeneficiaryId,
    beneficiaryId,
    hasBearerToken: !!bearertoken,
    hasMerchantData: !!merchantData,
    fetchStatus,
    hasFetched,
    beneficiaryName,
    navigationStatus,
    isInitialized: isInitializedRef.current,
    fetchAttempt: fetchAttemptRef.current,
  });

  // ✅ MAIN INITIALIZATION EFFECT - HANDLES EVERYTHING IN ONE PLACE
  useEffect(() => {
    // Prevent multiple initializations
    if (isInitializedRef.current) {
      console.log("⚠️ Already initialized, skipping");
      return;
    }

    // Validate authentication FIRST
    if (!bearertoken) {
      console.log("❌ No bearer token, redirecting to login");
      toast.error("Authentication required. Redirecting to login.");
      navigate("/");
      return;
    }

    if (!beneficiaryId) {
      console.log("❌ No beneficiary ID, redirecting to login");
      toast.error("No beneficiary selected. Redirecting to login.");
      navigate("/");
      return;
    }

    // Mark as initialized
    isInitializedRef.current = true;
    console.log("🚀 Starting beneficiary layout initialization...");

    // ✅ Set beneficiary flags for consistency
    localStorage.setItem("beneficaryLogin", "Y");
    localStorage.setItem("is_beneficiary", "true");

    // Store ID for persistence
    localStorage.setItem("beneficaryId", beneficiaryId);
    localStorage.setItem("beneficiaryId", beneficiaryId);

    // Initialize navigation
    dispatch(initializeNavigation());

    // ✅ Fetch beneficiary data if not already fetched
    const fetchData = async () => {
      try {
        // Check if we've already fetched this beneficiary
        if (hasFetched) {
          console.log("✅ Beneficiary data already fetched, skipping");
          return;
        }

        // Prevent too many fetch attempts
        if (fetchAttemptRef.current >= MAX_FETCH_ATTEMPTS) {
          console.error("❌ Max fetch attempts reached");
          toast.error("Failed to load beneficiary data. Please refresh.");
          return;
        }

        fetchAttemptRef.current += 1;
        console.log(
          `🔄 Fetching beneficiary data (attempt ${fetchAttemptRef.current})...`
        );

        // Dispatch the fetch action
        await dispatch(fetchBeneficiaryData(beneficiaryId)).unwrap();

        console.log("✅ Beneficiary data fetched successfully");
      } catch (error) {
        console.error("❌ Error fetching beneficiary data:", error);

        // Show error message but don't redirect - user might still navigate
        if (fetchAttemptRef.current >= MAX_FETCH_ATTEMPTS) {
          toast.error(
            "Failed to load beneficiary data. Some features may be limited."
          );
        }
      }
    };

    fetchData();

    // Cleanup function
    return () => {
      console.log("🧹 Cleaning up beneficiary layout");
      // Reset fetch attempts on cleanup
      fetchAttemptRef.current = 0;
    };
  }, [bearertoken, beneficiaryId, navigate, dispatch, hasFetched]);

  // ✅ Reset initialization when beneficiary ID changes
  useEffect(() => {
    if (beneficiaryId) {
      // Reset initialization state if beneficiary ID changes
      const prevBeneficiaryId = localStorage.getItem("previousBeneficiaryId");
      if (prevBeneficiaryId !== beneficiaryId) {
        console.log("🔄 Beneficiary ID changed, resetting initialization");
        isInitializedRef.current = false;
        fetchAttemptRef.current = 0;
        localStorage.setItem("previousBeneficiaryId", beneficiaryId);
      }
    }
  }, [beneficiaryId]);

  // ✅ Handle API errors globally
  useEffect(() => {
    if (
      fetchStatus === "failed" &&
      fetchAttemptRef.current < MAX_FETCH_ATTEMPTS
    ) {
      console.log("🔄 Fetch failed, will retry on next render");
      // Reset initialization to allow retry
      isInitializedRef.current = false;
    }
  }, [fetchStatus]);

  // ✅ Show loading while checking auth/fetching
  if (!bearertoken || !beneficiaryId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">
          Loading beneficiary portal...
        </span>
      </div>
    );
  }

  // ✅ Show loading while fetching beneficiary data (initial load)
  if (
    fetchStatus === "loading" &&
    !merchantData &&
    fetchAttemptRef.current === 1
  ) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">
          Loading beneficiary data...
          {fetchAttemptRef.current > 1 &&
            ` (Attempt ${fetchAttemptRef.current})`}
        </span>
      </div>
    );
  }

  // ✅ Show error state after max attempts
  if (
    fetchStatus === "failed" &&
    fetchAttemptRef.current >= MAX_FETCH_ATTEMPTS
  ) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-xl shadow-lg max-w-md">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            Unable to Load Data
          </h3>
          <p className="text-gray-600 mb-6">
            We couldn't load beneficiary information. Please try refreshing the
            page.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Global Header for ALL beneficiary pages */}
      {beneficiaryId && merchantData && (
        <BeneficiariesHeader
          beneficiaryId={beneficiaryId}
          merchantData={merchantData}
        />
      )}

      {/* Show minimal header while loading if we have the ID */}
      {beneficiaryId && !merchantData && fetchStatus !== "failed" && (
        <div className="w-full bg-gradient-to-r from-green-700 to-blue-700 py-4 px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg animate-pulse"></div>
              <div>
                <div className="h-4 w-32 bg-white/30 rounded animate-pulse mb-2"></div>
                <div className="h-3 w-24 bg-white/20 rounded animate-pulse"></div>
              </div>
            </div>
            <div className="h-10 w-32 bg-white/20 rounded-lg animate-pulse"></div>
          </div>
        </div>
      )}

      {/* Main Content Area with Sidebar */}
      <div className="flex h-[calc(100vh-80px)]">
        {" "}
        {/* Adjust height based on header height */}
        {/* Left Navigation Sidebar - Only show when we have data */}
        {merchantData && <NavigateSectionBenef />}
        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {/* Show loading in content area if still loading */}
          {!merchantData && fetchStatus === "loading" ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading beneficiary content...</p>
              </div>
            </div>
          ) : (
            <Outlet />
          )}
        </main>
      </div>
    </div>
  );
};

export default BeneficiaryLayout;
