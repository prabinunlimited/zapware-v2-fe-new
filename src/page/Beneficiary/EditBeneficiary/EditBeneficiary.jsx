import React, { useEffect } from "react";
import { useParams, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { RingLoader } from "react-spinners";
import BeneficiaryForm from "../AddBeneficiary/BeneficiaryForm";
import { fetchBeneficiaryById } from "../AddBeneficiary/addBeneficiarySlice";

const EditBeneficiary = () => {
  const { beneficiaryId } = useParams();
  const location = useLocation();
  const dispatch = useDispatch();

  const { fetchLoading, beneficiaryDetails } = useSelector((state) => ({
    fetchLoading: state.addBeneficiary?.fetchLoading || false,
    beneficiaryDetails: state.addBeneficiary?.beneficiaryData || null,
  }));

  // Fetch beneficiary data if not already in location state
  useEffect(() => {
    if (beneficiaryId && !location.state?.beneficiaryData) {
      console.log("🔄 Fetching beneficiary from API:", beneficiaryId);
      dispatch(fetchBeneficiaryById(beneficiaryId));
    }
  }, [beneficiaryId, dispatch, location.state]);

  // Merge location state data with fetched data if needed
  const getInitialData = () => {
    // If we have data from location state, use that (it has country_phone_code)
    if (location.state?.beneficiaryData) {
      console.log(
        "📦 Using location state beneficiary data:",
        location.state.beneficiaryData,
      );
      return location.state.beneficiaryData;
    }
    // Otherwise use fetched data
    return beneficiaryDetails;
  };

  const initialData = getInitialData();

  if (fetchLoading && !location.state?.beneficiaryData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <RingLoader size={60} color="#3B82F6" />
          <p className="mt-4 text-gray-700">Loading beneficiary data...</p>
        </div>
      </div>
    );
  }

  if (!initialData && !fetchLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Beneficiary Not Found
          </h2>
          <p className="text-gray-600">
            The beneficiary you're trying to edit does not exist.
          </p>
        </div>
      </div>
    );
  }

  return <BeneficiaryForm mode="edit" initialData={initialData} />;
};

export default EditBeneficiary;
