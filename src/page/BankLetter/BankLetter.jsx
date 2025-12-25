import React, {
  useEffect,
  useRef,
  useCallback,
  useState,
  useMemo,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { FiDownload, FiArrowLeft, FiPrinter } from "react-icons/fi";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { RingLoader } from "react-spinners";

// Components
import DefaultLogo from "../../assets/images/Logo/unlimited remit logo.png"; // Fallback logo

// Redux
import {
  fetchPartnerProfile,
  setAccountData,
  setPdfGenerating,
  selectBankLetterState,
  selectPartnerProfileData,
  selectAccountData,
  selectBankLetterLoading,
  selectPdfGenerating,
  selectCurrentDate,
  selectIsWhitelabelled,
} from "./slices/bankLetterSlice";

import { selectAuth } from "../../features/Auth/slices/authSlice";

import { useTransactionData } from "../../hooks/transactionHooks";

// Import the corrected usePartnerConfig hook
import { usePartnerConfig } from "../../hooks/usePartnerConfig";

const API_URL = import.meta.env.VITE_API_URL;

const BankLetter = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { accountId } = useParams();
  const customerId = localStorage.getItem("authcustomer_id");
  const { fetchTransactions } = useTransactionData();

  // ========== ALL SELECTORS AT THE TOP ==========
  const reduxAccountData = useSelector(
    (state) => state.bankLetter?.accountData
  );

  // Redux Selectors from bankLetterSlice
  const {
    loading: bankLetterLoading,
    pdfGenerating,
    error: bankLetterError,
    currentDate,
  } = useSelector(selectBankLetterState);
  const partnerProfileData = useSelector(selectPartnerProfileData);
  const accountData = useSelector(selectAccountData);
  const isPdfGenerating = useSelector(selectPdfGenerating);
  const isWhitelabelled = useSelector(selectIsWhitelabelled);
  const { token } = useSelector(selectAuth);

  // Use the corrected usePartnerConfig hook
  const {
    logoUrl,
    logoAltText,
    loading: partnerConfigLoading,
    config: partnerConfig,
    headerColor,
    textColor,
    isConfigured,
    partnerName,
    hasLogo,
    debugInfo,
  } = usePartnerConfig();

  // Local Refs
  const pdfContentRef = useRef(null);
  const originalAccountData = useRef(null);
  const loadingTimeoutRef = useRef(null);

  // Local state for logos with fallback
  const [effectiveLogo, setEffectiveLogo] = useState(null);
  const [effectiveLogoAlt, setEffectiveLogoAlt] = useState("");
  const [logoType, setLogoType] = useState("default");

  // Loading state management
  const [showLoading, setShowLoading] = useState(true);

  const isAllowedDomain =
    window.location.hostname === "ourzap-v2.unlimitedremit.com" ||
    window.location.hostname === "unlimited.unlimitedremit.com" || 
    window.location.hostname === "unlimited-v2.unlimitedremit.com";

  let whitelabelledpartnerid = null;
  try {
    const storedId = localStorage.getItem("whitelabelledpartnerid");
    if (storedId) {
      whitelabelledpartnerid = parseInt(storedId, 10);
    }
  } catch (error) {
    console.error(
      "Error reading whitelabelledpartnerid from localStorage:",
      error
    );
    whitelabelledpartnerid = null;
  }

  // ========== FIXED: Move useMemo BEFORE any conditional returns ==========
  const displayAccountData = useMemo(() => {
    // Priority 1: Account data that matches the selected currency from location state
    if (location.state?.selectedCurrency) {
      // Check if accountData matches the selected currency
      if (
        accountData &&
        accountData.currency === location.state.selectedCurrency
      ) {
        return accountData;
      }

      // Check if location state accountData matches
      if (
        location.state?.accountData &&
        location.state.accountData.currency === location.state.selectedCurrency
      ) {
        return location.state.accountData;
      }

      // Check if originalAccountData matches
      if (
        originalAccountData.current &&
        originalAccountData.current.currency === location.state.selectedCurrency
      ) {
        return originalAccountData.current;
      }
    }

    // Priority 2: Fallback to existing logic
    return (
      accountData || originalAccountData.current || location.state?.accountData
    );
  }, [accountData, originalAccountData.current, location.state]);

  // ========== DEBUG EFFECTS ==========
  useEffect(() => {
    console.log("🔍 BankLetter Mount Debug:", {
      accountId,
      locationState: location.state,
      hasAccountData: !!accountData,
      hasOriginalAccountData: !!originalAccountData.current,
      pathname: location.pathname,
      customerId: localStorage.getItem("authcustomer_id"),
      selectedAccountFromStorage: localStorage.getItem("selectedAccount"),
      search: location.search,
    });
  }, [
    accountId,
    location.state,
    accountData,
    location.pathname,
    location.search,
  ]);

  // Debug 2: Log Redux state
  useEffect(() => {
    console.log("🔍 BankLetter Redux Debug:", {
      accountData: accountData,
      reduxAccountData: reduxAccountData,
      isWhitelabelled,
      partnerProfileData,
      bankLetterLoading,
    });
  }, [
    accountData,
    reduxAccountData,
    isWhitelabelled,
    partnerProfileData,
    bankLetterLoading,
  ]);

  // Debug 3: Log when account data changes
  useEffect(() => {
    if (accountData) {
      console.log("✅ BankLetter has account data:", {
        accountNumber: accountData.account_number,
        currency: accountData.currency,
        accountName: accountData.account_name,
      });
    } else {
      console.log("❌ BankLetter missing account data");
    }
  }, [accountData]);

  // Debug 4: Log partner config info
  useEffect(() => {
    console.log("🔍 BankLetter Partner Config Debug:", {
      logoUrl,
      logoAltText,
      partnerConfigLoading,
      headerColor,
      textColor,
      isConfigured,
      partnerName,
      hasLogo,
      debugInfo,
    });
  }, [
    logoUrl,
    logoAltText,
    partnerConfigLoading,
    headerColor,
    textColor,
    isConfigured,
    partnerName,
    hasLogo,
    debugInfo,
  ]);

  // Initialize account data from location state
  useEffect(() => {
    if (location.state?.accountData) {
      // Check if we need to update
      const shouldUpdate =
        !accountData || // No account data yet
        accountData.currency !== location.state.accountData.currency || // Different currency
        accountData.account_number !==
          location.state.accountData.account_number; // Different account

      if (shouldUpdate) {
        console.log(
          "🔄 BankLetter - Setting/Updating account data from location state"
        );
        dispatch(setAccountData(location.state.accountData));
        originalAccountData.current = location.state.accountData;
      }
    }
  }, [location.state, dispatch, accountData]);

  // ========== LISTEN FOR CURRENCY CHANGES VIA LOCALSTORAGE ==========
  useEffect(() => {
    // Listen for currency changes from Account Summary via localStorage
    const handleStorageChange = (event) => {
      if (event.key === "selectedCurrency") {
        console.log(
          "🔄 BankLetter - Currency changed via storage:",
          event.newValue
        );
        // You could trigger a refetch or update here if needed
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  // Fetch partner profile if whitelabelled
  useEffect(() => {
    if (isWhitelabelled && token) {
      const partnerId = localStorage.getItem(
        "whitelabelled_customer_partnerid"
      );
      if (partnerId) {
        dispatch(fetchPartnerProfile(partnerId));
      }
    }
  }, [isWhitelabelled, token, dispatch]);

  // ========== INSTANT LOGO LOADING ==========
  useEffect(() => {
    // Check localStorage FIRST for instant logo display
    const storedLogo = localStorage.getItem("partner_logo");
    const storedName =
      localStorage.getItem("whitelabelled_customer_partnername") ||
      "Partner Logo";

    console.log("🎨 BankLetter - Checking for logos:", {
      localStorageLogo: storedLogo,
      localStoragePartnerName: storedName,
      hookLogoUrl: logoUrl,
      hookLoading: partnerConfigLoading,
    });

    // Priority 1: Try localStorage for INSTANT display
    if (storedLogo) {
      setEffectiveLogo(storedLogo);
      setEffectiveLogoAlt(storedName);
      setLogoType("localStorage");
      console.log("✅ Using logo from localStorage (instant):", storedLogo);
      setShowLoading(false); // Hide loading immediately
      return;
    }

    // Priority 2: If partner config is already loaded, use hook logo
    if (!partnerConfigLoading && logoUrl) {
      setEffectiveLogo(logoUrl);
      setEffectiveLogoAlt(logoAltText || "Partner Logo");
      setLogoType("hook");
      console.log("✅ Using logo from hook:", logoUrl);
      setShowLoading(false);
      return;
    }

    // Priority 3: Default logo (only if we have no other options)
    setEffectiveLogo(DefaultLogo);
    setEffectiveLogoAlt("Unlimited Remit Logo");
    setLogoType("default");
    console.log("✅ Using default logo");

    // Don't wait for partner config to finish loading
    setShowLoading(false);
  }, []); // Empty dependency array - run once on mount

  // Optional: Update logo when partner config finishes loading (for cache refresh)
  useEffect(() => {
    if (!partnerConfigLoading && logoUrl && logoUrl !== effectiveLogo) {
      console.log("🔄 Updating logo after partner config loaded:", logoUrl);
      setEffectiveLogo(logoUrl);
      setEffectiveLogoAlt(logoAltText || "Partner Logo");
      setLogoType("hook");
    }
  }, [partnerConfigLoading, logoUrl, logoAltText, effectiveLogo]);

  // Safety timeout for loading state
  useEffect(() => {
    // Set a very short timeout as safety net
    const timer = setTimeout(() => {
      setShowLoading(false);
    }, 500); // Reduced from 3000ms to 500ms

    return () => clearTimeout(timer);
  }, []);

  // Handle missing account data
  const handleMissingData = () => {
    return (
      <div className="container mx-auto py-10 text-center">
        <p className="text-red-500 font-semibold">
          Account data is missing. Please go back and try again.
        </p>
        <button
          className="mt-4 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded-lg shadow-lg transform hover:scale-105 transition duration-300"
          onClick={() => navigate(-1)}
        >
          Go Back
        </button>
      </div>
    );
  };

  // Generate PDF
  const generatePDF = useCallback(async () => {
    dispatch(setPdfGenerating(true));

    const content = pdfContentRef.current;
    if (!content) {
      dispatch(setPdfGenerating(false));
      return;
    }

    try {
      // Create the exact same HTML as printDocument
      const printStyles = `
      <style>
        body {
          margin: 0 !important;
          padding: 0 !important;
          font-family: Arial, sans-serif !important;
          color: #000 !important;
          background: white !important;
          width: 210mm !important;
        }
        
        .print-logo {
          max-width: 300px !important;
          max-height: 100px !important;
          width: auto !important;
          height: auto !important;
        }
        
        h1 {
          font-size: 24pt !important;
          margin-top: 20px !important;
          margin-bottom: 15px !important;
        }
        
        h2 {
          font-size: 18pt !important;
          margin-top: 15px !important;
          margin-bottom: 10px !important;
        }
        
        p, li, span, div {
          font-size: 12pt !important;
          line-height: 1.5 !important;
        }
        
        strong {
          font-weight: bold !important;
        }
        
        .no-print {
          display: none !important;
        }
        
        .account-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1rem;
          margin-bottom: 1.5rem;
        }
        
        .account-detail-item {
          background: #f8fafc;
          padding: 1rem;
          border-radius: 0.5rem;
          border: 1px solid #e2e8f0;
        }
        
        .account-detail-item strong {
          display: block;
          color: #4a5568;
          font-size: 0.875rem;
          margin-bottom: 0.25rem;
        }
        
        .account-detail-item div {
          color: #2d3748;
          font-size: 1rem;
          font-weight: 500;
        }
        
        /* Partner color styling */
        ${
          headerColor
            ? `
          .pdf-container {
            border-top: 4px solid ${headerColor} !important;
          }
          h1, h2 {
            color: ${headerColor} !important;
          }
        `
            : ""
        }
        
        ${
          textColor
            ? `
          body {
            color: ${textColor} !important;
          }
        `
            : ""
        }
      </style>
    `;

      // Create print-ready content
      const printContent = content.cloneNode(true);

      // Apply logo styling
      const logo = printContent.querySelector("header img");
      if (logo) {
        logo.classList.add("print-logo");
      }

      // Create a temporary container with exact print dimensions
      const tempContainer = document.createElement("div");
      tempContainer.style.cssText = `
      position: absolute;
      left: -9999px;
      top: 0;
      width: 210mm;
      padding: 15mm;
      background: white;
      box-sizing: border-box;
    `;

      // Add styles and content
      const styleElement = document.createElement("style");
      styleElement.textContent = printStyles;
      tempContainer.appendChild(styleElement);
      tempContainer.appendChild(printContent);

      document.body.appendChild(tempContainer);

      // Wait a moment for styles to apply
      await new Promise((resolve) => setTimeout(resolve, 100));

      const canvas = await html2canvas(tempContainer, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
        width: 794,
        windowWidth: 794,
        removeContainer: false,
        onclone: (clonedDoc) => {
          const clonedContainer = clonedDoc.body.firstChild;
          if (clonedContainer) {
            clonedContainer.style.width = "210mm";
            clonedContainer.style.padding = "15mm";
            clonedContainer.style.background = "white";
          }
        },
      });

      // Clean up
      document.body.removeChild(tempContainer);

      const imgData = canvas.toDataURL("image/png", 1.0);
      const doc = new jsPDF("p", "mm", "a4");

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Handle multiple pages if needed
      let heightLeft = imgHeight;
      let position = 0;

      // Add first page
      doc.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add additional pages if content is longer than one page
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        doc.addPage();
        doc.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Save the PDF
      doc.save(`Bank_Letter_${accountData?.account_number || "N/A"}.pdf`);
      dispatch(setPdfGenerating(false));
    } catch (error) {
      console.error("Error generating PDF:", error);
      dispatch(setPdfGenerating(false));
    }
  }, [accountData, dispatch, headerColor, textColor]);

  // Enhanced Print Document
  const printDocument = useCallback(() => {
    const content = pdfContentRef.current;
    if (!content) return;

    // Store original styles
    const originalStyles = content.style.cssText;
    const originalHTML = content.innerHTML;

    // Apply print-specific styles
    content.style.cssText = `
      width: 210mm !important;
      padding: 15mm !important;
      margin: 0 auto !important;
      background-color: white !important;
      box-shadow: none !important;
      border: none !important;
      border-radius: 0 !important;
      ${headerColor ? `border-top: 4px solid ${headerColor} !important;` : ""}
    `;

    // Clone the content to modify for print
    const printContent = content.cloneNode(true);

    // Modify logo size for print
    const logo = printContent.querySelector("header img");
    if (logo) {
      logo.style.maxWidth = "200px";
      logo.style.maxHeight = "100px";
      logo.style.width = "auto";
      logo.style.height = "auto";
      logo.classList.add("print-logo");
    }

    // Apply partner colors to headings if available
    if (headerColor) {
      const headings = printContent.querySelectorAll("h1, h2");
      headings.forEach((heading) => {
        heading.style.color = headerColor;
      });
    }

    // Create print-specific styles
    const printStyles = `
      <style>
        @media print {
          body {
            margin: 0 !important;
            padding: 0 !important;
            font-family: Arial, sans-serif !important;
            color: #000 !important;
            background: white !important;
          }
          
          .print-logo {
            max-width: 300px !important;
            max-height: 100px !important;
            width: auto !important;
            height: auto !important;
          }
          
          #pdfContent {
            width: 210mm !important;
            padding: 15mm !important;
            margin: 0 auto !important;
            background: white !important;
            ${
              headerColor
                ? `border-top: 4px solid ${headerColor} !important;`
                : ""
            }
          }
          
          h1 {
            font-size: 24pt !important;
            margin-top: 20px !important;
            margin-bottom: 15px !important;
            ${headerColor ? `color: ${headerColor} !important;` : ""}
          }
          
          h2 {
            font-size: 18pt !important;
            margin-top: 15px !important;
            margin-bottom: 10px !important;
            ${headerColor ? `color: ${headerColor} !important;` : ""}
          }
          
          p, li, span, div {
            font-size: 12pt !important;
            line-height: 1.5 !important;
            ${textColor ? `color: ${textColor} !important;` : ""}
          }
          
          strong {
            font-weight: bold !important;
          }
          
          /* Hide screen-only elements */
          .no-print {
            display: none !important;
          }
        }
        
        @page {
          size: A4;
          margin: 15mm;
        }
      </style>
    `;

    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Bank Letter - ${accountData?.account_number || "N/A"}</title>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          ${printStyles}
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();

    // Restore original content after a delay
    setTimeout(() => {
      printWindow.print();

      // Restore original styles
      content.style.cssText = originalStyles;

      // Close print window after printing
      setTimeout(() => {
        if (!printWindow.closed) {
          printWindow.close();
        }
      }, 500);
    }, 250);
  }, [accountData, headerColor, textColor]);

  // ========== FIXED: Check for missing data AFTER all hooks ==========
  // Check for missing data
  if (!displayAccountData) {
    return handleMissingData();
  }

  // Only show loading if we truly have no data
  if (showLoading && (!displayAccountData || !effectiveLogo)) {
    return (
      <div className="container mx-auto py-20 text-center">
        <RingLoader
          size={50}
          color={headerColor || "#3b82f6"}
          className="mx-auto mb-4"
        />
        <p className="text-gray-600">Loading configuration...</p>
        <button
          className="mt-4 px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
          onClick={() => setShowLoading(false)}
        >
          Skip Loading
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Header with navigation */}
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-blue-600 hover:text-blue-800 font-medium"
        >
          <FiArrowLeft className="mr-2" /> Back
        </button>
        <h1 className="text-2xl font-bold text-gray-800">
          Bank Confirmation Letter
        </h1>
        <div className="w-24"></div>
      </div>

      {/* PDF Content */}
      <div className="flex justify-center mb-8">
        <div
          id="pdfContent"
          ref={pdfContentRef}
          className="bg-white p-8 rounded-xl shadow-lg w-full max-w-4xl border border-gray-200 pdf-container"
          style={{
            ...(headerColor ? { borderTop: `4px solid ${headerColor}` } : {}),
            ...(textColor ? { color: textColor } : {}),
          }}
        >
          {/* Inline styles with print media queries */}
          <style>
            {`
              /* Screen styles */
              @media screen {
                .pdf-container {
                  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                }
              }
              
              /* PDF generation styles */
              .generating-pdf {
                width: 210mm !important;
                padding: 15mm !important;
              }
              
              .generating-pdf header img {
                max-width: 100px !important;
                max-height: 60px !important;
                width: auto !important;
                height: auto !important;
              }
              
              /* Main content styles */
              #pdfContent {
                font-family: 'Arial', sans-serif;
                line-height: 1.6;
              }
              
              #pdfContent header {
                border-bottom: 2px solid #e2e8f0;
                padding-bottom: 1.5rem;
                margin-bottom: 1.5rem;
                text-align: center;
              }
              
              /* Control logo size for screen */
              #pdfContent header img {
                max-width: 200px;
                max-height: 80px;
                width: auto;
                height: auto;
                object-fit: contain;
                margin-bottom: 1rem;
              }
              
              #pdfContent h1 {
                color: ${headerColor || "#2d3748"};
                font-size: 1.875rem;
                margin-top: 0.5rem;
              }
              
              #pdfContent h2 {
                color: ${headerColor || "#2d3748"};
                font-size: 1.25rem;
                margin-top: 1.5rem;
                margin-bottom: 0.75rem;
                border-bottom: 1px solid #e2e8f0;
                padding-bottom: 0.25rem;
              }
              
              #pdfContent ul {
                margin-top: 0.75rem;
                margin-bottom: 1rem;
              }
              
              #pdfContent li {
                margin-bottom: 0.5rem;
                padding-left: 0.5rem;
              }
              
              #pdfContent strong {
                color: #4a5568;
                min-width: 160px;
                display: inline-block;
              }
              
              #pdfContent footer {
                margin-top: 2rem;
                padding-top: 1.5rem;
                border-top: 1px solid #e2e8f0;
                font-size: 0.875rem;
                color: #718096;
              }
              
              /* Print media query */
              @media print {
                body { 
                  margin: 0 !important;
                  padding: 0 !important;
                }
                
                #pdfContent {
                  width: 210mm !important;
                  padding: 15mm !important;
                  margin: 0 auto !important;
                  box-shadow: none !important;
                  border: none !important;
                  border-radius: 0 !important;
                  border-top: 4px solid ${headerColor || "#3b82f6"} !important;
                }
                
                #pdfContent header img {
                  max-width: 100px !important;
                  max-height: 60px !important;
                  width: auto !important;
                  height: auto !important;
                }
                
                .no-print {
                  display: none !important;
                }
                
                h1, h2 {
                  color: ${headerColor || "#2d3748"} !important;
                }
              }
              
              /* Grid styles */
              .account-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                gap: 1rem;
                margin-bottom: 1.5rem;
              }
              
              .account-detail-item {
                background: #f8fafc;
                padding: 1rem;
                border-radius: 0.5rem;
                border: 1px solid #e2e8f0;
              }
              
              .account-detail-item strong {
                display: block;
                color: #4a5568;
                font-size: 0.875rem;
                margin-bottom: 0.25rem;
              }
              
              .account-detail-item div {
                color: #2d3748;
                font-size: 1rem;
                font-weight: 500;
              }
            `}
          </style>

          <header className="text-center pb-6 flex flex-col justify-center items-center">
            {/* Logo with error handling - Will show instantly from localStorage */}
            <img
              src={effectiveLogo || DefaultLogo}
              alt={effectiveLogoAlt || "Unlimited Remit Logo"}
              data-logo-type={logoType}
              className="mb-6 object-contain"
              onError={(e) => {
                console.error(`Failed to load logo: ${effectiveLogo}`);
                e.target.src = DefaultLogo;
                e.target.alt = "Default Logo";
                e.target.dataset.logoType = "default";
              }}
            />
            <h1 className="text-2xl font-bold" style={{ color: headerColor }}>
              Bank Confirmation Letter
            </h1>
          </header>

          <main className="px-2">
            <div className="text-right text-sm text-gray-600 mb-6">
              {currentDate}
            </div>

            <div className="text-justify">
              {
                isAllowedDomain ? (
                  <>
                    <p className="mb-6 text-lg font-medium text-gray-800">
                      Dear Customer,
                    </p>

                    {/* Company description only for non-whitelabel on allowed domain */}
                    {!isWhitelabelled && (
                      <>
                        <p className="mb-4">
                          Founded in 1992, Unlimited is one of the largest
                          organizations with its sister concerns in education,
                          internet services, software development, outsourcing,
                          and running a cooperative bank and digital wallet for
                          remittance services in the country.
                        </p>

                        <p className="mb-6">
                          Please be advised that we have established an account
                          for you on our platform. This account is used for
                          collecting and disbursing payments for your business.
                        </p>
                      </>
                    )}
                  </>
                ) : // For non-allowed domains (like partner domains)
                isWhitelabelled ? (
                  bankLetterLoading ? (
                    <div className="flex justify-center py-4">
                      <RingLoader size={30} color={headerColor || "#3b82f6"} />
                    </div>
                  ) : (
                    <div
                      dangerouslySetInnerHTML={{
                        __html: partnerProfileData?.text || "",
                      }}
                      className="prose max-w-none"
                      style={textColor ? { color: textColor } : {}}
                    />
                  )
                ) : null // Or add a default message for non-whitelabel on non-allowed domains
              }
            </div>

            <div className="mt-8">
              <h2
                className="text-xl font-semibold mb-4"
                style={{ color: headerColor }}
              >
                Account Details ({displayAccountData?.currency || "N/A"}{" "}
                Account)
              </h2>

              <div className="account-grid">
                {displayAccountData?.bank_account_type === "pooled" && (
                  <div className="account-detail-item">
                    <strong>
                      {displayAccountData.customer_type === "individual"
                        ? "Customer Name"
                        : "Business Name"}
                      :
                    </strong>
                    <div>
                      {displayAccountData.customer_type === "individual" ? (
                        <>
                          {displayAccountData.first_name}
                          {displayAccountData.middle_name
                            ? ` ${displayAccountData.middle_name}`
                            : ""}
                          {` ${displayAccountData.last_name}`}
                        </>
                      ) : (
                        displayAccountData.institution_name
                      )}
                    </div>
                  </div>
                )}

                {displayAccountData?.currency && (
                  <div className="account-detail-item">
                    <strong>Currency:</strong>
                    <div>{displayAccountData.currency}</div>
                  </div>
                )}

                {displayAccountData?.account_name && (
                  <div className="account-detail-item">
                    <strong>Account Holder Name:</strong>
                    <div>{displayAccountData.account_name}</div>
                  </div>
                )}

                {displayAccountData?.account_number && (
                  <div className="account-detail-item">
                    <strong>Account Number:</strong>
                    <div className="font-mono">
                      {displayAccountData.account_number}
                    </div>
                  </div>
                )}

                {displayAccountData?.bank_name && (
                  <div className="account-detail-item">
                    <strong>Bank Name:</strong>
                    <div>{displayAccountData.bank_name}</div>
                  </div>
                )}

                {displayAccountData?.sort_code && (
                  <div className="account-detail-item">
                    <strong>Sort Code:</strong>
                    <div className="font-mono">
                      {displayAccountData.sort_code}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {isAllowedDomain && (
              <footer className="mt-8 pt-6 border-t border-gray-200">
                <p className="mb-4">
                  If you have any questions, please do not hesitate to contact
                  our support team. We are here to assist you.
                </p>
                <div className="text-sm text-gray-500 italic">
                  Note: This is a computer generated letter so no signature is
                  required.
                </div>
              </footer>
            )}
          </main>

          {isAllowedDomain && (
            <footer className="mt-10 pt-6 border-t border-gray-200 text-center text-sm">
              <div className="font-medium mb-4">
                We are licensed in the following jurisdictions:
              </div>

              <div className="space-y-3 text-left">
                <div>
                  <strong>NEPAL:</strong> Lalit Money Transfer Pvt Ltd Unlimited
                  Building, Kichapokhari, PO Box 856, Kathmandu, NEPAL holds a
                  license for Remittances from Nepal Rastra Bank.
                </div>
                <div>
                  <strong>USA:</strong> Unlimited Cloud LLC, 10685-B Hazelhurst
                  Dr 18549, Houston, TX 77043, USA holds MSD Registration No.
                  31000204408346 from Financial Crimes Enforcement Network.
                </div>
                <div>
                  <strong>Singapore:</strong> Unlimited Cloud Pte Ltd, 68
                  Circular Road #02-01, Singapore 049422.
                </div>
                <div>
                  <strong>QATAR:</strong> Unlimited Remit Middle East LLC, QFC
                  Tower 1, Doha, Qatar holds fintech license No. 01576 from
                  Qatar Financial Center.
                </div>
                <div>
                  <strong>CANADA:</strong> Asimit Remittance Ltd 1224-13351
                  Commerce Pkwy, Richmond, BC V6V 2X7, Canada.
                </div>
                <div>
                  <strong>UAE:</strong> Asimit Portal Est., Dubai Mall, Downtown
                  Dubai, UAE.
                </div>
              </div>

              <div className="font-semibold mt-8 text-lg">
                Unlimited Remittance Ltd
              </div>
            </footer>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
        <button
          className="flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition duration-300 w-full sm:w-auto"
          style={{ backgroundColor: headerColor || "#3b82f6" }}
          onClick={generatePDF}
          disabled={isPdfGenerating}
        >
          {isPdfGenerating ? (
            <>
              <RingLoader size={18} color="#ffffff" className="mr-2" />
              Generating PDF...
            </>
          ) : (
            <>
              <FiDownload className="mr-2" />
              Download PDF
            </>
          )}
        </button>

        <button
          className="flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-3 px-6 rounded-lg shadow-md transition duration-300 w-full sm:w-auto"
          onClick={printDocument}
        >
          <FiPrinter className="mr-2" />
          Print
        </button>

        <button
          className="flex items-center justify-center bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition duration-300 w-full sm:w-auto"
          onClick={() => navigate(-1)}
        >
          <FiArrowLeft className="mr-2" />
          Close
        </button>
      </div>

      {bankLetterError && (
        <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-center">
          {bankLetterError}
        </div>
      )}
    </div>
  );
};

export default BankLetter;