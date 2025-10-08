import React from "react";

const RequiredDocuments = ({ values, documentTypeOptions, dispatch }) => {
  const handleFileChange = (e, documentId) => {
    const file = e.target.files[0];
    if (file) {
      dispatch(uploadFile({ documentId, file }));
    }
  };

  return (
    <>
      <h2 className="text-xl font-semibold mb-4">Documents & Verification</h2>

      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium mb-3">Business Documents</h3>
          <p className="text-sm text-gray-600 mb-4">
            Please upload required business documents for verification.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {documentTypeOptions.map((docType) => (
              <div key={docType.value} className="border rounded-lg p-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {docType.label}
                </label>
                <input
                  type="file"
                  onChange={(e) => handleFileChange(e, docType.value)}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  accept=".jpg,.jpeg,.png,.pdf"
                />
                {values.user_image[docType.value] && (
                  <p className="text-sm text-green-600 mt-1">
                    File selected: {values.user_image[docType.value].name}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium mb-3">Terms and Conditions</h3>
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-start">
              <input
                id="terms-agreement"
                name="terms-agreement"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
                required
              />
              <label
                htmlFor="terms-agreement"
                className="ml-3 text-sm text-gray-700"
              >
                I agree to the{" "}
                <a
                  href="/terms"
                  target="_blank"
                  className="text-blue-600 hover:text-blue-500"
                >
                  Terms and Conditions
                </a>{" "}
                and{" "}
                <a
                  href="/privacy"
                  target="_blank"
                  className="text-blue-600 hover:text-blue-500"
                >
                  Privacy Policy
                </a>
              </label>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default RequiredDocuments;
