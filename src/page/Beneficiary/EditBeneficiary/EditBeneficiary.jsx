import React, { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { ClipLoader } from "react-spinners";
import BeneficiaryForm from "../AddBeneficiary/BeneficiaryForm";
import { fetchBeneficiaryById } from "../AddBeneficiary/addBeneficiarySlice";

const EditBeneficiary = () => {
  const { beneficiaryId } = useParams();
  const dispatch = useDispatch();

  const { fetchLoading, beneficiaryDetails } = useSelector((state) => ({
    fetchLoading: state.addBeneficiary?.fetchLoading || false,
    beneficiaryDetails: state.addBeneficiary?.beneficiaryData || null,
  }));

  // Fetch beneficiary data
  useEffect(() => {
    if (beneficiaryId) {
      console.log("🔄 Fetching beneficiary:", beneficiaryId);
      dispatch(fetchBeneficiaryById(beneficiaryId));
    }
  }, [beneficiaryId, dispatch]);

  if (fetchLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <ClipLoader size={60} color="#3B82F6" />
          <p className="mt-4 text-gray-700">Loading beneficiary data...</p>
        </div>
      </div>
    );
  }

  if (!beneficiaryDetails && !fetchLoading) {
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

  return <BeneficiaryForm mode="edit" initialData={beneficiaryDetails} />;
};

export default EditBeneficiary;
