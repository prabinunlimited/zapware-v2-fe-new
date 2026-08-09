import React from "react";
import { Outlet } from "react-router-dom";
import NavigateSectionBenef from "../BenficiaryHome/NavigationSectionBenef";
import HeaderBenef from "../BenefHeader/BenefHeader";

const BeneficiaryLayout = () => {
  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gray-50">
      {/* Top Header */}
      <HeaderBenef />

      {/* Main Container */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Persistent Left Navigation Sidebar */}
        <NavigateSectionBenef />

        {/* Dynamic Tab Page Content */}
        <div className="flex-1 overflow-y-auto min-w-0 p-4 md:p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default BeneficiaryLayout;