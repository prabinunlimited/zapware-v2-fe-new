import { useState } from "react";

const useFieldFocus = () => {
  const [activeField, setActiveField] = useState(null);

  const handleFocus = (fieldName) => {
    setActiveField(fieldName);
  };

  const handleBlur = () => {
    setActiveField(null);
  };

  return {
    activeField,
    handleFocus,
    handleBlur
  };
};

export default useFieldFocus;