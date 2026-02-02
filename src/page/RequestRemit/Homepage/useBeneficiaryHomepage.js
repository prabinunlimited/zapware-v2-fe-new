// hooks/useBeneficiaryHomepage.js
import { useEffect, useRef, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import {
  fetchBeneficiaryData,
  fetchBeneficiaryHomepageData,
  setUserEmail,
  setEmailFormField,
  selectHasFetchedBeneficiary,
  selectIsLoading,
} from "./beneficiaryHomepageSlice";

export const useBeneficiaryHomepage = () => {
  const { beneficiaryId: urlBeneficiaryId } = useParams();
  const dispatch = useDispatch();

  const hasFetchedBeneficiary = useSelector(selectHasFetchedBeneficiary);
  const isLoading = useSelector(selectIsLoading);

  const hasFetchedRef = useRef(false);
  const isMountedRef = useRef(true);

  // Detect user email
  useEffect(() => {
    const detectUserEmail = () => {
      const userData =
        localStorage.getItem("user") ||
        sessionStorage.getItem("user") ||
        localStorage.getItem("userData") ||
        sessionStorage.getItem("userData");

      if (userData) {
        try {
          const parsedUser = JSON.parse(userData);
          if (parsedUser.email) {
            dispatch(setUserEmail(parsedUser.email));
            dispatch(
              setEmailFormField({ field: "to", value: parsedUser.email })
            );
          }
        } catch (error) {
          console.log("Could not parse user data");
        }
      }
    };

    detectUserEmail();
  }, [dispatch]);

  // Main data loading effect
  useEffect(() => {
    if (!urlBeneficiaryId || hasFetchedRef.current) return;

    const loadData = async () => {
      if (!isMountedRef.current) return;

      hasFetchedRef.current = true;

      try {
        console.log("Starting data load for beneficiary:", urlBeneficiaryId);

        // Fetch beneficiary data first
        const result = await dispatch(
          fetchBeneficiaryData(urlBeneficiaryId)
        ).unwrap();

        if (result) {
          // Then fetch all other data
          await dispatch(
            fetchBeneficiaryHomepageData(urlBeneficiaryId)
          ).unwrap();
          console.log("All data loaded successfully");
        }
      } catch (error) {
        console.error("Failed to load all data:", error);
      }
    };

    loadData();

    return () => {
      isMountedRef.current = false;
    };
  }, [urlBeneficiaryId, dispatch]);

  const handleRefreshData = useCallback(() => {
    if (urlBeneficiaryId) {
      // Clear cache for this beneficiary
      centralizedApi.clearCache(`/beneficiaries/`);

      // Force refresh all data
      dispatch(fetchBeneficiaryHomepageData(urlBeneficiaryId));
    }
  }, [urlBeneficiaryId, dispatch]);

  return {
    urlBeneficiaryId,
    hasFetchedBeneficiary,
    isLoading,
    handleRefreshData,
  };
};
