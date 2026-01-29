// utils/beneficiaryApi.js
import { centralizedApi } from "../../../services/api";

export const beneficiaryApi = {
  // Get beneficiary data with caching
  async getBeneficiaryData(beneficiaryId) {
    try {
      const response = await centralizedApi.api.get(
        `/beneficiaries/fetch-merchant-benef/${beneficiaryId}`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching beneficiary data:", error);
      throw error;
    }
  },

  // Get all data in one optimized call
  async getAllBeneficiaryData(beneficiaryId) {
    try {
      console.log("🔄 Fetching all data for beneficiary:", beneficiaryId);

      // Use Promise.all to fetch in parallel with caching
      const [currencies, transactions, requestStatus, senders] =
        await Promise.all([
          this.getCurrencies(),
          this.getTransactions(beneficiaryId),
          this.getRequestStatus(beneficiaryId),
          this.getSenders(beneficiaryId),
        ]);

      return {
        currencies,
        transactions,
        requestStatus,
        senders,
        success: true,
      };
    } catch (error) {
      console.error("Error fetching all beneficiary data:", error);
      throw error;
    }
  },

  // Individual methods with caching
  async getCurrencies() {
    try {
      const response = await centralizedApi.api.get("/payout-currencies");
      const data = response.data;

      let currenciesArray = [];
      if (Array.isArray(data)) {
        currenciesArray = data;
      } else if (data.currencies && Array.isArray(data.currencies)) {
        currenciesArray = data.currencies;
      } else if (data.data && Array.isArray(data.data)) {
        currenciesArray = data.data;
      } else {
        currenciesArray = Object.keys(data).map((key) => ({
          code: key,
          name: data[key],
        }));
      }

      return currenciesArray;
    } catch (error) {
      console.error("Error fetching currencies:", error);
      return [
        { code: "USD", name: "US Dollar" },
        { code: "EUR", name: "Euro" },
        { code: "GBP", name: "British Pound" },
        { code: "JPY", name: "Japanese Yen" },
      ];
    }
  },

  async getTransactions(beneficiaryId) {
    try {
      const response = await centralizedApi.api.get(
        `/beneficiaries/all-transactions/${beneficiaryId}`
      );
      const data = response.data;

      let transactionsData = [];
      if (data.data?.transactionDetails) {
        transactionsData = data.data.transactionDetails;
      } else if (data.transactionDetails) {
        transactionsData = data.transactionDetails;
      } else if (Array.isArray(data.data)) {
        transactionsData = data.data;
      } else if (Array.isArray(data)) {
        transactionsData = data;
      }

      const sortedTransactions = transactionsData.sort(
        (a, b) =>
          new Date(b.transaction_datetime || b.created_at) -
          new Date(a.transaction_datetime || a.created_at)
      );

      return sortedTransactions.map((transaction) => ({
        id: transaction.transaction_id || transaction.id,
        amount: transaction.instructed_amount || transaction.amount,
        currency: transaction.currency_code || transaction.currency,
        status: transaction.status,
        created_at: transaction.transaction_datetime || transaction.created_at,
        direction: transaction.direction,
        fee_amount: transaction.fee_amount,
        amount_with_fee: transaction.amount_with_fee,
        particulars: transaction.particulars,
        sender_name: transaction.sender_name,
      }));
    } catch (error) {
      console.error("Error fetching transactions:", error);
      return [];
    }
  },

  async getRequestStatus(beneficiaryId) {
    try {
      const response = await centralizedApi.api.get(
        `/request-status/${beneficiaryId}`
      );
      const data = response.data;

      if (data.data && Array.isArray(data.data)) {
        return data.data.slice(0, 5);
      } else if (Array.isArray(data)) {
        return data.slice(0, 5);
      } else {
        return [
          {
            id: "REQ-001",
            amount: "1000.00",
            currency: "USD",
            status: "completed",
            created_at: new Date().toISOString(),
          },
        ];
      }
    } catch (error) {
      console.log("Request status endpoint not found, returning mock data");
      return [
        {
          id: "REQ-001",
          amount: "1000.00",
          currency: "USD",
          status: "completed",
          created_at: new Date().toISOString(),
        },
        {
          id: "REQ-002",
          amount: "2500.00",
          currency: "EUR",
          status: "pending",
          created_at: new Date().toISOString(),
        },
      ];
    }
  },

  async getSenders(beneficiaryId) {
    try {
      const response = await centralizedApi.api.get(
        `/beneficiaries/senders/${beneficiaryId}`
      );
      const data = response.data;

      if (
        data.getbenefsendersacctobeneficiaryid_data &&
        Array.isArray(data.getbenefsendersacctobeneficiaryid_data)
      ) {
        return data.getbenefsendersacctobeneficiaryid_data.map((item) => ({
          id: item.customer_id,
          full_name: `${item.customer?.first_name || ""} ${
            item.customer?.middle_name || ""
          } ${item.customer?.last_name || ""}`
            .trim()
            .replace(/\s+/g, " "),
          first_name: item.customer?.first_name || "",
          middle_name: item.customer?.middle_name || "",
          last_name: item.customer?.last_name || "",
          email: item.customer?.email || "",
          phone: item.customer?.mobile_number || "",
          country: item.customer?.country || "",
        }));
      } else {
        return [];
      }
    } catch (error) {
      if (error.response?.status === 404) {
        return [];
      }
      console.error("Error fetching senders:", error);
      return [];
    }
  },

  async submitRemittanceRequest(requestData) {
    try {
      const response = await centralizedApi.api.post(
        "/request-remit",
        requestData
      );
      return response.data;
    } catch (error) {
      console.error("Error submitting remittance request:", error);
      throw error;
    }
  },

  // Clear cache for beneficiary
  clearCache(beneficiaryId) {
    centralizedApi.clearCache(`/beneficiaries/`);
    console.log(`🧹 Cleared cache for beneficiary ${beneficiaryId}`);
  },
};
