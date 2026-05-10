// AccountType.jsx
import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRight,
  faTimes,
  faCheckCircle,
  faChevronDown,
  faChevronUp,
} from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";
import ProgressBar from "../../../components/ProgressBar/ProgressBar";
import useCurrentStep from "../../../components/ProgressBar/useCurrentStep";

// Placeholder images - replace with your actual images
const userIcon =
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1000&q=80";
const institutionIcon =
  "https://images.unsplash.com/photo-1568992687947-868a62a9f521?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1000&q=80";
const partnerIcon =
  "https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1000&q=80";

const AccountType = () => {
  const navigate = useNavigate();
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [expandedAccount, setExpandedAccount] = useState(null);
  const [tappedAccount, setTappedAccount] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const hostName = window.location.hostname;
  const currentStep = useCurrentStep(); // Get current step from hook

  const handleSelectAccount = async (type) => {
    setSelectedAccount(type);
    
    try {
      // Call the API for partner account selection
      const response = await fetch('http://10.1.5.120:8000/api/partner-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          client_id: "HK6V7709",
          client_secret: "057d433a-2d02-437b-a265-56114567aa44",
          hostname: hostName,
          account_type: type,
        }),
      });

      const data = await response.json();
      
      // Get partner_id from response
      let partnerId = null;
      if (data.partner_id) {
        partnerId = data.partner_id;
      } else if (data.data && data.data.partner_id) {
        partnerId = data.data.partner_id;
      }
      
      // ✅ Store partner_id as whitelabelledpartnerid in localStorage
      if (partnerId) {
        localStorage.setItem('whitelabelledpartnerid', partnerId);
        localStorage.setItem('iswhitelabelledpartner', 'Y');
        console.log('✅ Saved whitelabelledpartnerid:', localStorage.getItem('whitelabelledpartnerid'));
      }
      
      // Navigate immediately after API call
      setTimeout(() => {
        if (type === "partner") {
          navigate("/selectcountry");
        } else {
          navigate("/selectcountry", { state: { accountType: type } });
        }
      }, 300);
      
    } catch (error) {
      console.error('API call failed:', error);
      // Still navigate even if API fails
      setTimeout(() => {
        if (type === "partner") {
          navigate("/selectcountry");
        } else {
          navigate("/selectcountry", { state: { accountType: type } });
        }
      }, 300);
    }
  };

  const handleCancel = () => {
    navigate("/");
  };

  const handleAccountTap = (accountId) => {
    // For mobile devices, toggle features visibility on tap
    if (expandedAccount === accountId) {
      setExpandedAccount(null);
    } else {
      setExpandedAccount(accountId);
    }
    setTappedAccount(accountId);
    setTimeout(() => setTappedAccount(null), 300); // Reset after animation
  };

  const accountTypes = [
    {
      id: "individual",
      title: "Individual Account",
      description:
        "Sign up for a personalized account to access tailored services and features designed for personal use.",
      icon: userIcon,
      color: "blue",
      features: [
        "Personal dashboard",
        "Easy money transfers",
        "Bill payments",
        "Savings tools",
        "24/7 customer support",
      ],
    },
    {
      id: "institution",
      title: "Institution Account",
      description:
        "Create an account for your organization to manage services efficiently with team collaboration features.",
      icon: institutionIcon,
      color: "purple",
      features: [
        "Multi-user access",
        "Bulk transactions",
        "Reporting tools",
        "Admin controls",
        "Dedicated account manager",
      ],
    },
  ];

  const closeModal = () => {
    setIsModalOpen(false);
    setModalMessage("");
  };

  const getButtonColor = (color) => {
    const colors = {
      blue: "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700",
      purple:
        "bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700",
      green:
        "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700",
    };
    return colors[color] || colors.blue;
  };

  const getBorderColor = (color) => {
    const colors = {
      blue: "border-blue-500",
      purple: "border-purple-500",
      green: "border-green-500",
    };
    return colors[color] || colors.blue;
  };

  const getGradientColor = (color) => {
    const colors = {
      blue: "from-blue-600/95",
      purple: "from-purple-600/95",
      green: "from-green-600/95",
    };
    return colors[color] || colors.blue;
  };

  // Check if device is touch capable
  const isTouchDevice = () => {
    return (
      "ontouchstart" in window ||
      navigator.maxTouchPoints > 0 ||
      navigator.msMaxTouchPoints > 0
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 flex justify-center items-center py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-blue-100/20 to-transparent"></div>
      <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-blue-200/30"></div>
      <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-purple-200/30"></div>

      {/* Close Button */}
      <button
        onClick={handleCancel}
        className="absolute top-6 right-6 z-10 p-3 rounded-xl bg-white/80 backdrop-blur-sm shadow-md hover:shadow-lg transition-all duration-300 hover:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 group"
        aria-label="Close"
      >
        <FontAwesomeIcon
          icon={faTimes}
          className="text-lg text-gray-600 group-hover:text-gray-800 transition-colors"
        />
      </button>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
            <div className="flex items-center justify-center text-blue-500 mb-4">
              <div className="bg-blue-100 p-3 rounded-full">
                <FontAwesomeIcon icon={faCheckCircle} size="lg" />
              </div>
            </div>
            <h3 className="text-lg font-medium text-gray-900 text-center mb-4">
              {modalMessage}
            </h3>
            <button
              onClick={closeModal}
              className="w-full py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="w-full max-w-6xl text-center relative z-10">
        {/* Progress Bar */}
        <ProgressBar currentStep={currentStep} />

        <div className="mb-8 sm:mb-12">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
            Choose Your Account Type
          </h1>
          <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto">
            {isTouchDevice()
              ? "Tap on each card to see features and select your account type"
              : "Hover over each card to see features or click to select your account type"}
          </p>
        </div>

        <div
          className={`grid grid-cols-1 ${
            accountTypes.length > 2 ? "md:grid-cols-3" : "md:grid-cols-2"
          } gap-4 sm:gap-6 md:gap-8`}
        >
          {accountTypes.map((account) => (
            <div
              key={account.id}
              className={`relative bg-white rounded-xl sm:rounded-2xl shadow-lg overflow-hidden cursor-pointer transform transition-all duration-300 min-h-[380px] sm:min-h-[420px]
                ${
                  selectedAccount === account.id
                    ? "ring-2 ring-offset-2 scale-105"
                    : ""
                } 
                ${getBorderColor(account.color)} 
                ${tappedAccount === account.id ? "scale-[1.02]" : ""}
                hover:shadow-xl`}
              onMouseEnter={() =>
                !isTouchDevice() && setExpandedAccount(account.id)
              }
              onMouseLeave={() => !isTouchDevice() && setExpandedAccount(null)}
              onClick={() =>
                isTouchDevice()
                  ? handleAccountTap(account.id)
                  : handleSelectAccount(account.id)
              }
            >
              {/* Image Section */}
              <div className="relative h-40 sm:h-48 overflow-hidden transition-all duration-500">
                <div
                  className="h-full w-full bg-cover bg-center"
                  style={{ backgroundImage: `url(${account.icon})` }}
                ></div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                <div className="absolute bottom-4 left-4 right-4">
                  <h2 className="text-lg sm:text-xl font-bold text-white">
                    {account.title}
                  </h2>
                  <p className="text-white/90 text-xs sm:text-sm mt-1 line-clamp-2">
                    {account.description}
                  </p>
                </div>
                {selectedAccount === account.id && (
                  <div className="absolute top-3 right-3 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-blue-500 flex items-center justify-center">
                    <FontAwesomeIcon
                      icon={faCheckCircle}
                      className="text-white text-xs sm:text-sm"
                    />
                  </div>
                )}

                {/* Mobile expand indicator */}
                {isTouchDevice() && (
                  <div className="absolute top-3 left-3 w-6 h-6 rounded-full bg-black/40 flex items-center justify-center">
                    <FontAwesomeIcon
                      icon={
                        expandedAccount === account.id
                          ? faChevronUp
                          : faChevronDown
                      }
                      className="text-white text-xs"
                    />
                  </div>
                )}
              </div>

              {/* Info Section (Always visible) */}
              <div className="p-4 sm:p-5">
                <div className="flex justify-between items-center mb-3 sm:mb-4">
                  <span className="text-xs sm:text-sm font-medium text-gray-500">
                    Key Features
                  </span>
                  <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                    {account.features.length} features
                  </span>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectAccount(account.id);
                  }}
                  className={`w-full py-2 sm:py-3 px-4 ${getButtonColor(
                    account.color
                  )} text-white rounded-lg sm:rounded-xl transition-all duration-300 flex items-center justify-center font-medium text-sm sm:text-base shadow-md hover:shadow-lg`}
                >
                  <span className="mr-2">Get Started</span>
                  <FontAwesomeIcon
                    icon={faArrowRight}
                    className="text-xs sm:text-sm"
                  />
                </button>
              </div>

              {/* Features Overlay (Appears on hover or tap) */}
              <div
                className={`absolute inset-0 bg-gradient-to-b ${getGradientColor(
                  account.color
                )} to-black/95 p-4 sm:p-5 flex flex-col justify-center transition-all duration-500 ease-in-out 
                ${
                  expandedAccount === account.id ||
                  (!isTouchDevice() && expandedAccount === account.id)
                    ? "opacity-100"
                    : "opacity-0 pointer-events-none"
                }`}
              >
                <h3 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4">
                  Key Features
                </h3>
                <ul className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                  {account.features.map((feature, index) => (
                    <li key={index} className="flex items-start text-white">
                      <FontAwesomeIcon
                        icon={faCheckCircle}
                        className="text-white mr-2 mt-0.5 text-xs sm:text-sm bg-white/20 p-1 rounded-full flex-shrink-0"
                      />
                      <span className="text-xs sm:text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-auto">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectAccount(account.id);
                    }}
                    className="w-full py-2 sm:py-3 px-4 bg-white text-gray-900 rounded-lg sm:rounded-xl transition-all duration-300 flex items-center justify-center font-medium text-sm sm:text-base shadow-md hover:shadow-lg hover:bg-gray-100"
                  >
                    <span className="mr-2">
                      Select {account.title.split(" ")[0]}
                    </span>
                    <FontAwesomeIcon
                      icon={faArrowRight}
                      className="text-xs sm:text-sm"
                    />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 sm:mt-12 text-center">
          <p className="text-xs sm:text-sm text-gray-500">
            Already have an account?{" "}
            <button
              onClick={() => navigate("/")}
              className="text-blue-600 hover:text-blue-800 font-medium transition-colors underline"
            >
              Sign in here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AccountType;