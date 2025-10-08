import React from "react";
import { AiOutlineCheckCircle } from "react-icons/ai";

const BenefitsSection = () => {
  const benefits = [
    {
      title: "Secure & Protected",
      description: "Your information is encrypted and never shared without your consent."
    },
    {
      title: "Instant Verification",
      description: "Receive SMS verification codes immediately to your phone."
    }
  ];

  return (
    <div className="mb-6 bg-blue-50 p-4 rounded-lg">
      <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {benefits.map((benefit, index) => (
          <li key={index} className="flex items-start">
            <div className="bg-white bg-opacity-20 p-1 rounded-full mr-3 mt-0.5 flex-shrink-0">
              <AiOutlineCheckCircle className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium text-blue-800">
                {benefit.title}
              </h3>
              <p className="text-gray-600 text-xs mt-1">
                {benefit.description}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default BenefitsSection;