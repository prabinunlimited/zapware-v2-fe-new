// C:\xampp\htdocs\zapware-v2-fe-sandbox\src\page\Remittance\RecurringRemit\RecurringRemitDetail.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

const RecurringRemitDetail = () => {
  const { customerId, recurringRemittanceId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("details");
  const [loading, setLoading] = useState({
    details: true,
    transactions: true,
  });
  const [error, setError] = useState({
    details: null,
    transactions: null,
  });
  const [data, setData] = useState({
    details: null,
    transactions: null,
  });

  // Get bearer token from localStorage
  const bearerToken = localStorage.getItem("bearertoken");

  const API_URL =
    import.meta.env.VITE_API_URL ||
    "https://zapware.unlimitedremit.com";

  console.log("🎯 RecurringRemit Detail Page loaded!");
  console.log("📌 Customer ID:", customerId);
  console.log("📌 Recurring Remittance ID:", recurringRemittanceId);

  // Fetch details and transactions when component mounts
  useEffect(() => {
    if (!recurringRemittanceId || !bearerToken) return;

    // Fetch details
    fetchData("details");

    // Fetch transactions
    fetchData("transactions");
  }, [recurringRemittanceId, bearerToken]);

  const fetchData = async (tabId) => {
    if (!recurringRemittanceId || !bearerToken) return;

    let endpoint = "";

    switch (tabId) {
      case "details":
        endpoint = `${API_URL}/recurring-remittance/detail/${recurringRemittanceId}`;
        break;
      case "transactions":
        endpoint = `${API_URL}/recurring-remittance/transactions/${recurringRemittanceId}`;
        break;
      default:
        return;
    }

    console.log(`🌐 Fetching ${tabId} from:`, endpoint);
    setLoading((prev) => ({ ...prev, [tabId]: true }));
    setError((prev) => ({ ...prev, [tabId]: null }));

    try {
      const headers = {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${bearerToken}`,
      };

      const response = await fetch(endpoint, {
        method: "GET",
        headers: headers,
      });

      console.log(`📡 ${tabId} response status:`, response.status);

      const responseText = await response.text();

      // Check for HTML response
      if (
        responseText.trim().startsWith("<!DOCTYPE") ||
        responseText.trim().startsWith("<html") ||
        responseText.includes("<html>")
      ) {
        throw new Error(
          `Server returned HTML instead of JSON. Status: ${response.status}`,
        );
      }

      let parsedData;
      try {
        parsedData = JSON.parse(responseText);
      } catch (parseError) {
        console.error(`❌ JSON Parse Error for ${tabId}:`, parseError);
        throw new Error(
          `Invalid JSON response: ${responseText.substring(0, 100)}...`,
        );
      }

      console.log(`📦 ${tabId} parsed data:`, parsedData);

      if (parsedData.status === "success") {
        setData((prev) => ({ ...prev, [tabId]: parsedData }));
        setError((prev) => ({ ...prev, [tabId]: null }));
      } else {
        throw new Error(parsedData.message || `Failed to fetch ${tabId}`);
      }
    } catch (err) {
      console.error(`❌ Error fetching ${tabId}:`, err);
      setError((prev) => ({
        ...prev,
        [tabId]: err.message || `Failed to fetch ${tabId} data`,
      }));
      setData((prev) => ({ ...prev, [tabId]: null }));
    } finally {
      setLoading((prev) => ({ ...prev, [tabId]: false }));
    }
  };

  // Handle back button click
  const handleBack = () => {
    navigate(`/recurring-remit/${customerId}`);
  };

  // Tab configurations
  const tabs = [
    { id: "details", label: "Remittance Details" },
    { id: "transactions", label: "Transaction Details" },
  ];

  // Handle tab click
  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
  };

  // Render content based on active tab
  const renderTabContent = () => {
    const currentData = data[activeTab];
    const currentError = error[activeTab];
    const currentLoading = loading[activeTab];

    if (currentLoading) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-lg">
            Loading {tabs.find((t) => t.id === activeTab)?.label}...
          </span>
        </div>
      );
    }

    if (currentError) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-red-700 font-semibold">⚠️ Error Loading Data</p>
          <p className="text-red-600 mt-2">{currentError}</p>
        </div>
      );
    }

    if (!currentData || !currentData.data || currentData.data.length === 0) {
      return (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <p className="text-yellow-700 font-semibold">ℹ️ No Data Available</p>
          <p>
            No {tabs.find((t) => t.id === activeTab)?.label} found for this
            recurring remittance.
          </p>
        </div>
      );
    }

    switch (activeTab) {
      case "details":
        return renderDetailsTab(currentData);
      case "transactions":
        return renderTransactionsTab(currentData);
      default:
        return null;
    }
  };

  // Render Details Tab
  const renderDetailsTab = (detailsData) => {
    const detailItem = detailsData.data[0];

    const detailsGroups = [
      {
        title: "Basic Information",
        items: [
          { label: "Recurring ID", value: detailItem.recurringId },
          { label: "Amount", value: detailItem.amount },
          {
            label: "Status",
            value: detailItem.activeStatus === "Y" ? "Active" : "Inactive",
          },
          { label: "Next Date", value: detailItem.nextDate },
          { label: "Frequency", value: detailItem.frequency },
        ],
      },
      {
        title: "Currency & Amount",
        items: [
          { label: "Source Amount", value: detailItem.source_amount },
          { label: "Source Currency", value: detailItem.source_currency },
          {
            label: "Destination Currency",
            value: detailItem.destination_currency,
          },
          { label: "Payment Method", value: detailItem.payment_method },
          { label: "Custom Days", value: detailItem.custom_days || "Not set" },
        ],
      },
      {
        title: "Beneficiary Information",
        items: [
          { label: "Beneficiary Name", value: detailItem.beneficiary_name },
          {
            label: "Bank Account Number",
            value: detailItem.beneficiary_bank_account_number,
          },
        ],
      },
    ];

    return (
      <div className="space-y-6">
        {detailsGroups.map((group, groupIndex) => (
          <div
            key={groupIndex}
            className="bg-white rounded-lg border border-gray-200 overflow-hidden"
          >
            <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">
                {group.title}
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {group.items.map((item, itemIndex) => (
                  <div key={itemIndex} className="space-y-1">
                    <dt className="text-sm font-medium text-gray-500">
                      {item.label}
                    </dt>
                    <dd className="text-base font-semibold text-gray-900 break-words">
                      {item.value || (
                        <span className="text-gray-400 italic">
                          Not specified
                        </span>
                      )}
                    </dd>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Render Transactions Tab
  const renderTransactionsTab = (transactionsData) => {
    const transactions = transactionsData.data;

    const getStatusColor = (status) => {
      switch (status?.toLowerCase()) {
        case "completed":
        case "success":
          return "bg-green-100 text-green-800";
        case "processing":
        case "processing-payout":
          return "bg-yellow-100 text-yellow-800";
        case "failed":
        case "cancelled":
          return "bg-red-100 text-red-800";
        default:
          return "bg-gray-100 text-gray-800";
      }
    };

    const getDirectionColor = (direction) => {
      switch (direction?.toLowerCase()) {
        case "inbound":
          return "bg-blue-100 text-blue-800";
        case "outbound":
          return "bg-purple-100 text-purple-800";
        default:
          return "bg-gray-100 text-gray-800";
      }
    };

    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Transaction ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Direction
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Currencies
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Date & Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Beneficiary
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transactions.map((transaction, index) => (
                <tr
                  key={index}
                  className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                    {transaction.transaction_id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900">
                      {transaction.source_amount} {transaction.source_currency}
                    </div>
                    <div className="text-xs text-gray-500">
                      → {transaction.destination_amount}{" "}
                      {transaction.destination_currency}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDirectionColor(transaction.direction)}`}
                    >
                      {transaction.direction}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}
                    >
                      {transaction.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {transaction.source_currency} →{" "}
                    {transaction.destination_currency}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {transaction.transaction_datetime}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {transaction.beneficiary_name}
                    </div>
                    <div className="text-xs text-gray-500">
                      Acc: {transaction.beneficiary_bank_account_number}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Refresh current tab data
  const refreshCurrentTab = () => {
    if (!loading[activeTab]) {
      setData((prev) => ({ ...prev, [activeTab]: null }));
      fetchData(activeTab);
    }
  };

  return (
    <div className="p-6">
      {/* Header with Back Button */}
      <div className="flex items-center mb-6">
        <button
          onClick={handleBack}
          className="mr-4 p-2 rounded-lg hover:bg-gray-100 transition-colors"
          title="Back to list"
        >
          <svg
            className="w-6 h-6 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
        </button>
        <div>
          <h1 className="text-2xl font-bold">Recurring Remittance Details</h1>
          <p className="text-sm text-gray-600">
            Recurring ID:{" "}
            <span className="font-mono">{recurringRemittanceId}</span>
          </p>
        </div>
        <div className="ml-auto">
          <button
            onClick={refreshCurrentTab}
            disabled={loading[activeTab]}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading[activeTab] ? "Refreshing..." : "Refresh Tab"}
          </button>
        </div>
      </div>

      {/* Status Summary */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-600">Customer ID:</p>
            <p className="font-mono text-sm break-all">{customerId}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Recurring ID:</p>
            <p className="font-mono text-sm break-all">
              {recurringRemittanceId}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Bearer Token:</p>
            <p
              className={`font-mono text-sm ${bearerToken ? "text-green-600" : "text-red-600"}`}
            >
              {bearerToken ? "✓ Available" : "✗ Not found"}
            </p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm
                ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }
                ${loading[tab.id] ? "opacity-50 cursor-wait" : "cursor-pointer"}
              `}
              disabled={loading[tab.id]}
            >
              {tab.label}
              {loading[tab.id] && (
                <span className="ml-2 inline-block animate-spin rounded-full h-3 w-3 border-b-2 border-current"></span>
              )}
              {data[tab.id] && !loading[tab.id] && (
                <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-green-600 bg-green-100 rounded-full">
                  ✓
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-4">{renderTabContent()}</div>

      {/* Debug Info */}
      {/* <details className="mt-8">
        <summary className="cursor-pointer text-sm font-medium text-gray-500 hover:text-gray-700">
          Debug Information
        </summary>
        <div className="mt-2 p-4 bg-gray-100 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <h4 className="font-semibold mb-2">Current Tab Data:</h4>
              <pre className="bg-white p-2 rounded overflow-auto max-h-48">
                {JSON.stringify(data[activeTab], null, 2)}
              </pre>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Endpoints:</h4>
              <ul className="space-y-1">
                <li className="font-mono text-xs break-all">
                  Details:{" "}
                  {`${API_URL}/recurring-remittance/detail/${recurringRemittanceId}`}
                </li>
                <li className="font-mono text-xs break-all">
                  Transactions:{" "}
                  {`${API_URL}/recurring-remittance/transactions/${recurringRemittanceId}`}
                </li>
              </ul>
              <div className="mt-4">
                <h4 className="font-semibold mb-2">Status:</h4>
                <ul className="space-y-1">
                  <li>Active Tab: {activeTab}</li>
                  <li>Details Loaded: {data.details ? "Yes" : "No"}</li>
                  <li>
                    Transactions Loaded: {data.transactions ? "Yes" : "No"}
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </details> */}
    </div>
  );
};

export default RecurringRemitDetail;
