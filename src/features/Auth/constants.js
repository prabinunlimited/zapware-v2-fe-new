export const PASSWORD_REQUIREMENTS = [
  {
    label: "At least 12 characters",
    regex: /^.{12,}$/,
  },
  {
    label: "At least one uppercase letter",
    regex: /[A-Z]/,
  },
  {
    label: "At least one special character",
    regex: /[!@#$%^&*(),.?":{}|<>]/,
  },
];