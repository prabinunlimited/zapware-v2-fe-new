// C:\xampp\htdocs\zapware-v2-fe-sandbox\src\page\Remittance\RecurringRemit\RecurringRemit.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

const RecurringRemit = () => {
  const { customerId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [remittanceList, setRemittanceList] = useState(null);

  // Get customerUuid from localStorage
  const customerUuid = localStorage.getItem("customerUuid");
  // Get bearer token from localStorage
  const bearerToken = localStorage.getItem("bearertoken");

  // Use customerUuid from localStorage if available, otherwise fall back to URL param
  const uuidToUse = customerUuid || customerId;

  const API_URL =
    import.meta.env.VITE_API_URL;

  console.log("🎯 RecurringRemit List Page loaded! Customer UUID:", uuidToUse);
  console.log("🔑 Bearer Token available:", !!bearerToken);

  // Fetch list data when component mounts
  useEffect(() => {
    const fetchRemittanceList = async () => {
      if (!uuidToUse) {
        setError("No customer UUID found");
        setLoading(false);
        return;
      }

      if (!bearerToken) {
        setError("No bearer token found in localStorage. Please login again.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const endpoint = `${API_URL}/recurring-remittance/list/${uuidToUse}`;

        console.log("🌐 Fetching list from:", endpoint);

        const response = await fetch(endpoint, {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${bearerToken}`,
          },
        });

        console.log("📡 Response status:", response.status);

        const responseText = await response.text();

        // Check for HTML response
        if (
          responseText.trim().startsWith("<!DOCTYPE") ||
          responseText.trim().startsWith("<html") ||
          responseText.includes("<html>")
        ) {
          throw new Error(
            `Server returned HTML page. Status: ${response.status}`,
          );
        }

        let parsedData;
        try {
          parsedData = JSON.parse(responseText);
        } catch (parseError) {
          console.error("❌ JSON Parse Error:", parseError);
          throw new Error(
            `Invalid JSON response: ${responseText.substring(0, 100)}...`,
          );
        }

        console.log("📦 Parsed API Response:", parsedData);

        if (parsedData.status === "success") {
          setRemittanceList(parsedData);
          setError(null);
        } else {
          throw new Error(
            parsedData.message || "Failed to fetch remittance list",
          );
        }
      } catch (err) {
        console.error("❌ Error fetching remittance list:", err);
        setError(err.message || "Failed to fetch recurring remittance list");
        setRemittanceList(null);
      } finally {
        setLoading(false);
      }
    };

    fetchRemittanceList();
  }, [uuidToUse, bearerToken, API_URL]);

  // Handle view details button click
  const handleViewDetails = (recurringRemittanceId) => {
    console.log("🔍 Navigating to details for:", recurringRemittanceId);
    navigate(`/recurring-remit/${uuidToUse}/${recurringRemittanceId}`);
  };

  // Loading state
  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Recurring Remittances</h1>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-lg">Loading recurring remittances...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Recurring Remittances</h1>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-red-700 font-semibold">⚠️ Error Loading Data</p>
          <p className="text-red-600">{error}</p>
          {!bearerToken && (
            <p className="mt-2 text-red-600 font-medium">
              Missing Bearer Token! Please check localStorage for "bearertoken"
            </p>
          )}
        </div>
      </div>
    );
  }

  // No data state
  if (
    !remittanceList ||
    !remittanceList.data ||
    remittanceList.data.length === 0
  ) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Recurring Remittances</h1>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-700 font-semibold">
            ℹ️ No Recurring Remittances Found
          </p>
          <p>No recurring remittances found for customer: {uuidToUse}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Recurring Remittances</h1>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <p className="text-green-700 font-semibold">
          ✓ Recurring remittances loaded successfully!
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
          <div>
            <p className="text-sm font-medium text-gray-600">Customer UUID:</p>
            <p className="font-mono text-sm break-all">{uuidToUse}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">
              Total Remittances:
            </p>
            <p className="text-lg font-semibold text-green-600">
              {remittanceList.data.length}
            </p>
          </div>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          API Status:{" "}
          <span className="font-semibold text-green-600">
            {remittanceList.status}
          </span>{" "}
          - {remittanceList.message}
        </p>
      </div>

      {/* Remittance List Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">
            Recurring Remittance List
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Click "View Details" to see detailed information and transactions
            for each remittance
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Recurring Remittance ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Next Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {remittanceList.data.map((item, index) => (
                <tr
                  key={index}
                  className={
                    index % 2 === 0
                      ? "bg-white"
                      : "bg-gray-50 hover:bg-gray-100"
                  }
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-mono text-gray-900">
                      {item.recurringRemittanceId || item.recurringId}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900">
                      {item.amount || "N/A"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        item.activeStatus === "Y"
                          ? "bg-green-100 text-green-800"
                          : item.activeStatus === "N"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {item.activeStatus === "Y"
                        ? "Active"
                        : item.activeStatus === "N"
                          ? "Inactive"
                          : item.activeStatus || "Unknown"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.nextDate || "Not scheduled"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() =>
                        handleViewDetails(
                          item.recurringRemittanceId || item.recurringId,
                        )
                      }
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      <svg
                        className="w-4 h-4 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Showing{" "}
              <span className="font-semibold">
                {remittanceList.data.length}
              </span>{" "}
              recurring remittance(s)
            </div>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Refresh List
            </button>
          </div>
        </div>
      </div>

      {/* Debug Info */}
      <details className="mt-8">
        <summary className="cursor-pointer text-sm font-medium text-gray-500 hover:text-gray-700">
          Debug Information
        </summary>
        <div className="mt-2 p-4 bg-gray-100 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <h4 className="font-semibold mb-2">API Response:</h4>
              <pre className="bg-white p-2 rounded overflow-auto max-h-48">
                {JSON.stringify(remittanceList, null, 2)}
              </pre>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Request Details:</h4>
              <ul className="space-y-1">
                <li className="font-mono text-xs break-all">
                  Endpoint:{" "}
                  {`${API_URL}/recurring-remittance/list/${uuidToUse}`}
                </li>
                <li>Customer UUID: {uuidToUse}</li>
                <li>
                  Bearer Token: {bearerToken ? "✓ Available" : "✗ Missing"}
                </li>
                <li>Data Count: {remittanceList.data.length}</li>
                <li>API Status: {remittanceList.status}</li>
                <li>Message: {remittanceList.message}</li>
              </ul>
            </div>
          </div>
        </div>
      </details>
    </div>
  );
};

export default RecurringRemit;
