import React from "react";
import { RingLoader } from "react-spinners";

const TermsAndConditions = ({ 
  termsConditions, 
  loading, 
  selectedTerms, 
  onTermChange 
}) => {
  return (
    <div className="mt-6 bg-blue-50 p-4 rounded-lg">
      <h3 className="text-sm font-medium text-gray-700 mb-3">
        Terms and Conditions <span className="text-red-500">*</span>
      </h3>
      {loading ? (
        <div className="flex items-center">
          <RingLoader color="#0284c7" size={16} className="mr-2" />
          <p className="text-sm text-gray-500">Loading terms...</p>
        </div>
      ) : termsConditions && termsConditions.length > 0 ? (
        <div className="space-y-3">
          {termsConditions.map((term) => (
            <div key={term.id} className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id={`term-${term.id}`}
                  name={`term-${term.id}`}
                  type="checkbox"
                  className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                  onChange={() => onTermChange(term.id)}
                  checked={selectedTerms.some(
                    (t) => t.id === term.id
                  )}
                />
              </div>
              <div className="ml-3 text-sm">
                <label
                  htmlFor={`term-${term.id}`}
                  className="font-medium text-gray-700"
                >
                  I agree to the{" "}
                  <a
                    href={term.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-500 hover:underline"
                  >
                    {term.title}
                  </a>
                </label>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500">No terms available</p>
      )}
    </div>
  );
};

export default TermsAndConditions;