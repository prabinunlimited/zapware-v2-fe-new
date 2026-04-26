// page/Team/Team.jsx
import React, { useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  AiOutlineEdit,
  AiOutlineDelete,
  AiOutlinePlus,
  AiOutlineUser,
  AiOutlineMail,
  AiOutlinePhone,
  AiOutlineInfoCircle,
} from "react-icons/ai";
import { FaArrowLeft } from "react-icons/fa";
import { FiUserPlus, FiUsers } from "react-icons/fi";
import { HiOutlineUserGroup } from "react-icons/hi";
import { RingLoader } from "react-spinners";
import { motion, AnimatePresence } from "framer-motion";
import { usePartnerConfig } from "../../hooks/usePartnerConfig";
import { useTeamActions, useTeamState } from "./Hooks/useTeamActions";

const Team = () => {
  const { customerId: urlCustomerId } = useParams();
  const navigate = useNavigate();
  
  // Get customerId from URL or localStorage
  const customerId = urlCustomerId && urlCustomerId !== "undefined" && urlCustomerId !== "null" 
    ? urlCustomerId 
    : localStorage.getItem("customerId");

  // Redux state and actions
  const { teamMembers, loading, deletingId, isInitialized, error } =
    useTeamState();
  const { loadTeamMembers, removeTeamMember, resetError } = useTeamActions();

  const authToken = localStorage.getItem("authtoken");
  const API_URL = import.meta.env.VITE_API_URL;

  const config = usePartnerConfig(authToken);
  const headerColor =
    config?.header_color || localStorage.getItem("header_color");
  const textColor = config?.text_color || localStorage.getItem("text_color");

  // Function to handle text color style
  const getTextColorStyle = () => {
    if (textColor && textColor.startsWith("text-")) {
      return { className: textColor };
    } else if (textColor && textColor.startsWith("#")) {
      return { style: { color: textColor } };
    }
    return {};
  };

  // Function to handle header color style
  const getHeaderColorStyle = () => {
    if (headerColor && headerColor.startsWith("bg-")) {
      return { className: headerColor };
    } else if (headerColor && headerColor.startsWith("#")) {
      return { style: { backgroundColor: headerColor } };
    }
    return { className: "bg-blue-600" }; // Default fallback
  };

  const textColorProps = getTextColorStyle();
  const headerColorProps = getHeaderColorStyle();

  // Store customerId in localStorage when valid
  useEffect(() => {
    if (customerId && customerId !== "undefined" && customerId !== "null") {
      localStorage.setItem("customerId", customerId);
    }
  }, [customerId]);

  // Validate customerId and load team members
  useEffect(() => {
    if (!authToken) {
      toast.error("Authentication token is missing. Please log in.", {
        position: "bottom-right",
        autoClose: 5000,
      });
      navigate("/");
      return;
    }

    if (!customerId || customerId === "undefined" || customerId === "null") {
      toast.error("Customer ID is missing. Please refresh the page or contact support.", {
        position: "bottom-right",
        autoClose: 5000,
      });
      return;
    }

    loadTeamMembers(customerId, authToken, API_URL);
  }, [customerId, authToken, navigate, loadTeamMembers, API_URL]);

  // Handle errors from Redux
  useEffect(() => {
    if (error) {
      toast.error(error, {
        position: "bottom-right",
        autoClose: 5000,
      });
      resetError();
    }
  }, [error, resetError]);

  const handleAddMember = useCallback(() => {
    const validCustomerId = customerId || localStorage.getItem("customerId");
    
    if (!validCustomerId || validCustomerId === "undefined" || validCustomerId === "null") {
      toast.error("Customer ID is missing. Cannot add team member.", {
        position: "bottom-right",
        autoClose: 5000,
      });
      return;
    }
    
    navigate(`/addteam/${validCustomerId}`);
  }, [customerId, navigate]);

  const handleDeleteMember = async (staffId) => {
    if (!window.confirm("Are you sure you want to delete this team member?"))
      return;

    try {
      const result = await removeTeamMember(staffId, authToken, API_URL);
      if (result.type === "team/deleteTeamMember/fulfilled") {
        toast.success("Team member deleted successfully", {
          position: "bottom-right",
          autoClose: 3000,
        });
        // Reload team members after deletion
        const validCustomerId = customerId || localStorage.getItem("customerId");
        if (validCustomerId) {
          loadTeamMembers(validCustomerId, authToken, API_URL);
        }
      }
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  const handleEditMember = useCallback((staffId) => {
    if (!isInitialized) {
      toast.info("Please wait while we finish loading team data", {
        position: "bottom-right",
        autoClose: 3000,
      });
      return;
    }

    const validCustomerId = customerId || localStorage.getItem("customerId");
    
    if (!validCustomerId || validCustomerId === "undefined" || validCustomerId === "null") {
      toast.error("Customer ID is missing. Cannot edit team member.", {
        position: "bottom-right",
        autoClose: 5000,
      });
      return;
    }

    if (!staffId) {
      toast.error("Staff ID is missing. Cannot edit team member.", {
        position: "bottom-right",
        autoClose: 5000,
      });
      return;
    }

    navigate(`/editmember/${validCustomerId}/${staffId}`);
  }, [customerId, isInitialized, navigate]);

  // If no customerId, show error state
  if (!customerId || customerId === "undefined" || customerId === "null") {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-gray-50 to-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-red-800 mb-2">Invalid Customer ID</h2>
            <p className="text-red-600 mb-6">Customer ID is missing or invalid. Please go back and try again.</p>
            <button
              onClick={() => navigate(-1)}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-50 to-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 space-y-4 sm:space-y-0">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center space-x-3"
          >
            <div
              className={`p-3 rounded-xl ${
                headerColorProps?.className ?? "bg-blue-100 text-blue-600"
              }`}
            >
              <HiOutlineUserGroup className="text-2xl text-white" />
            </div>

            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
                Team Members
              </h1>
              <p className="text-gray-600 mt-1">
                Manage your organization's team and their access
              </p>
            </div>
          </motion.div>

          <motion.button
            onClick={handleAddMember}
            className={`text-white py-2.5 px-5 rounded-lg shadow-lg flex items-center space-x-2 ${headerColorProps.className}`}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <FiUserPlus className="text-xl" />
            <span className="font-medium">Add Member</span>
          </motion.button>
        </div>

        {loading ? (
          <motion.div
            className="flex justify-center py-16 bg-white rounded-xl shadow-sm border border-gray-200"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <RingLoader size={48} color="#3b82f6" />
          </motion.div>
        ) : teamMembers.length === 0 ? (
          <motion.div
            className="flex flex-col items-center justify-center py-20 bg-white rounded-xl shadow-sm border border-gray-200 text-center"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              className="h-24 w-24 rounded-full bg-blue-50 flex items-center justify-center mb-6"
              animate={{
                rotate: [0, 5, -5, 0],
                scale: [1, 1.05, 1],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                repeatType: "reverse",
              }}
            >
              <FiUsers className="text-blue-500 text-4xl" />
            </motion.div>
            <h3 className="text-2xl font-semibold text-gray-800 mb-3">
              No team members found
            </h3>
            <p className="text-gray-600 max-w-md mb-6">
              Add team members to your organization to get started with
              collaboration and management.
            </p>
            <motion.button
              onClick={handleAddMember}
              className={`text-white py-2.5 px-6 rounded-lg shadow-md flex items-center space-x-2 hover:bg-blue-700 transition-all ${headerColorProps.className}`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
            >
              <AiOutlinePlus className="text-lg" />
              <span>Add Your First Member</span>
            </motion.button>
          </motion.div>
        ) : (
          <motion.div
            className="bg-white shadow-sm rounded-xl overflow-hidden border border-gray-200"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead
                  className={`text-white ${headerColorProps?.className ?? ""}`}
                  style={headerColorProps?.style}
                >
                  <tr>
                    <th className="py-4 px-6 text-left text-sm font-medium uppercase tracking-wider">
                      <div className="flex items-center">
                        <AiOutlineUser className="mr-2 text-blue-200" />
                        <span>Name</span>
                      </div>
                    </th>
                    <th className="py-4 px-6 text-left text-sm font-medium uppercase tracking-wider">
                      <div className="flex items-center">
                        <AiOutlineMail className="mr-2 text-blue-200" />
                        <span>Email</span>
                      </div>
                    </th>
                    <th className="py-4 px-6 text-left text-sm font-medium uppercase tracking-wider">
                      <div className="flex items-center">
                        <AiOutlinePhone className="mr-2 text-blue-200" />
                        <span>Phone</span>
                      </div>
                    </th>
                    <th className="py-4 px-6 text-center text-sm font-medium uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <AnimatePresence>
                    {teamMembers.map((member) => (
                      <motion.tr
                        key={member.staff_id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="hover:bg-blue-50/30 transition-colors"
                        layout
                      >
                        <td className="py-4 px-6 whitespace-nowrap">
                          <div className="flex items-center">
                            <motion.div
                              className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center mr-3"
                              whileHover={{ scale: 1.1 }}
                            >
                              <AiOutlineUser className="text-blue-600" />
                            </motion.div>
                            <div>
                              <div className="font-medium text-gray-900">
                                {member.first_name} {member.middle_name || ""}{" "}
                                {member.last_name}
                              </div>
                              {member.role && (
                                <motion.div
                                  className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full mt-1 inline-block"
                                  whileHover={{ scale: 1.05 }}
                                >
                                  {member.role}
                                </motion.div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap">
                          <div className="flex items-center text-gray-700">
                            <AiOutlineMail className="mr-2 text-blue-400" />
                            <span className="truncate max-w-xs">
                              {member.email}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap">
                          <div className="flex items-center text-gray-700">
                            <AiOutlinePhone className="mr-2 text-blue-400" />
                            <span>
                              {member.phone_number_country_code || member.mobilenumber_countrycode}{" "}
                              {member.phone_no || member.mobile_number}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center space-x-3">
                            <motion.button
                              onClick={() => handleEditMember(member.staff_id)}
                              className="text-blue-600 hover:text-blue-800 p-1.5 rounded-full hover:bg-blue-50 transition-colors"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              title="Edit member"
                              disabled={!isInitialized}
                            >
                              <AiOutlineEdit className="text-xl" />
                            </motion.button>
                            <motion.button
                              onClick={() =>
                                handleDeleteMember(member.staff_id)
                              }
                              className="text-red-500 hover:text-red-700 p-1.5 rounded-full hover:bg-red-50 transition-colors"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              disabled={
                                deletingId === member.staff_id || !isInitialized
                              }
                              title="Delete member"
                            >
                              {deletingId === member.staff_id ? (
                                <RingLoader size={20} color="#ef4444" />
                              ) : (
                                <AiOutlineDelete className="text-xl" />
                              )}
                            </motion.button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
            <motion.div
              className={`px-6 py-3 bg-gray-50 border-t border-gray-200 text-sm flex items-center justify-between ${
                textColorProps?.className ?? "text-gray-500"
              }`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center">
                <AiOutlineInfoCircle className="mr-2 text-blue-500" />
                Showing {teamMembers.length} team member
                {teamMembers.length !== 1 ? "s" : ""}
              </div>
            </motion.div>
          </motion.div>
        )}

        <div className="flex justify-center items-center mt-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-blue-600 border border-blue-600 hover:bg-blue-50 transition-colors duration-200 font-medium"
          >
            <FaArrowLeft className="text-blue-600" />
            <span>Back to Dashboard</span>
          </button>
        </div>
      </div>
      <ToastContainer
        position="bottom-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        toastClassName="shadow-lg rounded-xl overflow-hidden border border-gray-200"
        progressClassName="bg-gradient-to-r from-blue-500 to-blue-600"
      />
    </div>
  );
};

export default Team;