// src/services/transactionApi.js
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const transactionApi = createApi({
  reducerPath: "transactionApi",
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem("bearertoken");
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ["Transaction"],
  endpoints: (builder) => ({
    getTransactions: builder.query({
      query: ({ customerId, currencyCode }) =>
        `/transactions/${customerId}/${currencyCode}`,
      providesTags: (result, error, { customerId, currencyCode }) => [
        { type: "Transaction", id: `${customerId}-${currencyCode}` },
        "Transaction",
      ],
      // ✅ CACHE CONFIGURATION
      keepUnusedDataFor: 300, // Keep in cache for 5 minutes
      refetchOnMount: false, // Don't refetch on mount
      refetchOnReconnect: false,
      refetchOnFocus: false,
    }),

    getBeneficiaries: builder.query({
      query: ({ customerId }) => `/beneficiary/${customerId}`,
      providesTags: ["Beneficiary"],
      keepUnusedDataFor: 600, // Keep for 10 minutes (beneficiaries change less)
    }),

    // Mutations for invalidation
    addTransaction: builder.mutation({
      query: (transaction) => ({
        url: "/transactions",
        method: "POST",
        body: transaction,
      }),
      invalidatesTags: ["Transaction"],
    }),
  }),
});

export const {
  useGetTransactionsQuery,
  useGetBeneficiariesQuery,
  useAddTransactionMutation,
} = transactionApi;
