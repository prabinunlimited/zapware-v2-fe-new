import React from "react";

const FormHeader = ({ title, subtitle, icon }) => {
  return (
    <div className="flex items-center mb-6">
      <div className="bg-blue-100 p-3 rounded-full mr-4">
        {icon}
      </div>
      <div>
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800">
          {title}
        </h2>
        <p className="text-gray-600 mt-1">
          {subtitle}
        </p>
      </div>
    </div>
  );
};

export default FormHeader;