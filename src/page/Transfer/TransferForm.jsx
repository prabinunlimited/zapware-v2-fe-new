import React from "react";
import { useSelector } from "react-redux";
import { selectFormErrors } from "./transferSelectors";

const TransferForm = ({
  customerBankAccounts,
  selectedCurrency,
  transferAmount,
  onCurrencyChange,
  onAmountChange,
  headerColorProps,
  textColorProps,
}) => {
  const formErrors = useSelector(selectFormErrors);

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Currency
        </label>
        <select
          value={selectedCurrency}
          onChange={(e) => onCurrencyChange(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Select currency</option>
          {customerBankAccounts.map((account) => (
            <option key={account.id} value={account.currency_code}>
              {account.currency_code}
            </option>
          ))}
        </select>
        {formErrors.currency && (
          <p className="text-red-500 text-sm mt-1">{formErrors.currency}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Amount
        </label>
        <input
          type="number"
          value={transferAmount}
          onChange={(e) => onAmountChange(e.target.value)}
          placeholder="0.00"
          className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
        />
        {formErrors.amount && (
          <p className="text-red-500 text-sm mt-1">{formErrors.amount}</p>
        )}
      </div>
    </div>
  );
};

export default TransferForm;