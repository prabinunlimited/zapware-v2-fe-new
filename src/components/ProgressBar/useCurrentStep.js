// hooks/useCurrentStep.js
import { useLocation } from "react-router-dom";

const useCurrentStep = () => {
  const location = useLocation();
  
  const pathToStepMap = {
    "/selectaccount": 1,
    "/currencyselectaccount": 2,
    "/registerindividual": 3,
    "/verifyphone": 4,
    "/home/customerId": 5,
  };
  
  // Handle potential subpaths or query parameters
  const basePath = location.pathname.split('/')[1];
  const fullPath = location.pathname;
  
  // First try exact match, then try base path
  return pathToStepMap[fullPath] || pathToStepMap[`/${basePath}`] || 1;
};

export default useCurrentStep;