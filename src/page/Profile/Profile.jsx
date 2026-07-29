import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import axios from "axios";
import { RingLoader } from "react-spinners";
import Select from "react-select";
import { createPortal } from "react-dom";
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
  FaCamera,
  FaSpinner,
  FaChevronRight,
  FaChevronLeft,
  FaPlus,
  FaTrashAlt,
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

// Import countries selectors
import { selectCountries, selectCountriesLoading } from "../../features/Auth/slices/countrySlice";
import { setOwnerDetails } from "../../features/Auth/slices/authSlice";

import {
  fetchIdDocumentTypes,
  selectIdDocumentTypes,
  selectIdDocumentTypesLoading,
} from "../../features/Auth/slices/signupSlice"

const API_URL = import.meta.env.VITE_API_URL;

const defaultProfileData = {
  first_name: "",
  middle_name: "",
  last_name: "",
  gender_id: "",
  dob: "",
  nationality_id: "",
  country_id: "",
  resident_country_id: "",
  city: "",
  state: "",
  zip_code: "",
  street_address_1: "",
  street_address_2: "",
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
  occupation_id: "",
  purpose_of_account: "",
  monthly_expected_activity: "",
  customer_sending_countries: [],
  customer_receiving_funds_countries: [],
  id_document_type_id: "",
  id_document_number: "",
  id_issuing_country_id: "",
  id_expiry_date: "",
};

const Profile = () => {
  const { customerId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const authtoken = localStorage.getItem("authtoken");
  const uuid = localStorage.getItem("UUID");
  // const countries = JSON.parse(localStorage.getItem("allcountries") || "[]");
  const bearertoken = localStorage.getItem("bearertoken");

  // Get countries from Redux (already fetched by Login/App initialization)
  const reduxCountries = useSelector(selectCountries);
  const countriesLoading = useSelector(selectCountriesLoading);

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
  const [profilePictureLoading, setProfilePictureLoading] = useState(true);
  const [agreedDetails, setAgreedDetails] = useState([]);
  const [isChargesPopupOpen, setIsChargesPopupOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [genders, setGenders] = useState([]);
  const [nationalities, setNationalities] = useState([]);
  const [statusHistory, setStatusHistory] = useState([]);
  const [editableData, setEditableData] = useState(defaultProfileData);

  const [occupations, setOccupations] = useState([]);
  const [occupationsLoading, setOccupationsLoading] = useState(false);
  const [selectedOccupation, setSelectedOccupation] = useState(null);

  const idDocumentTypes = useSelector(selectIdDocumentTypes) || [];
  const idDocumentTypesLoading = useSelector(selectIdDocumentTypesLoading);

  const [selectedSendingCountries, setSelectedSendingCountries] = useState([]);
  const [selectedReceivingCountries, setSelectedReceivingCountries] = useState([]);

  const [activeTab, setActiveTab] = useState("Business Information");
  const [businessInfo, setBusinessInfo] = useState(null);
  const [responsiblePerson, setResponsiblePerson] = useState(null);
  const [officeControllers, setOfficeControllers] = useState(null);
  const [uploadedDocuments, setUploadedDocuments] = useState([]);
  const [tabLoading, setTabLoading] = useState(false);

  // Modal state for email/mobile change
  const [isChangeModalOpen, setIsChangeModalOpen] = useState(false);
  const [changeModalType, setChangeModalType] = useState(""); // "email" or "mobile"
  const [changeModalData, setChangeModalData] = useState({
    email: "",
    newEmail: "",
    mobileNumber: "",
    selectedCountryId: "",
    newMobileNumber: "",
  });
  const [changeModalLoading, setChangeModalLoading] = useState(false);

  // OTP verification states
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [tempMobileData, setTempMobileData] = useState({
    countryCode: "",
    mobileNumber: "",
    countryId: "",
    customerUuid: "",
  });
  const [otpRequestLoading, setOtpRequestLoading] = useState(false);
  const [otpResendTimer, setOtpResendTimer] = useState(0);
  const [canResendOtp, setCanResendOtp] = useState(true);

  // Passcode verification states for email
  const [showEmailPasscodeModal, setShowEmailPasscodeModal] = useState(false);
  const [emailPasscode, setEmailPasscode] = useState("");
  const [emailPasscodeLoading, setEmailPasscodeLoading] = useState(false);
  const [tempEmailData, setTempEmailData] = useState({
    email: "",
    customerUuid: "",
  });
  const [emailPasscodeRequestLoading, setEmailPasscodeRequestLoading] = useState(false);
  const [emailPasscodeResendTimer, setEmailPasscodeResendTimer] = useState(0);
  const [canResendEmailPasscode, setCanResendEmailPasscode] = useState(true);

  const [showDeleteControllerModal, setShowDeleteControllerModal] = useState(false);
  const [controllerToDelete, setControllerToDelete] = useState(null);
  const [deleteControllerLoading, setDeleteControllerLoading] = useState(false);

  const [showDeleteOwnerModal, setShowDeleteOwnerModal] = useState(false);
  const [ownerToDelete, setOwnerToDelete] = useState(null);
  const [deleteOwnerLoading, setDeleteOwnerLoading] = useState(false);
  const [remainingOwnersPercentages, setRemainingOwnersPercentages] = useState([]);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalData, setModalData] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "success",
    errors: null,
  });
  const [toast, setToast] = useState(null);

  const [ownerDetails, setOwnerDetails] = useState(null);

  const [documentTypes, setDocumentTypes] = useState([]);
  const [showDocumentDropdown, setShowDocumentDropdown] = useState(false);
  const [selectedDocumentType, setSelectedDocumentType] = useState(null);
  const [documentUploadLoading, setDocumentUploadLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  // Check if account type is individual
  const isIndividualAccount = useMemo(() => {
    return profileData?.customer_type?.toLowerCase() === "individual";
  }, [profileData?.customer_type]);

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

  const tabScrollRef = React.useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkTabScroll = () => {
    const el = tabScrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  useEffect(() => {
    checkTabScroll();
    const el = tabScrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", checkTabScroll);
    window.addEventListener("resize", checkTabScroll);
    return () => {
      el.removeEventListener("scroll", checkTabScroll);
      window.removeEventListener("resize", checkTabScroll);
    };
  }, [availableTabs]);

  const scrollTabs = (dir) => {
    const el = tabScrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * 150, behavior: "smooth" });
  };

  // Auto-close modal after delay
  useEffect(() => {
    if (isModalOpen) {
      const timer = setTimeout(() => {
        setIsModalOpen(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isModalOpen]);

  // Initialize profile picture from localStorage on mount
  useEffect(() => {
    const cachedImage = localStorage.getItem('profilePicture');
    if (cachedImage) {
      console.log("🔄 Loading cached profile picture:", cachedImage);
      setProfilePicture(cachedImage);
      setProfilePictureLoading(false);
    } else {
      // If no cached image, show loading until API responds
      setProfilePictureLoading(true);
    }
  }, []);

  //  Load profile picture from localStorage immediately on mount
  useEffect(() => {
    const cachedImage = localStorage.getItem('profilePicture');
    if (cachedImage) {
      console.log("🔄 Loading profile picture from localStorage:", cachedImage);
      setProfilePicture(cachedImage);
      //  Hide loading immediately if we have cached image
      setSaveLoading(false);
    } else {
      //  No image, just hide loading and show default avatar
      setSaveLoading(false);
      setProfilePicture(null);
    }
  }, []);

  // Resend OTP timer
  useEffect(() => {
    let interval;
    if (otpResendTimer > 0) {
      interval = setInterval(() => {
        setOtpResendTimer((prev) => {
          if (prev <= 1) {
            setCanResendOtp(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpResendTimer]);

  // Email Passcode Resend timer
  useEffect(() => {
    let interval;
    if (emailPasscodeResendTimer > 0) {
      interval = setInterval(() => {
        setEmailPasscodeResendTimer((prev) => {
          if (prev <= 1) {
            setCanResendEmailPasscode(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [emailPasscodeResendTimer]);

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

        // ✅ Check profileData for the image
        const imageFromProfile = profileData.profile_image ||
          profileData.profile_picture ||
          null;

        if (imageFromProfile && imageFromProfile !== "") {
          console.log("✅ Found profile picture in profileData:", imageFromProfile);
          setProfilePicture(imageFromProfile);
          localStorage.setItem('profilePicture', imageFromProfile);
        }

        // ✅ Check localStorage as fallback
        const cachedImage = localStorage.getItem('profilePicture');
        if (cachedImage && !imageFromProfile) {
          console.log("🔄 Found cached profile picture:", cachedImage);
          setProfilePicture(cachedImage);
        }

        // ✅ If no image found, just use default avatar (no spinner)
        if (!imageFromProfile && !cachedImage) {
          console.log("ℹ️ No profile picture found, showing default avatar");
          setProfilePicture(null);
        }

        // ✅ Set loading to false immediately after checking cache
        setSaveLoading(false);

        // Fetch other data in background
        const [termsResponse, statusLogResponse] = await Promise.all([
          axios.get(`${API_URL}/terms-agreed-details/${customerId}`, {
            headers: { Authorization: `Bearer ${authtoken}` },
          }),
          axios.get(`${API_URL}/account-status-log/${customerId}`, {
            headers: { Authorization: `Bearer ${authtoken}` },
          }),
        ]);

        console.log("✅ Terms and status log fetched");

        // Fetch KYC in background (non-blocking)
        try {
          const imageResponse = await axios.get(`${API_URL}/kyc/${customerId}`, {
            headers: { Authorization: `Bearer ${bearertoken}` },
          });

          console.log("📸 KYC Image response:", imageResponse.data);

          const pictureUrl = imageResponse.data.data?.profile_image ||

            imageResponse.data.picture ||
            null;

          if (pictureUrl && pictureUrl !== "" && pictureUrl !== profilePicture) {
            setProfilePicture(pictureUrl);
            localStorage.setItem('profilePicture', pictureUrl);
            console.log("✅ Profile picture updated from KYC API:", pictureUrl);
          }

          setCroppedImage(imageResponse.data.document_picture_front);
        } catch (kycErr) {
          console.log("ℹ️ KYC API not available, using existing image");
        }

        if (
          termsResponse.data.status === "success" &&
          termsResponse.data.count_agreed > "0"
        ) {
          setAgreedDetails(termsResponse.data.agreed_details);
        }

        setStatusHistory(statusLogResponse.data);
      } catch (err) {
        console.error("❌ Profile: Failed to fetch additional data", err);
        const cachedImage = localStorage.getItem('profilePicture');
        if (cachedImage) {
          setProfilePicture(cachedImage);
        } else {
          setProfilePicture(null);
        }
      } finally {
        // ✅ Always hide loading
        setSaveLoading(false);
      }
    };

    if (profileData && customerId && authtoken && bearertoken) {
      fetchAdditionalProfileData();
    }
  }, [profileData, customerId, authtoken, bearertoken]);
  // Fetch tab data when tab changes - ONLY for non-individual accounts
  // Fetch tab data when tab changes - ONLY for non-individual accounts
  useEffect(() => {
    const fetchTabData = async () => {
      // Don't fetch ANY tab data for individual accounts
      if (isIndividualAccount) {
        console.log("👤 Profile: Individual account, skipping tab data fetch");
        return;
      }

      // Get customerUuid from localStorage
      const customerUuid = localStorage.getItem("customerUuid");

      if (!customerUuid || !authtoken) {
        console.log("❌ Profile: Missing customerUuid or authtoken", {
          customerUuid: !!customerUuid,
          authtoken: !!authtoken
        });
        return;
      }

      try {
        setTabLoading(true);
        console.log(`📊 Profile: Fetching ${activeTab} data for customerUuid: ${customerUuid}`);

        let response;
        let endpoint = "";

        switch (activeTab) {
          case "Business Information":
            endpoint = `${API_URL}/customers/business-information/${customerUuid}`;
            response = await axios.get(endpoint, {
              headers: { Authorization: `Bearer ${authtoken}` },
            });
            setBusinessInfo(response.data);
            break;
          case "Responsible Person":
            endpoint = `${API_URL}/customers/responsible-person/${customerUuid}`;
            response = await axios.get(endpoint, {
              headers: { Authorization: `Bearer ${authtoken}` },
            });
            setResponsiblePerson(response.data);
            break;
          case "Office Controllers":
            endpoint = `${API_URL}/customers/office-controllers/${customerUuid}`;
            response = await axios.get(endpoint, {
              headers: { Authorization: `Bearer ${authtoken}` },
            });
            setOfficeControllers(response.data);
            break;
          case "Owner Details":
            endpoint = `${API_URL}/customers/owner-details/${customerUuid}`;
            response = await axios.get(endpoint, {
              headers: { Authorization: `Bearer ${authtoken}` },
            });
            setOwnerDetails(response.data);
            break;
          case "Uploaded Documents":
            endpoint = `${API_URL}/customers/uploaded-documents/${customerUuid}`;
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
        // Optionally set error state or show toast notification
      } finally {
        setTabLoading(false);
      }
    };

    fetchTabData();
  }, [activeTab, authtoken, isIndividualAccount]); // Remove uuid from dependencies since we get it inside

  // Initialize editableData when profileData changes
  useEffect(() => {
    if (profileData) {
      console.log("🔄 Profile: Initializing editableData from profileData");
      setEditableData({
        first_name: profileData.first_name || "",
        middle_name: profileData.middle_name || "",
        last_name: profileData.last_name || "",
        gender_id: profileData.gender_id || "",
        dob: profileData.dob || "",
        nationality_id: profileData.nationality_id || "",
        country_id: profileData.country_id || "",
        resident_country_id: profileData.resident_country_id || "",
        city: profileData.city || "",
        state: profileData.state || "",
        zip_code: profileData.zip_code || "",
        street_address_1: profileData.street_address_1 || "",
        street_address_2: profileData.street_address_2 || "",
        occupation_id: profileData.occupation_id || "",
        purpose_of_account: profileData.purpose_of_account || "",
        monthly_expected_activity: profileData.monthly_expected_activity || "",
        customer_sending_countries: (profileData.funds_sending_countries || []).map((c) => c.country_id),
        customer_receiving_funds_countries: (profileData.funds_receiving_countries || []).map((c) => c.country_id),
        id_document_type_id: profileData.id_document_type_id || "",
        id_document_number: profileData.id_document_number || "",
        id_issuing_country_id: profileData.id_document_type_country_id || "",
        id_expiry_date: profileData.id_document_expiry_date || "",
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

  // Fetch occupations (individual accounts only)
  useEffect(() => {
    const fetchOccupations = async () => {
      if (!isIndividualAccount || !bearertoken) return;
      try {
        setOccupationsLoading(true);
        const response = await axios.get(`${API_URL}/customers/fetch-occupation`, {
          headers: { Authorization: `Bearer ${bearertoken}` },
        });
        if (response.data?.data && Array.isArray(response.data.data)) {
          setOccupations(response.data.data);
        } else if (Array.isArray(response.data)) {
          setOccupations(response.data);
        } else {
          setOccupations([]);
        }
      } catch (error) {
        console.error("❌ Failed to fetch occupations:", error);
        setOccupations([]);
      } finally {
        setOccupationsLoading(false);
      }
    };
    fetchOccupations();
  }, [isIndividualAccount, bearertoken]);

  // Fetch ID document types (individual accounts only)
  useEffect(() => {
    if (isIndividualAccount && idDocumentTypes.length === 0) {
      dispatch(fetchIdDocumentTypes());
    }
  }, [isIndividualAccount, idDocumentTypes.length, dispatch]);

  // Sync selected occupation once data + profile are both loaded
  useEffect(() => {
    if (profileData?.occupation_id && occupations.length > 0) {
      const occ = occupations.find(
        (o) => String(o.id) === String(profileData.occupation_id)
      );
      if (occ) setSelectedOccupation({ value: occ.id, label: occ.name });
    }
  }, [profileData, occupations]);

  // Sync sending/receiving country multi-selects
  useEffect(() => {
    if (Array.isArray(profileData?.funds_sending_countries)) {
      setSelectedSendingCountries(
        profileData.funds_sending_countries.map((c) => ({
          value: c.country_id,
          label: c.countryname,
        }))
      );
    }
    if (Array.isArray(profileData?.funds_receiving_countries)) {
      setSelectedReceivingCountries(
        profileData.funds_receiving_countries.map((c) => ({
          value: c.country_id,
          label: c.countryname,
        }))
      );
    }
  }, [profileData]);

  // Memoize country options from Redux countries data
  const countryCodeOptions = useMemo(() => {
    if (!reduxCountries || !Array.isArray(reduxCountries)) {
      return [];
    }

    return reduxCountries
      .filter(country => country.phone_code) // Only include countries with phone codes
      .map((country) => ({
        value: country.id,
        label: `${country.name} (${country.phone_code})`,
        countryName: country.name,
        phone_code: country.phone_code,
        flagUrl: country.flag_url,
      }))
      .sort((a, b) => a.label.localeCompare(b.label)); // Sort alphabetically
  }, [reduxCountries]);

  const nationalityOptions = useMemo(() => {
    return nationalities.map((n) => ({
      value: n.id,
      label: n.name,
      flagUrl: n.flag_url, // omit if your nationalities API doesn't return this
    }));
  }, [nationalities]);

  const genderOptions = useMemo(() => {
    return genders.map((g) => ({
      value: g.id,
      label: g.name,
    }));
  }, [genders]);

  const profileCountryOptions = useMemo(() => {
    if (!reduxCountries || !Array.isArray(reduxCountries)) return [];
    return reduxCountries.map((c) => ({
      value: c.id,
      label: c.name,
    }));
  }, [reduxCountries]);

  // Find current selected country option
  const currentSelectedCountry = useMemo(() => {
    if (!changeModalData.selectedCountryId) {
      return null;
    }
    return countryCodeOptions.find(
      (option) => option.value === parseInt(changeModalData.selectedCountryId)
    ) || null;
  }, [countryCodeOptions, changeModalData.selectedCountryId]);

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

  // Validate email format
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Validate mobile number format
  const isValidMobileNumber = (number) => {
    const mobileRegex = /^\d{6,15}$/;
    return mobileRegex.test(number);
  };

  const handleEditToggle = () => {
    if (isEditing) {
      // Reset to original data from Redux
      setEditableData({
        first_name: profileData?.first_name || "",
        middle_name: profileData?.middle_name || "",
        last_name: profileData?.last_name || "",
        gender_id: profileData?.gender_id || "",
        dob: profileData?.dob || "",
        nationality_id: profileData?.nationality_id || "",
        country_id: profileData?.country_id || "",
        resident_country_id: profileData?.resident_country_id || "",
        city: profileData?.city || "",
        state: profileData?.state || "",
        zip_code: profileData?.zip_code || "",
        street_address_1: profileData?.street_address_1 || "",
        street_address_2: profileData?.street_address_2 || "",
        occupation_id: profileData?.occupation_id || "",
        purpose_of_account: profileData?.purpose_of_account || "",
        monthly_expected_activity: profileData?.monthly_expected_activity || "",
        customer_sending_countries: (profileData?.funds_sending_countries || []).map((c) => c.country_id),
        customer_receiving_funds_countries: (profileData?.funds_receiving_countries || []).map((c) => c.country_id),
        id_document_type_id: profileData?.id_document_type_id || "",
        id_document_number: profileData?.id_document_number || "",
        id_issuing_country_id: profileData?.id_document_type_country_id || "",
        id_expiry_date: profileData?.id_document_expiry_date || "",
      });
      if (profileData?.occupation_id) {
        const occ = occupations.find((o) => o.id === profileData.occupation_id);
        setSelectedOccupation(occ ? { value: occ.id, label: occ.name } : null);
      }
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
  const handleNationalitySelectChange = (selectedOption) => {
    setEditableData((prev) => ({ ...prev, nationality_id: selectedOption?.value || "" }));
  };

  const handleGenderSelectChange = (selectedOption) => {
    setEditableData((prev) => ({ ...prev, gender_id: selectedOption?.value || "" }));
  };

  const handleProfileCountryChange = (selectedOption) => {
    setEditableData((prev) => ({ ...prev, country_id: selectedOption?.value || "" }));
  };

  const handleOccupationChange = (selectedOption) => {
    setSelectedOccupation(selectedOption);
    setEditableData((prev) => ({ ...prev, occupation_id: selectedOption?.value || "" }));
  };

  const handleResidentCountryChange = (selectedOption) => {
    setEditableData((prev) => ({ ...prev, resident_country_id: selectedOption?.value || "" }));
  };

  const handleIdIssuingCountryChange = (selectedOption) => {
    setEditableData((prev) => ({ ...prev, id_issuing_country_id: selectedOption?.value || "" }));
  };

  const handleIdDocumentTypeChange = (e) => {
    setEditableData((prev) => ({ ...prev, id_document_type_id: e.target.value }));
  };

  const handleSendingCountriesChange = (selectedOptions) => {
    setSelectedSendingCountries(selectedOptions || []);
    setEditableData((prev) => ({
      ...prev,
      customer_sending_countries: (selectedOptions || []).map((opt) => opt.value),
    }));
  };

  const handleReceivingCountriesChange = (selectedOptions) => {
    setSelectedReceivingCountries(selectedOptions || []);
    setEditableData((prev) => ({
      ...prev,
      customer_receiving_funds_countries: (selectedOptions || []).map((opt) => opt.value),
    }));
  };

  // Open change email modal
  const handleChangeEmailClick = () => {
    setChangeModalData({
      email: profileData?.email || "",
      newEmail: "",
      mobileNumber: "",
      selectedCountryId: "",
      newMobileNumber: "",
    });
    setChangeModalType("email");
    setIsChangeModalOpen(true);
  };

  // Open change mobile modal
  const handleChangeMobileClick = () => {
    setChangeModalData({
      email: "",
      newEmail: "",
      mobileNumber: profileData?.mobile_number || "",
      selectedCountryId: "",
      newMobileNumber: "",
    });
    setChangeModalType("mobile");
    setIsChangeModalOpen(true);
  };

  // Handle change modal input
  const handleChangeModalInput = (e) => {
    const { name, value } = e.target;
    setChangeModalData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle country selection
  const handleCountryCodeSelect = (selectedOption) => {
    if (!selectedOption) return;

    setChangeModalData((prev) => ({
      ...prev,
      selectedCountryId: selectedOption.value,
    }));
  };

  // Request OTP for mobile change
  const requestMobileChangeOtp = async () => {
    if (!changeModalData.selectedCountryId) {
      setModalData({
        isOpen: true,
        title: "Validation Error",
        message: "Please select a country code.",
        type: "error",
      });
      setIsModalOpen(true);
      return;
    }

    if (!changeModalData.newMobileNumber || !changeModalData.newMobileNumber.trim()) {
      setModalData({
        isOpen: true,
        title: "Validation Error",
        message: "Please enter a mobile number.",
        type: "error",
      });
      setIsModalOpen(true);
      return;
    }

    const mobileRegex = /^\d{6,15}$/;
    if (!mobileRegex.test(changeModalData.newMobileNumber)) {
      setModalData({
        isOpen: true,
        title: "Invalid Mobile Number",
        message: "Please enter a valid mobile number (6-15 digits, numbers only).",
        type: "error",
      });
      setIsModalOpen(true);
      return;
    }

    setOtpRequestLoading(true);

    try {
      // Get the selected country's phone code
      const selectedCountry = countryCodeOptions.find(
        (c) => c.value === parseInt(changeModalData.selectedCountryId)
      );
      const phoneCode = selectedCountry?.phone_code || "";

      // Get the customer UUID from localStorage (THIS IS THE CORRECT ONE)
      const customerUuid = localStorage.getItem("customerUuid");

      console.log("🔍 Debug - Customer ID sources:", {
        customerUuid: customerUuid,
        authcustomer_id: localStorage.getItem("authcustomer_id"),
        customerIdParam: customerId,
      });

      if (!customerUuid) {
        throw new Error("Customer UUID not found. Please logout and login again.");
      }

      const payload = {
        customer_id: customerUuid, // This will be "2b6a2034-7f88-4fa4-a1e8-918f1fb80e51"
        mobile_number_country_code: phoneCode,
        mobile_number: changeModalData.newMobileNumber,
      };

      console.log("📱 Requesting OTP for mobile change:", payload);

      const response = await axios.post(
        `${API_URL}/customers/send-otp-profile-mobile-change`,
        payload,
        { headers: { Authorization: `Bearer ${authtoken}` } }
      );

      if (response.data.status === "success") {
        // Store temporary mobile data for OTP verification
        setTempMobileData({
          countryCode: phoneCode,
          mobileNumber: changeModalData.newMobileNumber,
          countryId: changeModalData.selectedCountryId,
          customerUuid: customerUuid,
        });

        // Close the change modal and open OTP modal
        setIsChangeModalOpen(false);
        setShowOtpModal(true);
        setOtpCode("");

        // Start resend timer
        setCanResendOtp(false);
        setOtpResendTimer(60);

        setModalData({
          isOpen: true,
          title: "OTP Sent",
          message: "A verification code has been sent to your new mobile number.",
          type: "success",
        });
        setIsModalOpen(true);
      } else {
        throw new Error(response.data.message || "Failed to send OTP");
      }
    } catch (err) {
      console.error("❌ Failed to send OTP:", err);
      setModalData({
        isOpen: true,
        title: "Error",
        message: err.response?.data?.message || "Failed to send OTP. Please try again.",
        type: "error",
      });
      setIsModalOpen(true);
    } finally {
      setOtpRequestLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (!canResendOtp) {
      setModalData({
        isOpen: true,
        title: "Please Wait",
        message: `Please wait ${otpResendTimer} seconds before requesting a new OTP.`,
        type: "warning",
      });
      setIsModalOpen(true);
      return;
    }

    setOtpRequestLoading(true);

    try {
      // Get the customer UUID from localStorage
      const customerUuid = localStorage.getItem("customerUuid");

      if (!customerUuid) {
        throw new Error("Customer UUID not found. Please logout and login again.");
      }

      const payload = {
        customer_id: customerUuid,
        mobile_number_country_code: tempMobileData.countryCode,
        mobile_number: tempMobileData.mobileNumber,
      };

      console.log("📱 Resending OTP:", payload);

      const response = await axios.post(
        `${API_URL}/customers/send-otp-profile-mobile-change`,
        payload,
        { headers: { Authorization: `Bearer ${authtoken}` } }
      );

      if (response.data.status === "success") {
        setCanResendOtp(false);
        setOtpResendTimer(60);

        setModalData({
          isOpen: true,
          title: "OTP Resent",
          message: "A new verification code has been sent to your mobile number.",
          type: "success",
        });
        setIsModalOpen(true);
      } else {
        throw new Error(response.data.message || "Failed to resend OTP");
      }
    } catch (err) {
      console.error("❌ Failed to resend OTP:", err);
      setModalData({
        isOpen: true,
        title: "Error",
        message: err.response?.data?.message || "Failed to resend OTP. Please try again.",
        type: "error",
      });
      setIsModalOpen(true);
    } finally {
      setOtpRequestLoading(false);
    }
  };

  // Verify OTP and update mobile number
  const handleVerifyOtp = async () => {
    if (!otpCode || otpCode.length !== 6) {
      setModalData({
        isOpen: true,
        title: "Invalid OTP",
        message: "Please enter a valid 6-digit OTP code.",
        type: "error",
      });
      setIsModalOpen(true);
      return;
    }

    setOtpLoading(true);

    try {
      // Get the customer UUID from localStorage
      const customerUuid = localStorage.getItem("customerUuid");

      if (!customerUuid) {
        throw new Error("Customer UUID not found. Please logout and login again.");
      }

      const payload = {
        customer_id: customerUuid,
        mobile_number_country_code: tempMobileData.countryCode,
        mobile_number: tempMobileData.mobileNumber,
        otp: otpCode,
      };

      console.log("🔐 Verifying OTP for mobile change:", payload);

      const response = await axios.post(
        `${API_URL}/customers/validate-otp-profile-mobile-change`,
        payload,
        { headers: { Authorization: `Bearer ${authtoken}` } }
      );

      if (response.data.status === "success") {
        console.log("✅ Mobile number changed successfully");

        // Refresh profile data
        if (bearertoken) {
          dispatch(fetchUserProfile({ customerId, bearertoken }));
        }

        // Close OTP modal
        setShowOtpModal(false);
        setOtpCode("");

        setModalData({
          isOpen: true,
          title: "Success",
          message: "Mobile number updated successfully.",
          type: "success",
        });
        setIsModalOpen(true);
      } else {
        throw new Error(response.data.message || "Failed to verify OTP");
      }
    } catch (err) {
      console.error("❌ Failed to verify OTP:", err);
      setModalData({
        isOpen: true,
        title: "Verification Failed",
        message: err.response?.data?.message || "Invalid OTP. Please try again.",
        type: "error",
      });
      setIsModalOpen(true);
    } finally {
      setOtpLoading(false);
    }
  };

  // Request Passcode for email change
  const requestEmailChangePasscode = async () => {
    if (!changeModalData.newEmail) {
      setModalData({
        isOpen: true,
        title: "Validation Error",
        message: "Please enter a valid email address.",
        type: "error",
      });
      setIsModalOpen(true);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(changeModalData.newEmail)) {
      setModalData({
        isOpen: true,
        title: "Invalid Email",
        message: "Please enter a valid email address (e.g., name@example.com).",
        type: "error",
      });
      setIsModalOpen(true);
      return;
    }

    setEmailPasscodeRequestLoading(true);

    try {
      const customerUuid = localStorage.getItem("customerUuid");

      if (!customerUuid) {
        throw new Error("Customer UUID not found. Please logout and login again.");
      }

      const payload = {
        customer_id: customerUuid,
        email: changeModalData.newEmail,
      };

      console.log("📧 Requesting passcode for email change:", payload);

      const response = await axios.post(
        `${API_URL}/customers/send-passcode-profile-email-change`,
        payload,
        { headers: { Authorization: `Bearer ${authtoken}` } }
      );

      if (response.data.status === "success") {
        setTempEmailData({
          email: changeModalData.newEmail,
          customerUuid: customerUuid,
        });

        setIsChangeModalOpen(false);
        setShowEmailPasscodeModal(true);
        setEmailPasscode("");

        setCanResendEmailPasscode(false);
        setEmailPasscodeResendTimer(60);

        setModalData({
          isOpen: true,
          title: "Passcode Sent",
          message: "A verification passcode has been sent to your new email address.",
          type: "success",
        });
        setIsModalOpen(true);
      } else {
        throw new Error(response.data.message || "Failed to send passcode");
      }
    } catch (err) {
      console.error("❌ Failed to send email passcode:", err);
      setModalData({
        isOpen: true,
        title: "Error",
        message: err.response?.data?.message || "Failed to send passcode. Please try again.",
        type: "error",
      });
      setIsModalOpen(true);
    } finally {
      setEmailPasscodeRequestLoading(false);
    }
  };

  // Resend Email Passcode
  const handleResendEmailPasscode = async () => {
    if (!canResendEmailPasscode) {
      setModalData({
        isOpen: true,
        title: "Please Wait",
        message: `Please wait ${emailPasscodeResendTimer} seconds before requesting a new passcode.`,
        type: "warning",
      });
      setIsModalOpen(true);
      return;
    }

    setEmailPasscodeRequestLoading(true);

    try {
      const customerUuid = localStorage.getItem("customerUuid");

      if (!customerUuid) {
        throw new Error("Customer UUID not found. Please logout and login again.");
      }

      const payload = {
        customer_id: customerUuid,
        email: tempEmailData.email,
      };

      console.log("📧 Resending email passcode:", payload);

      const response = await axios.post(
        `${API_URL}/customers/send-passcode-profile-email-change`,
        payload,
        { headers: { Authorization: `Bearer ${authtoken}` } }
      );

      if (response.data.status === "success") {
        setCanResendEmailPasscode(false);
        setEmailPasscodeResendTimer(60);

        setModalData({
          isOpen: true,
          title: "Passcode Resent",
          message: "A new verification passcode has been sent to your email address.",
          type: "success",
        });
        setIsModalOpen(true);
      } else {
        throw new Error(response.data.message || "Failed to resend passcode");
      }
    } catch (err) {
      console.error("❌ Failed to resend email passcode:", err);
      setModalData({
        isOpen: true,
        title: "Error",
        message: err.response?.data?.message || "Failed to resend passcode. Please try again.",
        type: "error",
      });
      setIsModalOpen(true);
    } finally {
      setEmailPasscodeRequestLoading(false);
    }
  };

  // Verify Email Passcode and update email
  const handleVerifyEmailPasscode = async () => {
    if (!emailPasscode || emailPasscode.length !== 6) {
      setModalData({
        isOpen: true,
        title: "Invalid Passcode",
        message: "Please enter a valid 6-digit passcode.",
        type: "error",
      });
      setIsModalOpen(true);
      return;
    }

    setEmailPasscodeLoading(true);

    try {
      const customerUuid = localStorage.getItem("customerUuid");

      if (!customerUuid) {
        throw new Error("Customer UUID not found. Please logout and login again.");
      }

      const payload = {
        customer_id: customerUuid,
        email: tempEmailData.email,
        passcode: emailPasscode,
      };

      console.log("🔐 Verifying email passcode:", payload);

      const response = await axios.post(
        `${API_URL}/customers/validate-passcode-profile-email-change`,
        payload,
        { headers: { Authorization: `Bearer ${authtoken}` } }
      );

      if (response.data.status === "success") {
        console.log("✅ Email changed successfully");

        if (bearertoken) {
          dispatch(fetchUserProfile({ customerId, bearertoken }));
        }

        setShowEmailPasscodeModal(false);
        setEmailPasscode("");

        setModalData({
          isOpen: true,
          title: "Success",
          message: "Email address updated successfully.",
          type: "success",
        });
        setIsModalOpen(true);
      } else {
        throw new Error(response.data.message || "Failed to verify passcode");
      }
    } catch (err) {
      console.error("❌ Failed to verify email passcode:", err);
      setModalData({
        isOpen: true,
        title: "Verification Failed",
        message: err.response?.data?.message || "Invalid passcode. Please try again.",
        type: "error",
      });
      setIsModalOpen(true);
    } finally {
      setEmailPasscodeLoading(false);
    }
  };

  // Submit change email (no OTP for email)
  const handleChangeEmailSubmit = async () => {
    setChangeModalLoading(true);

    try {
      if (!changeModalData.newEmail) {
        setModalData({
          isOpen: true,
          title: "Error",
          message: "Please enter new email address",
          type: "error",
        });
        setIsModalOpen(true);
        setChangeModalLoading(false);
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(changeModalData.newEmail)) {
        setModalData({
          isOpen: true,
          title: "Error",
          message: "Please enter a valid email address",
          type: "error",
        });
        setIsModalOpen(true);
        setChangeModalLoading(false);
        return;
      }

      console.log("📧 Profile: Changing email", changeModalData.newEmail);

      const response = await axios.post(
        `${API_URL}/customers/change-email`,
        {
          customer_id: customerId,
          new_email: changeModalData.newEmail,
        },
        { headers: { Authorization: `Bearer ${authtoken}` } }
      );

      if (response.data.status === "success") {
        console.log("✅ Profile: Email changed successfully");

        // Refresh profile data
        if (bearertoken) {
          dispatch(fetchUserProfile({ customerId, bearertoken }));
        }

        setModalData({
          isOpen: true,
          title: "Success",
          message: "Email address updated successfully",
          type: "success",
        });
        setIsModalOpen(true);
        setIsChangeModalOpen(false);
      } else {
        throw new Error(response.data.message || "Failed to update email");
      }
    } catch (err) {
      console.error("❌ Profile: Failed to change email", err);
      setModalData({
        isOpen: true,
        title: "Error",
        message: err.response?.data?.message || "Failed to update email. Please try again.",
        type: "error",
      });
      setIsModalOpen(true);
    } finally {
      setChangeModalLoading(false);
    }
  };

  // Fetch document types for dropdown
  const fetchDocumentTypes = async () => {
    try {
      console.log("📄 Fetching document types...");
      const response = await axios.get(`${API_URL}/institution-upload-document-types`, {
        headers: { Authorization: `Bearer ${authtoken}` },
      });

      console.log("📄 Document types response:", response.data);

      // The response is directly the array of document types
      if (Array.isArray(response.data)) {
        setDocumentTypes(response.data);
        console.log("✅ Document types loaded:", response.data.length, "types");
      } else if (response.data.status === "success" && Array.isArray(response.data.data)) {
        setDocumentTypes(response.data.data);
        console.log("✅ Document types loaded:", response.data.data.length, "types");
      } else {
        throw new Error("Invalid response format");
      }
    } catch (err) {
      console.error("❌ Failed to fetch document types:", err);
      setModalData({
        isOpen: true,
        title: "Error",
        message: err.response?.data?.message || "Failed to fetch document types. Please try again.",
        type: "error",
      });
      setIsModalOpen(true);
    }
  };

  // Handle document upload
  const handleDocumentUpload = async () => {
    // Validate selections
    if (!selectedDocumentType) {
      setModalData({
        isOpen: true,
        title: "Error",
        message: "Please select a document type.",
        type: "error",
      });
      setIsModalOpen(true);
      return;
    }

    if (!selectedFile) {
      setModalData({
        isOpen: true,
        title: "Error",
        message: "Please select a file to upload.",
        type: "error",
      });
      setIsModalOpen(true);
      return;
    }

    setDocumentUploadLoading(true);

    try {
      const customerUuid = localStorage.getItem("customerUuid");

      if (!customerUuid) {
        throw new Error("Customer UUID not found. Please logout and login again.");
      }

      // Create FormData
      const formData = new FormData();
      formData.append('customerUuid', customerUuid);
      formData.append('documentTypeId', selectedDocumentType.id);
      formData.append('document', selectedFile);

      console.log("📄 Uploading document:", {
        customerUuid,
        documentTypeId: selectedDocumentType.id,
        documentTypeName: selectedDocumentType.name || selectedDocumentType.document_type,
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        fileType: selectedFile.type
      });

      // Make API call
      const response = await axios.post(
        `${API_URL}/customers/add-document`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${authtoken}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      console.log("📄 Upload response:", response.data);

      if (response.data.status === "success") {
        // Refresh the uploaded documents list
        const refreshResponse = await axios.get(
          `${API_URL}/customers/uploaded-documents/${customerUuid}`,
          { headers: { Authorization: `Bearer ${authtoken}` } }
        );
        setUploadedDocuments(refreshResponse.data);

        // Show success message
        setModalData({
          isOpen: true,
          title: "Success",
          message: "Document uploaded successfully!",
          type: "success",
        });
        setIsModalOpen(true);

        // Reset form
        setShowDocumentDropdown(false);
        setSelectedDocumentType(null);
        setSelectedFile(null);
      } else {
        throw new Error(response.data.message || "Failed to upload document");
      }
    } catch (err) {
      console.error("❌ Failed to upload document:", err);
      setModalData({
        isOpen: true,
        title: "Upload Failed",
        message: err.response?.data?.message || err.message || "Failed to upload document. Please try again.",
        type: "error",
      });
      setIsModalOpen(true);
    } finally {
      setDocumentUploadLoading(false);
    }
  };

  // Open delete confirmation for a controller
  const handleDeleteControllerClick = (controller) => {
    setControllerToDelete(controller);
    setShowDeleteControllerModal(true);
  };

  // Confirm and perform deletion
  const handleConfirmDeleteController = async () => {
    if (!controllerToDelete) return;

    setDeleteControllerLoading(true);

    try {
      const customerUuid = localStorage.getItem("customerUuid");
      const authCustomerId = localStorage.getItem("authcustomer_id");

      if (!customerUuid) {
        throw new Error("Customer UUID not found. Please logout and login again.");
      }

      console.log("🗑️ Deleting controller:", controllerToDelete.controller_uuid);

      const payload = {
        controller_uuid: controllerToDelete.controller_uuid,
        updated_user_type: "customer",
        updated_user_id: authCustomerId ? parseInt(authCustomerId) : null,
      };

      const response = await axios.post(
        `${API_URL}/customers/delete-office-controller/${customerUuid}`,
        payload,
        { headers: { Authorization: `Bearer ${authtoken}` } }
      );

      if (response.data.status === "success") {
        // Refresh the office controllers list
        const refreshResponse = await axios.get(
          `${API_URL}/customers/office-controllers/${customerUuid}`,
          { headers: { Authorization: `Bearer ${authtoken}` } }
        );
        setOfficeControllers(refreshResponse.data);

        setToast({ message: "Controller deleted successfully!", type: "success" });
        setTimeout(() => setToast(null), 4000);

        setShowDeleteControllerModal(false);
        setControllerToDelete(null);
      } else {
        throw new Error(response.data.message || "Failed to delete controller");
      }
    } catch (err) {
      console.error("❌ Failed to delete controller:", err);
      setModalData({
        isOpen: true,
        title: "Delete Failed",
        message: err.response?.data?.message || "Failed to delete controller. Please try again.",
        type: "error",
      });
      setIsModalOpen(true);
    } finally {
      setDeleteControllerLoading(false);
    }
  };

  // Open delete confirmation for an owner
  const handleDeleteOwnerClick = (owner) => {
    const remaining = (ownerDetails?.data || [])
      .filter((o) => o.owner_uuid !== owner.owner_uuid)
      .map((o) => ({
        owner_uuid: o.owner_uuid,
        name: o.name || `${o.first_name || ""} ${o.last_name || ""}`.trim() || "Unnamed Owner",
        ownership_percentage: o.ownership_percentage || "0",
      }));

    setRemainingOwnersPercentages(remaining);
    setOwnerToDelete(owner);
    setShowDeleteOwnerModal(true);
  };

  // Update a remaining owner's percentage while editing before delete
  const handleRemainingOwnerPercentageChange = (ownerUuid, value) => {
    setRemainingOwnersPercentages((prev) =>
      prev.map((o) =>
        o.owner_uuid === ownerUuid ? { ...o, ownership_percentage: value } : o
      )
    );
  };

  // Sum of remaining owners' percentages, for validation
  const remainingOwnersTotalPercentage = useMemo(() => {
    return remainingOwnersPercentages.reduce(
      (sum, o) => sum + (parseFloat(o.ownership_percentage) || 0),
      0
    );
  }, [remainingOwnersPercentages]);

  // Confirm and perform deletion
  const handleConfirmDeleteOwner = async () => {
    if (!ownerToDelete) return;

    if (remainingOwnersPercentages.length > 0 && Math.round(remainingOwnersTotalPercentage * 100) / 100 !== 100) {
      setModalData({
        isOpen: true,
        title: "Invalid Ownership Total",
        message: `Remaining owners' percentages must total 100%. Current total: ${remainingOwnersTotalPercentage.toFixed(2)}%.`,
        type: "error",
      });
      setIsModalOpen(true);
      return;
    }

    setDeleteOwnerLoading(true);

    try {
      const customerUuid = localStorage.getItem("customerUuid");
      const authCustomerId = localStorage.getItem("authcustomer_id");

      if (!customerUuid) {
        throw new Error("Customer UUID not found. Please logout and login again.");
      }

      console.log("🗑️ Deleting owner:", ownerToDelete.owner_uuid);

      // Build the list of remaining owners (everyone except the one being deleted)
      // with their existing ownership percentages, as required by the delete endpoint
      const remainingOwners = (ownerDetails?.data || []).filter(
        (owner) => owner.owner_uuid !== ownerToDelete.owner_uuid
      );
      const payload = {
        owner_uuid: ownerToDelete.owner_uuid,
        updated_user_type: "customer",
        other_ownership_percentage_datas: remainingOwnersPercentages.map((owner) => ({
          other_owner_uuid: owner.owner_uuid,
          other_ownership_percentage: owner.ownership_percentage,
        })),
        updated_user_id: authCustomerId ? parseInt(authCustomerId) : null,
      };

      const response = await axios.post(
        `${API_URL}/customers/delete-owner/${customerUuid}`,
        payload,
        { headers: { Authorization: `Bearer ${authtoken}` } }
      );

      if (response.data.status === "success") {
        // Refresh the owner details list
        const refreshResponse = await axios.get(
          `${API_URL}/customers/owner-details/${customerUuid}`,
          { headers: { Authorization: `Bearer ${authtoken}` } }
        );
        setOwnerDetails(refreshResponse.data);

        setToast({ message: "Owner deleted successfully!", type: "success" });
        setTimeout(() => setToast(null), 4000);

        setShowDeleteOwnerModal(false);
        setOwnerToDelete(null);
        setRemainingOwnersPercentages([]);
      } else {
        throw new Error(response.data.message || "Failed to delete owner");
      }
    } catch (err) {
      console.error("❌ Failed to delete owner:", err);
      setModalData({
        isOpen: true,
        title: "Delete Failed",
        message: err.response?.data?.message || "Failed to delete owner. Please try again.",
        type: "error",
      });
      setIsModalOpen(true);
    } finally {
      setDeleteOwnerLoading(false);
    }
  };

  const handleSaveChanges = async () => {
    if (!authtoken || !customerId) {
      console.error("❌ Profile: Missing auth token or customer ID for save");
      return;
    }

    setSaveLoading(true);
    try {
      console.log("💾 Profile: Saving changes", editableData);

      let response;

      if (isIndividualAccount) {
        // Individual accounts use a dedicated endpoint with a different payload shape
        const customerUuid = localStorage.getItem("customerUuid");
        const authCustomerId = localStorage.getItem("authcustomer_id");

        if (!customerUuid) {
          throw new Error("Customer UUID not found. Please logout and login again.");
        }

        const individualRequestData = {
          first_name: editableData.first_name,
          middle_name: editableData.middle_name,
          last_name: editableData.last_name,
          resident_country_id: editableData.resident_country_id
            ? parseInt(editableData.resident_country_id, 10)
            : null,
          nationality_id: editableData.nationality_id
            ? parseInt(editableData.nationality_id, 10)
            : null,
          gender_id: editableData.gender_id
            ? parseInt(editableData.gender_id, 10)
            : null,
          dob: editableData.dob,
          occupation_id: editableData.occupation_id
            ? parseInt(editableData.occupation_id, 10)
            : null,
          purpose_of_account: editableData.purpose_of_account,
          monthly_expected_activity: editableData.monthly_expected_activity,
          customer_sending_countries: editableData.customer_sending_countries,
          customer_receiving_funds_countries: editableData.customer_receiving_funds_countries,
          contact_address_country_id: editableData.country_id
            ? parseInt(editableData.country_id, 10)
            : null,
          contact_address_zip_code: editableData.zip_code,
          contact_address_street_address_1: editableData.street_address_1,
          contact_address_street_address_2: editableData.street_address_2,
          contact_address_city: editableData.city,
          contact_address_state: editableData.state,
          id_document_type_id: editableData.id_document_type_id
            ? parseInt(editableData.id_document_type_id, 10)
            : null,
          id_document_number: editableData.id_document_number,
          id_issuing_country_id: editableData.id_issuing_country_id
            ? parseInt(editableData.id_issuing_country_id, 10)
            : null,
          id_expiry_date: editableData.id_expiry_date,
          updated_user_type: "customer",
          updated_user_id: authCustomerId ? parseInt(authCustomerId, 10) : null,
        };

        console.log("📤 Individual update payload:", individualRequestData);

        response = await axios.post(
          `${API_URL}/customers/update-individual-customer-details/${customerUuid}`,
          individualRequestData,
          { headers: { Authorization: `Bearer ${authtoken}` } },
        );
      } else {
        // Non-individual (institution) accounts keep the existing endpoint/payload
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

        response = await axios.post(
          `${API_URL}/customers/update-profile`,
          requestData,
          { headers: { Authorization: `Bearer ${authtoken}` } },
        );
      }

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
      } else {
        throw new Error(response.data.message || "Failed to update profile");
      }
    } catch (err) {
      console.error("❌ Profile: Failed to update", err);

      setModalData({
        isOpen: true,
        title: "Error",
        message: err.response?.data?.message || err.message || "Failed to update profile. Please try again.",
        type: "error",
      });
      setIsModalOpen(true);
    } finally {
      setSaveLoading(false);
    }
  };

  // Handle profile picture upload
  const handleProfilePictureUpload = async (file) => {
    // Validate file
    if (!file) {
      setModalData({
        isOpen: true,
        title: "Error",
        message: "Please select a file to upload.",
        type: "error",
      });
      setIsModalOpen(true);
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setModalData({
        isOpen: true,
        title: "Invalid File Type",
        message: "Please upload a valid image file (JPEG, PNG, JPG, GIF, WEBP).",
        type: "error",
      });
      setIsModalOpen(true);
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      console.log("❌ File too large:", file.size, "max:", maxSize);
      setToast({ message: "Please upload an image smaller than 5MB.", type: "error" });
      setTimeout(() => setToast(null), 4000);
      return;
    }

    setSaveLoading(true); // ← Show loading spinner

    try {
      const customerUuid = localStorage.getItem("customerUuid");

      if (!customerUuid) {
        throw new Error("Customer UUID not found. Please logout and login again.");
      }

      const formData = new FormData();
      formData.append('profile_image', file);

      console.log("📸 Uploading profile picture...");
      console.log("Customer UUID:", customerUuid);
      console.log("File:", file.name, file.type, file.size);

      const response = await axios.post(
        `${API_URL}/customers/update-profile-image/${customerUuid}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${authtoken}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      console.log("📸 Upload response:", response.data);

      if (response.data.status === "success") {
        console.log("✅ Profile picture uploaded successfully");

        // Get the image URL from the response
        const newPictureUrl = response.data.data?.profile_image ||
          response.data.profile_image;

        if (newPictureUrl && newPictureUrl !== "") {
          // Update state with the new image
          setProfilePicture(newPictureUrl);
          localStorage.setItem('profilePicture', newPictureUrl);
          console.log("🖼️ Profile picture updated and cached:", newPictureUrl);
        } else {
          console.warn("⚠️ Upload succeeded but no image URL returned");
        }

        // Show success message
        setToast({ message: "Profile picture uploaded successfully!", type: "success" });
        setTimeout(() => setToast(null), 4000);

        // Refresh profile data in background
        setTimeout(async () => {
          if (bearertoken) {
            await dispatch(fetchUserProfile({ customerId, bearertoken }));
          }
          // Fetch additional data to ensure image is up to date
          try {
            const imageResponse = await axios.get(`${API_URL}/kyc/${customerId}`, {
              headers: { Authorization: `Bearer ${bearertoken}` },
            });
            const refreshedUrl = imageResponse.data.data?.profile_image ||
              imageResponse.data.profile_image ||
              null;
            if (refreshedUrl && refreshedUrl !== "") {
              setProfilePicture(refreshedUrl);
              localStorage.setItem('profilePicture', refreshedUrl);
            }
          } catch (err) {
            console.error("Error refreshing profile picture:", err);
          }
          setSaveLoading(false); // ← Hide loading after everything is done
        }, 500);

      } else {
        throw new Error(response.data.message || "Failed to upload profile picture");
      }
    } catch (err) {
      console.error("❌ Failed to upload profile picture:", err);
      setModalData({
        isOpen: true,
        title: "Upload Failed",
        message: err.response?.data?.message || "Failed to upload profile picture. Please try again.",
        type: "error",
      });
      setIsModalOpen(true);
      setSaveLoading(false); // ← Hide loading on error
    } finally {
      // Don't set saveLoading false here - it's handled in the timeout or error
    }
  };
  // Handle file input change
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      handleProfilePictureUpload(file);
    }
    // Reset the input so the same file can be selected again
    event.target.value = '';
  };

  const isUnitedStatesSelected = () => {
    if (!editableData.country_id) return false;
    if (reduxCountries && reduxCountries.length > 0) {
      const selectedCountry = reduxCountries.find(
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
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-xl sm:text-2xl font-semibold text-[#005481] tracking-wide">
                Business Information
              </h3>
              <div className="flex items-center gap-3">
                {businessInfo && businessInfo.data && (
                  <span className="text-sm text-green-600 bg-green-100 px-3 py-1 rounded-full">
                    ✓ Complete
                  </span>
                )}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate(`/edit-business-information/${customerId}`)}
                  className={`text-white text-sm font-medium py-1.5 px-4 rounded-lg transition-colors ${headerColorProps.className}`}
                  style={headerColorProps.style}
                >
                  <FaEdit className="inline mr-1.5" />
                  Edit
                </motion.button>
              </div>
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
                          ? `${businessInfo.data.companyphone_countrycode || ""
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
                              className={`text-sm px-2 py-1 rounded-full ${item.status === "success"
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
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-xl sm:text-2xl font-semibold text-[#005481] tracking-wide">
                Responsible Person
              </h3>
              <div className="flex items-center gap-3">
                {responsiblePerson && responsiblePerson.data && (
                  <span className="text-sm text-green-600 bg-green-100 px-3 py-1 rounded-full">
                    ✓ Complete
                  </span>
                )}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate(`/edit-responsible-person/${customerId}`)}
                  className={`text-white text-sm font-medium py-1.5 px-4 rounded-lg transition-colors ${headerColorProps.className}`}
                  style={headerColorProps.style}
                >
                  <FaEdit className="inline mr-1.5" />
                  Edit
                </motion.button>
              </div>
            </div>

            {responsiblePerson && responsiblePerson.data ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {[
                  {
                    title: "Personal Information",
                    items: [
                      {
                        label: "Name",
                        value: `${responsiblePerson.data.first_name} ${responsiblePerson.data.middle_name || ""
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
                          ? `${responsiblePerson.data
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
                          <span className="text-sm font-medium text-gray-800 text-right flex-1 ml-2 min-w-0 break-words">
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
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-xl sm:text-2xl font-semibold text-[#005481] tracking-wide">
                Office Controllers
              </h3>
              <div className="flex items-center gap-3">
                {officeControllers && Array.isArray(officeControllers.data) && officeControllers.data.length > 0 && (
                  <span className="text-sm text-green-600 bg-green-100 px-3 py-1 rounded-full">
                    {officeControllers.data.length} Controllers
                  </span>
                )}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate(`/add-controller/${customerId}`)}
                  className={`text-white text-sm font-medium py-1.5 px-4 rounded-lg transition-colors ${headerColorProps.className}`}
                  style={headerColorProps.style}
                >
                  <FaPlus className="inline mr-1.5" />
                  Add Controller
                </motion.button>
              </div>
            </div>

            {officeControllers && Array.isArray(officeControllers.data) ? (
              officeControllers.data.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {officeControllers.data.map((controller, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow group flex flex-col"
                    >
                      <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-200">
                        <h4 className="text-lg font-semibold text-[#005481]">
                          Controller {index + 1}
                        </h4>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-blue-500 rounded-full group-hover:bg-blue-600 transition-colors"></div>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <span className="text-sm font-medium text-gray-600 min-w-[100px]">
                            Name:
                          </span>
                          <span className="text-sm font-medium text-gray-800 text-right flex-1 ml-2">
                            {controller.first_name && controller.last_name
                              ? `${controller.first_name} ${controller.last_name}`.trim()
                              : controller.name || "N/A"}
                          </span>
                        </div>
                        <div className="flex justify-between items-start">
                          <span className="text-sm font-medium text-gray-600 min-w-[100px]">
                            Email:
                          </span>
                          <span className="text-sm font-medium text-gray-800 text-right flex-1 ml-2 break-words">
                            {controller.email || "N/A"}
                          </span>
                        </div>
                        <div className="flex justify-between items-start">
                          <span className="text-sm font-medium text-gray-600 min-w-[100px]">
                            Position:
                          </span>
                          <span className="text-sm font-medium text-gray-800 text-right flex-1 ml-2">
                            {controller.designation || "N/A"}
                          </span>
                        </div>
                        <div className="flex justify-between items-start">
                          <span className="text-sm font-medium text-gray-600 min-w-[100px]">
                            Date of Birth:
                          </span>
                          <span className="text-sm font-medium text-gray-800 text-right flex-1 ml-2">
                            {controller.dob || "N/A"}
                          </span>
                        </div>
                        <div className="flex justify-between items-start">
                          <span className="text-sm font-medium text-gray-600 min-w-[100px]">
                            Gender:
                          </span>
                          <span className="text-sm font-medium text-gray-800 text-right flex-1 ml-2">
                            {controller.gendername || "N/A"}
                          </span>
                        </div>
                        <div className="flex justify-between items-start">
                          <span className="text-sm font-medium text-gray-600 min-w-[100px]">
                            Country:
                          </span>
                          <span className="text-sm font-medium text-gray-800 text-right flex-1 ml-2">
                            {controller.country_name || "N/A"}
                          </span>
                        </div>
                        <div className="flex justify-between items-start">
                          <span className="text-sm font-medium text-gray-600 min-w-[100px]">
                            City:
                          </span>
                          <span className="text-sm font-medium text-gray-800 text-right flex-1 ml-2">
                            {controller.city || "N/A"}
                          </span>
                        </div>
                        <div className="flex justify-between items-start">
                          <span className="text-sm font-medium text-gray-600 min-w-[100px]">
                            Address:
                          </span>
                          <span className="text-sm font-medium text-gray-800 text-right flex-1 ml-2">
                            {controller.street_address_1 || "N/A"}
                          </span>
                        </div>
                        <div className="flex justify-between items-start">
                          <span className="text-sm font-medium text-gray-600 min-w-[100px]">
                            Nationality:
                          </span>
                          <span className="text-sm font-medium text-gray-800 text-right flex-1 ml-2">
                            {controller.nationality_name || "N/A"}
                          </span>
                        </div>
                        <div className="flex justify-between items-start">
                          <span className="text-sm font-medium text-gray-600 min-w-[100px]">
                            Resident Country:
                          </span>
                          <span className="text-sm font-medium text-gray-800 text-right flex-1 ml-2">
                            {controller.residentcountry_name || "N/A"}
                          </span>
                        </div>
                      </div>

                      {/* Edit / Delete Buttons for each controller */}
                      <div className="mt-auto pt-3 border-t border-gray-200 flex gap-2">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => navigate(`/edit-controller/${customerId}/${controller.controller_uuid}`)}
                          className={`flex-1 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors ${headerColorProps.className}`}
                          style={headerColorProps.style}
                        >
                          <FaEdit className="inline mr-1.5" />
                          Edit
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleDeleteControllerClick(controller)}
                          className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors"
                        >
                          <FaTrashAlt className="inline mr-1.5" />
                          Delete
                        </motion.button>
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
                  <p className="text-gray-600 mb-2">No office controllers added</p>
                  <p className="text-sm text-gray-500">Add office controllers to your business profile</p>
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
                <p className="text-gray-600 mb-2">No office controllers information</p>
                <p className="text-sm text-gray-500">Please complete the office controllers details</p>
              </motion.div>
            )}
          </div>
        );

      case "Owner Details":
        return (
          <div className="w-full space-y-6 md:space-y-8">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-xl sm:text-2xl font-semibold text-[#005481] tracking-wide">
                Owner Details
              </h3>
              <div className="flex items-center gap-3">
                {ownerDetails && ownerDetails.data && ownerDetails.data.length > 0 && (
                  <span className="text-sm text-green-600 bg-green-100 px-3 py-1 rounded-full">
                    {ownerDetails.data.length} {ownerDetails.data.length === 1 ? 'Owner' : 'Owners'}
                  </span>
                )}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate(`/add-owner/${customerId}`)}
                  className={`text-white text-sm font-medium py-1.5 px-4 rounded-lg transition-colors ${headerColorProps.className}`}
                  style={headerColorProps.style}
                >
                  <FaPlus className="inline mr-1.5" />
                  Add Owner
                </motion.button>
              </div>
            </div>

            {ownerDetails && ownerDetails.data && ownerDetails.data.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {ownerDetails.data.map((owner, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex flex-col"
                  >
                    <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-200">
                      <h4 className="text-lg font-semibold text-[#005481]">
                        Owner {index + 1}
                      </h4>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-green-600 bg-green-100 px-3 py-1 rounded-full">
                          {owner.ownership_percentage}%
                        </span>
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <span className="text-sm font-medium text-gray-600 min-w-[120px]">
                          Full Name:
                        </span>
                        <span className="text-sm font-medium text-gray-800 text-right flex-1 ml-2">
                          {owner.name || `${owner.first_name} ${owner.last_name}`.trim() || "N/A"}
                        </span>
                      </div>

                      <div className="flex justify-between items-start gap-2">
                        <span className="text-sm font-medium text-gray-600 min-w-[120px] flex-shrink-0">
                          Email:
                        </span>
                        <span className="text-sm font-medium text-gray-800 text-right flex-1 min-w-0 break-words">
                          {owner.email || "N/A"}
                        </span>
                      </div>

                      <div className="flex justify-between items-start">
                        <span className="text-sm font-medium text-gray-600 min-w-[120px]">
                          Phone:
                        </span>
                        <span className="text-sm font-medium text-gray-800 text-right flex-1 ml-2">
                          {owner.mobile_number ? `${owner.mobile_number_country_code || ''} ${owner.mobile_number}` : "N/A"}
                        </span>
                      </div>

                      <div className="flex justify-between items-start">
                        <span className="text-sm font-medium text-gray-600 min-w-[120px]">
                          Date of Birth:
                        </span>
                        <span className="text-sm font-medium text-gray-800 text-right flex-1 ml-2">
                          {owner.dob || "N/A"}
                        </span>
                      </div>

                      <div className="flex justify-between items-start">
                        <span className="text-sm font-medium text-gray-600 min-w-[120px]">
                          Country:
                        </span>
                        <span className="text-sm font-medium text-gray-800 text-right flex-1 ml-2">
                          {owner.country_name || "N/A"}
                        </span>
                      </div>

                      <div className="flex justify-between items-start">
                        <span className="text-sm font-medium text-gray-600 min-w-[120px]">
                          Owner Type:
                        </span>
                        <span className="text-sm font-medium text-gray-800 text-right flex-1 ml-2 capitalize">
                          {owner.owner_type || "N/A"}
                        </span>
                      </div>

                      <div className="flex justify-between items-start">
                        <span className="text-sm font-medium text-gray-600 min-w-[120px]">
                          KYC Status:
                        </span>
                        <span className={`text-sm font-medium px-2 py-1 rounded-full ${owner.kyc_status === 1
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                          }`}>
                          {owner.kyc_status === 1 ? "Verified" : "Pending"}
                        </span>
                      </div>

                      {owner.needs_access_to_system === 1 && (
                        <div className="flex justify-between items-start">
                          <span className="text-sm font-medium text-gray-600 min-w-[120px]">
                            System Access:
                          </span>
                          <span className="text-sm font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                            Enabled
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Edit / Delete Buttons for each owner */}
                    <div className="mt-auto pt-3 border-t border-gray-200 flex gap-2">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => navigate(`/edit-owner/${customerId}/${owner.owner_uuid}`)}
                        className={`flex-1 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors ${headerColorProps.className}`}
                        style={headerColorProps.style}
                      >
                        <FaEdit className="inline mr-1.5" />
                        Edit
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleDeleteOwnerClick(owner)}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors"
                      >
                        <FaTrashAlt className="inline mr-1.5" />
                        Delete
                      </motion.button>
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
                  <FaUser className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-600 mb-2">No owner details available</p>
                <p className="text-sm text-gray-500">Please complete the owner details</p>
              </motion.div>
            )}
          </div>
        );

      case "Uploaded Documents":
        return (
          <div className="w-full space-y-4 sm:space-y-6 md:space-y-8">
            {/* Header with Add Document Button */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
              <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                <h3 className="text-base sm:text-xl md:text-2xl font-semibold text-[#005481] tracking-wide">
                  Uploaded Documents
                </h3>
                {uploadedDocuments &&
                  Array.isArray(uploadedDocuments.data) &&
                  uploadedDocuments.data.length > 0 && (
                    <span className="text-xs sm:text-sm text-green-600 bg-green-100 px-2 sm:px-3 py-1 rounded-full whitespace-nowrap">
                      {uploadedDocuments.data.length} Documents
                    </span>
                  )}
              </div>

              {/* Add Document Button - Mobile Responsive */}
              <div className="relative w-full sm:w-auto">
                <motion.button
                  onClick={() => {
                    if (!showDocumentDropdown) {
                      fetchDocumentTypes();
                    }
                    setShowDocumentDropdown(!showDocumentDropdown);
                    if (showDocumentDropdown) {
                      setSelectedDocumentType(null);
                      setSelectedFile(null);
                    }
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`${headerColorProps.className} text-white px-3 sm:px-4 py-2 rounded-lg flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all w-full sm:w-auto text-sm sm:text-base`}
                  style={headerColorProps.style}
                >
                  <FaFileAlt className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Add Document</span>
                  <svg
                    className={`w-3 h-3 sm:w-4 sm:h-4 transition-transform ${showDocumentDropdown ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </motion.button>

                {/* Dropdown Menu - Mobile Optimized */}
                {showDocumentDropdown && (
                  <>
                    {/* Backdrop for mobile */}
                    <div
                      className="fixed inset-0 bg-black bg-opacity-50 z-40 sm:hidden"
                      onClick={() => {
                        setShowDocumentDropdown(false);
                        setSelectedDocumentType(null);
                        setSelectedFile(null);
                      }}
                    ></div>

                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      className="fixed sm:absolute bottom-0 sm:bottom-auto left-0 sm:left-auto right-0 sm:right-0 w-full sm:w-96 bg-white rounded-t-2xl sm:rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden max-h-[90vh] sm:max-h-[500px]"
                    >
                      {/* Mobile Handle Bar */}
                      <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mt-2 mb-1 sm:hidden"></div>

                      {/* Close button for mobile */}
                      <button
                        onClick={() => {
                          setShowDocumentDropdown(false);
                          setSelectedDocumentType(null);
                          setSelectedFile(null);
                        }}
                        className="absolute top-3 right-3 p-1.5 hover:bg-gray-100 rounded-full transition-colors sm:hidden"
                      >
                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>

                      <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(90vh-60px)] sm:max-h-[450px]">
                        <h4 className="text-base sm:text-lg font-semibold text-gray-800 mb-4 pr-8 sm:pr-0">
                          Upload New Document
                        </h4>

                        {/* Document Type Selection */}
                        <div className="mb-4">
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                            Document Type *
                          </label>
                          <select
                            value={selectedDocumentType?.id || ''}
                            onChange={(e) => {
                              const selected = documentTypes.find(
                                type => type.id === parseInt(e.target.value)
                              );
                              setSelectedDocumentType(selected || null);
                            }}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                          >
                            <option value="">Select document type</option>
                            {documentTypes.map((type) => (
                              <option key={type.id} value={type.id}>
                                {type.name}
                              </option>
                            ))}
                          </select>
                          {documentTypes.length === 0 && (
                            <p className="text-xs text-gray-400 mt-1.5">
                              Loading document types...
                            </p>
                          )}
                          {documentTypes.length > 0 && (
                            <p className="text-xs text-gray-400 mt-1.5">
                              {documentTypes.length} document types available
                            </p>
                          )}
                        </div>

                        {/* File Upload */}
                        <div className="mb-4">
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                            File *
                          </label>
                          <div className="relative">
                            <input
                              type="file"
                              onChange={(e) => {
                                const file = e.target.files[0];
                                if (file) {
                                  if (file.size > 10 * 1024 * 1024) {
                                    setModalData({
                                      isOpen: true,
                                      title: "File Too Large",
                                      message: "Please upload a file smaller than 10MB.",
                                      type: "error",
                                    });
                                    setIsModalOpen(true);
                                    e.target.value = '';
                                    return;
                                  }
                                  setSelectedFile(file);
                                }
                              }}
                              className="w-full text-xs sm:text-sm text-gray-500 file:mr-2 sm:file:mr-4 file:py-1.5 sm:file:py-2 file:px-3 sm:file:px-4 file:rounded-lg file:border-0 file:text-xs sm:file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                            />
                          </div>
                          {selectedFile && (
                            <p className="text-xs text-green-600 mt-1.5 truncate">
                              Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                            </p>
                          )}
                        </div>

                        {/* Supported formats hint */}
                        <p className="text-xs text-gray-400 mb-4">
                          Supported: PDF, JPG, PNG, DOC, DOCX (Max 10MB)
                        </p>

                        {/* Action Buttons */}
                        <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 justify-end">
                          <button
                            onClick={() => {
                              setShowDocumentDropdown(false);
                              setSelectedDocumentType(null);
                              setSelectedFile(null);
                            }}
                            className="px-4 py-2.5 sm:py-2 text-sm text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors w-full sm:w-auto"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleDocumentUpload}
                            disabled={!selectedDocumentType || !selectedFile || documentUploadLoading}
                            className={`px-4 py-2.5 sm:py-2 text-sm text-white rounded-lg transition-colors flex items-center justify-center gap-2 w-full sm:w-auto ${!selectedDocumentType || !selectedFile || documentUploadLoading
                              ? 'opacity-50 cursor-not-allowed bg-gray-400'
                              : headerColorProps.className
                              }`}
                            style={!selectedDocumentType || !selectedFile || documentUploadLoading ? {} : headerColorProps.style}
                          >
                            {documentUploadLoading ? (
                              <>
                                <RingLoader size={16} color="#ffffff" />
                                <span>Uploading...</span>
                              </>
                            ) : (
                              <>
                                <FaCheckCircle className="w-4 h-4" />
                                <span>Upload</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  </>
                )}
              </div>
            </div>

            {/* Document List - Mobile Responsive Grid */}
            {uploadedDocuments && Array.isArray(uploadedDocuments.data) ? (
              uploadedDocuments.data.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {uploadedDocuments.data.map((doc, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow group"
                    >
                      <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200">
                        <h4 className="text-sm sm:text-base font-semibold text-[#005481] truncate flex-1 mr-2">
                          {doc.documenttype || doc.document_type || doc.name || `Document ${index + 1}`}
                        </h4>
                        <div className="w-2 h-2 sm:w-3 sm:h-3 bg-blue-500 rounded-full group-hover:bg-blue-600 transition-colors flex-shrink-0"></div>
                      </div>

                      <div className="space-y-2 sm:space-y-3">
                        <div className="flex justify-between items-start gap-2">
                          <span className="text-xs sm:text-sm font-medium text-gray-600 whitespace-nowrap">
                            Type:
                          </span>
                          <span className="text-xs sm:text-sm font-medium text-gray-800 text-right break-words flex-1">
                            {doc.documenttype || doc.document_type || doc.type || "N/A"}
                          </span>
                        </div>

                        <div className="flex justify-between items-start gap-2">
                          <span className="text-xs sm:text-sm font-medium text-gray-600 whitespace-nowrap">
                            Uploaded:
                          </span>
                          <span className="text-xs sm:text-sm font-medium text-gray-800 text-right break-words flex-1">
                            {doc.uploaded_date || doc.created_at || doc.upload_date || "N/A"}
                          </span>
                        </div>

                        {doc.status && (
                          <div className="flex justify-between items-start gap-2">
                            <span className="text-xs sm:text-sm font-medium text-gray-600 whitespace-nowrap">
                              Status:
                            </span>
                            <span className={`text-xs sm:text-sm font-medium px-2 py-0.5 rounded-full ${doc.status === 'approved' || doc.status === 'verified'
                              ? 'bg-green-100 text-green-800'
                              : doc.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                              }`}>
                              {doc.status}
                            </span>
                          </div>
                        )}

                        {doc.file_path && (
                          <div className="pt-2">
                            <a
                              href={doc.file_path}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center text-blue-600 hover:text-blue-800 text-xs sm:text-sm font-medium transition-colors"
                            >
                              <FaFileAlt className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
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
                  className="text-center py-8 sm:py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300"
                >
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <FaFileAlt className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                  </div>
                  <p className="text-sm sm:text-base text-gray-600 mb-1 sm:mb-2">
                    No documents uploaded yet
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500">
                    Click the "Add Document" button to upload files
                  </p>
                </motion.div>
              )
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8 sm:py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300"
              >
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <FaFileAlt className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                </div>
                <p className="text-sm sm:text-base text-gray-600 mb-1 sm:mb-2">No documents information</p>
                <p className="text-xs sm:text-sm text-gray-500">
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
      {/* Toast notification */}
      {toast && (
        <div className={`fixed top-6 right-6 z-[9999] px-5 py-4 rounded-xl shadow-xl text-white text-sm font-medium
          ${toast.type === "error" ? "bg-red-500" : "bg-green-500"}`}>
          {toast.message}
          <button onClick={() => setToast(null)} className="ml-4 opacity-70 hover:opacity-100">✕</button>
        </div>
      )}
      {isModalOpen && createPortal(
        <PopupModal
          isOpen={isModalOpen}
          title={modalData.title}
          message={modalData.message}
          type={modalData.type}
          onClose={() => setIsModalOpen(false)}
        />,
        document.body
      )}
      {/* Change Email/Mobile Modal */}
      {isChangeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">
                {changeModalType === "email" ? "Change Email Address" : "Change Mobile Number"}
              </h3>
              <button
                onClick={() => setIsChangeModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FaTimesCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {changeModalType === "email" ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Current Email
                    </label>
                    <input
                      type="email"
                      value={changeModalData.email}
                      disabled
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      New Email Address *
                    </label>
                    <input
                      type="email"
                      name="newEmail"
                      value={changeModalData.newEmail}
                      onChange={handleChangeModalInput}
                      placeholder="Enter new email address"
                      className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${changeModalData.newEmail && !isValidEmail(changeModalData.newEmail)
                        ? "border-red-500 bg-red-50"
                        : "border-gray-300"
                        }`}
                    />
                    {changeModalData.newEmail && !isValidEmail(changeModalData.newEmail) && (
                      <p className="text-red-500 text-xs mt-1">
                        Please enter a valid email address (e.g., name@example.com)
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Current Mobile Number
                    </label>
                    <input
                      type="text"
                      value={changeModalData.mobileNumber}
                      disabled
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-gray-500"
                    />
                  </div>

                  {/* Country Code Dropdown - Using React-Select with Redux countries data */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Country Code *
                    </label>
                    <Select
                      options={countryCodeOptions}
                      value={currentSelectedCountry}
                      onChange={handleCountryCodeSelect}
                      placeholder="Select country code"
                      isSearchable
                      classNamePrefix="react-select"
                      isLoading={countriesLoading}
                      styles={{
                        control: (provided, state) => ({
                          ...provided,
                          minHeight: "42px",
                          borderColor: !changeModalData.selectedCountryId && changeModalData.newMobileNumber ? "#ef4444" : "#d1d5db",
                          "&:hover": {
                            borderColor: !changeModalData.selectedCountryId && changeModalData.newMobileNumber ? "#ef4444" : "#9ca3af",
                          },
                        }),
                        option: (provided) => ({
                          ...provided,
                          padding: "10px",
                          display: "flex",
                          alignItems: "center",
                        }),
                      }}
                      formatOptionLabel={(option) => (
                        <div className="flex items-center">
                          {option.flagUrl && (
                            <img
                              src={option.flagUrl}
                              alt={option.label}
                              className="w-5 h-4 object-cover mr-2"
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          )}
                          <span>{option.label}</span>
                        </div>
                      )}
                    />
                    {!changeModalData.selectedCountryId && changeModalData.newMobileNumber && (
                      <p className="text-red-500 text-xs mt-1">
                        Please select a country code
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      New Mobile Number *
                    </label>
                    <input
                      type="tel"
                      name="newMobileNumber"
                      value={changeModalData.newMobileNumber}
                      onChange={handleChangeModalInput}
                      placeholder="Enter new mobile number"
                      className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${changeModalData.newMobileNumber && !isValidMobileNumber(changeModalData.newMobileNumber)
                        ? "border-red-500 bg-red-50"
                        : "border-gray-300"
                        }`}
                    />
                    {changeModalData.newMobileNumber && !isValidMobileNumber(changeModalData.newMobileNumber) && (
                      <p className="text-red-500 text-xs mt-1">
                        Enter 6-15 digits only (numbers only, no spaces or symbols)
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setIsChangeModalOpen(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={changeModalType === "email" ? requestEmailChangePasscode : requestMobileChangeOtp}
                disabled={
                  changeModalType === "email"
                    ? (!changeModalData.newEmail || !isValidEmail(changeModalData.newEmail))
                    : (!changeModalData.selectedCountryId || !changeModalData.newMobileNumber || !isValidMobileNumber(changeModalData.newMobileNumber))
                }
                className={`px-4 py-2 text-white rounded-lg transition-colors flex items-center gap-2 ${(changeModalType === "email"
                  ? (!changeModalData.newEmail || !isValidEmail(changeModalData.newEmail))
                  : (!changeModalData.selectedCountryId || !changeModalData.newMobileNumber || !isValidMobileNumber(changeModalData.newMobileNumber)))
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:opacity-90"
                  } ${headerColorProps.className}`}
                style={headerColorProps.style}
              >
                {(changeModalType === "email" ? emailPasscodeRequestLoading : otpRequestLoading) ? (
                  <>
                    <RingLoader size={16} color="#ffffff" />
                    <span>Sending...</span>
                  </>
                ) : (
                  "Send"
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* OTP Verification Modal for Mobile Change */}
      {showOtpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">
                Verify Mobile Number
              </h3>
              <button
                onClick={() => {
                  setShowOtpModal(false);
                  setOtpCode("");
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FaTimesCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="text-center">
                <p className="text-gray-600 mb-2">
                  Please enter the 6-digit OTP sent to
                </p>
                <p className="text-lg font-semibold text-gray-800">
                  {tempMobileData.countryCode} {tempMobileData.mobileNumber}
                </p>
              </div>

              {/* 6-digit OTP input boxes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 text-center">
                  Enter OTP *
                </label>
                <div className="flex justify-center gap-3 mb-6">
                  {[...Array(6)].map((_, index) => (
                    <input
                      key={index}
                      id={`otp-input-${index}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={otpCode[index] || ""}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "");
                        if (value.length <= 1) {
                          const newOtp = otpCode.split("");
                          newOtp[index] = value;
                          const newOtpString = newOtp.join("");
                          setOtpCode(newOtpString);

                          // Auto-focus next input
                          if (value && index < 5) {
                            const nextInput = document.getElementById(`otp-input-${index + 1}`);
                            if (nextInput) nextInput.focus();
                          }
                        }
                      }}
                      onKeyDown={(e) => {
                        // Handle backspace to go to previous input
                        if (e.key === "Backspace" && !otpCode[index] && index > 0) {
                          const prevInput = document.getElementById(`otp-input-${index - 1}`);
                          if (prevInput) {
                            prevInput.focus();
                            // Clear the previous digit
                            const newOtp = otpCode.split("");
                            newOtp[index - 1] = "";
                            setOtpCode(newOtp.join(""));
                          }
                        }
                      }}
                      onPaste={(e) => {
                        e.preventDefault();
                        const pastedData = e.clipboardData.getData("text/plain").replace(/\D/g, "").slice(0, 6);
                        if (pastedData.length === 6) {
                          setOtpCode(pastedData);
                          // Focus the last input after paste
                          setTimeout(() => {
                            const lastInput = document.getElementById(`otp-input-5`);
                            if (lastInput) lastInput.focus();
                          }, 10);
                        }
                      }}
                      className="w-12 h-12 text-center text-xl font-semibold border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-150"
                      autoFocus={index === 0}
                      disabled={otpLoading}
                    />
                  ))}
                </div>
              </div>

              <div className="text-center">
                <button
                  onClick={handleResendOtp}
                  disabled={!canResendOtp || otpLoading}
                  className={`text-sm ${canResendOtp ? 'text-blue-600 hover:text-blue-800' : 'text-gray-400 cursor-not-allowed'}`}
                >
                  {!canResendOtp ? `Resend OTP in ${otpResendTimer}s` : "Resend OTP"}
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowOtpModal(false);
                  setOtpCode("");
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleVerifyOtp}
                disabled={otpLoading || otpCode.length !== 6}
                className={`px-4 py-2 text-white rounded-lg transition-colors flex items-center gap-2 ${headerColorProps.className}`}
                style={headerColorProps.style}
              >
                {otpLoading ? (
                  <>
                    <RingLoader size={16} color="#ffffff" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  "Verify & Update"
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Email Passcode Verification Modal */}
      {showEmailPasscodeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">
                Verify Email Address
              </h3>
              <button
                onClick={() => {
                  setShowEmailPasscodeModal(false);
                  setEmailPasscode("");
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FaTimesCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="text-center">
                <p className="text-gray-600 mb-2">
                  Please enter the 6-digit passcode sent to
                </p>
                <p className="text-lg font-semibold text-gray-800 break-words">
                  {tempEmailData.email}
                </p>
              </div>

              {/* 6-digit passcode input boxes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 text-center">
                  Enter Passcode *
                </label>
                <div className="flex justify-center gap-3 mb-6">
                  {[...Array(6)].map((_, index) => (
                    <input
                      key={index}
                      id={`email-passcode-input-${index}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={emailPasscode[index] || ""}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "");
                        if (value.length <= 1) {
                          const newPasscode = emailPasscode.split("");
                          newPasscode[index] = value;
                          const newPasscodeString = newPasscode.join("");
                          setEmailPasscode(newPasscodeString);

                          if (value && index < 5) {
                            const nextInput = document.getElementById(`email-passcode-input-${index + 1}`);
                            if (nextInput) nextInput.focus();
                          }
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Backspace" && !emailPasscode[index] && index > 0) {
                          const prevInput = document.getElementById(`email-passcode-input-${index - 1}`);
                          if (prevInput) {
                            prevInput.focus();
                            const newPasscode = emailPasscode.split("");
                            newPasscode[index - 1] = "";
                            setEmailPasscode(newPasscode.join(""));
                          }
                        }
                      }}
                      onPaste={(e) => {
                        e.preventDefault();
                        const pastedData = e.clipboardData.getData("text/plain").replace(/\D/g, "").slice(0, 6);
                        if (pastedData.length === 6) {
                          setEmailPasscode(pastedData);
                          setTimeout(() => {
                            const lastInput = document.getElementById(`email-passcode-input-5`);
                            if (lastInput) lastInput.focus();
                          }, 10);
                        }
                      }}
                      className="w-12 h-12 text-center text-xl font-semibold border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-150"
                      autoFocus={index === 0}
                      disabled={emailPasscodeLoading}
                    />
                  ))}
                </div>
              </div>

              <div className="text-center">
                <button
                  onClick={handleResendEmailPasscode}
                  disabled={!canResendEmailPasscode || emailPasscodeLoading}
                  className={`text-sm ${canResendEmailPasscode ? 'text-blue-600 hover:text-blue-800' : 'text-gray-400 cursor-not-allowed'}`}
                >
                  {!canResendEmailPasscode ? `Resend Passcode in ${emailPasscodeResendTimer}s` : "Resend Passcode"}
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowEmailPasscodeModal(false);
                  setEmailPasscode("");
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleVerifyEmailPasscode}
                disabled={emailPasscodeLoading || emailPasscode.length !== 6}
                className={`px-4 py-2 text-white rounded-lg transition-colors flex items-center gap-2 ${headerColorProps.className}`}
                style={headerColorProps.style}
              >
                {emailPasscodeLoading ? (
                  <>
                    <RingLoader size={16} color="#ffffff" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  "Verify & Update"
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Enhanced ViewChargesPopup */}
      <ViewChargesPopup
        isOpen={isChargesPopupOpen}
        onClose={() => setIsChargesPopupOpen(false)}
        customerId={customerId}
        authtoken={authtoken}
      />

      {/* Delete Controller Confirmation Modal */}
      {showDeleteControllerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <FaTimesCircle className="w-7 h-7 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">
                Delete Controller?
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Are you sure you want to delete{" "}
                <span className="font-medium text-gray-800">
                  {controllerToDelete?.first_name && controllerToDelete?.last_name
                    ? `${controllerToDelete.first_name} ${controllerToDelete.last_name}`
                    : "this controller"}
                </span>
                ? This action cannot be undone.
              </p>

              <div className="flex gap-3 w-full">
                <button
                  onClick={() => {
                    setShowDeleteControllerModal(false);
                    setControllerToDelete(null);
                  }}
                  disabled={deleteControllerLoading}
                  className="flex-1 px-4 py-2.5 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDeleteController}
                  disabled={deleteControllerLoading}
                  className="flex-1 px-4 py-2.5 text-sm text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {deleteControllerLoading ? (
                    <>
                      <RingLoader size={16} color="#ffffff" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    "Delete"
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Delete Owner Confirmation Modal */}
      {showDeleteOwnerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <FaTimesCircle className="w-7 h-7 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">
                Delete Owner?
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Are you sure you want to delete{" "}
                <span className="font-medium text-gray-800">
                  {ownerToDelete?.name ||
                    (ownerToDelete?.first_name && ownerToDelete?.last_name
                      ? `${ownerToDelete.first_name} ${ownerToDelete.last_name}`
                      : "this owner")}
                </span>
                ? This action cannot be undone.
              </p>

              {remainingOwnersPercentages.length > 0 && (
                <div className="w-full text-left mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Adjust remaining owners' percentages so they total 100%:
                  </p>
                  <div className="space-y-2">
                    {remainingOwnersPercentages.map((owner) => (
                      <div key={owner.owner_uuid} className="flex items-center justify-between gap-3">
                        <span className="text-sm text-gray-700 truncate flex-1">{owner.name}</span>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            value={owner.ownership_percentage}
                            onChange={(e) =>
                              handleRemainingOwnerPercentageChange(owner.owner_uuid, e.target.value)
                            }
                            className="w-20 border border-gray-300 rounded-md px-2 py-1 text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-500">%</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-200">
                    <span className="text-xs text-gray-500">Total</span>
                    <span
                      className={`text-sm font-medium ${Math.round(remainingOwnersTotalPercentage * 100) / 100 === 100
                        ? "text-green-600"
                        : "text-red-500"
                        }`}
                    >
                      {remainingOwnersTotalPercentage.toFixed(2)}%
                    </span>
                  </div>
                </div>
              )}

              <div className="flex gap-3 w-full">
                <button
                  onClick={() => {
                    setShowDeleteOwnerModal(false);
                    setOwnerToDelete(null);
                    setRemainingOwnersPercentages([]);
                  }}
                  disabled={deleteOwnerLoading}
                  className="flex-1 px-4 py-2.5 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDeleteOwner}
                  disabled={
                    deleteOwnerLoading ||
                    (remainingOwnersPercentages.length > 0 &&
                      Math.round(remainingOwnersTotalPercentage * 100) / 100 !== 100)
                  }
                  className="flex-1 px-4 py-2.5 text-sm text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deleteOwnerLoading ? (
                    <>
                      <RingLoader size={16} color="#ffffff" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    "Delete"
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

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
              <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
                  {/* Left side - Profile Picture and Text */}
                  <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
                    {/* Profile Picture with Upload functionality */}
                    <div className="relative flex-shrink-0">
                      {/* Profile Picture Container */}
                      <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center shadow-md overflow-hidden">
                        {profilePicture ? (
                          <img
                            src={profilePicture}
                            alt="Profile"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <FaUser className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-gray-400" />
                        )}
                      </div>

                      {/* Upload Button Overlay - Camera Icon */}
                      <label
                        htmlFor="profile-picture-upload"
                        className={`absolute -bottom-1 -right-1 p-1 sm:p-1.5 md:p-1.5 rounded-full shadow-md cursor-pointer transition-all hover:scale-110 ${headerColorProps.className}`}
                        style={headerColorProps.style}
                        title="Upload profile picture"
                      >
                        <FaCamera className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-3.5 md:h-3.5 text-white" />
                        <input
                          id="profile-picture-upload"
                          type="file"
                          accept="image/jpeg,image/png,image/jpg,image/gif,image/webp"
                          onChange={handleFileChange}
                          className="hidden"
                          disabled={saveLoading}
                        />
                      </label>

                      {/* Loading Overlay - shows during upload when image exists */}
                      {saveLoading && profilePicture && (
                        <div className="absolute inset-0 bg-black bg-opacity-40 rounded-full flex items-center justify-center">
                          <FaSpinner className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white animate-spin" />
                        </div>
                      )}
                    </div>

                    {/* Text Content */}
                    <div className="flex-1 min-w-0">
                      <h1 className="text-base sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-800 truncate">
                        My Profile
                      </h1>
                      <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">
                        Manage your account information
                      </p>
                      <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5 sm:mt-1 hidden sm:block">
                        Click camera icon to upload photo
                      </p>
                    </div>
                  </div>

                  {/* Right side - Edit Button */}
                  <div className="w-full sm:w-auto flex-shrink-0">
                    <motion.button
                      onClick={handleEditToggle}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`w-full sm:w-auto text-white font-medium py-2 px-4 sm:py-2.5 sm:px-5 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-sm sm:text-base ${headerColorProps.className}`}
                      style={headerColorProps.style}
                    >
                      {isEditing ? "Cancel Editing" : "Edit Profile"}
                    </motion.button>
                  </div>
                </div>
              </div>

              {/* Personal Details Card */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-100">
                  Personal Details
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Name */}
                  <div className={`md:col-span-2 grid gap-4 ${isIndividualAccount ? "grid-cols-3" : "grid-cols-2"}`}>
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
                        {isIndividualAccount && (
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">
                              Middle Name
                            </label>
                            <input
                              name="middle_name"
                              value={editableData.middle_name}
                              onChange={handleInputChange}
                              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="Middle Name"
                            />
                          </div>
                        )}
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
                        {isIndividualAccount && (
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">
                              Middle Name
                            </label>
                            <span className="text-sm font-medium text-gray-800 block py-2">
                              {displayProfileData.middle_name || "N/A"}
                            </span>
                          </div>
                        )}
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
                        onClick={handleChangeMobileClick}
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
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-gray-800 truncate py-2 flex-1">
                        {displayProfileData.email || "Not Available"}
                      </span>
                      <motion.button
                        onClick={handleChangeEmailClick}
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
                      <Select
                        options={genderOptions}
                        value={genderOptions.find((opt) => opt.value === editableData.gender_id) || null}
                        onChange={handleGenderSelectChange}
                        placeholder="Select gender"
                        isSearchable
                        classNamePrefix="react-select"
                      />
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
                      <Select
                        options={nationalityOptions}
                        value={nationalityOptions.find((opt) => opt.value === editableData.nationality_id) || null}
                        onChange={handleNationalitySelectChange}
                        placeholder="Select nationality"
                        isSearchable
                        classNamePrefix="react-select"
                        formatOptionLabel={(option) => (
                          <div className="flex items-center">
                            {option.flagUrl && (
                              <img
                                src={option.flagUrl}
                                alt={option.label}
                                className="w-5 h-4 object-cover mr-2"
                                onError={(e) => { e.target.style.display = 'none'; }}
                              />
                            )}
                            <span>{option.label}</span>
                          </div>
                        )}
                      />
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
                      <Select
                        options={profileCountryOptions}
                        value={profileCountryOptions.find((opt) => opt.value === editableData.country_id) || null}
                        onChange={handleProfileCountryChange}
                        placeholder="Select country"
                        isSearchable
                        isLoading={countriesLoading}
                        classNamePrefix="react-select"
                        cursor="pointer"
                      />
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

                  {isIndividualAccount && (
                    <>
                      {/* <div>
                        <label className="block text-xs text-gray-500 mb-1">Middle Name</label>
                        {isEditing ? (
                          <input
                            name="middle_name"
                            value={editableData.middle_name}
                            onChange={handleInputChange}
                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Middle Name"
                          />
                        ) : (
                          <span className="text-sm font-medium text-gray-800 block py-2">
                            {displayProfileData.middle_name || "N/A"}
                          </span>
                        )}
                      </div> */}

                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Resident Country</label>
                        {isEditing ? (
                          <Select
                            options={reduxCountries?.map((c) => ({ value: c.id, label: c.name })) || []}
                            value={
                              reduxCountries
                                ?.map((c) => ({ value: c.id, label: c.name }))
                                .find((opt) => opt.value === editableData.resident_country_id) || null
                            }
                            onChange={handleResidentCountryChange}
                            placeholder="Select resident country"
                            isSearchable
                            classNamePrefix="react-select"
                          />
                        ) : (
                          <span className="text-sm font-medium text-gray-800 block py-2">
                            {reduxCountries?.find((c) => c.id === displayProfileData.resident_country_id)?.name || "N/A"}
                          </span>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Street Address</label>
                        {isEditing ? (
                          <input
                            name="street_address_1"
                            value={editableData.street_address_1}
                            onChange={handleInputChange}
                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Street Address"
                          />
                        ) : (
                          <span className="text-sm font-medium text-gray-800 block py-2">
                            {displayProfileData.street_address_1 || "N/A"}
                          </span>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Street Address 2 (Optional)</label>
                        {isEditing ? (
                          <input
                            name="street_address_2"
                            value={editableData.street_address_2}
                            onChange={handleInputChange}
                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Apt, suite, unit, etc."
                          />
                        ) : (
                          <span className="text-sm font-medium text-gray-800 block py-2">
                            {displayProfileData.street_address_2 || "N/A"}
                          </span>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Occupation</label>
                        {isEditing ? (
                          occupationsLoading ? (
                            <div className="flex items-center py-2 text-sm text-gray-500">
                              <RingLoader size={16} color="#3b82f6" />
                              <span className="ml-2">Loading occupations...</span>
                            </div>
                          ) : (
                            <Select
                              options={occupations.map((occ) => ({ value: occ.id, label: occ.name }))}
                              value={selectedOccupation}
                              onChange={handleOccupationChange}
                              placeholder="Select occupation"
                              isClearable
                              classNamePrefix="react-select"
                            />
                          )
                        ) : (
                          <span className="text-sm font-medium text-gray-800 block py-2">
                            {displayProfileData.occupation_name || "N/A"}
                          </span>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Purpose of Account</label>
                        {isEditing ? (
                          <input
                            name="purpose_of_account"
                            value={editableData.purpose_of_account}
                            onChange={handleInputChange}
                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="e.g., Personal savings"
                          />
                        ) : (
                          <span className="text-sm font-medium text-gray-800 block py-2">
                            {displayProfileData.purpose_of_account || "N/A"}
                          </span>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Monthly Expected Activity</label>
                        {isEditing ? (
                          <input
                            name="monthly_expected_activity"
                            value={editableData.monthly_expected_activity}
                            onChange={handleInputChange}
                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="e.g., $1,000 - $5,000"
                          />
                        ) : (
                          <span className="text-sm font-medium text-gray-800 block py-2">
                            {displayProfileData.monthly_expected_activity || "N/A"}
                          </span>
                        )}
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-xs text-gray-500 mb-1">Customer Sending Countries</label>
                        {isEditing ? (
                          <Select
                            options={reduxCountries?.map((c) => ({ value: c.id, label: c.name })) || []}
                            value={selectedSendingCountries}
                            onChange={handleSendingCountriesChange}
                            isMulti
                            placeholder="Select sending countries"
                            classNamePrefix="react-select"
                          />
                        ) : (
                          <span className="text-sm font-medium text-gray-800 block py-2">
                            {(displayProfileData.funds_sending_countries || [])
                              .map((c) => c.countryname)
                              .filter(Boolean)
                              .join(", ") || "N/A"}
                          </span>
                        )}
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-xs text-gray-500 mb-1">Customer Receiving Funds Countries</label>
                        {isEditing ? (
                          <Select
                            options={reduxCountries?.map((c) => ({ value: c.id, label: c.name })) || []}
                            value={selectedReceivingCountries}
                            onChange={handleReceivingCountriesChange}
                            isMulti
                            placeholder="Select receiving countries"
                            classNamePrefix="react-select"
                          />
                        ) : (
                          <span className="text-sm font-medium text-gray-800 block py-2">
                            {(displayProfileData.funds_receiving_countries || [])
                              .map((c) => c.countryname)
                              .filter(Boolean)
                              .join(", ") || "N/A"}
                          </span>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs text-gray-500 mb-1">ID Document Type</label>
                        {isEditing ? (
                          idDocumentTypesLoading ? (
                            <div className="flex items-center py-2 text-sm text-gray-500">
                              <RingLoader size={16} color="#3b82f6" />
                              <span className="ml-2">Loading...</span>
                            </div>
                          ) : (
                            <select
                              name="id_document_type_id"
                              value={editableData.id_document_type_id}
                              onChange={handleIdDocumentTypeChange}
                              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="">Select document type</option>
                              {idDocumentTypes.map((type) => (
                                <option key={type.id} value={type.id}>{type.name}</option>
                              ))}
                            </select>
                          )
                        ) : (
                          <span className="text-sm font-medium text-gray-800 block py-2">
                            {displayProfileData.id_document_type_name || "N/A"}
                          </span>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs text-gray-500 mb-1">ID Document Number</label>
                        {isEditing ? (
                          <input
                            name="id_document_number"
                            value={editableData.id_document_number}
                            onChange={handleInputChange}
                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Document number"
                          />
                        ) : (
                          <span className="text-sm font-medium text-gray-800 block py-2">
                            {displayProfileData.id_document_number || "N/A"}
                          </span>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs text-gray-500 mb-1">ID Issuing Country</label>
                        {isEditing ? (
                          <Select
                            options={reduxCountries?.map((c) => ({ value: c.id, label: c.name })) || []}
                            value={
                              reduxCountries
                                ?.map((c) => ({ value: c.id, label: c.name }))
                                .find((opt) => String(opt.value) === String(editableData.id_issuing_country_id)) || null
                            }
                            onChange={handleIdIssuingCountryChange}
                            placeholder="Select issuing country"
                            isSearchable
                            classNamePrefix="react-select"
                          />
                        ) : (
                          <span className="text-sm font-medium text-gray-800 block py-2">
                            {displayProfileData.id_document_type_country_name || "N/A"}
                          </span>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs text-gray-500 mb-1">ID Expiry Date</label>
                        {isEditing ? (
                          <input
                            type="date"
                            name="id_expiry_date"
                            value={editableData.id_expiry_date}
                            onChange={handleInputChange}
                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        ) : (
                          <span className="text-sm font-medium text-gray-800 block py-2">
                            {displayProfileData.id_document_expiry_date || "N/A"}
                          </span>
                        )}
                      </div>
                    </>
                  )}

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
                <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
                  <div className="relative border-b border-gray-200">
                    {/* Left arrow — desktop and mobile, only when scrolled right */}
                    {canScrollLeft && (
                      <button
                        onClick={() => scrollTabs(-1)}
                        className="absolute left-0 top-0 bottom-1 z-10 flex items-center bg-gradient-to-r from-white via-white to-transparent pr-4 pl-0.5"
                        aria-label="Scroll tabs left"
                      >
                        <FaChevronLeft className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500" />
                      </button>
                    )}

                    <div
                      ref={tabScrollRef}
                      className="tab-scroll flex gap-4 sm:gap-6 overflow-x-auto -mb-px"
                      style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                    >
                      <style>{`.tab-scroll::-webkit-scrollbar{display:none}`}</style>
                      {availableTabs.map((tab) => (
                        <motion.button
                          key={tab}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className={`flex-shrink-0 whitespace-nowrap px-1 py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors ${activeTab === tab
                            ? "border-blue-500 text-blue-600"
                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                            }`}
                          onClick={() => setActiveTab(tab)}
                        >
                          {tab}
                        </motion.button>
                      ))}
                    </div>

                    {/* Right arrow — desktop and mobile, only when there's more to scroll to */}
                    {canScrollRight && (
                      <button
                        onClick={() => scrollTabs(1)}
                        className="absolute right-0 top-0 bottom-1 z-10 flex items-center bg-gradient-to-l from-white via-white to-transparent pl-4 pr-0.5"
                        aria-label="Scroll tabs right"
                      >
                        <FaChevronRight className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500" />
                      </button>
                    )}
                  </div>

                  {/* Mobile-only swipe hint — shows only while there's more content to the right */}
                  {canScrollRight && (
                    <p className="mt-1.5 text-[11px] text-gray-400 flex items-center gap-1 sm:hidden">
                      Swipe to see more <FaChevronRight className="w-2 h-2" />
                    </p>
                  )}

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
                        className={`text-xs font-medium px-2 py-1 rounded-full ${displayProfileData.kyc_status === "Pending"
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
                        <div className="p-4 bg-white border rounded-xl">
                          <h4 className="text-blue-600 font-medium text-base">
                            {item.account_status_name}
                          </h4>

                          <p className="mt-1 text-sm text-gray-500">
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