// features/Beneficiary/EditBeneficiary/EditBeneficiaryPage.jsx
import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ClipLoader } from "react-spinners";
import {
  fetchBeneficiaryById,
  updateBeneficiary,
  clearError,
  clearSuccess,
  clearEditState,
  selectBeneficiaryDetails,
  selectEditBeneficiaryLoading,
  selectEditBeneficiaryError,
  selectBeneficiariesSuccess,
  selectBeneficiariesError,
  fetchNationalities,
  fetchCitiesByCountry,
  selectNationalities,
  selectCitiesForCountry,
} from "../MyBeneficiaries/BeneficiariesSlice";
import {
  FaArrowLeft,
  FaSave,
  FaUser,
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
  FaIdCard,
  FaGlobe,
  FaBirthdayCake,
  FaVenusMars,
  FaUniversity,
  FaSpinner,
} from "react-icons/fa";

const EditBeneficiaryPage = () => {
  const { customerId, beneficiaryId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Selectors
  const beneficiaryDetails = useSelector(selectBeneficiaryDetails);
  const loading = useSelector(selectEditBeneficiaryLoading);
  const error = useSelector(selectEditBeneficiaryError);
  const updateSuccess = useSelector(selectBeneficiariesSuccess);
  const updateError = useSelector(selectBeneficiariesError);
  const nationalities = useSelector(selectNationalities);

  // Dropdown options state
  const [dropdowns, setDropdowns] = useState({
    countries: [],
    nationalities: [],
    idTypes: [
      { id: "passport", name: "Passport" },
      { id: "national_id", name: "National ID" },
      { id: "drivers_license", name: "Driver's License" },
      { id: "other", name: "Other" },
    ],
    genders: [
      { id: "1", name: "Male" },
      { id: "2", name: "Female" },
      { id: "3", name: "Other" },
    ],
    occupations: [],
    incomeSources: [],
    transferPurposes: [],
    relationships: [
      { id: "friend", name: "Friend" },
      { id: "family", name: "Family" },
      { id: "business", name: "Business" },
      { id: "other", name: "Other" },
    ],
    cities: [],
  });

  const [dropdownLoading, setDropdownLoading] = useState(true);

  // Form state
  const [formData, setFormData] = useState({
    first_name: "",
    middle_name: "",
    last_name: "",
    email: "",
    phone_number: "",
    full_phone_number: "",
    street: "",
    city: "",
    state: "",
    postalcode: "",
    country_id: "",
    nationality_id: "",
    dob: "",
    gender_id: "",
    beneficiary_id_type: "",
    beneficiary_id_number: "",
    beneficiary_id_date_of_expiry: "",
    beneficiary_id_date_of_issue: "",
    occupation: "",
    income_source: "",
    transfer_purpose: "",
    relationtobenef: "",
    beneftype: "individual",
    status: 1,
    is_visible: true,
  });

  // Fetch dropdown data
  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        setDropdownLoading(true);
        
        // Fetch nationalities
        await dispatch(fetchNationalities()).unwrap();
        
        // TODO: Fetch other dropdown data
        // These would need additional API endpoints
        // For now, using static data or API if available
        
        // Sample countries (in real app, fetch from API)
        const sampleCountries = [
          { id: 123, name: "Nepal", code: "NP" },
          { id: 1, name: "United States", code: "US" },
          { id: 44, name: "United Kingdom", code: "GB" },
          { id: 91, name: "India", code: "IN" },
          // Add more as needed
        ];
        
        setDropdowns(prev => ({
          ...prev,
          countries: sampleCountries,
          nationalities: sampleCountries, // Using same for demo
        }));
        
      } catch (error) {
        console.error("Error fetching dropdown data:", error);
        toast.error("Failed to load dropdown options");
      } finally {
        setDropdownLoading(false);
      }
    };
    
    fetchDropdownData();
  }, [dispatch]);

  // Fetch beneficiary details on mount
  useEffect(() => {
    if (beneficiaryId) {
      console.log("Fetching beneficiary with ID:", beneficiaryId);
      dispatch(fetchBeneficiaryById(beneficiaryId));
    }

    return () => {
      dispatch(clearEditState());
    };
  }, [beneficiaryId, dispatch]);

  // Fetch cities when country changes
  useEffect(() => {
    if (formData.country_id) {
      dispatch(fetchCitiesByCountry(formData.country_id));
    }
  }, [formData.country_id, dispatch]);

  // Populate form when beneficiary details are fetched
  useEffect(() => {
    if (beneficiaryDetails && !dropdownLoading) {
      console.log("Setting form data from beneficiaryDetails:", beneficiaryDetails);
      
      // Get country name from dropdown options
      const country = dropdowns.countries.find(c => c.id === parseInt(beneficiaryDetails.country_id));
      const nationality = dropdowns.nationalities.find(n => n.id === parseInt(beneficiaryDetails.nationality_id));
      const relationship = dropdowns.relationships.find(r => r.id === beneficiaryDetails.relationtobenef);
      
      // Map API response to form fields
      const newFormData = {
        first_name: beneficiaryDetails.first_name || "",
        middle_name: beneficiaryDetails.middle_name || "",
        last_name: beneficiaryDetails.last_name || "",
        email: beneficiaryDetails.email || "",
        phone_number: beneficiaryDetails.phone_number || "",
        full_phone_number: beneficiaryDetails.full_phone_number || "",
        street: beneficiaryDetails.street || "",
        city: beneficiaryDetails.city || "",
        state: beneficiaryDetails.state || "",
        postalcode: beneficiaryDetails.postalcode || "",
        country_id: beneficiaryDetails.country_id ? String(beneficiaryDetails.country_id) : "",
        nationality_id: beneficiaryDetails.nationality_id ? String(beneficiaryDetails.nationality_id) : "",
        dob: beneficiaryDetails.dob ? beneficiaryDetails.dob.split(" ")[0] : "",
        gender_id: beneficiaryDetails.gender_id ? String(beneficiaryDetails.gender_id) : "",
        beneficiary_id_type: beneficiaryDetails.beneficiary_id_type || "",
        beneficiary_id_number: beneficiaryDetails.beneficiary_id_number || "",
        beneficiary_id_date_of_expiry: beneficiaryDetails.beneficiary_id_date_of_expiry
          ? beneficiaryDetails.beneficiary_id_date_of_expiry.split(" ")[0]
          : "",
        beneficiary_id_date_of_issue: beneficiaryDetails.beneficiary_id_date_of_issue
          ? beneficiaryDetails.beneficiary_id_date_of_issue.split(" ")[0]
          : "",
        occupation: beneficiaryDetails.occupation || "",
        income_source: beneficiaryDetails.income_source || "",
        transfer_purpose: beneficiaryDetails.transfer_purpose || "",
        relationtobenef: beneficiaryDetails.relationtobenef || "",
        beneftype: beneficiaryDetails.beneftype || "individual",
        status: beneficiaryDetails.status || 1,
        is_visible: beneficiaryDetails.status === 1,
      };
      
      console.log("New form data to set:", newFormData);
      setFormData(newFormData);
    }
  }, [beneficiaryDetails, dropdowns, dropdownLoading]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Prepare data for API update
      const updateData = {
        first_name: formData.first_name,
        middle_name: formData.middle_name,
        last_name: formData.last_name,
        name: `${formData.first_name} ${formData.last_name}`.trim(),
        email: formData.email,
        phone_number: formData.phone_number,
        full_phone_number: formData.full_phone_number,
        street: formData.street,
        city: formData.city,
        state: formData.state,
        postalcode: formData.postalcode,
        country_id: formData.country_id ? parseInt(formData.country_id) : null,
        nationality_id: formData.nationality_id ? parseInt(formData.nationality_id) : null,
        dob: formData.dob || null,
        gender_id: formData.gender_id ? parseInt(formData.gender_id) : null,
        beneficiary_id_type: formData.beneficiary_id_type || null,
        beneficiary_id_number: formData.beneficiary_id_number || null,
        beneficiary_id_date_of_expiry: formData.beneficiary_id_date_of_expiry || null,
        beneficiary_id_date_of_issue: formData.beneficiary_id_date_of_issue || null,
        occupation: formData.occupation || null,
        income_source: formData.income_source || null,
        transfer_purpose: formData.transfer_purpose || null,
        relationtobenef: formData.relationtobenef || null,
        beneftype: formData.beneftype,
        status: formData.status,
      };

      await dispatch(
        updateBeneficiary({
          customerId,
          beneficiaryId,
          beneficiaryData: updateData,
        })
      ).unwrap();

      toast.success("Beneficiary updated successfully!");

      // Navigate back after successful update
      setTimeout(() => {
        navigate(`/beneficiaries/${customerId}`);
      }, 1500);
    } catch (error) {
      toast.error(error.message || "Failed to update beneficiary");
    }
  };

  // Handle back navigation
  const handleBack = () => {
    navigate(`/beneficiaries/${customerId}`);
  };

  // Helper function to get display value for dropdowns
  const getDisplayValue = (id, options, fieldName) => {
    if (!id) return "";
    const option = options.find(opt => String(opt.id) === String(id));
    return option ? option.name : id;
  };

  // Show loading state for dropdowns
  if (dropdownLoading || (loading && !beneficiaryDetails)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex flex-col items-center justify-center">
        <ClipLoader color="#3B82F6" size={60} />
        <p className="mt-4 text-gray-600 text-lg">
          Loading beneficiary details...
        </p>
      </div>
    );
  }

  // Show error state
  if (error && !beneficiaryDetails) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaIdCard className="text-red-500 text-2xl" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Error Loading Beneficiary
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={handleBack}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Beneficiaries
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center space-x-4">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-blue-600 border border-blue-600 hover:bg-blue-50 transition-colors duration-200"
            >
              <FaArrowLeft />
              <span>Back</span>
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Edit Beneficiary
              </h1>
              <p className="text-gray-600">
                Update details for {beneficiaryDetails?.name || "Beneficiary"}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-lg overflow-hidden"
        >
          <form onSubmit={handleSubmit} className="p-6">
            {/* Personal Information Section */}
            <div className="mb-8">
              <div className="flex items-center mb-6">
                <div className="p-3 bg-blue-100 rounded-lg mr-3">
                  <FaUser className="text-blue-600 text-xl" />
                </div>
                <h2 className="text-xl font-semibold text-gray-800">
                  Personal Information
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Middle Name
                  </label>
                  <input
                    type="text"
                    name="middle_name"
                    value={formData.middle_name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaEnvelope className="text-gray-400" />
                    </div>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full pl-10 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaPhone className="text-gray-400" />
                    </div>
                    <input
                      type="tel"
                      name="full_phone_number"
                      value={formData.full_phone_number}
                      onChange={handleInputChange}
                      className="w-full pl-10 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Address Information Section */}
            <div className="mb-8">
              <div className="flex items-center mb-6">
                <div className="p-3 bg-green-100 rounded-lg mr-3">
                  <FaMapMarkerAlt className="text-green-600 text-xl" />
                </div>
                <h2 className="text-xl font-semibold text-gray-800">
                  Address Information
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Street Address
                  </label>
                  <input
                    type="text"
                    name="street"
                    value={formData.street}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter street address"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Country
                  </label>
                  <select
                    name="country_id"
                    value={formData.country_id}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Country</option>
                    {dropdowns.countries.map(country => (
                      <option key={country.id} value={country.id}>
                        {country.name} ({country.code})
                      </option>
                    ))}
                  </select>
                  {formData.country_id && (
                    <p className="mt-1 text-xs text-green-600">
                      ✓ {getDisplayValue(formData.country_id, dropdowns.countries, "country")}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter city"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    State/Province
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter state/province"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Postal Code
                  </label>
                  <input
                    type="text"
                    name="postalcode"
                    value={formData.postalcode}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter postal code"
                  />
                </div>
              </div>
            </div>

            {/* Identification Section */}
            <div className="mb-8">
              <div className="flex items-center mb-6">
                <div className="p-3 bg-purple-100 rounded-lg mr-3">
                  <FaIdCard className="text-purple-600 text-xl" />
                </div>
                <h2 className="text-xl font-semibold text-gray-800">
                  Identification Details
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ID Type
                  </label>
                  <select
                    name="beneficiary_id_type"
                    value={formData.beneficiary_id_type}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select ID Type</option>
                    {dropdowns.idTypes.map(idType => (
                      <option key={idType.id} value={idType.id}>
                        {idType.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ID Number
                  </label>
                  <input
                    type="text"
                    name="beneficiary_id_number"
                    value={formData.beneficiary_id_number}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter ID number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ID Issue Date
                  </label>
                  <input
                    type="date"
                    name="beneficiary_id_date_of_issue"
                    value={formData.beneficiary_id_date_of_issue}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ID Expiry Date
                  </label>
                  <input
                    type="date"
                    name="beneficiary_id_date_of_expiry"
                    value={formData.beneficiary_id_date_of_expiry}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Additional Information Section */}
            <div className="mb-8">
              <div className="flex items-center mb-6">
                <div className="p-3 bg-yellow-100 rounded-lg mr-3">
                  <FaGlobe className="text-yellow-600 text-xl" />
                </div>
                <h2 className="text-xl font-semibold text-gray-800">
                  Additional Information
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nationality
                  </label>
                  <select
                    name="nationality_id"
                    value={formData.nationality_id}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Nationality</option>
                    {dropdowns.nationalities.map(nationality => (
                      <option key={nationality.id} value={nationality.id}>
                        {nationality.name}
                      </option>
                    ))}
                  </select>
                  {formData.nationality_id && (
                    <p className="mt-1 text-xs text-green-600">
                      ✓ {getDisplayValue(formData.nationality_id, dropdowns.nationalities, "nationality")}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date of Birth
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaBirthdayCake className="text-gray-400" />
                    </div>
                    <input
                      type="date"
                      name="dob"
                      value={formData.dob}
                      onChange={handleInputChange}
                      className="w-full pl-10 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gender
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaVenusMars className="text-gray-400" />
                    </div>
                    <select
                      name="gender_id"
                      value={formData.gender_id}
                      onChange={handleInputChange}
                      className="w-full pl-10 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select Gender</option>
                      {dropdowns.genders.map(gender => (
                        <option key={gender.id} value={gender.id}>
                          {gender.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Occupation
                  </label>
                  <input
                    type="text"
                    name="occupation"
                    value={formData.occupation}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter occupation"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Income Source
                  </label>
                  <input
                    type="text"
                    name="income_source"
                    value={formData.income_source}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter income source"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Transfer Purpose
                  </label>
                  <input
                    type="text"
                    name="transfer_purpose"
                    value={formData.transfer_purpose}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter transfer purpose"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Relationship to Sender
                  </label>
                  <select
                    name="relationtobenef"
                    value={formData.relationtobenef}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Relationship</option>
                    {dropdowns.relationships.map(relationship => (
                      <option key={relationship.id} value={relationship.id}>
                        {relationship.name}
                      </option>
                    ))}
                  </select>
                  {formData.relationtobenef && (
                    <p className="mt-1 text-xs text-green-600">
                      ✓ {getDisplayValue(formData.relationtobenef, dropdowns.relationships, "relationship")}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Beneficiary Type
                  </label>
                  <select
                    name="beneftype"
                    value={formData.beneftype}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="individual">Individual</option>
                    <option value="institution">Institution</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Status Section */}
            <div className="mb-8 p-6 bg-gray-50 rounded-lg">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-blue-100 rounded-lg mr-3">
                  <FaUniversity className="text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800">Status</h3>
              </div>

              <div className="flex flex-wrap gap-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.status === 1}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        status: e.target.checked ? 1 : 0,
                      }))
                    }
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-gray-700">Active</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="is_visible"
                    checked={formData.is_visible}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-gray-700">Visible in List</span>
                </label>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={handleBack}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || dropdownLoading}
                className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <ClipLoader color="#ffffff" size={20} />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <FaSave />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>

      {/* Toast Container */}
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </div>
  );
};

export default EditBeneficiaryPage;