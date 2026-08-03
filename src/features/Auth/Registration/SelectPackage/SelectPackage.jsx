// SelectPackage.jsx
import React, { useState, useMemo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faArrowLeft,
    faArrowRight,
    faClock,
    faCheck,
    faSearch,
    faUser,
    faBuilding,
    faMoneyBill,
    faGlobe,
} from "@fortawesome/free-solid-svg-icons";
import { useNavigate, useLocation } from "react-router-dom";

const SelectPackage = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // Data passed from AccountType.jsx via navigate state
    const packageList = location.state?.packageList?.data ?? [];
    const accountType = location.state?.accountType ?? null;
    const accountTypeLabel = location.state?.accountTypeLabel ?? accountType ?? "Not selected";

    // 'package' -> step 1 (choose plan), 'currency' -> step 2 (choose currencies)
    const [step, setStep] = useState("package");
    const [selectedPackage, setSelectedPackage] = useState(null);
    const [selectedCurrencies, setSelectedCurrencies] = useState([]);
    const [currencySearch, setCurrencySearch] = useState("");

    const handleSelectPackage = (pkg) => {
        setSelectedPackage(pkg);
    };

    const handleBack = () => {
        navigate(-1);
    };

    const handleContinueToCurrencies = () => {
        if (!selectedPackage) return;
        setSelectedCurrencies([]);
        setCurrencySearch("");
        setStep("currency");
    };

    const handleBackToPlans = () => {
        setStep("package");
    };

    const handleBackToCurrencies = () => {
        setStep("currency");
    };

    const maxCurrencies = selectedPackage?.package_no_of_accounts ?? null;

    const toggleCurrency = (currency) => {
        setSelectedCurrencies((prev) => {
            const alreadySelected = prev.some(
                (c) => c.monthly_package_currency_id === currency.monthly_package_currency_id
            );
            if (alreadySelected) {
                return prev.filter(
                    (c) => c.monthly_package_currency_id !== currency.monthly_package_currency_id
                );
            }
            if (maxCurrencies && prev.length >= maxCurrencies) {
                // Cap reached — ignore further selections
                return prev;
            }
            return [...prev, currency];
        });
    };
    const handleFinishSetup = () => {
        if (selectedCurrencies.length === 0) return;
        setStep("confirmation"); // Go to confirmation screen
    };

    const handleContinueToVerification = () => {
        const selectedCurrencyIds = selectedCurrencies.map(
            (c) => c.monthly_package_currency_id
        );

        localStorage.setItem("packageselectedcurrencyids", JSON.stringify(selectedCurrencyIds));
        console.log("Saved packageselectedcurrencyids:", localStorage.getItem("packageselectedcurrencyids"));

        navigate("/selectcountry", {
            state: {
                accountType,
                selectedPackage,
                selectedCurrencies,
                selectedCurrencyIds,
            },
        });
    };

    // package_services comes back as a single string with \r\n / \n separators
    const getFeatures = (servicesString) => {
        if (!servicesString) return [];

        const parser = new DOMParser();
        const doc = parser.parseFromString(servicesString, "text/html");

        // 1. If backend returns <p> elements, query them directly
        const pElements = doc.querySelectorAll("p");

        if (pElements.length > 0) {
            return Array.from(pElements)
                .map((p) => p.textContent.replace(/^[\u2713✓\s]+/, "").trim())
                .filter(Boolean);
        }

        // 2. Fallback for plain text without <p> tags (like UAE Account)
        return doc.body.textContent
            .split(/\r\n|\n/)
            .map((line) => line.replace(/^[\u2713✓\s]+/, "").trim())
            .filter(Boolean);
    };
    // currency icon and currency code can both be null, so fall back gracefully
    const getCurrencyLabel = (pkg) =>
        pkg.package_fee_currency_icon || pkg.package_fee_currency || "";

    // Builds the "Choose any X of Y currencies" style badge from account/currency counts
    const getBadgeText = (pkg) => {
        if (pkg.package_no_of_currencies) {
            if (pkg.package_no_of_accounts === pkg.package_no_of_currencies) {
                return `All ${pkg.package_no_of_currencies} currencies included`;
            }
            return `Choose any ${pkg.package_no_of_accounts} of ${pkg.package_no_of_currencies} currencies`;
        }
        if (pkg.package_no_of_accounts) {
            return `${pkg.package_no_of_accounts} local account${pkg.package_no_of_accounts > 1 ? "s" : ""
                } included`;
        }
        return null;
    };

    // Derives a simple 2-letter "flag" label from the currency code
    // (works for the common codes: EUR->EU, USD->US, GBP->GB, etc.)
    const getFlagLabel = (currencyCode) => currencyCode?.slice(0, 2).toUpperCase();

    const filteredCurrencies = useMemo(() => {
        if (!selectedPackage?.currencies) return [];
        const term = currencySearch.trim().toLowerCase();
        if (!term) return selectedPackage.currencies;
        return selectedPackage.currencies.filter(
            (c) =>
                c.currency_code.toLowerCase().includes(term) ||
                c.currency_name.toLowerCase().includes(term)
        );
    }, [selectedPackage, currencySearch]);

    // ---------------- STEP 2: Currency selection ----------------
    if (step === "currency" && selectedPackage) {
        const count = selectedCurrencies.length;
        const atMax = maxCurrencies != null && count >= maxCurrencies;

        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 flex flex-col">
                {/* Back to plans */}
                <div className="p-4 sm:p-6">
                    <button
                        onClick={handleBackToPlans}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-sm border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        <FontAwesomeIcon icon={faArrowLeft} className="text-xs" />
                        Back to plans
                    </button>
                </div>

                {/* Header */}
                <div className="text-center px-4 mb-6 sm:mb-8">
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
                        Select your account currencies
                    </h1>
                    <p className="text-sm sm:text-base text-gray-500 max-w-2xl mx-auto">
                        {selectedPackage.package_no_of_currencies
                            ? `Choose from ${selectedPackage.package_no_of_currencies} currencies — open local accounts to hold, send and receive like a local.`
                            : "Open local accounts to hold, send and receive like a local."}
                    </p>
                </div>

                <div className="flex-1 px-4 sm:px-6 pb-32">
                    <div className="max-w-4xl mx-auto">
                        {/* Package summary bar */}
                        <div className="flex items-center justify-between bg-blue-950 text-white rounded-xl px-4 sm:px-5 py-3 sm:py-4 mb-5">
                            <div className="flex items-center gap-3 min-w-0">
                                <span className="bg-blue-700 text-white text-xs font-bold px-2.5 py-1 rounded-md flex-shrink-0">
                                    {selectedPackage.package_name}
                                </span>
                                <span className="text-sm sm:text-base truncate">
                                    {getBadgeText(selectedPackage)}
                                </span>
                            </div>
                            <div className="flex items-center gap-3 flex-shrink-0">
                                <span className="text-sm sm:text-base font-semibold">
                                    {count}
                                    {maxCurrencies != null ? ` / ${maxCurrencies}` : ""}
                                </span>
                            </div>
                        </div>

                        {/* Search */}
                        <div className="relative mb-5">
                            <FontAwesomeIcon
                                icon={faSearch}
                                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm"
                            />
                            <input
                                type="text"
                                value={currencySearch}
                                onChange={(e) => setCurrencySearch(e.target.value)}
                                placeholder="Search currency — e.g. AED, Danish Krone..."
                                className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        {/* Currency grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                            {filteredCurrencies.map((currency) => {
                                const isChecked = selectedCurrencies.some(
                                    (c) => c.monthly_package_currency_id === currency.monthly_package_currency_id
                                );
                                const isDisabled = !isChecked && atMax;

                                return (
                                    <button
                                        key={currency.monthly_package_currency_id}
                                        type="button"
                                        onClick={() => !isDisabled && toggleCurrency(currency)}
                                        disabled={isDisabled}
                                        className={`flex items-center justify-between gap-3 bg-white border rounded-xl px-4 py-3 text-left transition-colors
        ${isChecked
                                                ? "border-blue-600 ring-1 ring-blue-600"
                                                : "border-gray-200 hover:border-gray-300"
                                            }
        ${isDisabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <span className="text-xs font-bold text-gray-500 flex-shrink-0">
                                                {getFlagLabel(currency.currency_code)}
                                            </span>
                                            <div className="min-w-0">
                                                <p className="text-sm font-semibold text-gray-900">
                                                    {currency.currency_code}
                                                </p>
                                                <p className="text-xs text-gray-500 truncate">
                                                    {currency.currency_name}
                                                </p>
                                            </div>
                                        </div>
                                        <span
                                            className={`w-5 h-5 rounded border flex-shrink-0 flex items-center justify-center
                        ${isChecked
                                                    ? "bg-blue-600 border-blue-600"
                                                    : "border-gray-300"
                                                }`}
                                        >
                                            {isChecked && (
                                                <FontAwesomeIcon icon={faCheck} className="text-white text-[10px]" />
                                            )}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        {filteredCurrencies.length === 0 && (
                            <p className="text-center text-sm text-gray-400 mt-8">
                                No currencies match "{currencySearch}"
                            </p>
                        )}
                    </div>
                </div>

                {/* Bottom bar */}
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 sm:px-8 py-4 flex items-center justify-between">
                    <button
                        onClick={handleBackToPlans}
                        className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                    >
                        <FontAwesomeIcon icon={faArrowLeft} className="text-xs" />
                        Back
                    </button>

                    <p className="text-sm text-gray-500 hidden sm:block">
                        {count === 0
                            ? "Select at least one currency"
                            : `${count} currenc${count > 1 ? "ies" : "y"} selected`}
                    </p>

                    <button
                        onClick={handleFinishSetup}
                        disabled={count === 0}
                        className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium text-sm transition-colors
              ${count > 0
                                ? "bg-blue-900 text-white hover:bg-blue-800"
                                : "bg-gray-200 text-gray-400 cursor-not-allowed"
                            }`}
                    >
                        Finish setup <FontAwesomeIcon icon={faArrowRight} className="text-xs" />
                    </button>
                </div>
            </div>
        );
    }

    // ---------------- STEP 3: Confirmation Screen 
    if (step === "confirmation" && selectedPackage) {
        const currencyCodes = selectedCurrencies.map(c => c.currency_code).join(", ");
        const packageFee = `${getCurrencyLabel(selectedPackage)}${selectedPackage.package_fee}`;

        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 flex flex-col">
                {/* Back to currencies */}
                <div className="p-4 sm:p-6">
                    <button
                        onClick={handleBackToCurrencies}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-sm border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        <FontAwesomeIcon icon={faArrowLeft} className="text-xs" />
                        Back to currencies
                    </button>
                </div>

                {/* Main content */}
                <div className="flex-1 flex items-center justify-center px-4 sm:px-6 py-8">
                    <div className="max-w-2xl w-full">
                        {/* Success/Ready card */}
                        <div className="bg-white rounded-3xl shadow-xl p-8 sm:p-10">
                            <div className="text-center mb-8">
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                                    Your account is ready to go
                                </h2>
                                <p className="text-gray-500 mt-2 text-sm sm:text-base">
                                    Here's your setup at a glance. Next, we'll verify your identity — then you can start transacting.
                                </p>
                            </div>

                            {/* Summary details */}
                            <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                                <div className="flex justify-between items-center border-b border-gray-200 pb-3">
                                    <span className="text-sm font-medium text-gray-500">Account type</span>
                                    <span className="text-sm font-semibold text-gray-900 capitalize">
                                        {accountTypeLabel}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center border-b border-gray-200 pb-3">
                                    <span className="text-sm font-medium text-gray-500">Plan</span>
                                    <span className="text-sm font-semibold text-gray-900">
                                        {selectedPackage.package_name}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center border-b border-gray-200 pb-3">
                                    <span className="text-sm font-medium text-gray-500">Monthly</span>
                                    <span className="text-sm font-semibold text-gray-900">
                                        {packageFee}/month
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-gray-500">Currencies</span>
                                    <span className="text-sm font-semibold text-gray-900">
                                        {currencyCodes}
                                    </span>
                                </div>
                            </div>

                            {/* Continue button */}
                            <button
                                onClick={handleContinueToVerification}
                                className="w-full mt-8 bg-blue-900 text-white py-3 px-6 rounded-xl font-medium hover:bg-blue-800 transition-colors flex items-center justify-center gap-2"
                            >
                                Continue to verification →
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ---------------- STEP 1: Package selection ----------------
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 flex flex-col">
            {/* Back to account type */}
            <div className="p-4 sm:p-6">
                <button
                    onClick={handleBack}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-sm border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                    <FontAwesomeIcon icon={faArrowLeft} className="text-xs" />
                    Back to account type
                </button>
            </div>

            {/* Header */}
            <div className="text-center px-4 mb-8 sm:mb-12">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
                    Select the solution that best fits your business
                </h1>
                <p className="text-sm sm:text-base text-gray-500 max-w-2xl mx-auto">
                    Every plan includes local account details and access to your
                    partner's global payment rails.
                </p>
            </div>

            {/* Package cards */}
            <div className="flex-1 px-4 sm:px-6 pb-32">
                <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
                    {packageList.map((pkg) => {
                        const isSelected = selectedPackage?.package_id === pkg.package_id;
                        const features = getFeatures(pkg.package_services);
                        const currencyLabel = getCurrencyLabel(pkg);
                        const badgeText = getBadgeText(pkg);

                        return (
                            <div
                                key={pkg.package_id}
                                onClick={() => handleSelectPackage(pkg)}
                                className={`relative bg-white rounded-2xl shadow-sm p-6 cursor-pointer transition-all duration-300 border-2 flex flex-col
                  ${isSelected
                                        ? "border-blue-600 shadow-lg"
                                        : "border-gray-200 hover:border-gray-300 hover:shadow-md"
                                    }`}
                            >
                                <h3 className="text-lg font-bold text-gray-900 mb-1">
                                    {pkg.package_name}
                                </h3>
                                {pkg.package_summary && (
                                    <p className="text-sm text-gray-500 mb-4">{pkg.package_summary}</p>
                                )}

                                <div className="mb-1">
                                    <span className="text-3xl font-extrabold text-gray-900">
                                        {currencyLabel}
                                        {pkg.package_fee}
                                    </span>
                                    <span className="text-sm text-gray-500 ml-1">/month</span>
                                </div>

                                {badgeText && (
                                    <div className="inline-flex self-start items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-4 mt-3 bg-blue-50 text-blue-800">
                                        <FontAwesomeIcon icon={faClock} className="text-[10px]" />
                                        {badgeText}
                                    </div>
                                )}

                                <ul className="space-y-2 mb-6 flex-1">
                                    {features.map((feature, idx) => (
                                        <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                                            <FontAwesomeIcon
                                                icon={faCheck}
                                                className="text-blue-600 text-xs mt-1 flex-shrink-0"
                                            />
                                            <span>{feature}</span>
                                        </li>
                                    ))}
                                </ul>

                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleSelectPackage(pkg);
                                    }}
                                    className={`w-full py-2.5 px-4 rounded-lg font-medium text-sm transition-colors
                    ${isSelected
                                            ? "bg-blue-900 text-white"
                                            : "bg-white border border-gray-300 text-gray-900 hover:bg-gray-50"
                                        }`}
                                >
                                    {isSelected ? (
                                        <>
                                            Selected <FontAwesomeIcon icon={faCheck} className="ml-1" />
                                        </>
                                    ) : (
                                        `Select ${pkg.package_name}`
                                    )}
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Bottom bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 sm:px-8 py-4 flex items-center justify-between">
                <button
                    onClick={handleBack}
                    className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                >
                    <FontAwesomeIcon icon={faArrowLeft} className="text-xs" />
                    Back
                </button>

                <p className="text-sm text-gray-500 hidden sm:block">
                    {selectedPackage
                        ? `${selectedPackage.package_name} — ${getCurrencyLabel(
                            selectedPackage
                        )}${selectedPackage.package_fee}/month`
                        : "Select a plan to continue"}
                </p>

                <button
                    onClick={handleContinueToCurrencies}
                    disabled={!selectedPackage}
                    className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium text-sm transition-colors
            ${selectedPackage
                            ? "bg-blue-900 text-white hover:bg-blue-800"
                            : "bg-gray-200 text-gray-400 cursor-not-allowed"
                        }`}
                >
                    Continue <FontAwesomeIcon icon={faArrowRight} className="text-xs" />
                </button>
            </div>
        </div>
    );
};

export default SelectPackage;   