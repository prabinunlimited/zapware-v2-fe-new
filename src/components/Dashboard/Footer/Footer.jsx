// src/components/Dashboard/Footer/Footer.jsx
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import { usePartnerConfig } from "../../../hooks/usePartnerConfig";

const API_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_URL;

const Footer = () => {
    console.log("🔄 Footer component is rendering"); // ADD THIS
    
    const [partnerName, setPartnerName] = useState(null);
    const [loading, setLoading] = useState(false);

    // Safe Redux access (works even if auth state doesn't exist)
    const whiteLabelInfo = useSelector((state) => state.auth?.whiteLabelInfo);
    const { config: partnerConfig, loading: partnerConfigLoading } = usePartnerConfig();

    const hostName = window.location.hostname;

    useEffect(() => {
        console.log("🔍 Footer useEffect running"); // ADD THIS
        const detectPartner = async () => {
            // Skip if we already have partner info
            if (whiteLabelInfo?.partnerName || partnerConfig?.name) {
                return;
            }

            // Check localStorage first
            const cachedPartnerName = localStorage.getItem("whitelabelled_customer_partnername");
            if (cachedPartnerName) {
                setPartnerName(cachedPartnerName);
                return;
            }

            // Fetch partner details from API
            try {
                setLoading(true);
                const payload = { hostName };
                const res = await axios.post(`${API_URL}/partners/detail-by-slug`, payload);

                if (res.data?.partner_name) {
                    const detectedPartnerName = res.data.partner_name;
                    localStorage.setItem("whitelabelled_customer_partnername", detectedPartnerName);
                    setPartnerName(detectedPartnerName);
                }
            } catch (error) {
                console.error("Error detecting partner:", error);
            } finally {
                setLoading(false);
            }
        };

        detectPartner();
    }, [hostName, whiteLabelInfo, partnerConfig]);

    // Get styling from partner config with fallbacks
    const backgroundColor = partnerConfig?.header_color || localStorage.getItem("header_color") || "#075985";
    const textColor = partnerConfig?.text_color || localStorage.getItem("text_color") || "white";
    const displayPartnerName = whiteLabelInfo?.partnerName || partnerConfig?.name || partnerName || "Unlimited Remit";
    const isLoading = loading || partnerConfigLoading;

    console.log("🎨 Footer styles:", { backgroundColor, textColor, displayPartnerName }); // ADD THIS

    return (
        <footer className="w-full mt-auto">
            <div
                className="px-6 py-2 text-center w-full"
                style={{ backgroundColor, color: textColor }}
            >
                {isLoading ? (
                    <div className="flex items-center justify-center">
                        <span className="mr-2">Loading</span>
                        <div className="flex space-x-1">
                            {[0, 1, 2].map((i) => (
                                <div
                                    key={i}
                                    className="w-1 h-1 bg-current rounded-full animate-pulse"
                                    style={{ animationDelay: `${i * 0.2}s` }}
                                ></div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <p className="text-xs">
                        &copy; {new Date().getFullYear()} {displayPartnerName}. All rights reserved.
                    </p>
                )}
            </div>
        </footer>
    );
};

export default Footer;