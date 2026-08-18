import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";

// Professional Share Popup Component
const SharePopup = ({
  isOpen,
  onClose,
  requestRemitLink,
  emailForm,
  onEmailFormChange,
  onEmailSend,
  onCopyLink,
}) => {
  if (!isOpen) return null;

  // Enhanced plain text email content
  const generateEnhancedEmailContent = () => {
    const currentDate = new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    return `
🔐 SECURE REMITTANCE REQUEST - ACTION REQUIRED

Dear Recipient,

You have received a secure remittance request that requires your immediate attention.

📋 PAYMENT DETAILS:
• Secure Payment Link: ${requestRemitLink}
• Request Date: ${currentDate}
• Status: Pending Your Action

🚀 QUICK ACTIONS:
1. Click the payment link above to access the secure payment portal
2. Review the transaction details carefully
3. Complete the payment using your preferred method
4. Receive instant confirmation upon completion

🛡️ SECURITY FEATURES:
• End-to-end encryption
• Real-time transaction monitoring
• Secure payment processing
• Instant confirmation

⏰ TIME-SENSITIVE:
This payment link is active for 7 days. We recommend completing the payment at your earliest convenience to avoid any processing delays.

📞 SUPPORT INFORMATION:
If you encounter any issues or have questions:
• Support available 24/7
• Typical response time: 15 minutes
• Secure messaging through the payment portal

🔒 IMPORTANT SECURITY NOTES:
• This link is uniquely generated for you - do not share it with others
• Always verify you're on a secure connection (https://)
• Contact support immediately if you notice anything suspicious

Best regards,
Global Remittance Team
---
This is an automated message from Global Remittance Portal.
For security reasons, please do not reply to this email.
Generated on ${currentDate}
    `.trim();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 p-4">
      <div className="bg-white rounded-xl border border-gray-200 shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gray-100 p-2 rounded-full">
                <svg
                  className="w-5 h-5 text-gray-700"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-base font-semibold text-gray-900">
                  Send Remittance Request
                </h2>
                <p className="text-gray-500 text-sm">
                  Send payment request directly to your beneficiary
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-colors"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Enhanced Message Preview Section */}
          <div className="mb-6">
            <div className="border border-dashed border-gray-200 rounded-lg p-5 bg-gray-50">
              <div className="text-center mb-3">
                <div className="w-12 h-12 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76"
                    />
                  </svg>
                </div>
                <h4 className="font-semibold text-gray-900 text-sm">
                  Professional Email Content
                </h4>
                <p className="text-sm text-gray-500">
                  Your recipient will receive this enhanced email message
                  directly
                </p>
              </div>
            </div>
          </div>

          {/* Link Section */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Link
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={requestRemitLink}
                readOnly
                className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-600 font-mono text-sm"
              />
              <button
                onClick={onCopyLink}
                className="px-4 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium flex items-center space-x-2"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                <span>Copy</span>
              </button>
            </div>
          </div>

          {/* Email Section */}
          <div className="mb-2">
            <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
              <svg
                className="w-4 h-4 mr-2 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              Send Email Directly
            </h3>

            <div className="space-y-4 bg-gray-50 rounded-lg p-4 border border-gray-100">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Recipient Email
                </label>
                <input
                  type="email"
                  name="to"
                  value={emailForm.to}
                  onChange={onEmailFormChange}
                  placeholder="Enter recipient email address"
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Subject
                </label>
                <input
                  type="text"
                  name="subject"
                  value={emailForm.subject}
                  onChange={onEmailFormChange}
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                  placeholder="🔐 Secure Remittance Request - Action Required"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Message Preview
                </label>
                <div className="bg-white border border-gray-200 rounded-lg p-4 max-h-32 overflow-y-auto">
                  <pre className="text-sm text-gray-500 whitespace-pre-wrap">
                    {generateEnhancedEmailContent().substring(0, 300)}...
                  </pre>
                </div>
                <p className="text-xs text-gray-400 mt-1.5">
                  Enhanced professional message will be sent directly
                </p>
              </div>

              <button
                onClick={onEmailSend}
                disabled={!emailForm.to}
                className={`w-full py-3 px-6 rounded-lg font-medium text-white text-sm focus:outline-none transition-colors flex items-center justify-center space-x-2 ${!emailForm.to
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-gray-900 hover:bg-gray-800"
                  }`}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                <span>Send Email Now</span>
              </button>

              <p className="text-xs text-gray-400 text-center">
                The email will open in your default email client with the
                message pre-filled
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">
              Email will be sent directly from your email client
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

function BenefHome() {
  const { customerId } = useParams();
  const { beneficiaryId: urlBeneficiaryId } = useParams();
  const [beneficiaryId, setBeneficiaryId] = useState(urlBeneficiaryId || "");
  const [benefCode, setBenefCode] = useState("");
  const [formData, setFormData] = useState({
    beneficiary_id: "",
    beneficiary_bank_id: "",
    amount: "",
    currency: "USD",
    senders: [],
  });
  const [currencies, setCurrencies] = useState([]);
  const [beneficiaryData, setBeneficiaryData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [errors, setErrors] = useState({});
  const [currenciesLoading, setCurrenciesLoading] = useState(false);
  const [requestRemitLink, setRequestRemitLink] = useState(null);
  const [showSharePopup, setShowSharePopup] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [hasFetchedBeneficiary, setHasFetchedBeneficiary] = useState(false);
  // Dashboard state
  const [requestStatus, setRequestStatus] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [statusLoading, setStatusLoading] = useState(false);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [stats, setStats] = useState({
    totalRequests: 0,
    pendingRequests: 0,
    completedTransactions: 0,
    totalAmount: 0,
  });
  const [userEmail, setUserEmail] = useState("");
  const [emailForm, setEmailForm] = useState({
    to: "",
    subject: "🔐 Secure Remittance Request - Action Required",
    message: "",
  });

  const [senders, setSenders] = useState([]);
  const [sendersLoading, setSendersLoading] = useState(false);
  const [selectedSenders, setSelectedSenders] = useState([]);

  // Global loading state
  const [isLoading, setIsLoading] = useState(true);

  // Add transaction stats state
  const [transactionStats, setTransactionStats] = useState({
    totalTransactions: 0,
    transactionsPending: 0,
    transactionsPaid: 0,
    transactionsFailed: 0,
  });

  const API_URL = import.meta.env.VITE_API_URL;

  // Get bearer token
  const getAuthToken = () => {
    const authtoken =
      localStorage.getItem("authtoken") ||
      localStorage.getItem("authToken") ||
      localStorage.getItem("token") ||
      localStorage.getItem("bearerToken") ||
      sessionStorage.getItem("authtoken") ||
      sessionStorage.getItem("authToken") ||
      sessionStorage.getItem("token") ||
      sessionStorage.getItem("bearerToken");

    return authtoken;
  };

  // Calculate transaction stats
  const calculateTransactionStats = useCallback((transactions) => {
    const totalTransactions = transactions?.length || 0;

    // Updated status matching for API responses including "Processing-Payout"
    const transactionsPending =
      transactions?.filter((trans) => {
        const status = trans.status?.toLowerCase();
        return (
          status === "pending" ||
          status === "processing" ||
          status === "processing-payout" ||
          status === "in_progress" ||
          status === "awaiting_approval" ||
          status === "processing_payout"
        );
      }).length || 0;

    const transactionsPaid =
      transactions?.filter((trans) => {
        const status = trans.status?.toLowerCase();
        return (
          status === "completed" ||
          status === "paid" ||
          status === "approved" ||
          status === "success" ||
          status === "settled" ||
          status === "processed"
        );
      }).length || 0;

    const transactionsFailed =
      transactions?.filter((trans) => {
        const status = trans.status?.toLowerCase();
        return (
          status === "failed" ||
          status === "cancelled" ||
          status === "rejected" ||
          status === "declined"
        );
      }).length || 0;

    setTransactionStats({
      totalTransactions,
      transactionsPending,
      transactionsPaid,
      transactionsFailed,
    });
  }, []);

  // Fetch currencies data
  const fetchCurrenciesData = useCallback(async () => {
    try {
      setCurrenciesLoading(true);
      const authtoken = getAuthToken();

      const headers = {
        "Content-Type": "application/json",
      };

      if (authtoken) {
        headers.Authorization = `Bearer ${authtoken}`;
      }

      const response = await fetch(`${API_URL}/payout-currencies`, {
        headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Currencies API Response:", data);

      let currenciesArray = [];

      if (Array.isArray(data)) {
        currenciesArray = data;
      } else if (data.currencies && Array.isArray(data.currencies)) {
        currenciesArray = data.currencies;
      } else if (data.data && Array.isArray(data.data)) {
        currenciesArray = data.data;
      } else {
        currenciesArray = Object.keys(data).map((key) => ({
          code: key,
          name: data[key],
        }));
      }

      setCurrencies(currenciesArray);
    } catch (error) {
      console.error("Failed to fetch currencies:", error);
      // Set default currencies
      setCurrencies([
        { code: "USD", name: "US Dollar" },
        { code: "EUR", name: "Euro" },
        { code: "GBP", name: "British Pound" },
        { code: "JPY", name: "Japanese Yen" },
      ]);
    } finally {
      setCurrenciesLoading(false);
    }
  }, [API_URL]);

  // Fetch transactions - FIXED: Accept beneficiaryId as parameter
  const fetchTransactions = useCallback(
    async (benefId) => {
      if (!benefId) {
        console.log("No beneficiaryId found:", benefId);
        return;
      }

      try {
        setTransactionsLoading(true);
        setMessage({ type: "", text: "" });

        const authtoken = getAuthToken();

        console.log("Fetching transactions for beneficiary:", benefId);
        console.log("Auth token present:", !!authtoken);

        // Create headers with authentication
        const headers = {
          "Content-Type": "application/json",
        };

        if (authtoken) {
          headers.Authorization = `Bearer ${authtoken}`;
        }

        const response = await fetch(
          `${API_URL}/beneficiaries/all-transactions/${benefId}`,
          {
            method: "GET",
            headers: headers,
          }
        );

        console.log("Response status:", response.status);

        // Handle redirects (302 status)
        if (response.status === 302) {
          const redirectUrl = response.headers.get("Location");
          console.log("Redirect detected to:", redirectUrl);
          throw new Error(
            `Request was redirected. This usually indicates authentication issues. Redirect URL: ${redirectUrl}`
          );
        }

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log("Full Transactions API Response:", data);
        console.log("Response data structure:", data);

        // Handle the API response structure - EXACTLY like the first component
        let transactionsData = [];

        if (data.data?.transactionDetails) {
          transactionsData = data.data.transactionDetails;
        } else if (data.transactionDetails) {
          transactionsData = data.transactionDetails;
        } else if (Array.isArray(data.data)) {
          transactionsData = data.data;
        } else if (Array.isArray(data)) {
          transactionsData = data;
        }

        console.log("Extracted transactions:", transactionsData);

        // Sort transactions by date (newest first) - like the first component
        const sortedTransactions = transactionsData.sort(
          (a, b) =>
            new Date(b.transaction_datetime || b.created_at) -
            new Date(a.transaction_datetime || a.created_at)
        );

        // Map the API data to match your UI structure
        const mappedTransactions = sortedTransactions.map((transaction) => ({
          id: transaction.transaction_id || transaction.id,
          amount: transaction.instructed_amount || transaction.amount,
          currency: transaction.currency_code || transaction.currency,
          status: transaction.status,
          created_at:
            transaction.transaction_datetime || transaction.created_at,
          direction: transaction.direction,
          fee_amount: transaction.fee_amount,
          amount_with_fee: transaction.amount_with_fee,
          particulars: transaction.particulars,
          sender_name: transaction.sender_name,
        }));

        console.log("Mapped transactions for UI:", mappedTransactions);

        setTransactions(mappedTransactions);
        calculateTransactionStats(mappedTransactions);

        // Update stats with new transactions
        updateStats(requestStatus, mappedTransactions);

        setMessage({ type: "", text: "" });
      } catch (error) {
        console.error("Error fetching transactions:", error);

        // More detailed error handling
        if (error.message.includes("redirected")) {
          setMessage({
            type: "error",
            text: "Authentication issue detected. Please check if you're logged in properly.",
          });
        } else if (error.message.includes("404")) {
          setMessage({
            type: "error",
            text: "Transactions endpoint not found. Please check the API URL.",
          });
        } else if (error.message.includes("401")) {
          setMessage({
            type: "error",
            text: "Authentication failed. Please log in again.",
          });
        } else {
          setMessage({
            type: "error",
            text: `Failed to load transactions: ${error.message}`,
          });
        }

        // Set empty transactions on error
        setTransactions([]);
        setTransactionStats({
          totalTransactions: 0,
          transactionsPending: 0,
          transactionsPaid: 0,
          transactionsFailed: 0,
        });
        throw error; // Re-throw to be caught by fetchAllData
      } finally {
        setTransactionsLoading(false);
      }
    },
    [API_URL, calculateTransactionStats]
  ); // FIXED: Remove beneficiaryId dependency

  // Fetch request status - FIXED: Accept beneficiaryId as parameter
  const fetchRequestStatus = useCallback(
    async (benefId) => {
      if (!benefId) return;

      try {
        setStatusLoading(true);
        const authtoken = getAuthToken();

        if (!authtoken) {
          throw new Error(
            "Authentication token not found. Please log in again."
          );
        }

        const response = await fetch(
          `${API_URL}/beneficiaries/request-remits/${benefId}`,
          {
            headers: {
              Authorization: `Bearer ${authtoken}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          // If endpoint doesn't exist, use mock data for demo
          console.log("Request status endpoint not available, using mock data");
          setRequestStatus([
            {
              id: 1,
              amount: "1000.00",
              currency: "USD",
              request_remit_link: "https://ourzap.unlimitedremit.com/remittance-request/demo-1",
              created_at: new Date().toISOString(),
            },
            {
              id: 2,
              amount: "2500.00",
              currency: "EUR",
              request_remit_link: "https://ourzap.unlimitedremit.com/remittance-request/demo-2",
              created_at: new Date().toISOString(),
            },
          ]);
          return;
        }

        const data = await response.json();
        console.log("Request Status API Response:", data);

        if (data.data && Array.isArray(data.data)) {
          setRequestStatus(data.data.slice(0, 5));
          updateStats(data.data, transactions);
        } else if (Array.isArray(data)) {
          setRequestStatus(data.slice(0, 5));
          updateStats(data, transactions);
        } else {
          // Fallback to mock data
          setRequestStatus([
            {
              id: 1,
              amount: "1000.00",
              currency: "USD",
              request_remit_link: "https://ourzap.unlimitedremit.com/remittance-request/demo-1",
              created_at: new Date().toISOString(),
            },
          ]);
        }
      } catch (error) {
        console.error("Failed to fetch request status:", error);
        // Use mock data for demo purposes
        setRequestStatus([
          {
            id: 1,
            amount: "1000.00",
            currency: "USD",
            request_remit_link: "https://ourzap.unlimitedremit.com/remittance-request/demo-1",
            created_at: new Date().toISOString(),
          },
          {
            id: 2,
            amount: "2500.00",
            currency: "EUR",
            request_remit_link: "https://ourzap.unlimitedremit.com/remittance-request/demo-2",
            created_at: new Date().toISOString(),
          },
        ]);
        throw error; // Re-throw to be caught by fetchAllData
      } finally {
        setStatusLoading(false);
      }
    },
    [API_URL]
  ); // FIXED: Remove beneficiaryId dependency

  // Fetch senders data
  const fetchSenders = useCallback(
    async (benefId) => {
      if (!benefId) return;

      try {
        setSendersLoading(true);
        const authtoken = getAuthToken();

        if (!authtoken) {
          throw new Error(
            "Authentication token not found. Please log in again."
          );
        }

        const response = await fetch(
          `${API_URL}/beneficiaries/senders/${benefId}`,
          {
            headers: {
              Authorization: `Bearer ${authtoken}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          if (response.status === 404) {
            console.log("No senders found for this beneficiary");
            setSenders([]);
            return;
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log("Senders API Response:", data);

        // Extract senders data from the response
        if (
          data.getbenefsendersacctobeneficiaryid_data &&
          Array.isArray(data.getbenefsendersacctobeneficiaryid_data)
        ) {
          const sendersData = data.getbenefsendersacctobeneficiaryid_data.map(
            (item) => ({
              id: item.customer_id,
              full_name: `${item.customer?.first_name || ""} ${item.customer?.middle_name || ""
                } ${item.customer?.last_name || ""}`
                .trim()
                .replace(/\s+/g, " "),
              first_name: item.customer?.first_name || "",
              middle_name: item.customer?.middle_name || "",
              last_name: item.customer?.last_name || "",
              email: item.customer?.email || "",
              phone: item.customer?.mobile_number || "",
              country: item.customer?.country || "",
            })
          );

          setSenders(sendersData);
          console.log("Processed senders:", sendersData);
        } else {
          setSenders([]);
        }
      } catch (error) {
        console.error("Failed to fetch senders:", error);
        setSenders([]);
      } finally {
        setSendersLoading(false);
      }
    },
    [API_URL]
  );

  const handleSenderSelection = (senderId) => {
    setSelectedSenders((prev) => {
      const isSelected = prev.includes(senderId);
      let newSelection;

      if (isSelected) {
        newSelection = prev.filter((id) => id !== senderId);
      } else {
        newSelection = [...prev, senderId];
      }

      // Update formData with selected sender IDs
      setFormData((prevFormData) => ({
        ...prevFormData,
        senders: newSelection,
      }));

      return newSelection;
    });
  };

  // Handle select all senders
  const handleSelectAllSenders = () => {
    const allSenderIds = senders.map((sender) => sender.id);
    setSelectedSenders(allSenderIds);
    setFormData((prevFormData) => ({
      ...prevFormData,
      senders: allSenderIds,
    }));
  };

  // Handle clear all senders
  const handleClearAllSenders = () => {
    setSelectedSenders([]);
    setFormData((prevFormData) => ({
      ...prevFormData,
      senders: [],
    }));
  };

  // Update dashboard statistics
  const updateStats = (requests, transacts) => {
    const totalRequests = requests?.length || 0;
    const pendingRequests =
      requests?.filter((req) =>
        ["pending", "opened", "amount_changed"].includes(req.status)
      ).length || 0;

    const completedTransactions =
      transacts?.filter(
        (trans) => trans.status === "completed" || trans.status === "approved"
      ).length || 0;

    const totalAmount =
      transacts?.reduce((sum, trans) => {
        if (trans.status === "completed" || trans.status === "approved") {
          return sum + (parseFloat(trans.amount) || 0);
        }
        return sum;
      }, 0) || 0;

    setStats({
      totalRequests,
      pendingRequests,
      completedTransactions,
      totalAmount,
    });
  };

  // Fetch beneficiary data
  const fetchBeneficiaryData = async (id) => {
    if (!id) {
      setMessage({
        type: "error",
        text: "Beneficiary ID is required",
      });
      return;
    }

    try {
      setMessage({ type: "", text: "" });
      const authtoken = getAuthToken();

      if (!authtoken) {
        throw new Error("Authentication token not found. Please log in again.");
      }

      const response = await fetch(
        `${API_URL}/beneficiaries/fetch-merchant-benef/${id}`,
        {
          headers: {
            Authorization: `Bearer ${authtoken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Authentication failed. Please log in again.");
        }
        if (response.status === 404) {
          throw new Error("Beneficiary not found. Please check the ID.");
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Beneficiary API Response:", data);

      if (data.data) {
        setBeneficiaryData(data.data);
        setHasFetchedBeneficiary(true);

        // Extract benef_code from the response
        const benefCodeFromAPI =
          data.data.benef_code || data.data.benefCode || "";
        setBenefCode(benefCodeFromAPI);

        // Update form data with beneficiary ID and first bank
        if (data.data.benef_banks && data.data.benef_banks.length > 0) {
          const firstBank = data.data.benef_banks[0];
          setFormData((prev) => ({
            ...prev,
            beneficiary_id: id,
            beneficiary_bank_id: firstBank.id.toString(),
            currency: firstBank.currency_code || "USD",
          }));
        } else {
          setFormData((prev) => ({
            ...prev,
            beneficiary_id: id,
            beneficiary_bank_id: "",
          }));
          setMessage({
            type: "error",
            text: "No bank accounts found for this beneficiary",
          });
        }
      } else {
        throw new Error("No beneficiary data found");
      }
    } catch (error) {
      console.error("Failed to fetch beneficiary data:", error);
      setMessage({
        type: "error",
        text:
          error.message ||
          "Failed to load beneficiary information. Please check the ID.",
      });
      setBeneficiaryData(null);
      setHasFetchedBeneficiary(false);
      setBenefCode(""); // Reset benef_code on error
      throw error; // Re-throw to be caught by fetchAllData
    }
  };

  // Fetch all data function - FIXED: Remove dependencies that cause re-renders
  const fetchAllData = useCallback(async () => {
    if (!urlBeneficiaryId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setMessage({ type: "", text: "" });

      // Set beneficiary ID first
      setBeneficiaryId(urlBeneficiaryId);

      // Fetch beneficiary data first (needed for other APIs)
      await fetchBeneficiaryData(urlBeneficiaryId);

      // Then fetch all other data in parallel
      await Promise.all([
        fetchRequestStatus(urlBeneficiaryId),
        fetchTransactions(urlBeneficiaryId),
        fetchCurrenciesData(),
        fetchSenders(urlBeneficiaryId), // Add this line
      ]);
    } catch (error) {
      console.error("Error fetching all data:", error);
      setMessage({
        type: "error",
        text: "Failed to load data. Please try refreshing the page.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [urlBeneficiaryId]);

  // Enhanced email content generator
  const generateEnhancedEmailContent = () => {
    const currentDate = new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    return `
🔐 SECURE REMITTANCE REQUEST - ACTION REQUIRED

Dear Recipient,

You have received a secure remittance request that requires your immediate attention.

📋 PAYMENT DETAILS:
• Secure Payment Link: ${requestRemitLink}
• Request Date: ${currentDate}
• Status: Pending Your Action

🚀 QUICK ACTIONS:
1. Click the payment link above to access the secure payment portal
2. Review the transaction details carefully
3. Complete the payment using your preferred method
4. Receive instant confirmation upon completion

🛡️ SECURITY FEATURES:
• End-to-end encryption
• Real-time transaction monitoring
• Secure payment processing
• Instant confirmation

⏰ TIME-SENSITIVE:
This payment link is active for 7 days. We recommend completing the payment at your earliest convenience to avoid any processing delays.

📞 SUPPORT INFORMATION:
If you encounter any issues or have questions:
• Support available 24/7
• Typical response time: 15 minutes
• Secure messaging through the payment portal

🔒 IMPORTANT SECURITY NOTES:
• This link is uniquely generated for you - do not share it with others
• Always verify you're on a secure connection (https://)
• Contact support immediately if you notice anything suspicious

Best regards,
Global Remittance Team
---
This is an automated message from Global Remittance Portal.
For security reasons, please do not reply to this email.
Generated on ${currentDate}
    `.trim();
  };

  // Copy to clipboard function
  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(true);
      setMessage({
        type: "success",
        text: "Copied to clipboard!",
      });
      setTimeout(() => setCopySuccess(false), 3000);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopySuccess(true);
      setMessage({
        type: "success",
        text: "Copied to clipboard!",
      });
      setTimeout(() => setCopySuccess(false), 3000);
    }
  };

  // Send email directly function
  const sendEmailDirectly = () => {
    if (!emailForm.to) {
      setMessage({
        type: "error",
        text: "Please enter recipient email address",
      });
      return;
    }

    const subject = encodeURIComponent(emailForm.subject);
    const body = encodeURIComponent(emailForm.message);
    const to = encodeURIComponent(emailForm.to);

    // Use mailto link to open default email client
    const mailtoLink = `mailto:${to}?subject=${subject}&body=${body}`;

    // Open the email client
    window.location.href = mailtoLink;

    // Show success message
    setMessage({
      type: "success",
      text: "Email client opened with pre-filled message!",
    });

    // Close the popup after a short delay
    setTimeout(() => {
      setShowSharePopup(false);
    }, 2000);
  };

  // Update the email form handler
  const handleEmailFormChange = (e) => {
    const { name, value } = e.target;
    setEmailForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Copy link function
  const handleCopyLink = () => {
    copyToClipboard(requestRemitLink);
  };

  // Share via native share API if available
  const shareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Remittance Request",
          text: "Please use this link to process the remittance request:",
          url: requestRemitLink,
        });
      } catch (err) {
        console.log("Error sharing:", err);
        setShowSharePopup(true);
      }
    } else {
      setShowSharePopup(true);
    }
  };

  // Helper functions
  const getCurrencyDisplayText = (currency) => {
    if (!currency) return "Unknown";

    if (typeof currency === "string") return currency;

    if (currency.code && currency.name) {
      return `${currency.code} - ${currency.name}`;
    }

    if (currency.code) return currency.code;
    if (currency.currency) return currency.currency;

    if (typeof currency === "object") {
      const stringProps = Object.values(currency).filter(
        (val) => typeof val === "string"
      );
      return stringProps[0] || "Unknown Currency";
    }

    return String(currency);
  };

  const getCurrencyValue = (currency) => {
    if (!currency) return "";

    if (typeof currency === "string") return currency;
    if (currency.code) return currency.code;
    if (currency.currency) return currency.currency;

    if (typeof currency === "object") {
      const stringProps = Object.values(currency).filter(
        (val) => typeof val === "string"
      );
      return stringProps[0] || "";
    }

    return String(currency);
  };

  const getBankDisplayText = (bank) => {
    if (!bank) return "Unknown Bank";

    const bankName = bank.bank_name || bank.name || "Unknown Bank";
    const accountNo = bank.bank_acc_no || bank.account_number;

    if (accountNo) {
      return `${bankName} - ****${accountNo.slice(-4)}`;
    }

    return bankName;
  };

  const getStatusDisplay = (status) => {
    const statusConfig = {
      completed: {
        text: "Completed",
        className: "bg-emerald-50 text-emerald-700 border border-emerald-200",
        icon: "check",
      },
      pending: {
        text: "Pending",
        className: "bg-amber-50 text-amber-700 border border-amber-200",
        icon: "clock",
      },
      "processing-payout": {
        text: "Processing Payout",
        className: "bg-blue-50 text-blue-700 border border-blue-200",
        icon: "refresh",
      },
      processing: {
        text: "Processing",
        className: "bg-blue-50 text-blue-700 border border-blue-200",
        icon: "refresh",
      },
      failed: {
        text: "Failed",
        className: "bg-red-50 text-red-700 border border-red-200",
        icon: "x",
      },
      cancelled: {
        text: "Cancelled",
        className: "bg-gray-50 text-gray-600 border border-gray-200",
        icon: "ban",
      },
    };

    const normalizedStatus = status?.toLowerCase();
    const config = statusConfig[normalizedStatus] || {
      text: status || "Unknown",
      className: "bg-gray-50 text-gray-600 border border-gray-200",
      icon: "help",
    };

    const getStatusIcon = (iconName) => {
      const icons = {
        check: (
          <svg
            className="w-3 h-3 mr-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        ),
        clock: (
          <svg
            className="w-3 h-3 mr-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        ),
        refresh: (
          <svg
            className="w-3 h-3 mr-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        ),
        x: (
          <svg
            className="w-3 h-3 mr-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        ),
        ban: (
          <svg
            className="w-3 h-3 mr-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
            />
          </svg>
        ),
        help: (
          <svg
            className="w-3 h-3 mr-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        ),
      };
      return icons[iconName] || icons.help;
    };

    return (
      <span
        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${config.className}`}
      >
        {getStatusIcon(config.icon)}
        {config.text}
      </span>
    );
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = "Valid amount is required";
    }

    if (!formData.currency) {
      newErrors.currency = "Currency is required";
    }

    if (!formData.beneficiary_bank_id) {
      newErrors.beneficiary_bank_id = "Bank account selection is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setMessage({ type: "", text: "" });
    setRequestRemitLink(null);
    setCopySuccess(false);
    setShowSharePopup(false);

    try {
      const authtoken = getAuthToken();

      if (!authtoken) {
        throw new Error("Authentication token not found. Please log in again.");
      }

      const payload = {
        beneficiary_id: formData.beneficiary_id,
        beneficiary_bank_id: formData.beneficiary_bank_id,
        amount: formData.amount,
        currency: formData.currency,
        senders: formData.senders,
      };

      console.log("Sending payload:", payload);
      console.log("Sending payload with senders:", {
        ...payload,
        senders_count: payload.senders.length,
        selected_senders: payload.senders,
      });

      const response = await fetch(`${API_URL}/request-remit`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authtoken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      console.log("API Response:", result);

      if (response.ok && result.status === "success") {
        setMessage({
          type: "success",
          text: result.message || "Remittance request submitted successfully!",
        });

        // ✅ USE THE EXTERNAL URL DIRECTLY FROM THE API RESPONSE
        const externalUrl = result.data?.requestRemitLink;
        console.log("Using external payment URL:", externalUrl);

        if (externalUrl) {
          setRequestRemitLink(externalUrl);

          // Also extract the requestRemitId for your internal use if needed
          const urlParts = externalUrl.split("/");
          const requestRemitId = urlParts[urlParts.length - 1];
          console.log(
            "Extracted requestRemitId for internal use:",
            requestRemitId
          );

          // Store this for your RemittanceForm component if needed
          localStorage.setItem("currentRequestRemitId", requestRemitId);
        } else {
          throw new Error("No requestRemitLink found in API response");
        }

        // Refresh dashboard data
        fetchAllData();
      } else {
        if (response.status === 401) {
          throw new Error("Authentication failed. Please log in again.");
        }
        setMessage({
          type: "error",
          text: result.message || "Failed to submit request. Please try again.",
        });
      }
    } catch (error) {
      console.error("API Error:", error);
      setMessage({
        type: "error",
        text: error.message || "Failed to submit request. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendAnother = () => {
    setRequestRemitLink(null);
    setCopySuccess(false);
    setShowSharePopup(false);
    setFormData((prev) => ({
      ...prev,
      amount: "",
      beneficiary_bank_id:
        beneficiaryData?.benef_banks?.[0]?.id?.toString() || "",
      currency: beneficiaryData?.benef_banks?.[0]?.currency_code || "USD",
    }));
  };

  // Update the email form when requestRemitLink changes
  useEffect(() => {
    if (requestRemitLink) {
      const enhancedContent = generateEnhancedEmailContent();
      setEmailForm((prev) => ({
        ...prev,
        message: enhancedContent,
      }));
    }
  }, [requestRemitLink]);

  // Fetch all data when component mounts
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      if (urlBeneficiaryId && isMounted) {
        await fetchAllData();
      } else if (isMounted) {
        setIsLoading(false);
      }
    };

    loadData();

    return () => {
      isMounted = false; // Cleanup to prevent state updates after unmount
    };
  }, [urlBeneficiaryId, fetchAllData]);

  // Check if user is authenticated
  useEffect(() => {
    const authtoken = getAuthToken();
    if (!authtoken) {
      setMessage({
        type: "error",
        text: "Please log in to access this page.",
      });
    }
  }, []);

  useEffect(() => {
    const detectUserEmail = () => {
      // Try to get email from localStorage or sessionStorage
      const userData =
        localStorage.getItem("user") ||
        sessionStorage.getItem("user") ||
        localStorage.getItem("userData") ||
        sessionStorage.getItem("userData");

      if (userData) {
        try {
          const parsedUser = JSON.parse(userData);
          if (parsedUser.email) {
            setUserEmail(parsedUser.email);
            return;
          }
        } catch (error) {
          console.log("Could not parse user data");
        }
      }
    };

    detectUserEmail();
  }, []);

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-white">
      {/* Global Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-200 border-t-gray-900 mx-auto mb-4"></div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">
              Loading dashboard
            </h3>
            <p className="text-gray-500 text-sm max-w-xs mx-auto">
              Loading beneficiary information, transactions, and account data
            </p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto min-w-0 bg-gray-50">
        {/* Mobile-only beneficiary code strip (sidebar is hidden on small screens) */}
        {beneficiaryId && (
          <div className="lg:hidden bg-white border-b border-gray-200 sticky top-0 z-20 px-4 py-3 flex items-center justify-between">
            <span className="text-xs text-gray-400">Beneficiary Code</span>
            <span className="text-sm font-mono font-medium text-gray-900">
              {benefCode || beneficiaryId}
            </span>
          </div>
        )}

        <div className="py-8 lg:py-10 px-4 sm:px-6 lg:px-10">
          <div className="max-w-7xl mx-auto">
            {/* Authentication Warning */}
            {!getAuthToken() && (
              <div className="mb-8 bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-amber-500"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-semibold text-amber-800">
                      Authentication Required
                    </h3>
                    <div className="mt-0.5 text-sm text-amber-700">
                      <p>Please log in to access all enterprise features.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Stats Grid - Only show when beneficiary data is loaded */}
            {hasFetchedBeneficiary && (
              <div className="mb-10">
                {/* Section Header */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                      Performance Dashboard
                      <span className="ml-3 px-2.5 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                        Real-time
                      </span>
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">
                      Overview of your remittance activities and performance
                      metrics
                    </p>
                  </div>
                  <button
                    onClick={fetchAllData}
                    className="flex items-center space-x-2 px-3.5 py-2 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg text-gray-700 font-medium transition-colors text-sm"
                  >
                    <svg
                      className={`w-4 h-4 ${statusLoading || transactionsLoading
                        ? "animate-spin"
                        : ""
                        }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                    <span>Refresh Data</span>
                  </button>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                  {/* Total Requests Card */}
                  <div className="bg-white rounded-xl p-5 border border-gray-200 hover:border-gray-300 transition-colors">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <p className="text-gray-500 text-sm font-medium mb-1">
                          Total Requests
                        </p>
                        <p className="text-2xl font-semibold text-gray-900 mb-2">
                          {stats.totalRequests}
                        </p>
                        <div className="flex items-center text-gray-400 text-xs">
                          <svg
                            className="w-3.5 h-3.5 mr-1"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                          All requests
                        </div>
                      </div>
                      <div className="w-10 h-10 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-center">
                        <svg
                          className="w-5 h-5 text-blue-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                      </div>
                    </div>

                    {/* Trend Indicator */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <div className="flex items-center space-x-1 text-emerald-600 text-xs font-medium">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                        <span>Active</span>
                      </div>
                      <div className="text-gray-400 text-xs">
                        Since last month
                      </div>
                    </div>
                  </div>

                  {/* Pending Review Card */}
                  <div className="bg-white rounded-xl p-5 border border-gray-200 hover:border-gray-300 transition-colors">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <p className="text-gray-500 text-sm font-medium mb-1">
                          Pending Review
                        </p>
                        <p className="text-2xl font-semibold text-gray-900 mb-2">
                          {stats.pendingRequests}
                        </p>
                        <div className="flex items-center text-gray-400 text-xs">
                          <svg
                            className="w-3.5 h-3.5 mr-1"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          Needs attention
                        </div>
                      </div>
                      <div className="w-10 h-10 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-center">
                        <svg
                          className="w-5 h-5 text-amber-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                    </div>

                    {/* Alert Badge for Pending Items */}
                    {stats.pendingRequests > 0 && (
                      <div className="flex items-center space-x-2 pt-3 border-t border-gray-100">
                        <div className="flex items-center space-x-1.5 bg-amber-50 text-amber-700 px-2 py-1 rounded-md text-xs font-medium border border-amber-200">
                          <div className="w-1.5 h-1.5 bg-amber-500 rounded-full"></div>
                          <span>Action required</span>
                        </div>
                        <div className="text-amber-600 text-xs font-medium">
                          {stats.pendingRequests} items
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Completed Card */}
                  <div className="bg-white rounded-xl p-5 border border-gray-200 hover:border-gray-300 transition-colors">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <p className="text-gray-500 text-sm font-medium mb-1">
                          Completed
                        </p>
                        <p className="text-2xl font-semibold text-gray-900 mb-2">
                          {stats.completedTransactions}
                        </p>
                        <div className="flex items-center text-gray-400 text-xs">
                          <svg
                            className="w-3.5 h-3.5 mr-1"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          Successfully processed
                        </div>
                      </div>
                      <div className="w-10 h-10 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-center">
                        <svg
                          className="w-5 h-5 text-emerald-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                    </div>

                    {/* Success Rate */}
                    {stats.totalRequests > 0 && (
                      <div className="pt-3 border-t border-gray-100">
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="text-gray-500 text-xs font-medium">
                            Success Rate
                          </span>
                          <span className="text-emerald-600 text-xs font-semibold">
                            {Math.round(
                              (stats.completedTransactions /
                                stats.totalRequests) *
                              100
                            )}
                            %
                          </span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                          <div
                            className="bg-emerald-500 h-1.5 rounded-full transition-all duration-700 ease-out"
                            style={{
                              width: `${Math.round(
                                (stats.completedTransactions /
                                  stats.totalRequests) *
                                100
                              )}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Total Processed Card */}
                  <div className="bg-white rounded-xl p-5 border border-gray-200 hover:border-gray-300 transition-colors">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <p className="text-gray-500 text-sm font-medium mb-1">
                          Total Processed
                        </p>
                        <p className="text-2xl font-semibold text-gray-900 mb-2">
                          ${stats.totalAmount.toLocaleString()}
                        </p>
                        <div className="flex items-center text-gray-400 text-xs">
                          <svg
                            className="w-3.5 h-3.5 mr-1"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                            />
                          </svg>
                          Total volume
                        </div>
                      </div>
                      <div className="w-10 h-10 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-center">
                        <svg
                          className="w-5 h-5 text-gray-700"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                          />
                        </svg>
                      </div>
                    </div>

                    {/* Growth Indicator */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <div className="flex items-center space-x-1 text-emerald-600 text-xs font-medium">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                        <span>Growing</span>
                      </div>
                      <div className="text-gray-400 text-xs">
                        All currencies
                      </div>
                    </div>
                  </div>
                </div>

                {/* Loading State */}
                {(statusLoading || transactionsLoading) && (
                  <div className="mt-4 flex items-center justify-center space-x-2 text-gray-400 text-sm">
                    <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-gray-200 border-t-gray-500"></div>
                    <span>Updating dashboard data...</span>
                  </div>
                )}
              </div>
            )}

            {/* TRANSACTIONS SECTION */}
            {hasFetchedBeneficiary && (
              <div className="bg-white rounded-xl border border-gray-200 mb-10 overflow-hidden relative">
                <div className="px-6 lg:px-8 py-6 lg:py-8">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center space-x-4">
                      <div className="w-11 h-11 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-200">
                        <svg
                          className="w-5 h-5 text-gray-700"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                          />
                        </svg>
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                          Transaction Analytics
                          <span className="ml-3 px-2.5 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium border border-emerald-200">
                            Live
                          </span>
                        </h2>
                        <p className="text-gray-500 text-sm mt-1">
                          Real-time overview of your payment activities
                        </p>
                      </div>
                    </div>

                    {/* Refresh Button */}
                    <button
                      onClick={fetchAllData}
                      className="flex items-center space-x-2 px-3.5 py-2 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg text-gray-700 font-medium transition-colors text-sm"
                    >
                      <svg
                        className={`w-4 h-4 ${transactionsLoading ? "animate-spin" : ""
                          }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      </svg>
                      <span>Refresh</span>
                    </button>
                  </div>

                  {/* Stats Grid - 4 Columns */}
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
                    {/* Total Transactions Card */}
                    <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                      <div className="flex items-center justify-between mb-4">
                        <div className="text-gray-700 text-sm font-semibold">
                          Total Transactions
                        </div>
                        <div className="w-10 h-10 bg-white border border-gray-200 rounded-lg flex items-center justify-center">
                          <svg
                            className="w-5 h-5 text-blue-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                            />
                          </svg>
                        </div>
                      </div>
                      <div className="text-3xl font-semibold text-gray-900 mb-3">
                        {transactionStats.totalTransactions}
                      </div>
                      <div className="flex items-center text-gray-500 text-sm mb-4">
                        <svg
                          className="w-4 h-4 mr-1.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        All-time volume
                      </div>

                      {/* Progress Bar */}
                      <div>
                        <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                          <span>Progress</span>
                          <span className="font-medium">
                            {Math.round(
                              (transactionStats.totalTransactions /
                                (transactionStats.totalTransactions || 1)) *
                              100
                            )}
                            %
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div
                            className="bg-gray-900 h-1.5 rounded-full transition-all duration-700 ease-out"
                            style={{
                              width: `${Math.round(
                                (transactionStats.totalTransactions /
                                  (transactionStats.totalTransactions || 1)) *
                                100
                              )}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    {/* In Progress Card */}
                    <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                      <div className="flex items-center justify-between mb-4">
                        <div className="text-gray-700 text-sm font-semibold">
                          In Progress
                        </div>
                        <div className="w-10 h-10 bg-white border border-gray-200 rounded-lg flex items-center justify-center">
                          <svg
                            className="w-5 h-5 text-amber-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </div>
                      </div>
                      <div className="text-3xl font-semibold text-gray-900 mb-3">
                        {transactionStats.transactionsPending}
                      </div>
                      <div className="flex items-center text-gray-500 text-sm mb-4">
                        <svg
                          className="w-4 h-4 mr-1.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                          />
                        </svg>
                        Processing & Pending
                      </div>

                      {/* Detailed Status Breakdown */}
                      {transactions.length > 0 && (
                        <div className="space-y-2.5">
                          {(() => {
                            const statusCounts = transactions.reduce(
                              (acc, trans) => {
                                const status = trans.status?.toLowerCase();
                                acc[status] = (acc[status] || 0) + 1;
                                return acc;
                              },
                              {}
                            );

                            const processingCount =
                              statusCounts["processing-payout"] ||
                              statusCounts["processing"] ||
                              0;
                            const pendingCount = statusCounts["pending"] || 0;

                            return (
                              <>
                                {processingCount > 0 && (
                                  <div className="flex justify-between items-center text-sm">
                                    <div className="flex items-center space-x-2 text-blue-700">
                                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                                      <span>Processing Payout</span>
                                    </div>
                                    <span className="text-gray-900 font-medium">
                                      {processingCount}
                                    </span>
                                  </div>
                                )}
                                {pendingCount > 0 && (
                                  <div className="flex justify-between items-center text-sm">
                                    <div className="flex items-center space-x-2 text-amber-700">
                                      <div className="w-1.5 h-1.5 bg-amber-500 rounded-full"></div>
                                      <span>Pending Review</span>
                                    </div>
                                    <span className="text-gray-900 font-medium">
                                      {pendingCount}
                                    </span>
                                  </div>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      )}

                      {/* Alert for Pending */}
                      {transactionStats.transactionsPending > 0 && (
                        <div className="mt-4 flex items-center space-x-2 px-3 py-2 bg-amber-50 rounded-md border border-amber-200">
                          <div className="w-1.5 h-1.5 bg-amber-500 rounded-full"></div>
                          <span className="text-amber-800 text-sm font-medium">
                            {transactionStats.transactionsPending}{" "}
                            transaction(s) in progress
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Completed Transactions Card */}
                    <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                      <div className="flex items-center justify-between mb-4">
                        <div className="text-gray-700 text-sm font-semibold">
                          Completed
                        </div>
                        <div className="w-10 h-10 bg-white border border-gray-200 rounded-lg flex items-center justify-center">
                          <svg
                            className="w-5 h-5 text-emerald-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </div>
                      </div>
                      <div className="text-3xl font-semibold text-gray-900 mb-3">
                        {transactionStats.transactionsPaid}
                      </div>
                      <div className="flex items-center text-gray-500 text-sm mb-4">
                        <svg
                          className="w-4 h-4 mr-1.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        Successfully processed
                      </div>
                    </div>

                    {/* Failed Transactions Card */}
                    <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                      <div className="flex items-center justify-between mb-4">
                        <div className="text-gray-700 text-sm font-semibold">
                          Failed
                        </div>
                        <div className="w-10 h-10 bg-white border border-gray-200 rounded-lg flex items-center justify-center">
                          <svg
                            className="w-5 h-5 text-red-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </div>
                      </div>
                      <div className="text-3xl font-semibold text-gray-900 mb-3">
                        {transactionStats.transactionsFailed || 0}
                      </div>
                      <div className="flex items-center text-gray-500 text-sm mb-4">
                        <svg
                          className="w-4 h-4 mr-1.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                          />
                        </svg>
                        Unsuccessful transactions
                      </div>

                      {/* Alert for Failed Transactions */}
                      {(transactionStats.transactionsFailed || 0) > 0 && (
                        <div className="mt-4 flex items-center space-x-2 px-3 py-2 bg-red-50 rounded-md border border-red-200">
                          <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                          <span className="text-red-800 text-sm font-medium">
                            {transactionStats.transactionsFailed || 0}{" "}
                            transaction(s) failed
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Status Legend */}
                  <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-gray-500 text-sm">
                    <div className="flex items-center space-x-2">
                      <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></div>
                      <span>Completed</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2.5 h-2.5 bg-blue-500 rounded-full"></div>
                      <span>Processing Payout</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2.5 h-2.5 bg-amber-500 rounded-full"></div>
                      <span>Pending</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2.5 h-2.5 bg-red-500 rounded-full"></div>
                      <span>Failed</span>
                    </div>
                  </div>

                  {/* Quick Actions Footer */}
                  <div className="mt-8 flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0 pt-6 border-t border-gray-100">
                    <div className="flex items-center space-x-6 text-gray-500 text-sm">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                        <span>Live updates</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span>Real-time data</span>
                      </div>
                    </div>

                    <div className="flex space-x-3">
                      <button className="px-4 py-2 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg text-gray-700 text-sm font-medium transition-colors">
                        Export Report
                      </button>
                      <button className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-sm font-medium transition-colors">
                        View Details
                      </button>
                    </div>
                  </div>
                </div>

                {/* Loading Overlay */}
                {transactionsLoading && (
                  <div className="absolute inset-0 bg-white/80 rounded-xl flex items-center justify-center">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-200 border-t-gray-900 mx-auto mb-3"></div>
                      <p className="text-gray-700 font-medium text-sm">
                        Updating transactions...
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
              {/* Left Column - Quick Transfer */}
              <div className="xl:col-span-1">
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="px-5 lg:px-6 py-4 lg:py-5 border-b border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-900 tracking-wide uppercase">
                      Request Payments
                    </h3>
                    <p className="text-xs lg:text-sm text-gray-500 mt-1">
                      Create new remittance request
                    </p>
                  </div>
                  <div className="p-5 lg:p-6">
                    {/* Status Message */}
                    {message.text && (
                      <div
                        className={`rounded-lg p-3.5 mb-5 ${message.type === "error"
                          ? "bg-red-50 border border-red-200"
                          : "bg-emerald-50 border border-emerald-200"
                          }`}
                      >
                        <div
                          className={`text-sm font-medium ${message.type === "error"
                            ? "text-red-700"
                            : "text-emerald-700"
                            }`}
                        >
                          {message.text}
                        </div>
                      </div>
                    )}

                    {/* Reset Beneficiary Button */}
                    {hasFetchedBeneficiary && (
                      <div className="mb-5 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-500">
                              Beneficiary Information
                            </p>
                            {benefCode && (
                              <p className="text-lg font-semibold text-gray-900 mt-1">
                                {benefCode}
                              </p>
                            )}
                            <p className="text-xs text-gray-400 mt-1">
                              Bank accounts loaded successfully
                            </p>
                          </div>
                          <div className="w-9 h-9 bg-white border border-gray-200 rounded-full flex items-center justify-center">
                            <svg
                              className="w-4 h-4 text-emerald-600"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                              />
                            </svg>
                          </div>
                        </div>
                      </div>
                    )}

                    {senders.length > 0 && (
                      <div className="mb-5">
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Senders
                          </label>
                          <div className="flex space-x-3">
                            <button
                              type="button"
                              onClick={handleSelectAllSenders}
                              className="text-xs text-gray-900 hover:text-gray-600 font-medium"
                            >
                              Select All
                            </button>
                            <button
                              type="button"
                              onClick={handleClearAllSenders}
                              className="text-xs text-gray-400 hover:text-gray-600 font-medium"
                            >
                              Clear All
                            </button>
                          </div>
                        </div>

                        <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg">
                          {sendersLoading ? (
                            <div className="p-3 text-center text-gray-500 text-sm">
                              Loading senders...
                            </div>
                          ) : (
                            senders.map((sender) => (
                              <div
                                key={sender.id}
                                className={`flex items-center p-3 border-b border-gray-100 last:border-b-0 cursor-pointer transition-colors ${selectedSenders.includes(sender.id)
                                  ? "bg-gray-50"
                                  : "hover:bg-gray-50"
                                  }`}
                                onClick={() => handleSenderSelection(sender.id)}
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedSenders.includes(sender.id)}
                                  onChange={() =>
                                    handleSenderSelection(sender.id)
                                  }
                                  className="h-4 w-4 text-gray-900 focus:ring-gray-900 border-gray-300 rounded"
                                />
                                <div className="ml-3 flex-1">
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-gray-900">
                                      {sender.full_name}
                                    </span>
                                    {selectedSenders.includes(sender.id) && (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                        Selected
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-xs text-gray-400 mt-0.5">
                                    {sender.email} • {sender.phone}
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>

                        {selectedSenders.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs text-gray-500">
                              {selectedSenders.length} sender(s) selected
                            </p>
                          </div>
                        )}

                        {senders.length === 0 && !sendersLoading && (
                          <div className="text-center py-4 text-gray-400 text-sm">
                            No senders available for this beneficiary
                          </div>
                        )}
                      </div>
                    )}

                    <form
                      onSubmit={handleSubmit}
                      className="space-y-4 lg:space-y-5"
                    >
                      {/* Bank Account Selection - Only show when beneficiary data is loaded */}
                      {hasFetchedBeneficiary && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Destination Account
                          </label>
                          <select
                            name="beneficiary_bank_id"
                            value={formData.beneficiary_bank_id}
                            onChange={handleChange}
                            className={`block w-full px-3.5 py-2.5 rounded-lg border bg-white text-sm ${errors.beneficiary_bank_id
                              ? "border-red-300 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                              : "border-gray-200 focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                              } focus:outline-none transition-colors`}
                          >
                            <option value="">Select bank account</option>
                            {beneficiaryData?.benef_banks?.map((bank) => (
                              <option key={bank.id} value={bank.id}>
                                {getBankDisplayText(bank)}
                              </option>
                            ))}
                          </select>
                          {errors.beneficiary_bank_id && (
                            <p className="mt-1.5 text-sm text-red-600 flex items-center">
                              <svg
                                className="w-4 h-4 mr-1"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              {errors.beneficiary_bank_id}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Amount and Currency - Only show when beneficiary data is loaded */}
                      {hasFetchedBeneficiary && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                              Amount
                            </label>
                            <input
                              type="number"
                              name="amount"
                              value={formData.amount}
                              onChange={handleChange}
                              min="1"
                              step="0.01"
                              className={`block w-full px-3.5 py-2.5 rounded-lg border bg-white text-sm ${errors.amount
                                ? "border-red-300 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                                : "border-gray-200 focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                                } focus:outline-none transition-colors`}
                              placeholder="0.00"
                            />
                            {errors.amount && (
                              <p className="mt-1.5 text-sm text-red-600 flex items-center">
                                <svg
                                  className="w-4 h-4 mr-1"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                                {errors.amount}
                              </p>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                              Currency
                            </label>
                            <select
                              name="currency"
                              value={formData.currency}
                              onChange={handleChange}
                              disabled={currenciesLoading}
                              className={`block w-full px-3.5 py-2.5 rounded-lg border bg-white text-sm ${errors.currency
                                ? "border-red-300 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                                : "border-gray-200 focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                                } focus:outline-none transition-colors disabled:bg-gray-50`}
                            >
                              <option value="">Select currency</option>
                              {currencies.map((currency, index) => (
                                <option
                                  key={getCurrencyValue(currency) || index}
                                  value={getCurrencyValue(currency)}
                                >
                                  {getCurrencyDisplayText(currency)}
                                </option>
                              ))}
                            </select>
                            {errors.currency && (
                              <p className="mt-1.5 text-sm text-red-600 flex items-center">
                                <svg
                                  className="w-4 h-4 mr-1"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                                {errors.currency}
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {hasFetchedBeneficiary && (
                        <button
                          type="submit"
                          disabled={
                            loading ||
                            !formData.beneficiary_bank_id ||
                            !getAuthToken()
                          }
                          className={`w-full py-3 px-6 rounded-lg font-medium text-white text-sm focus:outline-none transition-colors ${loading ||
                            !formData.beneficiary_bank_id ||
                            !getAuthToken()
                            ? "bg-gray-300 cursor-not-allowed"
                            : "bg-gray-900 hover:bg-gray-800"
                            }`}
                        >
                          {loading ? (
                            <div className="flex items-center justify-center">
                              <svg
                                className="animate-spin -ml-1 mr-2.5 h-4 w-4 text-white"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                              >
                                <circle
                                  className="opacity-25"
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                ></circle>
                                <path
                                  className="opacity-75"
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                ></path>
                              </svg>
                              Processing Request...
                            </div>
                          ) : !getAuthToken() ? (
                            "Authentication Required"
                          ) : (
                            <div className="flex items-center justify-center">
                              <svg
                                className="w-4 h-4 mr-2"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                                />
                              </svg>
                              Initiate Transfer
                            </div>
                          )}
                        </button>
                      )}
                    </form>

                    {/* Success Section with Enhanced Link Sharing */}
                    {requestRemitLink && (
                      <div className="mt-5 p-5 bg-emerald-50 border border-emerald-200 rounded-xl">
                        <div className="text-center">
                          <div className="mx-auto h-11 w-11 bg-white rounded-full flex items-center justify-center mb-3 border border-emerald-200">
                            <svg
                              className="h-5 w-5 text-emerald-600"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          </div>
                          <h4 className="text-base font-semibold text-emerald-900 mb-1.5">
                            Transfer Initiated
                          </h4>
                          <p className="text-emerald-700 mb-4 text-sm">
                            Your remittance request has been queued for
                            processing.
                          </p>

                          {/* Enhanced Link Section with Copy and Share */}
                          <div className="bg-white rounded-lg p-4 mb-4 border border-emerald-200">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                Tracking Link
                              </p>
                              <div className="flex items-center space-x-3">
                                {/* Copy Button */}
                                <button
                                  onClick={handleCopyLink}
                                  className="flex items-center text-xs text-gray-700 hover:text-gray-900 font-medium transition-colors"
                                  title="Copy to clipboard"
                                >
                                  {copySuccess ? (
                                    <>
                                      <svg
                                        className="w-3.5 h-3.5 mr-1 text-emerald-600"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M5 13l4 4L19 7"
                                        />
                                      </svg>
                                      <span className="text-emerald-600">
                                        Copied!
                                      </span>
                                    </>
                                  ) : (
                                    <>
                                      <svg
                                        className="w-3.5 h-3.5 mr-1"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                        />
                                      </svg>
                                      Copy
                                    </>
                                  )}
                                </button>

                                {/* Share Button */}
                                <button
                                  onClick={() => setShowSharePopup(true)}
                                  className="flex items-center text-xs text-gray-700 hover:text-gray-900 font-medium transition-colors"
                                  title="Share via email"
                                >
                                  <svg
                                    className="w-3.5 h-3.5 mr-1"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                    />
                                  </svg>
                                  Email
                                </button>
                              </div>
                            </div>
                            <a
                              href={requestRemitLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-gray-700 hover:text-gray-900 break-all text-xs font-mono font-medium underline block text-left"
                            >
                              {requestRemitLink}
                            </a>
                          </div>

                          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                            <a
                              href={requestRemitLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 inline-flex justify-center items-center px-4 py-2.5 text-sm font-medium rounded-lg text-white bg-gray-900 hover:bg-gray-800 transition-colors"
                            >
                              <svg
                                className="w-4 h-4 mr-2"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                />
                              </svg>
                              Open Link
                            </a>
                            <button
                              onClick={handleSendAnother}
                              className="flex-1 inline-flex justify-center items-center px-4 py-2.5 border border-gray-200 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                            >
                              <svg
                                className="w-4 h-4 mr-2"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                />
                              </svg>
                              New Request
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column - Status and Transactions - Only show when beneficiary data is loaded */}
              {hasFetchedBeneficiary && (
                <div className="xl:col-span-2 space-y-6 lg:space-y-8">
                  {/* Request Status Section */}
                  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="px-5 lg:px-6 py-4 lg:py-5 border-b border-gray-200 flex justify-between items-center">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900 tracking-wide uppercase">
                          Request Status
                        </h3>
                        <p className="text-xs lg:text-sm text-gray-500 mt-1">
                          Recent remittance requests
                        </p>
                      </div>
                      <button
                        onClick={fetchAllData}
                        className="flex items-center text-xs lg:text-sm text-gray-500 hover:text-gray-900 font-medium transition-colors"
                      >
                        <svg
                          className="w-3.5 h-3.5 lg:w-4 lg:h-4 mr-1"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                          />
                        </svg>
                        Refresh
                      </button>
                    </div>
                    <div className="p-5 lg:p-6">
                      {statusLoading ? (
                        <div className="text-center py-6 lg:py-8">
                          <div className="animate-spin rounded-full h-6 w-6 lg:h-8 lg:w-8 border-2 border-gray-200 border-t-gray-900 mx-auto"></div>
                          <p className="text-gray-500 mt-2 text-sm font-medium">
                            Loading requests...
                          </p>
                        </div>
                      ) : requestStatus.length > 0 ? (
                        <div className="space-y-3">
                          {requestStatus.map((request) => (
                            <div
                              key={request.id}
                              className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3.5 lg:p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                            >
                              <div className="flex items-center space-x-3.5 mb-2 sm:mb-0">
                                <div className="w-9 h-9 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-center">
                                  <svg
                                    className="w-4 h-4 text-gray-600"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                    />
                                  </svg>
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900 text-sm">
                                    {request.amount} {request.currency}
                                  </p>
                                  <p className="text-xs lg:text-sm text-gray-500">
                                    {request.created_at
                                      ? new Date(
                                        request.created_at
                                      ).toLocaleDateString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                        year: "numeric",
                                      })
                                      : "N/A"}
                                  </p>
                                </div>
                              </div>
                              {request.request_remit_link && (
                                <div className="flex items-center space-x-3 sm:text-right">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      copyToClipboard(request.request_remit_link)
                                    }
                                    className="flex items-center text-xs text-gray-600 hover:text-gray-900 font-medium transition-colors"
                                    title="Copy request link"
                                  >
                                    <svg
                                      className="w-3.5 h-3.5 mr-1"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                      />
                                    </svg>
                                    Copy Link
                                  </button>
                                  <a
                                    href={request.request_remit_link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center text-xs text-gray-600 hover:text-gray-900 font-medium transition-colors"
                                    title="Open request link"
                                  >
                                    <svg
                                      className="w-3.5 h-3.5 mr-1"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                      />
                                    </svg>
                                    Open
                                  </a>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6 lg:py-8">
                          <div className="mx-auto h-12 w-12 bg-gray-50 border border-gray-200 rounded-full flex items-center justify-center mb-3">
                            <svg
                              className="h-5 w-5 text-gray-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                              />
                            </svg>
                          </div>
                          <h3 className="text-sm font-semibold text-gray-900 mb-1.5">
                            No requests found
                          </h3>
                          <p className="text-gray-500 text-sm">
                            Create your first remittance request to get started.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Transactions Section */}
                  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="px-5 lg:px-6 py-4 lg:py-5 border-b border-gray-200 flex justify-between items-center">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900 tracking-wide uppercase">
                          Transaction History
                        </h3>
                        <p className="text-xs lg:text-sm text-gray-500 mt-1">
                          Recent completed transactions
                        </p>
                      </div>
                      <button
                        onClick={fetchAllData}
                        className="flex items-center text-xs lg:text-sm text-gray-500 hover:text-gray-900 font-medium transition-colors"
                      >
                        <svg
                          className="w-3.5 h-3.5 lg:w-4 lg:h-4 mr-1"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                          />
                        </svg>
                        Refresh
                      </button>
                    </div>
                    <div className="p-5 lg:p-6">
                      {transactionsLoading ? (
                        <div className="text-center py-6 lg:py-8">
                          <div className="animate-spin rounded-full h-6 w-6 lg:h-8 lg:w-8 border-2 border-gray-200 border-t-gray-900 mx-auto"></div>
                          <p className="text-gray-500 mt-2 text-sm font-medium">
                            Loading transactions...
                          </p>
                        </div>
                      ) : transactions.length > 0 ? (
                        <div className="space-y-3">
                          {transactions.map((transaction) => (
                            <div
                              key={transaction.id}
                              className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3.5 lg:p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                            >
                              <div className="flex items-center space-x-3.5 mb-2 sm:mb-0">
                                <div
                                  className={`w-9 h-9 rounded-lg flex items-center justify-center border ${transaction.direction === "Inbound"
                                    ? "bg-emerald-50 border-emerald-200"
                                    : "bg-gray-50 border-gray-200"
                                    }`}
                                >
                                  <svg
                                    className={`w-4 h-4 ${transaction.direction === "Inbound"
                                      ? "text-emerald-600"
                                      : "text-gray-600"
                                      }`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    {transaction.direction === "Inbound" ? (
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                      />
                                    ) : (
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                                      />
                                    )}
                                  </svg>
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900 text-sm">
                                    {transaction.id}
                                  </p>
                                  <p className="text-xs lg:text-sm text-gray-500">
                                    {transaction.amount} {transaction.currency}
                                  </p>
                                  {transaction.fee_amount &&
                                    parseFloat(transaction.fee_amount) > 0 && (
                                      <p className="text-xs text-gray-400">
                                        Fee: {transaction.fee_amount}
                                      </p>
                                    )}
                                </div>
                              </div>
                              <div className="sm:text-right">
                                {getStatusDisplay(transaction.status)}
                                <p className="text-xs text-gray-400 mt-1.5 font-medium">
                                  {transaction.created_at
                                    ? new Date(
                                      transaction.created_at
                                    ).toLocaleDateString("en-US", {
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                    })
                                    : "N/A"}
                                </p>
                                {transaction.direction && (
                                  <p className="text-xs text-gray-400 mt-0.5 font-medium">
                                    {transaction.direction}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6 lg:py-8">
                          <div className="mx-auto h-12 w-12 bg-gray-50 border border-gray-200 rounded-full flex items-center justify-center mb-3">
                            <svg
                              className="h-5 w-5 text-gray-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                              />
                            </svg>
                          </div>
                          <h3 className="text-sm font-semibold text-gray-900 mb-1.5">
                            No transactions yet
                          </h3>
                          <p className="text-gray-500 text-sm">
                            Completed transactions will appear here.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>


      {/* Share Popup */}
      <SharePopup
        isOpen={showSharePopup}
        onClose={() => setShowSharePopup(false)}
        requestRemitLink={requestRemitLink}
        emailForm={emailForm}
        onEmailFormChange={handleEmailFormChange}
        onEmailSend={sendEmailDirectly}
        onCopyLink={handleCopyLink}
      />
    </div>
  );
}

export default BenefHome;