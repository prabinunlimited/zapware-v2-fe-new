// src/components/ViewChargesPopup/ViewChargesPopup.jsx
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { 
  IoClose, 
  IoInformationCircle, 
  IoDownload, 
  IoRefresh,
  IoSearch
} from "react-icons/io5";
import { FiArrowUpRight, FiAlertCircle } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { ClipLoader } from "react-spinners";

// Import Redux actions and selectors for charges
import {
  fetchChargesData,
  clearChargesData,
  selectChargesData,
  selectChargesLoading,
  selectChargesError,
} from "../Dashboard/Header/headerSlice";

const ViewChargesPopup = ({ isOpen, onClose, customerId, authtoken }) => {
  const dispatch = useDispatch();
  
  // Redux selectors for charges data
  const charges = useSelector(selectChargesData);
  const chargesLoading = useSelector(selectChargesLoading);
  const chargesError = useSelector(selectChargesError);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [lastRefreshed, setLastRefreshed] = useState(null);

  // Fetch charges when popup opens
  useEffect(() => {
    if (isOpen && customerId && authtoken) {
      console.log("🔍 Fetching charges data for customer:", customerId);
      dispatch(fetchChargesData({ customerId, authtoken }));
      setLastRefreshed(new Date());
    }

    // Cleanup when popup closes
    return () => {
      if (!isOpen) {
        // Only clear if we're actually closing
        setTimeout(() => {
          dispatch(clearChargesData());
        }, 300); // Small delay to allow smooth close animation
      }
    };
  }, [isOpen, customerId, authtoken, dispatch]);

  // Handle refresh
  const handleRefresh = () => {
    if (customerId && authtoken && !chargesLoading) {
      console.log("🔄 Refreshing charges data...");
      dispatch(fetchChargesData({ customerId, authtoken }));
      setLastRefreshed(new Date());
    }
  };

  // Filter charges based on search term
  const filteredCharges = React.useMemo(() => {
    if (!searchTerm) return charges;
    
    return charges.filter(charge =>
      charge.currency?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      charge.fx_charges?.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
      charge.local_transfer?.toString().toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [charges, searchTerm]);

  // Sort charges
  const sortedCharges = React.useMemo(() => {
    if (!sortConfig.key) return filteredCharges;

    return [...filteredCharges].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      
      // Handle numeric values
      if (!isNaN(parseFloat(aValue)) && !isNaN(parseFloat(bValue))) {
        const numA = parseFloat(aValue);
        const numB = parseFloat(bValue);
        return sortConfig.direction === 'asc' ? numA - numB : numB - numA;
      }
      
      // Handle string values
      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [filteredCharges, sortConfig]);

  const handleSort = (key) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleExport = () => {
    if (sortedCharges.length === 0) return;
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Currency,FX Charges,Local Transfer,Minimum Balance,Monthly Maintenance\n"
      + sortedCharges.map(charge => 
          `"${charge.currency || ''}","${charge.fx_charges || ''}","${charge.local_transfer || ''}","${charge.minimum_balance || ''}","${charge.monthly_maintenance_charge || ''}"`
        ).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `charges_summary_${customerId}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatCurrencyValue = (value) => {
    if (!value || value === "N/A" || value === "0" || value === "0.00" || value === "0.0") return "-";
    
    // Format numeric values
    if (!isNaN(parseFloat(value))) {
      const numValue = parseFloat(value);
      if (numValue === 0) return "-";
      return numValue.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    }
    
    return value;
  };

  const getChargeColor = (value, type = 'default') => {
    if (!value || value === "N/A" || value === "0" || value === "0.00" || value === "0.0") {
      return 'text-gray-500 bg-gray-100';
    }
    
    const numericValue = parseFloat(value);
    if (isNaN(numericValue)) return 'text-gray-700 bg-gray-100';
    
    switch (type) {
      case 'fx':
        return numericValue > 0 ? 'text-red-700 bg-red-50 border border-red-200' : 'text-green-700 bg-green-50 border border-green-200';
      case 'maintenance':
        return numericValue > 0 ? 'text-orange-700 bg-orange-50 border border-orange-200' : 'text-green-700 bg-green-50 border border-green-200';
      case 'balance':
        return numericValue > 0 ? 'text-blue-700 bg-blue-50 border border-blue-200' : 'text-green-700 bg-green-50 border border-green-200';
      default:
        return numericValue > 0 ? 'text-purple-700 bg-purple-50 border border-purple-200' : 'text-green-700 bg-green-50 border border-green-200';
    }
  };

  const getChargeStats = () => {
    const total = charges.length;
    const withFxCharges = charges.filter(c => {
      const value = parseFloat(c.fx_charges);
      return !isNaN(value) && value > 0;
    }).length;
    const withMaintenance = charges.filter(c => {
      const value = parseFloat(c.monthly_maintenance_charge);
      return !isNaN(value) && value > 0;
    }).length;

    return { total, withFxCharges, withMaintenance };
  };

  const stats = getChargeStats();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-2xl">
              <div className="flex items-center space-x-3">
                <motion.div 
                  className="p-2 bg-blue-100 rounded-lg"
                  whileHover={{ scale: 1.05, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <IoInformationCircle className="w-6 h-6 text-blue-600" />
                </motion.div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">
                    Charges Summary
                  </h2>
                  <p className="text-sm text-gray-600 mt-1 flex items-center">
                    View all applicable charges and fees
                    {lastRefreshed && (
                      <span className="text-xs text-gray-500 ml-2 flex items-center">
                        <span className="w-1 h-1 bg-gray-400 rounded-full mr-1"></span>
                        Updated {lastRefreshed.toLocaleTimeString()}
                      </span>
                    )}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {/* Refresh Button */}
                <motion.button
                  onClick={handleRefresh}
                  disabled={chargesLoading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  <IoRefresh className={`w-4 h-4 ${chargesLoading ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </motion.button>

                {/* Export Button */}
                {sortedCharges.length > 0 && (
                  <motion.button
                    onClick={handleExport}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
                  >
                    <IoDownload className="w-4 h-4" />
                    <span>Export</span>
                  </motion.button>
                )}
                
                {/* Close Button */}
                <motion.button
                  onClick={onClose}
                  whileHover={{ scale: 1.1, backgroundColor: "rgba(0,0,0,0.05)" }}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
                >
                  <IoClose className="w-6 h-6" />
                </motion.button>
              </div>
            </div>

            {/* Search and Stats Bar */}
            <div className="p-6 border-b border-gray-100 bg-white">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <motion.input
                      type="text"
                      placeholder="Search currencies or amounts..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      whileFocus={{ scale: 1.02 }}
                      className="pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64 transition-all shadow-sm"
                    />
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                      <IoSearch className="w-4 h-4" />
                    </div>
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm('')}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <IoClose className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  
                  {searchTerm && (
                    <motion.span 
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="text-sm text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full border"
                    >
                      {sortedCharges.length} result{sortedCharges.length !== 1 ? 's' : ''}
                    </motion.span>
                  )}
                </div>

                <div className="flex items-center space-x-6 text-sm">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                    <div className="text-gray-500 text-xs">Total Currencies</div>
                  </div>
                  <div className="w-px h-8 bg-gray-300"></div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{stats.withFxCharges}</div>
                    <div className="text-gray-500 text-xs">With FX Charges</div>
                  </div>
                  <div className="w-px h-8 bg-gray-300"></div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{stats.withMaintenance}</div>
                    <div className="text-gray-500 text-xs">With Maintenance</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden">
              {chargesLoading ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-16"
                >
                  <ClipLoader size={40} color="#3B82F6" />
                  <p className="mt-4 text-gray-600 font-medium">Loading charges information...</p>
                  <p className="text-sm text-gray-500 mt-2">Fetching the latest charges data</p>
                </motion.div>
              ) : chargesError ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center py-16 text-center"
                >
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                    <FiAlertCircle className="w-8 h-8 text-red-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Unable to Load Charges</h3>
                  <p className="text-gray-600 max-w-md mb-4">{chargesError}</p>
                  <div className="flex space-x-3">
                    <motion.button
                      onClick={handleRefresh}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      Try Again
                    </motion.button>
                    <motion.button
                      onClick={onClose}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                    >
                      Close
                    </motion.button>
                  </div>
                </motion.div>
              ) : sortedCharges.length > 0 ? (
                <div className="overflow-auto max-h-[50vh]">
                  <table className="w-full">
                    <thead className="bg-gray-50 sticky top-0 shadow-sm">
                      <tr>
                        {[
                          { key: 'currency', label: 'Currency', width: 'w-1/5' },
                          { key: 'fx_charges', label: 'FX Charges', width: 'w-1/5' },
                          { key: 'local_transfer', label: 'Local Transfer', width: 'w-1/5' },
                          { key: 'minimum_balance', label: 'Minimum Balance', width: 'w-1/5' },
                          { key: 'monthly_maintenance_charge', label: 'Monthly Maintenance', width: 'w-1/5' }
                        ].map(({ key, label, width }) => (
                          <th
                            key={key}
                            className={`py-4 px-6 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors group ${width}`}
                            onClick={() => handleSort(key)}
                          >
                            <div className="flex items-center space-x-2">
                              <span>{label}</span>
                              <div className="flex flex-col">
                                {sortConfig.key === key ? (
                                  <motion.span
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className={`text-blue-500 ${sortConfig.direction === 'desc' ? 'rotate-180' : ''}`}
                                  >
                                    <FiArrowUpRight className="w-3 h-3" />
                                  </motion.span>
                                ) : (
                                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                    <FiArrowUpRight className="w-2 h-2 text-gray-400" />
                                  </div>
                                )}
                              </div>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {sortedCharges.map((charge, index) => (
                        <motion.tr
                          key={charge.id || `charge-${index}`}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.03 }}
                          className="hover:bg-blue-50/50 transition-colors group border-b border-gray-100 last:border-b-0"
                          whileHover={{ backgroundColor: "rgba(59, 130, 246, 0.05)" }}
                        >
                          <td className="py-4 px-6">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold shadow-md">
                                {charge.currency?.charAt(0) || 'C'}
                              </div>
                              <div>
                                <span className="font-semibold text-gray-800 block text-sm">
                                  {charge.currency || 'N/A'}
                                </span>
                                <span className="text-xs text-gray-500 font-medium">
                                  {charge.currency_code || 'Currency'}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <span className={`inline-flex px-3 py-1.5 rounded-full text-sm font-semibold ${getChargeColor(charge.fx_charges, 'fx')} transition-all group-hover:scale-105`}>
                              {formatCurrencyValue(charge.fx_charges)}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <span className={`inline-flex px-3 py-1.5 rounded-full text-sm font-semibold ${getChargeColor(charge.local_transfer)} transition-all group-hover:scale-105`}>
                              {formatCurrencyValue(charge.local_transfer)}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <span className={`inline-flex px-3 py-1.5 rounded-full text-sm font-semibold ${getChargeColor(charge.minimum_balance, 'balance')} transition-all group-hover:scale-105`}>
                              {formatCurrencyValue(charge.minimum_balance)}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <span className={`inline-flex px-3 py-1.5 rounded-full text-sm font-semibold ${getChargeColor(charge.monthly_maintenance_charge, 'maintenance')} transition-all group-hover:scale-105`}>
                              {formatCurrencyValue(charge.monthly_maintenance_charge)}
                            </span>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center justify-center py-16 text-center"
                >
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
                    <IoInformationCircle className="w-12 h-12 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    {searchTerm ? 'No matching charges found' : 'No charges available'}
                  </h3>
                  <p className="text-gray-600 max-w-md mb-6">
                    {searchTerm 
                      ? `No charges found for "${searchTerm}". Try searching with different terms.`
                      : 'There are no charges configured for your account at this time.'
                    }
                  </p>
                  {searchTerm ? (
                    <motion.button
                      onClick={() => setSearchTerm('')}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-6 py-2.5 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium"
                    >
                      Clear Search
                    </motion.button>
                  ) : (
                    <motion.button
                      onClick={handleRefresh}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      Check Again
                    </motion.button>
                  )}
                </motion.div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-100 bg-gray-50/80 rounded-b-2xl backdrop-blur-sm">
              <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
                <div className="text-sm text-gray-600 flex items-center space-x-4">
                  <span className="font-medium">Customer ID: <span className="text-gray-800">{customerId}</span></span>
                  <span className="w-px h-4 bg-gray-300"></span>
                  <span>Showing: <span className="font-semibold text-blue-600">{sortedCharges.length}</span> of <span className="font-semibold">{charges.length}</span> records</span>
                </div>
                <div className="flex space-x-3">
                  <motion.button
                    onClick={handleExport}
                    disabled={sortedCharges.length === 0}
                    whileHover={{ scale: sortedCharges.length > 0 ? 1.02 : 1 }}
                    whileTap={{ scale: sortedCharges.length > 0 ? 0.98 : 1 }}
                    className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-colors shadow-sm ${
                      sortedCharges.length === 0
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:shadow-md'
                    }`}
                  >
                    <IoDownload className="w-4 h-4" />
                    <span>Export CSV</span>
                  </motion.button>
                  <motion.button
                    onClick={onClose}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm hover:shadow-md"
                  >
                    Close Summary
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ViewChargesPopup;