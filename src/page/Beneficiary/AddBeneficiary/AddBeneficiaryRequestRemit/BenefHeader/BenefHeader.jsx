import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaUserCircle, FaIdCard, FaStar } from "react-icons/fa";
import { IoIosArrowForward } from "react-icons/io";
import { HiOutlineLogout, HiOutlineMenuAlt2 } from "react-icons/hi";

const API_URL = import.meta.env.VITE_API_URL;

function HeaderBenef({ onToggleMobileMenu }) {
  const navigate = useNavigate();
  const [beneficiaryName, setBeneficiaryName] = useState("");
  const [beneficiaryIdentifier, setBeneficiaryIdentifier] = useState("");
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dropdownRef = useRef(null);

  const customerType = localStorage.getItem("customer_type") || "individual";
  const displayType =
    customerType.charAt(0).toUpperCase() + customerType.slice(1);
  const beneficiaryId = localStorage.getItem("beneficaryId");

  useEffect(() => {
    if (!beneficiaryId) return;

    const fetchBeneficiaryDetails = async () => {
      try {
        const response = await axios.get(
          `${API_URL}/beneficiaries/fetch-merchant-benef/${beneficiaryId}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("bearertoken")}`,
            },
          }
        );

        const data = response.data?.data;
        if (data?.name) {
          setBeneficiaryName(data.name);
        }
        if (data?.mobile_number) {
          setBeneficiaryIdentifier(data.mobile_number);
        }
      } catch (error) {
        console.error("Error fetching beneficiary details:", error);
      }
    };

    fetchBeneficiaryDetails();
  }, [beneficiaryId]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMyProfile = () => {
    setIsProfileOpen(false);
    navigate(`/beneficiaryprofile/${beneficiaryId}`);
  };

  const handleLogout = () => {
    setIsProfileOpen(false);
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = "/";
  };

  return (
    <header className="w-full bg-gradient-to-r from-emerald-500 to-blue-600 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between flex-shrink-0 relative z-30">
      {/* Left: Mobile Hamburger + Logo + Title */}
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
        {/* Mobile Hamburger Button */}
        <button
          onClick={onToggleMobileMenu}
          className="md:hidden p-2 rounded-xl bg-white/15 hover:bg-white/20 text-white transition-colors flex-shrink-0"
          aria-label="Open navigation menu"
        >
          <HiOutlineMenuAlt2 className="w-5 h-5" />
        </button>

        <div className="w-9 h-9 sm:w-11 sm:h-11 bg-white/15 rounded-xl flex items-center justify-center flex-shrink-0">
          <svg
            className="w-5 h-5 sm:w-6 sm:h-6 text-white"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 12c2.7 0 4.9-2.2 4.9-4.9S14.7 2.2 12 2.2 7.1 4.4 7.1 7.1 9.3 12 12 12zm0 2.4c-3.3 0-9.8 1.6-9.8 4.9v2.4h19.6v-2.4c0-3.3-6.5-4.9-9.8-4.9z" />
          </svg>
        </div>
        <h1 className="text-lg sm:text-xl font-bold text-white truncate">
          Beneficiaries
        </h1>
      </div>

      {/* Right: Profile pill & Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsProfileOpen((prev) => !prev)}
          className="flex items-center gap-2 sm:gap-3 bg-white/10 hover:bg-white/15 transition-colors rounded-full p-1 sm:pl-2 sm:pr-3 sm:py-1.5"
          aria-label="User Menu"
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/20 flex items-center justify-center relative flex-shrink-0">
            <FaUserCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            <span className="absolute -top-0.5 -right-0.5 w-2 sm:w-2.5 h-2 sm:h-2.5 bg-emerald-400 rounded-full border-2 border-emerald-500" />
          </div>

          <div className="text-left hidden sm:block max-w-[120px] md:max-w-[160px]">
            <p className="text-sm font-semibold text-white leading-tight truncate">
              {beneficiaryName || "Beneficiary"}
            </p>
            <p className="text-xs text-white/80 leading-tight truncate">
              {displayType}
            </p>
          </div>

          <IoIosArrowForward
            className={`w-3.5 h-3.5 sm:w-4 sm:h-4 text-white/80 transition-transform ${
              isProfileOpen ? "rotate-90" : ""
            }`}
          />
        </button>

        {/* Profile Dropdown Menu */}
        {isProfileOpen && (
          <div className="absolute right-0 top-full mt-2 w-[calc(100vw-2rem)] max-w-xs sm:w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50">
            <div className="bg-gradient-to-br from-emerald-500 to-blue-600 p-4 sm:p-6">
              <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl bg-white/15 flex items-center justify-center relative flex-shrink-0">
                  <FaUserCircle className="w-7 h-7 sm:w-9 sm:h-9 text-white" />
                  <span className="absolute -top-0.5 -right-0.5 w-3 h-3 sm:w-3.5 sm:h-3.5 bg-emerald-400 rounded-full border-2 border-emerald-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-base sm:text-lg font-bold text-white truncate">
                    {beneficiaryName || "Beneficiary"}
                  </p>
                  <p className="text-xs sm:text-sm text-white/80 mt-0.5 truncate">
                    ID: {beneficiaryIdentifier || beneficiaryId || "N/A"}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span className="px-2.5 py-1 sm:px-3 sm:py-1.5 bg-white/15 text-white text-xs sm:text-sm font-medium rounded-full capitalize">
                  {customerType}
                </span>
                <span className="px-2.5 py-1 sm:px-3 sm:py-1.5 bg-white/15 text-white text-[11px] sm:text-xs font-medium rounded-full">
                  Beneficiaries Portal
                </span>
              </div>
            </div>

            <div className="p-3 sm:p-4 space-y-2 sm:space-y-2.5">
              <button
                onClick={handleMyProfile}
                className="w-full flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors text-left"
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <FaIdCard className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm sm:text-base font-semibold text-gray-900 truncate">
                    My Profile
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500 truncate">
                    Manage personal information
                  </p>
                </div>
                <IoIosArrowForward className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" />
              </button>

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl bg-red-50 hover:bg-red-100 border border-red-100 transition-colors text-left"
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                  <HiOutlineLogout className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm sm:text-base font-semibold text-red-600 truncate">
                    Logout
                  </p>
                  <p className="text-xs sm:text-sm text-red-400 truncate">
                    Sign out from account
                  </p>
                </div>
                <IoIosArrowForward className="w-4 h-4 sm:w-5 sm:h-5 text-red-400 flex-shrink-0" />
              </button>
            </div>

            <div className="px-3 py-2.5 sm:px-4 sm:py-3.5 border-t border-gray-100 flex items-center justify-center gap-1 text-xs sm:text-sm text-gray-400">
              <FaStar className="w-3 h-3 text-amber-400" />
              <span>Beneficiaries Portal &bull; v2.1.0</span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

export default HeaderBenef;