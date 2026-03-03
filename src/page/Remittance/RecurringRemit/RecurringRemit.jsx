// src/page/RecurringRemit/index.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { RingLoader } from "react-spinners";
import { Plus } from "lucide-react";
import RecurringRemitEdit from "../../../components/PopupModal/RecurringRemitEdit";
import AddRecurringRemitPopup from "../../../components/PopupModal/AddRecurringRemit";

const RecurringRemit = () => {
  const { customerId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [remittanceList, setRemittanceList] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedRecurringRemittanceId, setSelectedRecurringRemittanceId] =
    useState(null);
  const [notification, setNotification] = useState({
    show: false,
    message: "",
    type: "",
  });
  const [processingStatus, setProcessingStatus] = useState({
    id: null,
    action: "",
  });

  const customerUuid = localStorage.getItem("customerUuid");
  const bearerToken = localStorage.getItem("bearertoken");
  const uuidToUse = customerUuid || customerId;
  const API_URL = import.meta.env.VITE_API_URL;

  const fetchRemittanceList = useCallback(
    async (showLoading = true) => {
      if (!uuidToUse || !bearerToken) {
        setError("No customer UUID or token found");
        setLoading(false);
        return;
      }

      try {
        if (showLoading) setLoading(true);
        const endpoint = `${API_URL}/recurring-remittance/list/${uuidToUse}`;
        const response = await fetch(endpoint, {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${bearerToken}`,
          },
        });

        const responseText = await response.text();
        let parsedData = JSON.parse(responseText);

        if (parsedData.status === "success") {
          setRemittanceList(parsedData);
          setError(null);
        } else {
          throw new Error(parsedData.message || "Failed to fetch list");
        }
      } catch (err) {
        setError(err.message || "Failed to fetch recurring remittance list");
      } finally {
        setLoading(false);
      }
    },
    [uuidToUse, bearerToken, API_URL],
  );

  useEffect(() => {
    fetchRemittanceList();
  }, [fetchRemittanceList]);

  const handleOpenEditModal = (id) => {
    setSelectedRecurringRemittanceId(id);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedRecurringRemittanceId(null);
  };

  const handleOpenAddModal = () => {
    setIsAddModalOpen(true);
  };

  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
  };

  const handleAddRecurringRemit = (newData) => {
    // Add the new item to the list
    if (remittanceList && remittanceList.data) {
      setRemittanceList({
        ...remittanceList,
        data: [...remittanceList.data, newData],
      });
    }

    // Show success notification
    setNotification({
      show: true,
      message: "Recurring Remittance Added Successfully",
      type: "success",
    });

    setTimeout(() => {
      setNotification({ show: false, message: "", type: "" });
    }, 3000);

    // Refresh the list in the background
    fetchRemittanceList(false);
  };

  const handleSaveEdit = (updatedData) => {
    if (remittanceList && remittanceList.data) {
      const updatedArray = remittanceList.data.map((item) => {
        const itemId = item.recurringRemittanceId || item.recurringId;
        if (itemId === updatedData.recurring_remittance_id) {
          return {
            ...item,
            amount: updatedData.source_amount,
            frequency: updatedData.recurring_frequency,
          };
        }
        return item;
      });
      setRemittanceList({ ...remittanceList, data: updatedArray });
    }
    fetchRemittanceList(false);
    handleCloseEditModal();
  };

  const handleViewDetails = (id) => {
    navigate(`/recurring-remit/${uuidToUse}/${id}`);
  };

  const handleStatusUpdate = async (recurringRemittanceId, currentStatus) => {
    const newStatus = currentStatus === "Y" ? "N" : "Y";
    const action = newStatus === "Y" ? "Activated" : "Deactivated";
    const processingAction =
      newStatus === "Y" ? "Activating..." : "Deactivating...";

    setProcessingStatus({
      id: recurringRemittanceId,
      action: processingAction,
    });

    try {
      const endpoint = `${API_URL}/recurring-remittance/update-status`;
      const customerUuid = localStorage.getItem("customerUuid");

      const payload = {
        recurring_remittance_id: recurringRemittanceId,
        recurring_active_status: newStatus,
        source: "zap",
        author_type: "customer",
        author_id: customerUuid,
      };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${bearerToken}`,
        },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json();

      if (responseData.status === "success") {
        if (remittanceList && remittanceList.data) {
          const updatedArray = remittanceList.data.map((item) => {
            if (
              (item.recurringRemittanceId || item.recurringId) ===
              recurringRemittanceId
            ) {
              return { ...item, activeStatus: newStatus };
            }
            return item;
          });
          setRemittanceList({ ...remittanceList, data: updatedArray });
        }

        setNotification({
          show: true,
          message: `Recurring Remit Successfully ${action}`,
          type: "success",
        });

        setTimeout(() => {
          setNotification({ show: false, message: "", type: "" });
        }, 3000);
      } else {
        throw new Error(
          responseData.message ||
            `Failed to ${action.toLowerCase()} recurring remit`,
        );
      }
    } catch (err) {
      setNotification({
        show: true,
        message:
          err.message || `Failed to ${action.toLowerCase()} recurring remit`,
        type: "error",
      });

      setTimeout(() => {
        setNotification({ show: false, message: "", type: "" });
      }, 3000);
    } finally {
      setProcessingStatus({ id: null, action: "" });
    }
  };

  if (loading && !remittanceList) {
    return (
      <div className="p-6 flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-lg">Loading recurring remittances...</span>
      </div>
    );
  }

  if (error && !remittanceList) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700 font-semibold">⚠️ Error Loading Data</p>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Recurring Remittances</h1>
        <button
          onClick={handleOpenAddModal}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Recurring Remit
        </button>
      </div>

      {/* Notification Display */}
      {notification.show && (
        <div
          className={`mb-4 p-4 rounded-lg ${
            notification.type === "success"
              ? "bg-green-100 text-green-800 border border-green-200"
              : "bg-red-100 text-red-800 border border-red-200"
          }`}
        >
          {notification.message}
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">
            Recurring Remittance List
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                  Next Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {remittanceList?.data?.map((item, index) => {
                const itemId = item.recurringRemittanceId || item.recurringId;
                const isProcessing = processingStatus.id === itemId;

                return (
                  <tr
                    key={index}
                    className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                      {itemId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {item.amount || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${item.activeStatus === "Y" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                      >
                        {item.activeStatus === "Y" ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.nextDate || "Not scheduled"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleViewDetails(itemId)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                          disabled={isProcessing}
                        >
                          View Details
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(itemId)}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                          disabled={isProcessing}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() =>
                            handleStatusUpdate(itemId, item.activeStatus)
                          }
                          className={`px-4 py-2 rounded-lg text-white flex items-center justify-center min-w-[110px] ${
                            item.activeStatus === "Y"
                              ? "bg-red-600 hover:bg-red-700"
                              : "bg-teal-600 hover:bg-teal-700"
                          } disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200`}
                          disabled={isProcessing}
                        >
                          {isProcessing ? (
                            <>
                              <RingLoader size={18} color="#ffffff" />
                              <span className="ml-2">
                                {processingStatus.action}
                              </span>
                            </>
                          ) : item.activeStatus === "Y" ? (
                            "Deactivate"
                          ) : (
                            "Activate"
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && (
        <RecurringRemitEdit
          isOpen={isEditModalOpen}
          onSave={handleSaveEdit}
          onClose={handleCloseEditModal}
          recurringRemittanceId={selectedRecurringRemittanceId}
          customerId={customerId}
        />
      )}

      <AddRecurringRemitPopup
        isOpen={isAddModalOpen}
        onClose={handleCloseAddModal}
        onSave={handleAddRecurringRemit}
        customerId={customerId}
      />
    </div>
  );
};

export default RecurringRemit;
