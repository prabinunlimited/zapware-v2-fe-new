import React, { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  FaChartLine,
  FaExchangeAlt,
  FaUserFriends,
  FaHeadset,
  FaHandHoldingUsd,
} from "react-icons/fa";
import { IoIosArrowForward } from "react-icons/io";
import { IoClose } from "react-icons/io5";

function NavigateSectionBenef({ isMobileMenuOpen, setIsMobileMenuOpen }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [beneficiaryId, setBeneficiaryId] = useState(
    localStorage.getItem("beneficaryId")
  );

  useEffect(() => {
    const storedBeneficiaryId = localStorage.getItem("beneficaryId");
    setBeneficiaryId(storedBeneficiaryId);
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    if (setIsMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }
  }, [location.pathname, setIsMobileMenuOpen]);

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
      case "beneficiary-requestremit":
        return "requestremit";
      case "benefsupport":
      case "beneficiarysupport":
        return "support";
      default:
        return "";
    }
  }, []);

  const activeTab = getActiveTabFromPath(location.pathname);

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
      id: "requestremit",
      label: "Request Remit",
      icon: FaHandHoldingUsd,
      path: `/beneficiary-requestremit/${beneficiaryId}`,
      description: "Request remittance payout",
      gradient: "from-amber-500 to-yellow-500",
    },
    {
      id: "support",
      label: "Support",
      icon: FaHeadset,
      path: `/beneficiarysupport/${beneficiaryId}`,
      description: "Get help and assistance",
      gradient: "from-orange-500 to-red-500",
    },
  ];

  const renderNavLinks = () => (
    <nav className="flex-1 px-4 py-4 space-y-3 overflow-y-auto">
      {navigationItems.map((item) => {
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => {
              navigate(item.path);
              if (setIsMobileMenuOpen) setIsMobileMenuOpen(false);
            }}
            className={`
              group relative flex items-center w-full text-left
              rounded-2xl p-3.5 lg:p-4 transition-all duration-200
              ${isActive
                ? `bg-gradient-to-r ${item.gradient} shadow-md`
                : "hover:bg-gray-50"
              }
            `}
          >
            <div className="flex items-center w-full">
              <div
                className={`
                  w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0
                  ${isActive
                    ? "bg-white/20 text-white"
                    : `bg-gradient-to-r ${item.gradient} text-white`
                  }
                `}
              >
                <item.icon className="text-base" />
              </div>

              <div className="flex flex-col ml-3 flex-1 min-w-0">
                <span
                  className={`font-semibold text-sm lg:text-base leading-tight truncate ${isActive ? "text-white" : "text-gray-900"
                    }`}
                >
                  {item.label}
                </span>
                <span
                  className={`text-xs mt-0.5 leading-tight truncate ${isActive ? "text-white/85" : "text-gray-500"
                    }`}
                >
                  {item.description}
                </span>
              </div>

              <IoIosArrowForward
                className={`w-4 h-4 flex-shrink-0 ml-2 transition-transform duration-200 group-hover:translate-x-0.5 ${isActive ? "text-white" : "text-gray-400"
                  }`}
              />
            </div>
          </button>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:flex h-full bg-white w-72 lg:w-[350px] flex-shrink-0 flex-col border-r border-gray-100">
        {renderNavLinks()}
      </aside>

      {/* Mobile Slide-Over Backdrop & Drawer */}
      <div
        className={`fixed inset-0 z-50 md:hidden transition-opacity duration-300 ${isMobileMenuOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
          }`}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />

        {/* Off-canvas panel */}
        <div
          className={`absolute top-0 bottom-0 left-0 w-4/5 max-w-xs bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
            }`}
        >
          {/* Drawer Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-emerald-500 to-blue-600 text-white">
            <h2 className="font-bold text-lg">Menu</h2>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-1.5 rounded-lg bg-white/15 hover:bg-white/20 transition-colors"
              aria-label="Close menu"
            >
              <IoClose className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Drawer Nav Items */}
          {renderNavLinks()}
        </div>
      </div>
    </>
  );
}

export default NavigateSectionBenef;