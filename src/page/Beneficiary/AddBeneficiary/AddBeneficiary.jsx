import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import BeneficiaryForm from "../AddBeneficiary/BeneficiaryForm";
import { 
  selectCreateSuccess, 
  selectLastCreatedId, 
  fetchBeneficiaryById, 
  clearCreateSuccess,
  selectCreateLoading,
  selectCreateError
} from "../MyBeneficiaries/BeneficiariesSlice";

const AddBeneficiary = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { customerId } = useParams();
  
  const createSuccess = useSelector(selectCreateSuccess);
  const createLoading = useSelector(selectCreateLoading);
  const createError = useSelector(selectCreateError);
  const lastCreatedId = useSelector(selectLastCreatedId);
  
  // Get return information from location state
  const returnTo = location.state?.returnTo || null;
  const returnStep = location.state?.returnStep || 2;
  const fromRemittance = location.state?.from === "remittance"; // Check if coming from remittance
  
  // Track if redirect has been done
  const redirectDone = useRef(false);
  
  // Handle redirect after successful beneficiary creation - ONLY if from Remittance
  useEffect(() => {
    // Only redirect if we came from remittance AND have success AND haven't redirected yet
    if (fromRemittance && createSuccess && lastCreatedId && !redirectDone.current) {
      console.log("✅ Beneficiary created successfully from Remittance, ID:", lastCreatedId);
      redirectDone.current = true;
      
      // Small delay to let the user see the success state
      const timer = setTimeout(async () => {
        if (returnTo) {
          try {
            // Fetch the complete beneficiary data
            console.log("📥 Fetching beneficiary data for ID:", lastCreatedId);
            const result = await dispatch(fetchBeneficiaryById(lastCreatedId)).unwrap();
            
            console.log("📦 Fetched beneficiary data:", result);
            
            // Navigate back to remittance with the new beneficiary data
            navigate(returnTo, {
              state: {
                newBeneficiary: result,
                returnToStep: returnStep,
                autoSelect: true,
                timestamp: Date.now()
              },
              replace: true
            });
            
            // Clear the create success state
            dispatch(clearCreateSuccess());
            
          } catch (error) {
            console.error("❌ Failed to fetch new beneficiary:", error);
            
            // Still navigate back even if fetch fails
            const basicBeneficiary = {
              id: lastCreatedId,
              name: "New Beneficiary",
            };
            
            navigate(returnTo, {
              state: {
                newBeneficiary: basicBeneficiary,
                returnToStep: returnStep,
                creationSuccess: true,
                beneficiaryId: lastCreatedId
              },
              replace: true
            });
          }
        }
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [fromRemittance, createSuccess, lastCreatedId, navigate, returnTo, returnStep, dispatch]);
  
  // Reset redirect flag when component unmounts or when createSuccess changes back to false
  useEffect(() => {
    if (!createSuccess) {
      redirectDone.current = false;
    }
  }, [createSuccess]);
  
  // Handle cancel - go back to where we came from or just regular back
  const handleCancel = () => {
    console.log("❌ Cancelling beneficiary creation");
    if (fromRemittance && returnTo) {
      // If from remittance, go back to remittance
      navigate(returnTo, {
        state: {
          returnToStep: returnStep,
          cancelled: true
        },
        replace: true
      });
    } else {
      // Otherwise, regular back navigation
      navigate(-1);
    }
  };
  
  return <BeneficiaryForm mode="create" onCancel={handleCancel} />;
};

export default AddBeneficiary;