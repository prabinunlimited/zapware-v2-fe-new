// src/contexts/PartnerConfigContext.jsx
import React, { createContext, useContext } from "react";
import { usePartnerConfig } from "../hooks/usePartnerConfig";

const PartnerConfigContext = createContext();

export const usePartnerConfigContext = () => {
  const context = useContext(PartnerConfigContext);
  if (!context) {
    throw new Error("usePartnerConfigContext must be used within a PartnerConfigProvider");
  }
  return context;
};

export const PartnerConfigProvider = ({ children }) => {
  // Use the hook directly
  const { config: partnerConfig, loading, error } = usePartnerConfig();

  return (
    <PartnerConfigContext.Provider value={{ partnerConfig, loading, error }}>
      {children}
    </PartnerConfigContext.Provider>
  );
};

export default PartnerConfigContext;