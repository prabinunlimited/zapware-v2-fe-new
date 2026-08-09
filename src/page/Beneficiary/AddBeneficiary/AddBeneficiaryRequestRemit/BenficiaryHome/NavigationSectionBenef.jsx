// /src/components/Beneficiary/NavigateSectionBenef.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  FaChartLine,
  FaExchangeAlt,
  FaUserFriends,
  FaShareAlt,
} from "react-icons/fa";
import { IoIosArrowForward } from "react-icons/io";

function NavigateSectionBenef() {
  const location = useLocation();
  const navigate = useNavigate();
  const [beneficiaryId, setBeneficiaryId] = useState(
    localStorage.getItem("beneficaryId")
  );

  useEffect(() => {
    const storedBeneficiaryId = localStorage.getItem("beneficaryId");
    setBeneficiaryId(storedBeneficiaryId);
  }, []);

  const getActiveTabFromPath = useCallback((pathname) => {
    const pathSegments = pathname.split("/").filter((segment) => segment);
    if (pathSegments.length === 0) return "";

    const mainSection = pathSegments[0];

    switch (mainSection) {
      case "benefhome":
        return "dashboard";
      case "beneftransactions":
        return "transactions";
      case "benefsenders":
        return "senders";
      case "referral":
        return "referral";
      default:
        return "";
    }
  }, []);

  const activeTab = getActiveTabFromPath(location.pathname);

  const handleNavigationClick = (item) => {
    navigate(item.path);
  };

  const navigationItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: FaChartLine,
      path: `/benefhome/${beneficiaryId}`,
      description: "Overview and analytics",
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      id: "transactions",
      label: "Transactions",
      icon: FaExchangeAlt,
      path: `/beneftransactions/${beneficiaryId}`,
      description: "View all transactions",
      gradient: "from-emerald-500 to-green-500",
    },
    {
      id: "senders",
      label: "Senders",
      icon: FaUserFriends,
      path: `/benefsenders/${beneficiaryId}`,
      description: "Manage your senders",
      gradient: "from-purple-500 to-pink-500",
    },
    {
      id: "referral",
      label: "Referral",
      icon: FaShareAlt,
      path: `#`,
      description: "Refer and earn rewards",
      gradient: "from-orange-500 to-red-500",
    },
  ];

  return (
    <div className="h-full bg-white w-[350px] max-w-[400px] flex-shrink-0 flex flex-col border-r border-gray-100">
      <nav className="flex-1 px-4 py-4 space-y-3 overflow-y-auto">
        {navigationItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNavigationClick(item)}
              className={`
                group relative flex items-center w-full text-left
                rounded-2xl p-4 transition-all duration-200
                ${
                  isActive
                    ? `bg-gradient-to-r ${item.gradient} shadow-md`
                    : "hover:bg-gray-50"
                }
              `}
            >
              <div className="flex items-center w-full">
                <div
                  className={`
                    w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0
                    ${
                      isActive
                        ? "bg-white/20 text-white"
                        : `bg-gradient-to-r ${item.gradient} text-white`
                    }
                  `}
                >
                  <item.icon className="text-base" />
                </div>

                <div className="flex flex-col ml-3 flex-1 min-w-0">
                  <span
                    className={`font-semibold text-base leading-tight ${
                      isActive ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {item.label}
                  </span>
                  <span
                    className={`text-xs mt-0.5 leading-tight ${
                      isActive ? "text-white/85" : "text-gray-500"
                    }`}
                  >
                    {item.description}
                  </span>
                </div>

                <IoIosArrowForward
                  className={`w-4 h-4 flex-shrink-0 ml-2 transition-transform duration-200 group-hover:translate-x-0.5 ${
                    isActive ? "text-white" : "text-gray-400"
                  }`}
                />
              </div>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

export default NavigateSectionBenef;