// BeneficiaryDetailsPopup.jsx
import React, { useState, useEffect } from "react";
import {
  FaUser, FaPhone, FaEnvelope, FaMapMarkerAlt, FaBuilding, FaFlag,
  FaCalendarAlt, FaMoneyBillWave, FaIdCard, FaUserFriends, FaTimes,
  FaUniversity, FaInfoCircle, FaGlobe, FaCreditCard,
  FaBuilding as FaBank, FaCheckCircle, FaCopy, FaHeart, FaStar, FaRegHeart,
} from "react-icons/fa";
import { motion, AnimatePresence, useAnimation } from "framer-motion";

const BeneficiaryDetailsPopup = ({ beneficiary, onClose }) => {
  const [activeTab, setActiveTab] = useState("personal");
  const [isFavorite, setIsFavorite] = useState(false);
  const [showCopied, setShowCopied] = useState(false);
  const controls = useAnimation();

  if (!beneficiary) return null;

  useEffect(() => {
    controls.start("visible");
  }, [controls]);

  const handleFavorite = () => setIsFavorite(!isFavorite);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric", month: "long", day: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  };

  const formatDateShort = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric", month: "short", day: "numeric",
    });
  };

  const getBankDetails = (beneficiary) => {
    if (beneficiary.banks && Array.isArray(beneficiary.banks) && beneficiary.banks.length > 0) {
      return beneficiary.banks;
    }
    if (beneficiary.bank_name || beneficiary.bank_acc_no || beneficiary.bank_code) {
      return [{
        bank_name: beneficiary.bank_name,
        bank_acc_no: beneficiary.bank_acc_no,
        account_number: beneficiary.bank_acc_no,
        bank_code: beneficiary.bank_code,
        ifsc: beneficiary.ifsc,
        swift_code: beneficiary.swift_code || beneficiary.bic_code,
        routing_number: beneficiary.routing_number,
        currency: beneficiary.currency,
        currency_code: beneficiary.currency_code,
        rails: beneficiary.rails,
        payment_method: beneficiary.payment_method,
        bank_branch: beneficiary.bank_branch,
        bank_address: beneficiary.bank_address,
        bank_city: beneficiary.bank_city,
        bank_state: beneficiary.bank_state,
        bank_country: beneficiary.bank_country,
        nameInBankAc: beneficiary.nameInBankAc,
        account_type: beneficiary.account_type,
        ...beneficiary,
      }];
    }
    return [];
  };

  const banks = getBankDetails(beneficiary);

  const getCountryName = (beneficiary) => {
    if (beneficiary.beneficiarycountryname) return beneficiary.beneficiarycountryname;
    if (beneficiary.country) return beneficiary.country;
    if (beneficiary.country_id) return `Country ID: ${beneficiary.country_id}`;
    return "N/A";
  };

  const getStatusDisplay = (beneficiary) => {
    const isActive =
      beneficiary.status === 1 || beneficiary.active_status === 1 ||
      beneficiary.status === "1" || beneficiary.active_status === "1";

    const verificationStatus =
      beneficiary.verification_status !== undefined && beneficiary.verification_status !== null
        ? parseInt(beneficiary.verification_status)
        : null;

    if (verificationStatus === 1) return {
      text: "Verified", color: "text-green-600", bg: "bg-green-100",
      icon: React.createElement(FaCheckCircle, { className: "text-green-500" }),
    };
    if (verificationStatus === 0) return {
      text: "Pending Verification", color: "text-yellow-600", bg: "bg-yellow-100",
      icon: React.createElement(FaInfoCircle, { className: "text-yellow-500" }),
    };
    if (isActive) return {
      text: "Active", color: "text-green-600", bg: "bg-green-100",
      icon: React.createElement(FaCheckCircle, { className: "text-green-500" }),
    };
    return {
      text: "Inactive", color: "text-red-600", bg: "bg-red-100",
      icon: React.createElement(FaTimes, { className: "text-red-500" }),
    };
  };

  const statusInfo = getStatusDisplay(beneficiary);

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text);
    setShowCopied(field);
    setTimeout(() => setShowCopied(null), 2000);
  };

  const tabs = [
    { id: "personal",   label: "Personal Info", icon: React.createElement(FaUser) },
    { id: "address",    label: "Address",        icon: React.createElement(FaMapMarkerAlt) },
    { id: "banking",    label: "Bank Details",   icon: React.createElement(FaUniversity) },
    { id: "additional", label: "Additional",     icon: React.createElement(FaInfoCircle) },
  ];

  const containerVariants = {
    hidden: { opacity: 0, scale: 0.8, y: 50 },
    visible: {
      opacity: 1, scale: 1, y: 0,
      transition: { type: "spring", damping: 25, stiffness: 300, staggerChildren: 0.1 },
    },
    exit: { opacity: 0, scale: 0.8, y: 50, transition: { duration: 0.3 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.4 } },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: {
      opacity: 1, y: 0, scale: 1,
      transition: { type: "spring", stiffness: 200, damping: 20 },
    },
    hover: { scale: 1.02, transition: { duration: 0.2 } },
  };

  const heartVariants = {
    idle: { scale: 1 },
    pulse: { scale: [1, 1.2, 1], transition: { duration: 0.3, ease: "easeInOut" } },
  };

  return React.createElement(
    AnimatePresence,
    null,
    React.createElement(
      motion.div,
      {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-70 backdrop-blur-md",
        onClick: onClose,
      },
      React.createElement(
        motion.div,
        {
          variants: containerVariants,
          initial: "hidden",
          animate: "visible",
          exit: "exit",
          // ✅ Main modal: overflow-hidden to clip all children
          className: "bg-gradient-to-br from-white via-gray-50 to-white rounded-3xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col",
          onClick: (e) => e.stopPropagation(),
        },

        // ─── Header ───────────────────────────────────────────────────────────
        React.createElement(
          motion.div,
          {
            initial: { y: -100 },
            animate: { y: 0 },
            transition: { type: "spring", stiffness: 200, damping: 20 },
            // ✅ Header section: overflow-hidden
            className: "relative bg-gradient-to-r from-blue-600 via-blue-500 to-purple-600 px-8 py-6 overflow-hidden flex-shrink-0",
          },
          React.createElement("div", {
            className: "absolute inset-0 opacity-10",
            children: React.createElement("div", {
              className: "absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\"60\" height=\"60\" viewBox=\"0 0 60 60\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"none\" fill-rule=\"evenodd\"%3E%3Cg fill=\"%23ffffff\" fill-opacity=\"0.4\"%3E%3Cpath d=\"M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] bg-repeat",
            }),
          }),
          React.createElement(
            "div",
            { className: "relative flex justify-between items-center" },
            React.createElement(
              "div",
              { className: "flex items-center gap-4 overflow-hidden" }, // ✅ overflow-hidden on flex row
              React.createElement(
                motion.div,
                {
                  initial: { scale: 0, rotate: -180 },
                  animate: { scale: 1, rotate: 0 },
                  transition: { type: "spring", stiffness: 260, damping: 20, delay: 0.2 },
                  className: "w-16 h-16 bg-white/20 rounded-2xl backdrop-blur-sm flex items-center justify-center shadow-lg flex-shrink-0",
                },
                React.createElement(FaUser, { className: "w-8 h-8 text-white" })
              ),
              React.createElement(
                "div",
                { className: "overflow-hidden" }, // ✅ overflow-hidden on text block
                React.createElement(
                  motion.h2,
                  {
                    initial: { x: -20, opacity: 0 },
                    animate: { x: 0, opacity: 1 },
                    transition: { delay: 0.1 },
                    className: "text-3xl font-bold text-white truncate", // ✅ truncate long names
                  },
                  beneficiary.name || "Beneficiary Details"
                ),
                React.createElement(
                  motion.p,
                  {
                    initial: { x: -20, opacity: 0 },
                    animate: { x: 0, opacity: 1 },
                    transition: { delay: 0.2 },
                    className: "text-blue-100 text-sm mt-1 truncate", // ✅ truncate long relationship text
                  },
                  beneficiary.relationtobenef || "No relationship specified"
                )
              )
            ),
            React.createElement(
              "div",
              { className: "flex gap-2 flex-shrink-0" },
              React.createElement(
                motion.button,
                {
                  whileHover: { scale: 1.1, rotate: 360 },
                  whileTap: { scale: 0.9 },
                  onClick: handleFavorite,
                  className: "p-3 bg-white/20 rounded-full backdrop-blur-sm hover:bg-white/30 transition-all",
                  animate: isFavorite ? "pulse" : "idle",
                  variants: heartVariants,
                },
                isFavorite
                  ? React.createElement(FaHeart, { className: "text-red-400" })
                  : React.createElement(FaRegHeart, { className: "text-white" })
              ),
              React.createElement(
                motion.button,
                {
                  whileHover: { scale: 1.1, rotate: 90 },
                  whileTap: { scale: 0.9 },
                  onClick: onClose,
                  className: "p-3 bg-white/20 rounded-full backdrop-blur-sm hover:bg-white/30 transition-all",
                },
                React.createElement(FaTimes, { className: "text-white" })
              )
            )
          ),
          React.createElement(
            motion.div,
            {
              initial: { scale: 0, x: 50 },
              animate: { scale: 1, x: 0 },
              transition: { delay: 0.3, type: "spring" },
              className: "absolute top-6 right-20 overflow-hidden", // ✅ overflow-hidden on status badge
            },
            React.createElement(
              "div",
              { className: `px-4 py-2 rounded-full ${statusInfo.bg} backdrop-blur-sm shadow-lg flex items-center gap-2` },
              statusInfo.icon,
              React.createElement("span", { className: `text-sm font-semibold ${statusInfo.color}` }, statusInfo.text)
            )
          )
        ),

        // ─── Tab Navigation ───────────────────────────────────────────────────
        React.createElement(
          "div",
          // ✅ Tab bar: overflow-hidden wrapper, overflow-x-auto on inner scroll row
          { className: "border-b border-gray-200 bg-white/50 backdrop-blur-sm sticky top-0 z-10 overflow-hidden flex-shrink-0" },
          React.createElement(
            "div",
            { className: "flex px-6 gap-2 overflow-x-auto scrollbar-hide" },
            tabs.map((tab, index) =>
              React.createElement(
                motion.button,
                {
                  key: tab.id,
                  initial: { y: -20, opacity: 0 },
                  animate: { y: 0, opacity: 1 },
                  transition: { delay: index * 0.1 },
                  whileHover: { scale: 1.05, y: -2 },
                  whileTap: { scale: 0.95 },
                  onClick: () => setActiveTab(tab.id),
                  className: `px-6 py-4 font-medium transition-all duration-300 flex items-center gap-2 relative whitespace-nowrap ${
                    activeTab === tab.id ? "text-blue-600" : "text-gray-500 hover:text-gray-700"
                  }`,
                },
                tab.icon,
                React.createElement("span", { className: "hidden sm:inline" }, tab.label),
                activeTab === tab.id &&
                  React.createElement(motion.div, {
                    layoutId: "activeTab",
                    className: "absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-600 to-purple-600",
                    initial: false,
                    transition: { type: "spring", stiffness: 500, damping: 30 },
                  })
              )
            )
          )
        ),

        // ─── Scrollable Content ───────────────────────────────────────────────
        React.createElement(
          "div",
          // ✅ Content area: overflow-y-auto with overflow-x-hidden to prevent horizontal bleed
          { className: "overflow-y-auto overflow-x-hidden flex-1" },
          React.createElement(
            "div",
            { className: "p-8" },
            React.createElement(
              AnimatePresence,
              { mode: "wait" },

              // ── Personal Tab ────────────────────────────────────────────────
              activeTab === "personal" &&
                React.createElement(
                  motion.div,
                  {
                    key: "personal",
                    initial: { opacity: 0, x: 20 },
                    animate: { opacity: 1, x: 0 },
                    exit: { opacity: 0, x: -20 },
                    transition: { duration: 0.3 },
                    className: "space-y-6 overflow-hidden", // ✅
                  },
                  React.createElement(
                    motion.div,
                    {
                      variants: cardVariants,
                      initial: "hidden",
                      animate: "visible",
                      whileHover: "hover",
                      // ✅ Personal card: overflow-hidden
                      className: "bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 shadow-lg overflow-hidden",
                    },
                    React.createElement(
                      "div",
                      { className: "flex items-center gap-3 mb-6 overflow-hidden" }, // ✅
                      React.createElement(
                        motion.div,
                        { animate: { rotate: 360 }, transition: { duration: 0.5, delay: 0.5 } },
                        React.createElement(FaInfoCircle, { className: "text-blue-600 text-2xl flex-shrink-0" })
                      ),
                      React.createElement("h3", { className: "text-xl font-bold text-gray-800 truncate" }, "Personal Information") // ✅ truncate
                    ),
                    React.createElement(
                      "div",
                      { className: "grid grid-cols-1 md:grid-cols-2 gap-6 overflow-hidden" }, // ✅
                      [
                        {
                          icon: React.createElement(FaUser),
                          label: "Full Name",
                          value:
                            beneficiary.name ||
                            (beneficiary.first_name && beneficiary.last_name
                              ? `${beneficiary.first_name || ""} ${beneficiary.middle_name || ""} ${beneficiary.last_name || ""}`.trim()
                              : "N/A"),
                        },
                        { icon: React.createElement(FaUserFriends), label: "Relationship", value: beneficiary.relationtobenef || beneficiary.relation || "N/A" },
                        {
                          icon: React.createElement(FaPhone),
                          label: "Phone Number",
                          value: beneficiary.full_phone_number || beneficiary.phone_number || "N/A",
                          extra: beneficiary.country_code ? `Country Code: +${beneficiary.country_code}` : null,
                        },
                        { icon: React.createElement(FaEnvelope), label: "Email Address", value: beneficiary.email || "N/A", copyable: true },
                        { icon: React.createElement(FaIdCard), label: "Beneficiary Type", value: beneficiary.beneftype || "Individual" },
                        { icon: React.createElement(FaFlag), label: "Nationality", value: beneficiary.nationality_id ? `ID: ${beneficiary.nationality_id}` : "N/A" },
                      ].map((field, idx) =>
                        React.createElement(
                          motion.div,
                          {
                            key: idx,
                            variants: itemVariants,
                            custom: idx,
                            // ✅ Field item: overflow-hidden to clip long values
                            className: "flex items-start gap-3 p-3 bg-white/50 rounded-xl hover:bg-white transition-all overflow-hidden",
                          },
                          React.createElement("div", { className: "text-blue-500 mt-1 flex-shrink-0" }, field.icon),
                          React.createElement(
                            "div",
                            { className: "flex-1 min-w-0 overflow-hidden" }, // ✅ min-w-0 + overflow-hidden for flex truncation
                            React.createElement("p", { className: "text-xs text-gray-500 font-medium uppercase tracking-wider" }, field.label),
                            React.createElement("p", { className: "font-semibold text-gray-900 mt-1 truncate" }, field.value), // ✅ truncate
                            field.extra && React.createElement("p", { className: "text-xs text-gray-500 mt-1 truncate" }, field.extra)
                          ),
                          field.copyable && field.value !== "N/A" &&
                            React.createElement(
                              motion.button,
                              {
                                whileHover: { scale: 1.1 },
                                whileTap: { scale: 0.9 },
                                onClick: () => copyToClipboard(field.value, field.label),
                                className: "text-gray-400 hover:text-blue-600 flex-shrink-0",
                              },
                              React.createElement(FaCopy)
                            )
                        )
                      )
                    )
                  )
                ),

              // ── Address Tab ─────────────────────────────────────────────────
              activeTab === "address" &&
                React.createElement(
                  motion.div,
                  {
                    key: "address",
                    initial: { opacity: 0, x: 20 },
                    animate: { opacity: 1, x: 0 },
                    exit: { opacity: 0, x: -20 },
                    transition: { duration: 0.3 },
                    className: "space-y-6 overflow-hidden", // ✅
                  },
                  (beneficiary.street || beneficiary.city || beneficiary.state || beneficiary.country_id || beneficiary.postalcode) ?
                    React.createElement(
                      motion.div,
                      {
                        variants: cardVariants,
                        initial: "hidden",
                        animate: "visible",
                        whileHover: "hover",
                        // ✅ Address card: overflow-hidden
                        className: "bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 shadow-lg overflow-hidden",
                      },
                      React.createElement(
                        "div",
                        { className: "flex items-center gap-3 mb-6 overflow-hidden" }, // ✅
                        React.createElement(
                          motion.div,
                          {
                            animate: { x: [-5, 5, -5] },
                            transition: { duration: 2, repeat: Infinity, repeatType: "reverse" },
                          },
                          React.createElement(FaMapMarkerAlt, { className: "text-green-600 text-2xl flex-shrink-0" })
                        ),
                        React.createElement("h3", { className: "text-xl font-bold text-gray-800 truncate" }, "Address Information") // ✅
                      ),
                      React.createElement(
                        "div",
                        { className: "grid grid-cols-1 md:grid-cols-2 gap-6 overflow-hidden" }, // ✅
                        [
                          { icon: React.createElement(FaBuilding),       label: "Street Address",  value: beneficiary.street },
                          { icon: React.createElement(FaMapMarkerAlt),   label: "City",             value: beneficiary.city },
                          { icon: React.createElement(FaMapMarkerAlt),   label: "State / Province", value: beneficiary.state },
                          { icon: React.createElement(FaFlag),           label: "Country",          value: getCountryName(beneficiary) },
                          { icon: React.createElement(FaMapMarkerAlt),   label: "Postal Code",      value: beneficiary.postalcode },
                        ].map(
                          (field, idx) =>
                            field.value &&
                            React.createElement(
                              motion.div,
                              {
                                key: idx,
                                variants: itemVariants,
                                // ✅ Field item: overflow-hidden
                                className: "flex items-start gap-3 p-3 bg-white/50 rounded-xl hover:bg-white transition-all overflow-hidden",
                              },
                              React.createElement("div", { className: "text-green-500 mt-1 flex-shrink-0" }, field.icon),
                              React.createElement(
                                "div",
                                { className: "min-w-0 overflow-hidden" }, // ✅
                                React.createElement("p", { className: "text-xs text-gray-500 font-medium uppercase tracking-wider" }, field.label),
                                React.createElement("p", { className: "font-semibold text-gray-900 mt-1 truncate" }, field.value) // ✅
                              )
                            )
                        )
                      )
                    ) :
                    React.createElement(
                      motion.div,
                      {
                        initial: { opacity: 0, scale: 0.9 },
                        animate: { opacity: 1, scale: 1 },
                        className: "text-center py-12 overflow-hidden", // ✅
                      },
                      React.createElement(FaMapMarkerAlt, { className: "text-gray-300 text-6xl mx-auto mb-4" }),
                      React.createElement("p", { className: "text-gray-500" }, "No address information available")
                    )
                ),

              // ── Banking Tab ─────────────────────────────────────────────────
              activeTab === "banking" &&
                React.createElement(
                  motion.div,
                  {
                    key: "banking",
                    initial: { opacity: 0, x: 20 },
                    animate: { opacity: 1, x: 0 },
                    exit: { opacity: 0, x: -20 },
                    transition: { duration: 0.3 },
                    className: "space-y-6 overflow-hidden", // ✅
                  },
                  banks.length > 0 ?
                    banks.map((bank, index) =>
                      React.createElement(
                        motion.div,
                        {
                          key: index,
                          variants: cardVariants,
                          initial: "hidden",
                          animate: "visible",
                          whileHover: "hover",
                          // ✅ Bank card: overflow-hidden
                          className: "bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 shadow-lg overflow-hidden",
                        },
                        React.createElement(
                          "div",
                          { className: "flex items-center gap-3 mb-6 overflow-hidden" }, // ✅
                          React.createElement(
                            motion.div,
                            {
                              animate: { rotate: [0, 360] },
                              transition: { duration: 20, repeat: Infinity, ease: "linear" },
                            },
                            React.createElement(FaUniversity, { className: "text-purple-600 text-2xl flex-shrink-0" })
                          ),
                          React.createElement(
                            "h3",
                            { className: "text-xl font-bold text-gray-800 truncate" }, // ✅
                            banks.length > 1 ? `Bank Account ${index + 1}` : "Banking Information"
                          )
                        ),
                        React.createElement(
                          "div",
                          { className: "grid grid-cols-1 md:grid-cols-2 gap-6 overflow-hidden" }, // ✅
                          [
                            { icon: React.createElement(FaUniversity),    label: "Bank Name",      value: bank.bank_name || bank.bankname },
                            { icon: React.createElement(FaMoneyBillWave), label: "Currency",       value: bank.currency_code || bank.currency },
                            { icon: React.createElement(FaCreditCard),    label: "Account Number", value: bank.bank_acc_no || bank.account_number, copyable: true },
                            { icon: React.createElement(FaUser),          label: "Account Holder", value: bank.nameInBankAc },
                            { icon: React.createElement(FaIdCard),        label: "Account Type",   value: bank.account_type },
                            { icon: React.createElement(FaInfoCircle),    label: "Payment Rails",  value: bank.rails || bank.payment_method },
                            { icon: React.createElement(FaIdCard),        label: "Bank Code",      value: bank.bank_code || bank.bankCode2 },
                            { icon: React.createElement(FaIdCard),        label: "IFSC Code",      value: bank.ifsc, copyable: true },
                            { icon: React.createElement(FaGlobe),         label: "SWIFT/BIC Code", value: bank.swift_code || bank.swift || bank.bic_code, copyable: true },
                            { icon: React.createElement(FaIdCard),        label: "Routing Number", value: bank.routing_number, copyable: true },
                            { icon: React.createElement(FaIdCard),        label: "Sort Code",      value: bank.sort_code, copyable: true },
                            { icon: React.createElement(FaBuilding),      label: "Bank Branch",    value: bank.bank_branch || bank.bank_branch_name },
                          ].map(
                            (field, idx) =>
                              field.value &&
                              React.createElement(
                                motion.div,
                                {
                                  key: idx,
                                  variants: itemVariants,
                                  // ✅ Field item: overflow-hidden
                                  className: "flex items-start gap-3 p-3 bg-white/50 rounded-xl hover:bg-white transition-all group overflow-hidden",
                                },
                                React.createElement("div", { className: "text-purple-500 mt-1 flex-shrink-0" }, field.icon),
                                React.createElement(
                                  "div",
                                  { className: "flex-1 min-w-0 overflow-hidden" }, // ✅
                                  React.createElement("p", { className: "text-xs text-gray-500 font-medium uppercase tracking-wider" }, field.label),
                                  React.createElement(
                                    "p",
                                    { className: "font-semibold text-gray-900 mt-1 font-mono text-sm truncate" }, // ✅ truncate long codes
                                    field.value
                                  )
                                ),
                                field.copyable &&
                                  React.createElement(
                                    motion.button,
                                    {
                                      whileHover: { scale: 1.1 },
                                      whileTap: { scale: 0.9 },
                                      onClick: () => copyToClipboard(field.value, field.label),
                                      className: "opacity-0 group-hover:opacity-100 text-gray-400 hover:text-purple-600 transition-all flex-shrink-0",
                                    },
                                    React.createElement(FaCopy)
                                  )
                              )
                          )
                        )
                      )
                    ) :
                    React.createElement(
                      motion.div,
                      {
                        initial: { opacity: 0, scale: 0.9 },
                        animate: { opacity: 1, scale: 1 },
                        className: "text-center py-12 overflow-hidden", // ✅
                      },
                      React.createElement(FaUniversity, { className: "text-gray-300 text-6xl mx-auto mb-4" }),
                      React.createElement("p", { className: "text-gray-500" }, "No banking information available")
                    )
                ),

              // ── Additional Tab ──────────────────────────────────────────────
              activeTab === "additional" &&
                React.createElement(
                  motion.div,
                  {
                    key: "additional",
                    initial: { opacity: 0, x: 20 },
                    animate: { opacity: 1, x: 0 },
                    exit: { opacity: 0, x: -20 },
                    transition: { duration: 0.3 },
                    className: "space-y-6 overflow-hidden", // ✅
                  },
                  React.createElement(
                    motion.div,
                    {
                      variants: cardVariants,
                      initial: "hidden",
                      animate: "visible",
                      whileHover: "hover",
                      // ✅ Additional card: overflow-hidden
                      className: "bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-6 shadow-lg overflow-hidden",
                    },
                    React.createElement(
                      "div",
                      { className: "flex items-center gap-3 mb-6 overflow-hidden" }, // ✅
                      React.createElement(
                        motion.div,
                        {
                          animate: { scale: [1, 1.1, 1] },
                          transition: { duration: 2, repeat: Infinity },
                        },
                        React.createElement(FaCalendarAlt, { className: "text-gray-600 text-2xl flex-shrink-0" })
                      ),
                      React.createElement("h3", { className: "text-xl font-bold text-gray-800 truncate" }, "Additional Information") // ✅
                    ),
                    React.createElement(
                      "div",
                      { className: "grid grid-cols-1 md:grid-cols-2 gap-6 overflow-hidden" }, // ✅
                      [
                        { icon: React.createElement(FaCalendarAlt), label: "Date Added",       value: formatDate(beneficiary.created_at) },
                        { icon: React.createElement(FaCalendarAlt), label: "Last Updated",     value: formatDate(beneficiary.updated_at) },
                        { icon: React.createElement(FaIdCard),      label: "Beneficiary UUID", value: beneficiary.benef_uuid, copyable: true, fullWidth: true },
                        { icon: React.createElement(FaIdCard),      label: "ZapWare ID",       value: beneficiary.zwareId, copyable: true },
                        { icon: React.createElement(FaIdCard),      label: "Remit Source ID",  value: beneficiary.remitSourceId, copyable: true },
                        { icon: React.createElement(FaBuilding),    label: "Partner ID",       value: beneficiary.partner_id },
                        { icon: React.createElement(FaIdCard),      label: "Referral Code",    value: beneficiary.referral_code, copyable: true },
                      ].map(
                        (field, idx) =>
                          field.value &&
                          React.createElement(
                            motion.div,
                            {
                              key: idx,
                              variants: itemVariants,
                              // ✅ Field item: overflow-hidden
                              className: `flex items-start gap-3 p-3 bg-white/50 rounded-xl hover:bg-white transition-all group overflow-hidden ${
                                field.fullWidth ? "md:col-span-2" : ""
                              }`,
                            },
                            React.createElement("div", { className: "text-gray-500 mt-1 flex-shrink-0" }, field.icon),
                            React.createElement(
                              "div",
                              { className: "flex-1 min-w-0 overflow-hidden" }, // ✅
                              React.createElement("p", { className: "text-xs text-gray-500 font-medium uppercase tracking-wider" }, field.label),
                              React.createElement(
                                "p",
                                {
                                  // ✅ UUID gets break-all; others get truncate
                                  className: `font-semibold text-gray-900 mt-1 ${
                                    field.label.includes("UUID") ? "text-xs font-mono break-all" : "truncate"
                                  }`,
                                },
                                field.value
                              )
                            ),
                            field.copyable &&
                              React.createElement(
                                motion.button,
                                {
                                  whileHover: { scale: 1.1 },
                                  whileTap: { scale: 0.9 },
                                  onClick: () => copyToClipboard(field.value, field.label),
                                  className: "opacity-0 group-hover:opacity-100 text-gray-400 hover:text-blue-600 transition-all flex-shrink-0",
                                },
                                React.createElement(FaCopy)
                              )
                          )
                      )
                    )
                  ),
                  (beneficiary.beneficiary_id_type || beneficiary.beneficiary_id_number) &&
                    React.createElement(
                      motion.div,
                      {
                        variants: cardVariants,
                        initial: "hidden",
                        animate: "visible",
                        whileHover: "hover",
                        // ✅ ID card: overflow-hidden
                        className: "bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl p-6 shadow-lg overflow-hidden",
                      },
                      React.createElement(
                        "div",
                        { className: "flex items-center gap-3 mb-6 overflow-hidden" }, // ✅
                        React.createElement(
                          motion.div,
                          {
                            animate: { rotate: [0, 10, -10, 0] },
                            transition: { duration: 3, repeat: Infinity, repeatType: "reverse" },
                          },
                          React.createElement(FaIdCard, { className: "text-yellow-600 text-2xl flex-shrink-0" })
                        ),
                        React.createElement("h3", { className: "text-xl font-bold text-gray-800 truncate" }, "Identification Details") // ✅
                      ),
                      React.createElement(
                        "div",
                        { className: "grid grid-cols-1 md:grid-cols-2 gap-6 overflow-hidden" }, // ✅
                        beneficiary.beneficiary_id_type &&
                          React.createElement(
                            "div",
                            // ✅ ID type field: overflow-hidden
                            { className: "flex items-start gap-3 p-3 bg-white/50 rounded-xl overflow-hidden" },
                            React.createElement(FaIdCard, { className: "text-yellow-500 mt-1 flex-shrink-0" }),
                            React.createElement(
                              "div",
                              { className: "min-w-0 overflow-hidden" }, // ✅
                              React.createElement("p", { className: "text-xs text-gray-500 font-medium uppercase tracking-wider" }, "ID Type"),
                              React.createElement("p", { className: "font-semibold text-gray-900 mt-1 truncate" }, beneficiary.beneficiary_id_type) // ✅
                            )
                          ),
                        beneficiary.beneficiary_id_number &&
                          React.createElement(
                            "div",
                            // ✅ ID number field: overflow-hidden
                            { className: "flex items-start gap-3 p-3 bg-white/50 rounded-xl group overflow-hidden" },
                            React.createElement(FaIdCard, { className: "text-yellow-500 mt-1 flex-shrink-0" }),
                            React.createElement(
                              "div",
                              { className: "flex-1 min-w-0 overflow-hidden" }, // ✅
                              React.createElement("p", { className: "text-xs text-gray-500 font-medium uppercase tracking-wider" }, "ID Number"),
                              React.createElement(
                                "p",
                                { className: "font-semibold text-gray-900 mt-1 font-mono truncate" }, // ✅
                                beneficiary.beneficiary_id_number
                              )
                            ),
                            React.createElement(
                              motion.button,
                              {
                                whileHover: { scale: 1.1 },
                                whileTap: { scale: 0.9 },
                                onClick: () => copyToClipboard(beneficiary.beneficiary_id_number, "ID Number"),
                                className: "opacity-0 group-hover:opacity-100 text-gray-400 hover:text-yellow-600 transition-all flex-shrink-0",
                              },
                              React.createElement(FaCopy)
                            )
                          )
                      )
                    )
                )
            )
          )
        ),

        // ─── Footer ───────────────────────────────────────────────────────────
        React.createElement(
          motion.div,
          {
            initial: { y: 50, opacity: 0 },
            animate: { y: 0, opacity: 1 },
            transition: { delay: 0.5 },
            // ✅ Footer: overflow-hidden + flex-shrink-0 so it never collapses
            className: "border-t border-gray-200 px-8 py-5 bg-gradient-to-r from-gray-50 to-white overflow-hidden flex-shrink-0",
          },
          React.createElement(
            "div",
            { className: "flex flex-col sm:flex-row justify-between items-center gap-4 overflow-hidden" }, // ✅
            React.createElement(
              motion.div,
              {
                initial: { opacity: 0 },
                animate: { opacity: 1 },
                transition: { delay: 0.6 },
                className: "text-sm text-gray-500 truncate", // ✅
              },
              React.createElement(FaStar, { className: "inline mr-1 text-yellow-500" }),
              `Last updated: ${formatDateShort(beneficiary.updated_at)}`
            ),
            React.createElement(
              "div",
              { className: "flex gap-3 flex-shrink-0" },
              React.createElement(
                motion.button,
                {
                  whileHover: { scale: 1.05, y: -2 },
                  whileTap: { scale: 0.95 },
                  onClick: () => copyToClipboard(beneficiary.name, "Name"),
                  className: "px-5 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all flex items-center gap-2",
                },
                React.createElement(FaCopy),
                React.createElement("span", null, "Copy Details")
              ),
              React.createElement(
                motion.button,
                {
                  whileHover: { scale: 1.05, y: -2 },
                  whileTap: { scale: 0.95 },
                  onClick: onClose,
                  className: "px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all flex items-center gap-2",
                },
                React.createElement(FaTimes),
                React.createElement("span", null, "Close")
              )
            )
          )
        ),

        // ─── Copy Toast ────────────────────────────────────────────────────────
        React.createElement(
          AnimatePresence,
          null,
          showCopied &&
            React.createElement(
              motion.div,
              {
                initial: { opacity: 0, y: 50, scale: 0.9 },
                animate: { opacity: 1, y: 0, scale: 1 },
                exit: { opacity: 0, y: 50, scale: 0.9 },
                className: "fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-2 z-50 overflow-hidden", // ✅
              },
              React.createElement(FaCheckCircle, { className: "text-green-400 flex-shrink-0" }),
              React.createElement("span", { className: "font-medium truncate" }, `${showCopied} copied to clipboard!`) // ✅
            )
        )
      )
    )
  );
};

export default BeneficiaryDetailsPopup;