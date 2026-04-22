import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import axios from "axios";
import { RingLoader } from "react-spinners";
import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaIdCard,
  FaBuilding,
  FaCalendarAlt,
  FaEdit,
  FaArrowLeft,
  FaShieldAlt,
  FaCheckCircle,
  FaTimesCircle,
  FaFileAlt,
  FaUsers,
  FaUserTie,
  FaBusinessTime,
} from "react-icons/fa";
import { motion } from "framer-motion";

// Import components
import ViewChargesPopup from "../../components/PopupModal/ViewChargesPopup";
import PopupModal from "../../components/PopupModal/PopupModal";
import usePartnerConfig from "../../hooks/usePartnerConfig";

// Import Redux selectors
import {
  selectProfileData,
  selectProfileLoading,
  selectProfileError,
  selectChargesData,
  selectChargesLoading,
  selectChargesError,
  fetchUserProfile,
} from "../../components/Dashboard/Header/headerSlice";

const API_URL = import.meta.env.VITE_API_URL;

const defaultProfileData = {
  first_name: "",
  last_name: "",
  gender_id: "",
  dob: "",
  nationality_id: "",
  country_id: "",
  city: "",
  state: "",
  zip_code: "",
  ssn: "",
  mobile_number: "",
  email: "",
  active_status: "",
  kyc_status: "",
  customer_type: "",
  referral_code: "",
  agent_code: "",
  country_name: "",
  nationality: "",
};

const Profile = () => {
  const { customerId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const authtoken = localStorage.getItem("authtoken");
  const uuid = localStorage.getItem("UUID");
  const countries = JSON.parse(localStorage.getItem("allcountries") || "[]");
  const bearertoken = localStorage.getItem("bearertoken");

  const config = usePartnerConfig(authtoken);
  const headerColor =
    config?.header_color || localStorage.getItem("header_color");
  const textColor = config?.text_color || localStorage.getItem("text_color");

  // Redux selectors - using data already fetched by Header
  const profileData = useSelector(selectProfileData);
  const profileLoading = useSelector(selectProfileLoading);
  const profileError = useSelector(selectProfileError);
  const charges = useSelector(selectChargesData);
  const chargesLoading = useSelector(selectChargesLoading);
  const chargesError = useSelector(selectChargesError);

  // Debug logging
  console.log("🔍 Profile Debug:", {
    profileData: profileData,
    profileLoading: profileLoading,
    profileError: profileError,
    customerId: customerId,
    hasBearerToken: !!bearertoken,
    hasProfileFirstName: profileData?.first_name,
    hasLocalStorageFirstName: localStorage.getItem("firstName"),
  });

  // Local state for editing and additional data
  const [saveLoading, setSaveLoading] = useState(false);
  const [profilePicture, setProfilePicture] = useState(null);
  const [croppedImage, setCroppedImage] = useState(null);
  const [agreedDetails, setAgreedDetails] = useState([]);
  const [isChargesPopupOpen, setIsChargesPopupOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [genders, setGenders] = useState([]);
  const [nationalities, setNationalities] = useState([]);
  const [statusHistory, setStatusHistory] = useState([]);
  const [editableData, setEditableData] = useState(defaultProfileData);
  const [activeTab, setActiveTab] = useState("Business Information");
  const [businessInfo, setBusinessInfo] = useState(null);
  const [responsiblePerson, setResponsiblePerson] = useState(null);
  const [officeControllers, setOfficeControllers] = useState(null);
  const [uploadedDocuments, setUploadedDocuments] = useState([]);
  const [tabLoading, setTabLoading] = useState(false);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalData, setModalData] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "success",
    errors: null,
  });

  // Check if account type is individual
  const isIndividualAccount = useMemo(() => {
    return profileData?.customer_type?.toLowerCase() === "individual";
  }, [profileData?.customer_type]);

  // Auto-close modal after delay
  useEffect(() => {
    if (isModalOpen) {
      const timer = setTimeout(() => {
        setIsModalOpen(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isModalOpen]);

  // =============== FIX: Fetch profile data if missing in Redux ===============
  useEffect(() => {
    const fetchProfileIfNeeded = async () => {
      // Check if we have necessary tokens and customerId
      if (!bearertoken || !customerId) {
        console.log("❌ Profile: Missing token or customerId", {
          bearertoken: !!bearertoken,
          customerId: customerId,
        });
        return;
      }

      // If we already have data, no need to fetch
      if (profileData) {
        console.log("✅ Profile: Already have data in Redux", {
          firstName: profileData.first_name,
          lastName: profileData.last_name,
        });
        return;
      }

      // If we're already loading, wait
      if (profileLoading) {
        console.log("⏳ Profile: Already loading from Redux");
        return;
      }

      // If there's an error, don't try to fetch
      if (profileError) {
        console.log("❌ Profile: Error in Redux", profileError);
        return;
      }

      // No data and not loading/error - fetch the profile
      console.log("🚀 Profile: Fetching profile data (missing in Redux)");

      try {
        await dispatch(fetchUserProfile({ customerId, bearertoken }));
        console.log("✅ Profile: Successfully dispatched fetch");
      } catch (error) {
        console.error("❌ Profile: Failed to fetch profile", error);
      }
    };

    fetchProfileIfNeeded();
  }, [
    profileData,
    profileLoading,
    profileError,
    customerId,
    bearertoken,
    dispatch,
  ]);
  // =============== END FIX ===============

  // Fetch additional profile data that's not in Redux
  useEffect(() => {
    const fetchAdditionalProfileData = async () => {
      if (!profileData || !customerId) return;

      try {
        console.log("📸 Profile: Fetching additional profile data");

        const [imageResponse, termsResponse, statusLogResponse] =
          await Promise.all([
            axios.get(`${API_URL}/kyc/${customerId}`, {
              headers: { Authorization: `Bearer ${bearertoken}` },
            }),
            axios.get(`${API_URL}/terms-agreed-details/${customerId}`, {
              headers: { Authorization: `Bearer ${authtoken}` },
            }),
            axios.get(`${API_URL}/account-status-log/${customerId}`, {
              headers: { Authorization: `Bearer ${authtoken}` },
            }),
          ]);

        console.log("✅ Profile: Additional data fetched successfully");

        setProfilePicture(imageResponse.data.profile_picture);
        setCroppedImage(imageResponse.data.document_picture_front);

        if (
          termsResponse.data.status === "success" &&
          termsResponse.data.count_agreed > "0"
        ) {
          setAgreedDetails(termsResponse.data.agreed_details);
        }

        setStatusHistory(statusLogResponse.data);
      } catch (err) {
        console.error("❌ Profile: Failed to fetch additional data", err);
      }
    };

    if (profileData && customerId && authtoken && bearertoken) {
      fetchAdditionalProfileData();
    }
  }, [profileData, customerId, authtoken, bearertoken]);

  // Fetch tab data when tab changes - ONLY for non-individual accounts
  useEffect(() => {
    const fetchTabData = async () => {
      // Don't fetch ANY tab data for individual accounts
      if (isIndividualAccount) {
        console.log("👤 Profile: Individual account, skipping tab data fetch");
        return;
      }

      if (!uuid || !authtoken) return;

      try {
        setTabLoading(true);
        console.log(`📊 Profile: Fetching ${activeTab} data`);

        let response;
        let endpoint = "";

        switch (activeTab) {
          case "Business Information":
            endpoint = `${API_URL}/customers/business-information/${uuid}`;
            response = await axios.get(endpoint, {
              headers: { Authorization: `Bearer ${authtoken}` },
            });
            setBusinessInfo(response.data);
            break;
          case "Responsible Person":
            endpoint = `${API_URL}/customers/responsible-person/${uuid}`;
            response = await axios.get(endpoint, {
              headers: { Authorization: `Bearer ${authtoken}` },
            });
            setResponsiblePerson(response.data);
            break;
          case "Office Controllers":
            endpoint = `${API_URL}/customers/office-controllers/${uuid}`;
            response = await axios.get(endpoint, {
              headers: { Authorization: `Bearer ${authtoken}` },
            });
            setOfficeControllers(response.data);
            break;
          case "Owner Details":
            // Add your Owner Details API endpoint here if needed
            console.log("👑 Profile: Owner Details tab selected");
            break;
          case "Uploaded Documents":
            endpoint = `${API_URL}/customers/uploaded-documents/${uuid}`;
            response = await axios.get(endpoint, {
              headers: { Authorization: `Bearer ${authtoken}` },
            });
            setUploadedDocuments(response.data);
            break;
          default:
            break;
        }

        console.log(`✅ Profile: ${activeTab} data fetched successfully`);
      } catch (err) {
        console.error(`❌ Profile: Failed to fetch ${activeTab} data`, err);
      } finally {
        setTabLoading(false);
      }
    };

    fetchTabData();
  }, [activeTab, uuid, authtoken, isIndividualAccount]);

  // Initialize editableData when profileData changes
  useEffect(() => {
    if (profileData) {
      console.log("🔄 Profile: Initializing editableData from profileData");
      setEditableData({
        first_name: profileData.first_name || "",
        last_name: profileData.last_name || "",
        gender_id: profileData.gender_id || "",
        dob: profileData.dob || "",
        nationality_id: profileData.nationality_id || "",
        country_id: profileData.country_id || "",
        city: profileData.city || "",
        state: profileData.state || "",
        zip_code: profileData.zip_code || "",
      });
    }
  }, [profileData]);

  // Fetch genders and nationalities
  useEffect(() => {
    const fetchData = async () => {
      if (!bearertoken) return;

      try {
        console.log("👥 Profile: Fetching genders and nationalities");

        const [gendersRes, nationalitiesRes] = await Promise.all([
          axios.get(`${API_URL}/genders`, {
            headers: { Authorization: `Bearer ${bearertoken}` },
          }),
          axios.get(`${API_URL}/nationalities`, {
            headers: { Authorization: `Bearer ${bearertoken}` },
          }),
        ]);

        console.log("✅ Profile: Genders and nationalities fetched");
        setGenders(gendersRes.data);
        setNationalities(nationalitiesRes.data);
      } catch (err) {
        console.error("❌ Profile: Failed to fetch genders/nationalities", err);
      }
    };

    fetchData();
  }, [bearertoken]);

  // Function to handle text color style
  const getTextColorStyle = () => {
    if (textColor && textColor.startsWith("text-")) {
      return { className: textColor };
    } else if (textColor && textColor.startsWith("#")) {
      return { style: { color: textColor } };
    }
    return {};
  };

  // Function to handle header color style
  const getHeaderColorStyle = () => {
    if (headerColor && headerColor.startsWith("bg-")) {
      return { className: headerColor };
    } else if (headerColor && headerColor.startsWith("#")) {
      return { style: { backgroundColor: headerColor } };
    }
    return { className: "bg-blue-600" };
  };

  const textColorProps = getTextColorStyle();
  const headerColorProps = getHeaderColorStyle();

  const formatSSN = (value) => {
    if (!value) return "";
    const valStr = value.toString();
    if (/^\d{3}-\d{2}-\d{4}$/.test(valStr)) return valStr;
    const ssn = valStr.replace(/\D/g, "");
    if (ssn.length <= 3) return ssn;
    if (ssn.length <= 5) return `${ssn.slice(0, 3)}-${ssn.slice(3)}`;
    return `${ssn.slice(0, 3)}-${ssn.slice(3, 5)}-${ssn.slice(5, 9)}`;
  };

  const handleEditToggle = () => {
    if (isEditing) {
      // Reset to original data from Redux
      setEditableData({
        first_name: profileData?.first_name || "",
        last_name: profileData?.last_name || "",
        gender_id: profileData?.gender_id || "",
        dob: profileData?.dob || "",
        nationality_id: profileData?.nationality_id || "",
        country_id: profileData?.country_id || "",
        city: profileData?.city || "",
        state: profileData?.state || "",
        zip_code: profileData?.zip_code || "",
      });
    }
    setIsEditing((prev) => !prev);
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setEditableData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveChanges = async () => {
    if (!authtoken || !customerId) {
      console.error("❌ Profile: Missing auth token or customer ID for save");
      return;
    }

    setSaveLoading(true);
    try {
      console.log("💾 Profile: Saving changes", editableData);

      const requestData = {
        customer_id: customerId,
        first_name: editableData.first_name,
        last_name: editableData.last_name,
        gender: editableData.gender_id
          ? parseInt(editableData.gender_id, 10)
          : null,
        dob: editableData.dob,
        country: editableData.country_id,
        nationality: editableData.nationality_id,
        city: editableData.city,
        state: editableData.state,
        zip_code: editableData.zip_code,
      };

      const response = await axios.post(
        `${API_URL}/customers/update-profile`,
        requestData,
        { headers: { Authorization: `Bearer ${authtoken}` } },
      );

      if (response.data.status === "success") {
        console.log("✅ Profile: Updated successfully");

        // Refresh profile data in Redux
        if (bearertoken) {
          dispatch(fetchUserProfile({ customerId, bearertoken }));
        }

        setIsEditing(false);
        setModalData({
          isOpen: true,
          title: "Success",
          message: "Profile updated successfully.",
          type: "success",
        });
        setIsModalOpen(true);
      }
    } catch (err) {
      console.error("❌ Profile: Failed to update", err);

      setModalData({
        isOpen: true,
        title: "Error",
        message: "Failed to update profile. Please try again.",
        type: "error",
      });
      setIsModalOpen(true);
    } finally {
      setSaveLoading(false);
    }
  };

  const isUnitedStatesSelected = () => {
    if (!editableData.country_id) return false;
    if (countries.length > 0) {
      const selectedCountry = countries.find(
        (c) => c.id.toString() === editableData.country_id.toString(),
      );
      return (
        selectedCountry?.name.toLowerCase() === "united states" ||
        selectedCountry?.id === 186
      );
    }
    return editableData.country_id.toString() === "186";
  };

  const handleReferral = () => {
    navigate(`/referral/${customerId}`, {
      state: {
        referral_code: profileData?.referral_code,
        customerId: customerId,
      },
    });
  };

  const handleAgent = () => {
    navigate(`/agents/${customerId}`, {
      state: {
        agent_code: profileData?.agent_code,
        customerId: customerId,
      },
    });
  };

  const handleChangePassword = () => {
    navigate(`/changepassword/${customerId}`);
  };

  const handleChangeMobile = () => {
    navigate(`/changephonenumber/${customerId}`);
  };

  const handleBackClick = () => {
    navigate(-1);
  };

  const handleViewCharges = () => {
    setIsChargesPopupOpen(true);
  };

  // Calculate charges statistics
  const getChargesStats = useMemo(() => {
    const total = charges.length;
    const withFxCharges = charges.filter((c) => {
      const value = parseFloat(c.fx_charges);
      return !isNaN(value) && value > 0;
    }).length;
    const withMaintenance = charges.filter((c) => {
      const value = parseFloat(c.monthly_maintenance_charge);
      return !isNaN(value) && value > 0;
    }).length;

    return { total, withFxCharges, withMaintenance };
  }, [charges]);

  const chargesStats = getChargesStats;

  // Use profile data from Redux with fallbacks
  const displayProfileData = profileData || defaultProfileData;

  // Define tabs based on account type - HIDE specified tabs for individual accounts
  const getAvailableTabs = () => {
    if (isIndividualAccount) {
      // For individual accounts, only show Owner Details and Uploaded Documents
      return [];
    }
    // For non-individual accounts, show all tabs
    return [
      "Business Information",
      "Responsible Person",
      "Office Controllers",
      "Owner Details",
      "Uploaded Documents",
    ];
  };

  const availableTabs = getAvailableTabs();

  const renderTabContent = () => {
    // If no tabs are available (individual account), show appropriate message
    if (availableTabs.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaUser className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            Individual Account
          </h3>
          <p className="text-gray-500 max-w-md mx-auto">
            Business information sections are only available for institution
            accounts. Your individual account profile contains all the necessary
            information in the personal details section.
          </p>
        </div>
      );
    }

    if (tabLoading) {
      return (
        <div className="flex justify-center items-center h-64">
          <RingLoader size={50} color="#00254d" />
          <p className="mt-4 text-gray-600">Loading {activeTab}...</p>
        </div>
      );
    }

    switch (activeTab) {
      case "Business Information":
        return (
          <div className="w-full space-y-6 md:space-y-8">
            <div className="flex items-center justify-between">
              <h3 className="text-xl sm:text-2xl font-semibold text-[#005481] tracking-wide">
                Business Information
              </h3>
              {businessInfo && businessInfo.data && (
                <span className="text-sm text-green-600 bg-green-100 px-3 py-1 rounded-full">
                  ✓ Complete
                </span>
              )}
            </div>

            {businessInfo && businessInfo.data ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {[
                  {
                    title: "Basic Information",
                    items: [
                      {
                        label: "Institution Name",
                        value: businessInfo.data.institution_name,
                      },
                      {
                        label: "Registration Number",
                        value: businessInfo.data.registration_number,
                      },
                      {
                        label: "Date of Incorporation",
                        value: businessInfo.data.date_incorporation,
                      },
                      {
                        label: "Industry Type",
                        value: businessInfo.data.industry_type_name,
                      },
                      {
                        label: "Account Created",
                        value: businessInfo.data.account_created_date,
                      },
                    ],
                  },
                  {
                    title: "Address Information",
                    items: [
                      {
                        label: "Street 1",
                        value: businessInfo.data.registered_address_street_1,
                      },
                      {
                        label: "Street 2",
                        value: businessInfo.data.registered_address_street_2,
                      },
                      {
                        label: "City",
                        value: businessInfo.data.registered_address_street_city,
                      },
                      {
                        label: "State",
                        value:
                          businessInfo.data.registered_address_street_state,
                      },
                      {
                        label: "ZIP",
                        value: businessInfo.data.registered_address_street_zip,
                      },
                      {
                        label: "Country",
                        value:
                          businessInfo.data
                            .registered_address_street_country_name,
                      },
                    ],
                  },
                  {
                    title: "Contact Information",
                    items: [
                      {
                        label: "Phone",
                        value: businessInfo.data.company_phone_number
                          ? `${
                              businessInfo.data.companyphone_countrycode || ""
                            } ${businessInfo.data.company_phone_number}`
                          : null,
                      },
                      { label: "EIN", value: businessInfo.data.ein },
                      {
                        label: "Business Email",
                        value: businessInfo.data.business_email,
                      },
                      {
                        label: "Website",
                        value: businessInfo.data.business_webiste,
                      },
                      {
                        label: "Business Type",
                        value: businessInfo.data.business_type,
                      },
                    ],
                  },
                  {
                    title: "Additional Information",
                    items: [
                      {
                        label: "Referral Code",
                        value: businessInfo.data.referral_code,
                      },
                      {
                        label: "Agent Code",
                        value: businessInfo.data.agent_code,
                      },
                      {
                        label: "Status",
                        value: businessInfo.data.active_status
                          ? "Active"
                          : "Inactive",
                        status: businessInfo.data.active_status
                          ? "success"
                          : "inactive",
                      },
                      {
                        label: "NAICS Code",
                        value: businessInfo.data.naice_code,
                      },
                      {
                        label: "Remit Status",
                        value: businessInfo.data.is_remit
                          ? "Enabled"
                          : "Disabled",
                        status: businessInfo.data.is_remit
                          ? "success"
                          : "inactive",
                      },
                    ],
                  },
                ].map((section, sectionIndex) => (
                  <motion.div
                    key={sectionIndex}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: sectionIndex * 0.1 }}
                    className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                  >
                    <h4 className="text-lg font-semibold text-[#005481] mb-4 pb-2 border-b border-gray-200 flex items-center">
                      <span className="flex-1">{section.title}</span>
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    </h4>
                    <div className="space-y-3">
                      {section.items.map((item, itemIndex) => (
                        <div
                          key={itemIndex}
                          className="flex justify-between items-start"
                        >
                          <span className="text-sm font-medium text-gray-600 min-w-[120px]">
                            {item.label}:
                          </span>
                          {item.status ? (
                            <span
                              className={`text-sm px-2 py-1 rounded-full ${
                                item.status === "success"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {item.value || "N/A"}
                            </span>
                          ) : (
                            <span className="text-sm font-medium text-gray-800 text-right flex-1 ml-2">
                              {item.value || "N/A"}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300"
              >
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaBuilding className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-600 mb-2">
                  No business information available
                </p>
                <p className="text-sm text-gray-500">
                  Please complete your business profile setup
                </p>
              </motion.div>
            )}
          </div>
        );

      case "Responsible Person":
        return (
          <div className="w-full space-y-6 md:space-y-8">
            <div className="flex items-center justify-between">
              <h3 className="text-xl sm:text-2xl font-semibold text-[#005481] tracking-wide">
                Responsible Person
              </h3>
              {responsiblePerson && responsiblePerson.data && (
                <span className="text-sm text-green-600 bg-green-100 px-3 py-1 rounded-full">
                  ✓ Complete
                </span>
              )}
            </div>

            {responsiblePerson && responsiblePerson.data ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {[
                  {
                    title: "Personal Information",
                    items: [
                      {
                        label: "Name",
                        value: `${responsiblePerson.data.first_name} ${
                          responsiblePerson.data.middle_name || ""
                        } ${responsiblePerson.data.last_name}`.trim(),
                      },
                      {
                        label: "Date of Birth",
                        value: responsiblePerson.data.dob,
                      },
                      {
                        label: "Gender",
                        value: responsiblePerson.data.gendername,
                      },
                      {
                        label: "Designation",
                        value: responsiblePerson.data.designation,
                      },
                      { label: "SSN", value: responsiblePerson.data.ssn },
                    ],
                  },
                  {
                    title: "Contact Information",
                    items: [
                      { label: "Email", value: responsiblePerson.data.email },
                      {
                        label: "Phone",
                        value: responsiblePerson.data.mobile_number
                          ? `${
                              responsiblePerson.data
                                .mobile_number_country_code || ""
                            } ${responsiblePerson.data.mobile_number}`
                          : null,
                      },
                      {
                        label: "Nationality",
                        value: responsiblePerson.data.nationality_name,
                      },
                      {
                        label: "Resident Country",
                        value: responsiblePerson.data.residentcountry_name,
                      },
                    ],
                  },
                  {
                    title: "Address Information",
                    items: [
                      {
                        label: "Street 1",
                        value: responsiblePerson.data.street_address_1,
                      },
                      {
                        label: "Street 2",
                        value: responsiblePerson.data.street_address_2,
                      },
                      { label: "City", value: responsiblePerson.data.city },
                      { label: "State", value: responsiblePerson.data.state },
                      { label: "ZIP", value: responsiblePerson.data.zip_code },
                      {
                        label: "Country",
                        value: responsiblePerson.data.country_name,
                      },
                    ],
                  },
                ].map((section, sectionIndex) => (
                  <motion.div
                    key={sectionIndex}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: sectionIndex * 0.1 }}
                    className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                  >
                    <h4 className="text-lg font-semibold text-[#005481] mb-4 pb-2 border-b border-gray-200 flex items-center">
                      <span className="flex-1">{section.title}</span>
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    </h4>
                    <div className="space-y-3">
                      {section.items.map((item, itemIndex) => (
                        <div
                          key={itemIndex}
                          className="flex justify-between items-start"
                        >
                          <span className="text-sm font-medium text-gray-600 min-w-[120px]">
                            {item.label}:
                          </span>
                          <span className="text-sm font-medium text-gray-800 text-right flex-1 ml-2">
                            {item.value || "N/A"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300"
              >
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaUserTie className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-600 mb-2">
                  No responsible person information
                </p>
                <p className="text-sm text-gray-500">
                  Please complete the responsible person details
                </p>
              </motion.div>
            )}
          </div>
        );

      case "Office Controllers":
        return (
          <div className="w-full space-y-6 md:space-y-8">
            <div className="flex items-center justify-between">
              <h3 className="text-xl sm:text-2xl font-semibold text-[#005481] tracking-wide">
                Office Controllers
              </h3>
              {officeControllers &&
                Array.isArray(officeControllers.data) &&
                officeControllers.data.length > 0 && (
                  <span className="text-sm text-green-600 bg-green-100 px-3 py-1 rounded-full">
                    {officeControllers.data.length} Controllers
                  </span>
                )}
            </div>

            {officeControllers && Array.isArray(officeControllers.data) ? (
              officeControllers.data.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {officeControllers.data.map((controller, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow group"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-semibold text-[#005481]">
                          Controller {index + 1}
                        </h4>
                        <div className="w-3 h-3 bg-blue-500 rounded-full group-hover:bg-blue-600 transition-colors"></div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <span className="text-sm font-medium text-gray-600">
                            Name:
                          </span>
                          <span className="text-sm font-medium text-gray-800 text-right">
                            {controller.name || "N/A"}
                          </span>
                        </div>
                        <div className="flex justify-between items-start">
                          <span className="text-sm font-medium text-gray-600">
                            Email:
                          </span>
                          <span className="text-sm font-medium text-gray-800 text-right">
                            {controller.email || "N/A"}
                          </span>
                        </div>
                        <div className="flex justify-between items-start">
                          <span className="text-sm font-medium text-gray-600">
                            Position:
                          </span>
                          <span className="text-sm font-medium text-gray-800 text-right">
                            {controller.position || "N/A"}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300"
                >
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FaUsers className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-600 mb-2">
                    No office controllers added
                  </p>
                  <p className="text-sm text-gray-500">
                    Add office controllers to your business profile
                  </p>
                </motion.div>
              )
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300"
              >
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaUsers className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-600 mb-2">
                  No office controllers information
                </p>
                <p className="text-sm text-gray-500">
                  Please complete the office controllers details
                </p>
              </motion.div>
            )}
          </div>
        );

      case "Owner Details":
        return (
          <div className="w-full space-y-6 md:space-y-8">
            <h3 className="text-xl sm:text-2xl font-semibold text-[#005481] tracking-wide mb-4">
              Owner Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
              >
                <h4 className="text-lg font-semibold text-[#005481] mb-4 pb-2 border-b border-gray-200">
                  Ownership Information
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <span className="text-sm font-medium text-gray-600">
                      Owner Name:
                    </span>
                    <span className="text-sm font-medium text-gray-800">
                      {displayProfileData.first_name}{" "}
                      {displayProfileData.last_name}
                    </span>
                  </div>
                  <div className="flex justify-between items-start">
                    <span className="text-sm font-medium text-gray-600">
                      Ownership Percentage:
                    </span>
                    <span className="text-sm font-medium text-green-600 bg-green-100 px-2 py-1 rounded-full">
                      100%
                    </span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        );

      case "Uploaded Documents":
        return (
          <div className="w-full space-y-6 md:space-y-8">
            <div className="flex items-center justify-between">
              <h3 className="text-xl sm:text-2xl font-semibold text-[#005481] tracking-wide">
                Uploaded Documents
              </h3>
              {uploadedDocuments &&
                Array.isArray(uploadedDocuments.data) &&
                uploadedDocuments.data.length > 0 && (
                  <span className="text-sm text-green-600 bg-green-100 px-3 py-1 rounded-full">
                    {uploadedDocuments.data.length} Documents
                  </span>
                )}
            </div>

            {uploadedDocuments && Array.isArray(uploadedDocuments.data) ? (
              uploadedDocuments.data.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {uploadedDocuments.data.map((doc, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow group"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-semibold text-[#005481]">
                          {doc.documenttype || `Document ${index + 1}`}
                        </h4>
                        <div className="w-3 h-3 bg-blue-500 rounded-full group-hover:bg-blue-600 transition-colors"></div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <span className="text-sm font-medium text-gray-600">
                            Type:
                          </span>
                          <span className="text-sm font-medium text-gray-800">
                            {doc.documenttype || "N/A"}
                          </span>
                        </div>
                        <div className="flex justify-between items-start">
                          <span className="text-sm font-medium text-gray-600">
                            Uploaded:
                          </span>
                          <span className="text-sm font-medium text-gray-800">
                            {doc.uploaded_date || "N/A"}
                          </span>
                        </div>
                        {doc.file_path && (
                          <div className="pt-2">
                            <a
                              href={doc.file_path}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
                            >
                              <FaFileAlt className="w-4 h-4 mr-1" />
                              View Document
                            </a>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300"
                >
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FaFileAlt className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-600 mb-2">
                    No documents uploaded yet
                  </p>
                  <p className="text-sm text-gray-500">
                    Upload documents to complete your profile
                  </p>
                </motion.div>
              )
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300"
              >
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaFileAlt className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-600 mb-2">No documents information</p>
                <p className="text-sm text-gray-500">
                  Please upload required documents
                </p>
              </motion.div>
            )}
          </div>
        );

      default:
        return (
          <div className="text-center py-12">
            <p className="text-gray-500">Select a tab to view details</p>
          </div>
        );
    }
  };

  // =============== LOADING STATE ===============
  if (profileLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <RingLoader size={60} color="#3B82F6" loading={true} />
          <p className="mt-4 text-gray-600 text-lg">
            Loading profile information...
          </p>
        </div>
      </div>
    );
  }

  // =============== ERROR STATE ===============
  if (profileError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <FaTimesCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Error Loading Profile
          </h2>
          <p className="text-gray-600 mb-4">{profileError}</p>
          <button
            onClick={handleBackClick}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // =============== NO DATA STATE ===============
  if (!profileData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <FaUser className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            No Profile Data
          </h2>
          <p className="text-gray-600 mb-4">
            Profile information is not available. Please try refreshing the
            page.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors block w-full"
            >
              Refresh Page
            </button>
            <button
              onClick={handleBackClick}
              className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors block w-full"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =============== MAIN RENDER ===============
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {isModalOpen && (
        <PopupModal
          title={modalData.title}
          message={modalData.message}
          type={modalData.type}
          onClose={() => setIsModalOpen(false)}
        />
      )}

      {/* Enhanced ViewChargesPopup */}
      <ViewChargesPopup
        isOpen={isChargesPopupOpen}
        onClose={() => setIsChargesPopupOpen(false)}
        customerId={customerId}
        authtoken={authtoken}
      />

      <div className="container mx-auto p-4 py-6 sm:p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-2xl shadow-lg w-full p-6 sm:p-8 md:p-10 space-y-8 overflow-hidden"
        >
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 md:gap-8">
            {/* Main Content Area - 3 columns width */}
            <div className="lg:col-span-3 space-y-6 md:space-y-8">
              {/* Profile Header Card */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
                  <div className="flex items-center gap-4">
                    {/* Profile Picture */}
                    <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center shadow-md overflow-hidden">
                      {profilePicture ? (
                        <img
                          src={profilePicture}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <FaUser className="h-10 w-10 md:h-12 md:w-12 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                        My Profile
                      </h1>
                      <p className="text-gray-500 text-sm mt-1">
                        Manage your account information
                      </p>
                    </div>
                  </div>
                  <motion.button
                    onClick={handleEditToggle}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`text-white font-medium py-2.5 px-5 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${headerColorProps.className}`}
                    style={headerColorProps.style}
                  >
                    {isEditing ? "Cancel Editing" : "Edit Profile"}
                  </motion.button>
                </div>
              </div>

              {/* Personal Details Card */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-100">
                  Personal Details
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Name */}
                  <div className="md:col-span-2 grid grid-cols-2 gap-4">
                    {isEditing ? (
                      <>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">
                            First Name
                          </label>
                          <input
                            name="first_name"
                            value={editableData.first_name}
                            onChange={handleInputChange}
                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="First Name"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">
                            Last Name
                          </label>
                          <input
                            name="last_name"
                            value={editableData.last_name}
                            onChange={handleInputChange}
                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Last Name"
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">
                            First Name
                          </label>
                          <span className="text-sm font-medium text-gray-800 block py-2">
                            {displayProfileData.first_name || "Not Available"}
                          </span>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">
                            Last Name
                          </label>
                          <span className="text-sm font-medium text-gray-800 block py-2">
                            {displayProfileData.last_name || "Not Available"}
                          </span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Contact Information */}
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Mobile Number
                    </label>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-800 py-2">
                        {displayProfileData.mobile_number || "Not available"}
                      </span>
                      <motion.button
                        onClick={handleChangeMobile}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`text-xs text-white py-1.5 px-3 rounded-md transition-colors ${headerColorProps.className}`}
                        style={headerColorProps.style}
                      >
                        Change
                      </motion.button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Email Address
                    </label>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-800 truncate py-2">
                        {displayProfileData.email || "Not Available"}
                      </span>
                      <motion.button
                        onClick={handleChangePassword}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`text-xs text-white py-1.5 px-3 rounded-md transition-colors ${headerColorProps.className}`}
                        style={headerColorProps.style}
                      >
                        Change
                      </motion.button>
                    </div>
                  </div>

                  {/* Gender and DOB */}
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Gender
                    </label>
                    {isEditing ? (
                      <select
                        name="gender_id"
                        value={editableData.gender_id || ""}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select gender</option>
                        {genders.map((gender) => (
                          <option key={gender.id} value={gender.id}>
                            {gender.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-sm font-medium text-gray-800 block py-2">
                        {genders.find(
                          (g) => g.id === displayProfileData.gender_id,
                        )?.name || "N/A"}
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Date of Birth
                    </label>
                    {isEditing ? (
                      <input
                        type="date"
                        name="dob"
                        value={editableData.dob}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : (
                      <span className="text-sm font-medium text-gray-800 block py-2">
                        {displayProfileData.dob || "N/A"}
                      </span>
                    )}
                  </div>

                  {/* Nationality and Country */}
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Nationality
                    </label>
                    {isEditing ? (
                      <select
                        name="nationality_id"
                        value={editableData.nationality_id || ""}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select nationality</option>
                        {nationalities.map((nationality) => (
                          <option key={nationality.id} value={nationality.id}>
                            {nationality.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-sm font-medium text-gray-800 block py-2">
                        {displayProfileData.nationality || "N/A"}
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Country
                    </label>
                    {isEditing ? (
                      <select
                        name="country_id"
                        value={editableData.country_id || ""}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select country</option>
                        {countries.map((country) => (
                          <option key={country.id} value={country.id}>
                            {country.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-sm font-medium text-gray-800 block py-2">
                        {displayProfileData.country_name || "N/A"}
                      </span>
                    )}
                  </div>

                  {/* City, State, ZIP */}
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      City
                    </label>
                    {isEditing ? (
                      <input
                        name="city"
                        value={editableData.city}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="City"
                      />
                    ) : (
                      <span className="text-sm font-medium text-gray-800 block py-2">
                        {displayProfileData.city || "N/A"}
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      State
                    </label>
                    {isEditing ? (
                      <input
                        name="state"
                        value={editableData.state || ""}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="State"
                      />
                    ) : (
                      <span className="text-sm font-medium text-gray-800 block py-2">
                        {displayProfileData.state || "N/A"}
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      ZIP Code
                    </label>
                    {isEditing ? (
                      <input
                        name="zip_code"
                        value={editableData.zip_code}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="ZIP Code"
                      />
                    ) : (
                      <span className="text-sm font-medium text-gray-800 block py-2">
                        {displayProfileData.zip_code || "N/A"}
                      </span>
                    )}
                  </div>

                  {/* SSN (only for US) */}
                  {isUnitedStatesSelected() && (
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        SSN
                      </label>
                      <span className="text-sm font-medium text-gray-800 block py-2">
                        {displayProfileData?.ssn
                          ? formatSSN(displayProfileData.ssn)
                          : "N/A"}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Tabs Section - Show different tabs based on account type */}
              {availableTabs.length > 0 && (
                <div className="bg-white rounded-xl shadow-md p-6">
                  <div className="border-b border-gray-200">
                    <div className="flex overflow-x-auto scrollbar-hide -mb-px">
                      {availableTabs.map((tab) => (
                        <motion.button
                          key={tab}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className={`whitespace-nowrap px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                            activeTab === tab
                              ? "border-blue-500 text-blue-600"
                              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                          }`}
                          onClick={() => setActiveTab(tab)}
                        >
                          {tab}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Tab Content */}
                  <div className="mt-4">{renderTabContent()}</div>
                </div>
              )}
            </div>

            {/* Sidebar - 1 column width */}
            <div className="space-y-6 md:space-y-8">
              {/* Account Information Card */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-xl shadow-md p-6"
              >
                <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-100">
                  Account Information
                </h2>

                <div className="space-y-5">
                  {/* Account Status */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-gray-600">
                        Account Status:
                      </span>
                      <span className="text-sm font-medium text-blue-600">
                        {displayProfileData.active_status || "N/A"}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full"
                        style={{ width: "75%" }}
                      ></div>
                    </div>
                  </div>

                  {/* KYC Status */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-gray-600">KYC Status:</span>
                      <span
                        className={`text-xs font-medium px-2 py-1 rounded-full ${
                          displayProfileData.kyc_status === "Pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {displayProfileData.kyc_status || "N/A"}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-600 rounded-full"
                        style={{
                          width:
                            displayProfileData.kyc_status === "Completed"
                              ? "100%"
                              : "60%",
                        }}
                      ></div>
                    </div>
                  </div>

                  {/* Account Type */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-gray-600">
                        Account Type:
                      </span>
                      <span className="text-sm font-medium text-gray-800 capitalize">
                        {displayProfileData.customer_type || "N/A"}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gray-600 rounded-full"
                        style={{ width: "100%" }}
                      ></div>
                    </div>
                  </div>

                  {/* View Charges - Enhanced */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-gray-600">Charges</span>
                      <motion.button
                        onClick={handleViewCharges}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="text-xs bg-blue-600 hover:bg-blue-700 text-white py-1.5 px-3 rounded-md transition-colors shadow-sm"
                      >
                        View Charges
                      </motion.button>
                    </div>
                    <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-purple-600 rounded-full"
                        style={{
                          width: chargesStats.total > 0 ? "100%" : "0%",
                        }}
                      ></div>
                    </div>
                    {chargesStats.total > 0 && (
                      <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                        <span>{chargesStats.total} currencies</span>
                        <span>{chargesStats.withFxCharges} with FX</span>
                      </div>
                    )}
                  </div>

                  {/* Referral Code */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-gray-600">
                        Referral Code:
                      </span>
                      <motion.button
                        onClick={handleReferral}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="text-xs bg-gray-600 hover:bg-gray-700 text-white py-1.5 px-3 rounded-md transition-colors"
                      >
                        {displayProfileData.referral_code || "N/A"}
                      </motion.button>
                    </div>
                    <div className="w-full h-1.5 bg-gray-200 rounded-full"></div>
                  </div>

                  {/* Agent Code */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-gray-600">Agent Code:</span>
                      <motion.button
                        onClick={handleAgent}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="text-xs bg-gray-600 hover:bg-gray-700 text-white py-1.5 px-3 rounded-md transition-colors"
                      >
                        {displayProfileData.agent_code || "N/A"}
                      </motion.button>
                    </div>
                    <div className="w-full h-1.5 bg-gray-200 rounded-full"></div>
                  </div>
                </div>
              </motion.div>

              {/* Terms and Conditions Card */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-xl shadow-md p-6"
              >
                <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-100">
                  Terms & Conditions
                </h2>
                {agreedDetails.length > 0 ? (
                  <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                    {agreedDetails.map((item, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-gray-50 p-3 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                      >
                        <h4 className="text-sm font-medium text-gray-800 mb-1">
                          {item.title}
                        </h4>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1">
                          <Link
                            to={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 text-xs hover:underline"
                          >
                            View terms
                          </Link>
                          <p className="text-xs text-gray-500">
                            Agreed:{" "}
                            {new Date(
                              item.agreed_date_time,
                            ).toLocaleDateString()}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">
                    No terms and conditions available.
                  </p>
                )}
              </motion.div>

              {/* Account Status History Card */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white rounded-xl shadow-md p-6"
              >
                <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-100">
                  Status History
                </h2>
                {statusHistory.length > 0 ? (
                  <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                    {statusHistory.map((item, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-gray-50 p-3 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex justify-between items-start">
                          <h4 className="text-sm font-medium text-blue-600">
                            {item.account_status_name}
                          </h4>
                          <p className="text-xs text-gray-500 whitespace-nowrap">
                            {item.status_date_time}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">
                    No account status history available.
                  </p>
                )}
              </motion.div>
            </div>
          </div>

          {/* Save/Cancel Buttons (only in edit mode) */}
          {isEditing && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col sm:flex-row justify-end items-center gap-3 mt-8 pt-6 border-t border-gray-200"
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="py-2.5 px-5 bg-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-400 transition-colors text-sm"
                onClick={handleEditToggle}
              >
                Cancel
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="py-2.5 px-5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center justify-center min-w-32"
                onClick={handleSaveChanges}
                disabled={saveLoading}
              >
                {saveLoading ? (
                  <RingLoader size={16} color="#ffffff" />
                ) : (
                  "Save Changes"
                )}
              </motion.button>
            </motion.div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex justify-center items-center mt-4"
        >
          <motion.button
            onClick={handleBackClick}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-blue-600 border border-blue-600 hover:bg-blue-50 transition-colors duration-200"
          >
            <FaArrowLeft className="text-blue-600" />
            <span>Back to Dashboard</span>
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
};

export default Profile;