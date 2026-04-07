// src/services/beneficiaryService.js
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

export const beneficiaryService = {
  // Fetch beneficiaries
  fetchBeneficiaries: async (customerId) => {
    const bearertoken = localStorage.getItem("bearertoken");
    const response = await axios.get(
      `${API_URL}/beneficiaries/customer-view/${customerId}`,
      {
        headers: { Authorization: `Bearer ${bearertoken}` },
      }
    );
    return response.data;
  },

  // Fetch beneficiary by code
  fetchByCode: async (code) => {
    const bearertoken = localStorage.getItem("bearertoken");
    const response = await axios.get(
      `${API_URL}/beneficiaries/fetch-benef/${code}`,
      {
        headers: { Authorization: `Bearer ${bearertoken}` },
      }
    );
    return response.data;
  },

  // Fetch beneficiary banks
  fetchBanks: async (beneficiaryId) => {
    const authtoken = localStorage.getItem("authtoken");
    const response = await axios.get(
      `${API_URL}/beneficiaries/benef-all-bank/${beneficiaryId}`,
      {
        headers: { Authorization: `Bearer ${authtoken}` },
      }
    );
    return response.data;
  },
};