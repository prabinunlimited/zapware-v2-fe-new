import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";

const API_URL = import.meta.env.VITE_API_URL;

const getInitials = (name = "") =>
    name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase())
        .join("") || "?";

const avatarPalette = [
    "bg-blue-50 text-blue-600",
    "bg-violet-50 text-violet-600",
    "bg-emerald-50 text-emerald-600",
    "bg-amber-50 text-amber-600",
    "bg-rose-50 text-rose-600",
    "bg-cyan-50 text-cyan-600",
];

const cardPalette = [
    "bg-blue-50/60 border-blue-100 hover:border-blue-200",
    "bg-violet-50/60 border-violet-100 hover:border-violet-200",
    "bg-emerald-50/60 border-emerald-100 hover:border-emerald-200",
    "bg-amber-50/60 border-amber-100 hover:border-amber-200",
    "bg-rose-50/60 border-rose-100 hover:border-rose-200",
    "bg-cyan-50/60 border-cyan-100 hover:border-cyan-200",
];

const ViewFundingAccountsModal = ({ isOpen, onClose }) => {
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const bearertoken = localStorage.getItem("bearertoken");
    const customerUuid =
        localStorage.getItem("customerUuid") ||
        localStorage.getItem("customer_uuid") ||
        localStorage.getItem("authcustomer_id");

    useEffect(() => {
        if (!isOpen) return;

        const fetchFundingAccounts = async () => {
            if (!customerUuid) {
                setError("Customer UUID not found in session storage.");
                return;
            }

            try {
                setLoading(true);
                setError(null);
                const response = await fetch(
                    `${API_URL}/get-funding-accounts/${customerUuid}`,
                    {
                        method: "GET",
                        headers: {
                            Authorization: `Bearer ${bearertoken}`,
                            "Content-Type": "application/json",
                        },
                    }
                );

                const result = await response.json();

                if (!response.ok) {
                    throw new Error(result.message || "Failed to fetch funding accounts");
                }

                const list = Array.isArray(result?.data)
                    ? result.data
                    : Array.isArray(result)
                        ? result
                        : [];

                setAccounts(list);
            } catch (err) {
                console.error("Failed to load funding accounts:", err);
                setError(err.message || "Unable to load funding accounts.");
            } finally {
                setLoading(false);
            }
        };

        fetchFundingAccounts();
    }, [isOpen, customerUuid, bearertoken]);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.97, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.97, y: 10 }}
                    transition={{ duration: 0.18 }}
                    className="relative w-full max-w-xl bg-white rounded-3xl shadow-xl p-0 z-10 max-h-[85vh] flex flex-col overflow-hidden"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-5">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900">
                                Funding Accounts
                            </h3>
                            <p className="text-xs text-slate-400 mt-0.5">
                                {accounts.length > 0
                                    ? `${accounts.length} account${accounts.length > 1 ? "s" : ""} linked`
                                    : "Linked bank accounts"}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                        >
                            ✕
                        </button>
                    </div>

                    {/* Content Body */}
                    <div className="px-6 pb-2 overflow-y-auto flex-1">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                                <div className="w-7 h-7 border-2 border-slate-200 border-t-blue-500 rounded-full animate-spin mb-3"></div>
                                <p className="text-sm">Loading funding accounts...</p>
                            </div>
                        ) : error ? (
                            <div className="p-4 bg-red-50 text-red-600 text-sm rounded-2xl text-center">
                                {error}
                            </div>
                        ) : accounts.length === 0 ? (
                            <div className="text-center py-16 text-slate-400">
                                <p className="text-sm">No funding accounts found.</p>
                            </div>
                        ) : (
                            <div className="space-y-2.5 pb-2">
                                {accounts.map((acc, index) => (
                                    <div
                                        key={acc.id || index}
                                        className={`p-4 rounded-2xl border hover:shadow-sm transition flex items-start gap-3.5 ${cardPalette[index % cardPalette.length]
                                            }`}
                                    >
                                        <div
                                            className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center text-sm font-semibold ${avatarPalette[index % avatarPalette.length]
                                                }`}
                                        >
                                            {getInitials(acc.bank_name)}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="font-medium text-slate-900 text-sm truncate">
                                                    {acc.bank_name || "Unknown Bank"}
                                                </span>
                                                {acc.currency && (
                                                    <span className="shrink-0 px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-[11px] font-medium">
                                                        {acc.currency}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-slate-400 text-xs mt-0.5 truncate">
                                                {acc.account_name} &bull; {acc.account_number}
                                            </div>

                                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-[11px] text-slate-400">
                                                {acc.account_type && (
                                                    <span className="capitalize">{acc.account_type}</span>
                                                )}
                                                {acc.holder_type && (
                                                    <span className="capitalize">{acc.holder_type}</span>
                                                )}
                                                {acc.routing_number && (
                                                    <span>Routing: {acc.routing_number}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex justify-end px-6 py-4 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100 rounded-xl transition"
                        >
                            Close
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default ViewFundingAccountsModal;