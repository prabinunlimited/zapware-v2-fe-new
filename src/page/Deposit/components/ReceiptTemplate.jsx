// ReceiptTemplate.jsx
import React from 'react';

const ReceiptTemplate = ({
  transactionSuccess,
  amount,
  selectedCurrency,
  paymentMethod,
  purpose
}) => {
  if (!transactionSuccess) return null;

  return (
    <div className="hidden">
      <div id="receipt-template" className="p-8 bg-white">
        {/* Receipt Header */}
        <div className="text-center border-b-2 border-gray-300 pb-4 mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Deposit Receipt</h1>
          <p className="text-gray-600">Transaction Confirmation</p>
        </div>

        {/* Transaction Details */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Transaction Details
          </h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Reference ID:</span>
              <p className="font-semibold">{transactionSuccess.reference_id}</p>
            </div>
            <div>
              <span className="text-gray-600">Date:</span>
              <p className="font-semibold">{new Date().toLocaleString()}</p>
            </div>
            <div>
              <span className="text-gray-600">Amount:</span>
              <p className="font-semibold">
                {selectedCurrency} {parseFloat(amount).toLocaleString()}
              </p>
            </div>
            <div>
              <span className="text-gray-600">Payment Method:</span>
              <p className="font-semibold capitalize">
                {paymentMethod.replace('_', ' ')}
              </p>
            </div>
            <div>
              <span className="text-gray-600">Purpose:</span>
              <p className="font-semibold">{purpose}</p>
            </div>
            <div>
              <span className="text-gray-600">Status:</span>
              <p className="font-semibold text-green-600">Completed</p>
            </div>
          </div>
        </div>

        {/* Terms */}
        <div className="border-t-2 border-gray-300 pt-4">
          <p className="text-xs text-gray-500 text-center">
            This is an automated receipt. Please keep this for your records.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ReceiptTemplate;