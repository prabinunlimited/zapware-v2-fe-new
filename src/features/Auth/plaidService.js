import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

export const initiatePlaidLink = async (customerId, hostname) => {
  try {
    const response = await axios.post(`${API_URL}/plaid/link`, {
      customer_id: customerId,
      hostname: hostname,
    });
    return {
      success: true,
      url: response.data.link_url,
      request_id: response.data.request_id
    };
  } catch (error) {
    
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to connect with Plaid'
    };
  }
};

export const exchangePlaidToken = async (publicToken) => {
  try {
    const response = await axios.post(`${API_URL}/plaid/exchange`, {
      public_token: publicToken
    });
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to exchange Plaid token'
    };
  }
};