import React, { useState } from "react";
import HeaderBenef from "../BenefHeader/BenefHeader";
import NavigateSectionBenef from "../BenficiaryHome/NavigationSectionBenef";
import { Outlet } from "react-router-dom";

export default function BeneficiaryLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50">
      <HeaderBenef onToggleMobileMenu={() => setIsMobileMenuOpen(prev => !prev)} />
      <div className="flex flex-1 overflow-hidden relative">
        <NavigateSectionBenef
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}