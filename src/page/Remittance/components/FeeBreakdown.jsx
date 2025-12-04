import React from "react";
import { FaInfoCircle, FaChevronDown, FaChevronUp } from "react-icons/fa";

const FeeBreakdown = ({
  sendAmount,
  sendCurrency,
  receiveAmount,
  receiveCurrency,
  exchangeRate,
  fee,
  show,
  onToggle,
}) => {
  const totalAmount = parseFloat(sendAmount || 0) + parseFloat(fee || 0);
  const amountAfterFee = parseFloat(sendAmount || 0) - parseFloat(fee || 0);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
      <button
        type="button"
        onClick={onToggle}
        className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <FaInfoCircle className="w-5 h-5 text-blue-600" />
          <div className="text-left">
            <div className="font-semibold text-gray-900">Fee Breakdown</div>
            <div className="text-sm text-gray-500">
              See how your amount is calculated
            </div>
          </div>
        </div>
        {show ? (
          <FaChevronUp className="w-5 h-5 text-gray-500" />
        ) : (
          <FaChevronDown className="w-5 h-5 text-gray-500" />
        )}
      </button>

      {show && (
        <div className="px-6 pb-6 border-t border-gray-100">
          <div className="space-y-4 pt-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Amount to Send</span>
              <span className="font-medium">
                {sendCurrency?.value} {parseFloat(sendAmount || 0).toFixed(2)}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <div>
                <span className="text-gray-600">Transfer Fee</span>
                <div className="text-xs text-green-600 mt-1">
                  Low fee compared to banks
                </div>
              </div>
              <span className="font-medium">
                {sendCurrency?.value} {parseFloat(fee || 0).toFixed(2)}
              </span>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-900">
                  Total to Pay
                </span>
                <span className="font-bold text-xl text-blue-600">
                  {sendCurrency?.value} {totalAmount.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-sm text-blue-800">
                <div className="font-medium mb-1">
                  How the amount is calculated:
                </div>
                <div className="text-xs">
                  ({sendAmount} - {fee}) × {exchangeRate?.toFixed(4)} ={" "}
                  {receiveAmount} {receiveCurrency?.value}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeeBreakdown;
