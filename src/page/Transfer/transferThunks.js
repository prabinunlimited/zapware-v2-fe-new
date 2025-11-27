import {
  startTransferLoading,
  startSearchLoading,
  stopSearchLoading,
  setTransferSuccess,
  setTransferError,
  setReceiverDetails,
  setCustomerBankAccounts,
} from "./transferSlice";

export const fetchCustomerBankAccounts =
  (customerId) => async (dispatch, getState) => {
    try {
      const { auth } = getState();
      const authtoken = auth.token || localStorage.getItem("authtoken");

      // FIXED: Use import.meta.env for Vite instead of process.env
      const API_URL = import.meta.env.VITE_API_URL;
      

      const response = await fetch(
        `${API_URL}/bank-account-details/${customerId}`,
        {
          headers: {
            Authorization: `Bearer ${authtoken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch bank accounts: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      
      dispatch(setCustomerBankAccounts(data.account_details || []));
    } catch (error) {
      
      dispatch(setTransferError(error.message));
    }
  };

export const searchReceiverByMobile =
  ({ mobile, countryCode }) =>
  async (dispatch, getState) => {
    dispatch(startSearchLoading());
    dispatch(setTransferError(null));

    try {
      const { auth } = getState();
      const authtoken = auth.token || localStorage.getItem("authtoken");

      const API_URL = import.meta.env.VITE_API_URL;
      

      const response = await fetch(`${API_URL}/customers/by-mobile/${mobile}`, {
        headers: {
          Authorization: `Bearer ${authtoken}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      

      if (data.success) {
        dispatch(setReceiverDetails(data.data));
        // FIX: Make sure we return the success payload
        return { success: true, data: data.data };
      } else {
        dispatch(setTransferError(data.message || "User not found"));
        // FIX: Make sure we return the error payload
        return { success: false, error: data.message };
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        "Failed to fetch receiver. Please try again.";
      
      dispatch(setTransferError(errorMessage));
      // FIX: Make sure we return the error payload
      return { success: false, error: errorMessage };
    } finally {
      dispatch(stopSearchLoading());
    }
  };

export const executeTransfer = (transferData) => async (dispatch, getState) => {
  
  dispatch(startTransferLoading());

  try {
    const { auth } = getState();
    const authtoken = auth.token || localStorage.getItem("authtoken");

    const API_URL = import.meta.env.VITE_API_URL;
    

    const response = await fetch(`${API_URL}/transfer`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authtoken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(transferData),
    });

    const data = await response.json();
    

    if (data.status === "Success") {
      
      dispatch(setTransferSuccess());
      return { success: true, data };
    } else {
      
      dispatch(setTransferError(data.message || "Transfer failed"));
      return { success: false, error: data.message };
    }
  } catch (error) {
    
    const errorMessage = error.response?.data?.message || "An error occurred during transfer.";
    dispatch(setTransferError(errorMessage));
    return { success: false, error: errorMessage };
  }
};
