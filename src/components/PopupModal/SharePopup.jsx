import React from "react";

const SharePopup = ({
  isOpen,
  onClose,
  requestRemitLink,
  emailForm,
  onEmailFormChange,
  onEmailSend,
  onCopyLink,
}) => {
  if (!isOpen) return null;

  // Enhanced plain text email content
  const generateEnhancedEmailContent = () => {
    const currentDate = new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    return `
🔐 SECURE REMITTANCE REQUEST - ACTION REQUIRED

Dear Recipient,

You have received a secure remittance request that requires your immediate attention.

📋 PAYMENT DETAILS:
• Secure Payment Link: ${requestRemitLink}
• Request Date: ${currentDate}
• Status: Pending Your Action

🚀 QUICK ACTIONS:
1. Click the payment link above to access the secure payment portal
2. Review the transaction details carefully
3. Complete the payment using your preferred method
4. Receive instant confirmation upon completion

🛡️ SECURITY FEATURES:
• End-to-end encryption
• Real-time transaction monitoring
• Secure payment processing
• Instant confirmation

⏰ TIME-SENSITIVE:
This payment link is active for 7 days. We recommend completing the payment at your earliest convenience to avoid any processing delays.

📞 SUPPORT INFORMATION:
If you encounter any issues or have questions:
• Support available 24/7
• Typical response time: 15 minutes
• Secure messaging through the payment portal

🔒 IMPORTANT SECURITY NOTES:
• This link is uniquely generated for you - do not share it with others
• Always verify you're on a secure connection (https://)
• Contact support immediately if you notice anything suspicious

Best regards,
Global Remittance Team
---
This is an automated message from Global Remittance Portal.
For security reasons, please do not reply to this email.
Generated on ${currentDate}
    `.trim();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden transform transition-all">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-white bg-opacity-20 p-2 rounded-full">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  Send Remittance Request
                </h2>
                <p className="text-blue-100 text-sm">
                  Send payment request directly to your beneficiary
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-full transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Enhanced Message Preview Section */}
          <div className="mb-6">
            <div className="border-2 border-dashed border-blue-200 rounded-lg p-4 bg-blue-50">
              <div className="text-center mb-4">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg
                    className="w-8 h-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76"
                    />
                  </svg>
                </div>
                <h4 className="font-semibold text-gray-800">
                  Professional Email Content
                </h4>
                <p className="text-sm text-gray-600">
                  Your recipient will receive this enhanced email message
                  directly
                </p>
              </div>
            </div>
          </div>

          {/* Link Section */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Payment Link
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={requestRemitLink}
                readOnly
                className="flex-1 px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-600 font-mono text-sm"
              />
              <button
                onClick={onCopyLink}
                className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center space-x-2"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                <span>Copy</span>
              </button>
            </div>
          </div>

          {/* Email Section */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <svg
                className="w-5 h-5 mr-2 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              Send Email Directly
            </h3>

            <div className="space-y-4 bg-gray-50 rounded-lg p-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Recipient Email
                </label>
                <input
                  type="email"
                  name="to"
                  value={emailForm.to}
                  onChange={onEmailFormChange}
                  placeholder="Enter recipient email address"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  name="subject"
                  value={emailForm.subject}
                  onChange={onEmailFormChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="🔐 Secure Remittance Request - Action Required"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message Preview
                </label>
                <div className="bg-white border border-gray-300 rounded-lg p-4 max-h-32 overflow-y-auto">
                  <pre className="text-sm text-gray-600 whitespace-pre-wrap">
                    {generateEnhancedEmailContent().substring(0, 300)}...
                  </pre>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Enhanced professional message will be sent directly
                </p>
              </div>

              <button
                onClick={onEmailSend}
                disabled={!emailForm.to}
                className={`w-full py-4 px-6 rounded-lg font-semibold text-white focus:outline-none focus:ring-4 transition-all duration-200 flex items-center justify-center space-x-3 ${
                  !emailForm.to
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 focus:ring-green-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                }`}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                <span className="text-lg">Send Email Now</span>
              </button>

              <p className="text-xs text-gray-500 text-center">
                The email will open in your default email client with the
                message pre-filled
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Email will be sent directly from your email client
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SharePopup;
