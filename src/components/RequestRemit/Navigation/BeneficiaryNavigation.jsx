import React, { useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  FaChartLine,
  FaExchangeAlt,
  FaUserFriends,
  FaShareAlt,
} from "react-icons/fa";
import { IoIosArrowForward } from "react-icons/io";

// Import Redux actions and selectors
import {
  setActiveTab,
  selectActiveTab,
  selectNavigationItems,
} from "../Navigation/Slices/BeneficiaryNavigationSlice";

function BeneficiaryNavigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Select data from Redux store
  const activeTab = useSelector(selectActiveTab);
  const navigationItems = useSelector(selectNavigationItems);

  // Get beneficiary ID from localStorage or URL
  const beneficiaryId =
    localStorage.getItem("beneficaryId") ||
    localStorage.getItem("beneficiaryId");

  // Get active tab from path - UPDATED for all possible routes
  const getActiveTabFromPath = useCallback((pathname) => {
    const pathSegments = pathname.split("/").filter((segment) => segment);

    if (pathSegments.length === 0) return "";

    // Check for legacy routes first
    if (pathSegments[0] === "benefprofile") return "";
    if (pathSegments[0] === "benefhomepage") return "dashboard";
    if (pathSegments[0] === "benefsenders") return "senders";

    // Check for new routes structure
    if (pathSegments[0] === "beneficiary") {
      if (pathSegments.length > 1) {
        const subSection = pathSegments[1];
        switch (subSection) {
          case "homepage":
            return "dashboard";
          case "transactions":
            return "transactions";
          case "senders":
            return "senders";
          case "referral":
            return "referral";
          default:
            return "";
        }
      }
    }

    // Check for customer portal routes
    if (pathSegments[0] === "beneficiary-senders") {
      return "senders";
    }

    return "";
  }, []);

  // Update navigation items with beneficiary ID
  useEffect(() => {
    if (beneficiaryId && navigationItems.length > 0) {
      // The navigation items should already be updated by the slice
      // This is just a safety check
      console.log("Beneficiary ID for navigation:", beneficiaryId);
    }
  }, [beneficiaryId, navigationItems]);

  // Update active tab based on route change
  useEffect(() => {
    const currentActiveTab = getActiveTabFromPath(location.pathname);
    if (currentActiveTab && currentActiveTab !== activeTab) {
      dispatch(setActiveTab(currentActiveTab));
    }
  }, [location.pathname, dispatch, getActiveTabFromPath, activeTab]);

  const handleNavigationClick = (item) => {
    // Update active tab in Redux
    dispatch(setActiveTab(item.id));

    // Navigate to the path
    if (item.path && item.path !== "#") {
      navigate(item.path);
    }
  };

  // Map icon names to actual components
  const iconComponents = {
    FaChartLine: FaChartLine,
    FaExchangeAlt: FaExchangeAlt,
    FaUserFriends: FaUserFriends,
    FaShareAlt: FaShareAlt,
  };

  return (
    <div className="h-full bg-none backdrop-blur-xl shadow-xl border-r border-gray-100/80 w-[30%] min-w-[350px] max-w-[400px] flex-shrink-0 flex flex-col">
      {/* Navigation Items */}
      <nav className="flex-1 px-4 py-4 space-y-3 overflow-y-auto">
        {navigationItems.map((item) => {
          const IconComponent = iconComponents[item.icon] || FaChartLine;

          return (
            <button
              key={item.id}
              onClick={() => handleNavigationClick(item)}
              className={`
                group relative flex items-center w-full
                rounded-xl p-4 transition-all duration-300 ease-out
                hover:shadow-lg hover:scale-[1.02] transform
                ${
                  activeTab === item.id
                    ? `bg-gradient-to-r ${item.gradient} text-white shadow-md`
                    : "text-gray-600 hover:bg-white/80 hover:border hover:border-gray-100/80"
                }
              `}
            >
              <div className="flex items-center w-full">
                <div
                  className={`
                    w-10 h-10 rounded-lg flex items-center justify-center
                    transition-all duration-300 shadow-md flex-shrink-0
                    ${
                      activeTab === item.id
                        ? "bg-white/20 text-white"
                        : `bg-gradient-to-r ${item.gradient} text-white group-hover:scale-105`
                    }
                  `}
                >
                  <IconComponent className="text-base" />
                </div>

                <div className="flex flex-col ml-3 flex-1 min-w-0">
                  <h2
                    className={`
                      font-semibold text-base transition-colors duration-300 text-left
                      ${activeTab === item.id ? "text-white" : "text-gray-800"}
                    `}
                  >
                    {item.label}
                  </h2>
                  <p
                    className={`
                      text-xs transition-colors duration-300 mt-1 text-left
                      ${
                        activeTab === item.id
                          ? "text-white/90"
                          : "text-gray-500"
                      }
                    `}
                  >
                    {item.description}
                  </p>
                </div>

                <IoIosArrowForward
                  className={`
                    w-4 h-4 transition-all duration-300 flex-shrink-0 ml-2
                    ${
                      activeTab === item.id
                        ? "text-white transform translate-x-1"
                        : "text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1"
                    }
                  `}
                />
              </div>
            </button>
          );
        })}
      </nav>

      {/* Footer Section */}
      <div className="px-4 py-6 border-t border-gray-100">
        <div className="text-xs text-gray-500">
          <p>Beneficiary Portal v1.0</p>
          <p className="mt-1">
            All rights reserved © {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
}

export default BeneficiaryNavigation;
