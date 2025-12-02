// src/features/Remittance/slices/remittancePartnersSlice.js
import { createSlice } from "@reduxjs/toolkit";
import {
  fetchOriginatingPartner,
  fetchPayoutPartnerByCurrency,
} from "../thunks/remittanceThunks";

const initialState = {
  // Partner Data
  originatingPartner: {
    data: null,
    loading: false,
    error: null,
  },

  payoutPartner: {
    data: null,
    loading: false,
    error: null,
  },

  // Partner Logos
  partnerLogos: {
    originatingLogo: "",
    payoutLogo: "",
    isLoading: false,
    hasError: false,
  },

  // Default Logos
  defaultLogos: {
    originating: "/path/to/default-originating-logo.png",
    payout: "/path/to/default-payout-logo.png",
  },

  // Partner Configuration
  partnerConfiguration: {
    originating: {
      id: null,
      name: "",
      logo: "",
      isWhiteLabelled: false,
    },
    payout: {
      currency: "",
      name: "",
      logo: "",
      country: "",
    },
  },

  // Partners by Currency Cache
  partnersByCurrency: {},

  // Loading states for thunks
  loadingStates: {
    originatingPartner: false,
    payoutPartner: false,
    payoutPartnerByCurrency: false,
  },

  // Error states for thunks
  errorStates: {
    originatingPartner: null,
    payoutPartner: null,
    payoutPartnerByCurrency: null,
  },
};

const remittancePartnersSlice = createSlice({
  name: "remittancePartners",
  initialState,
  reducers: {
    // Partner Actions
    setOriginatingPartner: (state, action) => {
      state.originatingPartner.data = action.payload;
      state.originatingPartner.loading = false;
      state.originatingPartner.error = null;
    },

    setPayoutPartner: (state, action) => {
      state.payoutPartner.data = action.payload;
      state.payoutPartner.loading = false;
      state.payoutPartner.error = null;
    },

    clearPartners: (state) => {
      state.originatingPartner = {
        data: null,
        loading: false,
        error: null,
      };
      state.payoutPartner = {
        data: null,
        loading: false,
        error: null,
      };
    },

    // Logo Actions
    setPartnerLogos: (state, action) => {
      state.partnerLogos = {
        ...state.partnerLogos,
        ...action.payload,
      };
    },

    setDefaultLogos: (state, action) => {
      state.defaultLogos = {
        ...state.defaultLogos,
        ...action.payload,
      };
    },

    // Configuration Actions
    setPartnerConfiguration: (state, action) => {
      state.partnerConfiguration = {
        ...state.partnerConfiguration,
        ...action.payload,
      };
    },

    // Cache Actions
    setPartnersByCurrency: (state, action) => {
      const { currency, data } = action.payload;
      state.partnersByCurrency[currency] = {
        data,
        fetchedAt: Date.now(),
      };
    },

    // Clear loading states
    clearLoading: (state, action) => {
      const { loadingType } = action.payload || {};
      if (loadingType && state.loadingStates[loadingType]) {
        state.loadingStates[loadingType] = false;
      } else {
        Object.keys(state.loadingStates).forEach((key) => {
          state.loadingStates[key] = false;
        });
      }
    },

    // Clear error states
    clearError: (state, action) => {
      const { errorType } = action.payload || {};
      if (errorType && state.errorStates[errorType]) {
        state.errorStates[errorType] = null;
      } else {
        Object.keys(state.errorStates).forEach((key) => {
          state.errorStates[key] = null;
        });
      }
    },

    // Clear partners by currency cache
    clearPartnersByCurrency: (state) => {
      state.partnersByCurrency = {};
    },

    // Reset partners
    resetPartners: () => initialState,
  },

  extraReducers: (builder) => {
    // ===================== ORIGINATING PARTNER =====================
    builder
      .addCase(fetchOriginatingPartner.pending, (state) => {
        state.loadingStates.originatingPartner = true;
        state.errorStates.originatingPartner = null;
        state.originatingPartner.loading = true;
        state.originatingPartner.error = null;
      })
      .addCase(fetchOriginatingPartner.fulfilled, (state, action) => {
        state.loadingStates.originatingPartner = false;
        state.originatingPartner.loading = false;
        state.originatingPartner.data = action.payload.data;

        // Update partner logos
        if (action.payload.logo) {
          state.partnerLogos.originatingLogo = action.payload.logo;
        }

        // Update partner configuration
        state.partnerConfiguration.originating = {
          id: action.payload.data?.id,
          name: action.payload.data?.name,
          logo: action.payload.logo,
          isWhiteLabelled: action.payload.data?.is_white_labelled,
        };
      })
      .addCase(fetchOriginatingPartner.rejected, (state, action) => {
        state.loadingStates.originatingPartner = false;
        state.errorStates.originatingPartner =
          action.payload || action.error.message;
        state.originatingPartner.loading = false;
        state.originatingPartner.error = action.payload || action.error.message;

        // Use default logo on error
        state.partnerLogos.originatingLogo = state.defaultLogos.originating;
      });

    // ===================== PAYOUT PARTNER BY CURRENCY =====================
    builder
      .addCase(fetchPayoutPartnerByCurrency.pending, (state) => {
        state.loadingStates.payoutPartnerByCurrency = true;
        state.errorStates.payoutPartnerByCurrency = null;
        state.payoutPartner.loading = true;
        state.payoutPartner.error = null;
      })
      .addCase(fetchPayoutPartnerByCurrency.fulfilled, (state, action) => {
        state.loadingStates.payoutPartnerByCurrency = false;
        state.payoutPartner.loading = false;
        state.payoutPartner.data = action.payload.data;

        // Cache partner by currency
        const { currencyCode, data, logo } = action.payload;
        state.partnersByCurrency[currencyCode] = {
          data,
          logo,
          fetchedAt: Date.now(),
        };

        // Update partner logos
        if (logo) {
          state.partnerLogos.payoutLogo = logo;
        }

        // Update partner configuration
        state.partnerConfiguration.payout = {
          currency: currencyCode,
          name: data?.name,
          logo: logo,
          country: data?.country,
        };
      })
      .addCase(fetchPayoutPartnerByCurrency.rejected, (state, action) => {
        state.loadingStates.payoutPartnerByCurrency = false;
        state.errorStates.payoutPartnerByCurrency =
          action.payload || action.error.message;
        state.payoutPartner.loading = false;
        state.payoutPartner.error = action.payload || action.error.message;

        // Use default logo on error
        state.partnerLogos.payoutLogo = state.defaultLogos.payout;
      });
  },
});

// Export actions
export const {
  setOriginatingPartner,
  setPayoutPartner,
  clearPartners,
  setPartnerLogos,
  setDefaultLogos,
  setPartnerConfiguration,
  setPartnersByCurrency,
  clearLoading,
  clearError,
  clearPartnersByCurrency,
  resetPartners,
} = remittancePartnersSlice.actions;

// Export selectors
export const selectRemittancePartners = (state) => state.remittancePartners;
export const selectOriginatingPartner = (state) =>
  state.remittancePartners.originatingPartner;
export const selectPayoutPartner = (state) =>
  state.remittancePartners.payoutPartner;
export const selectDefaultLogos = (state) =>
  state.remittancePartners.defaultLogos;
export const selectPartnerConfiguration = (state) =>
  state.remittancePartners.partnerConfiguration;
export const selectPartnersByCurrency = (state) =>
  state.remittancePartners.partnersByCurrency;
export const selectPartnerLogos = (state) =>
  state.remittancePartners.partnerLogos;

// Derived selectors - FIXED VERSION
export const selectPartnerStatus = (state) => ({
  originating: {
    loaded: !!state.remittancePartners.originatingPartner.data,
    loading: state.remittancePartners.originatingPartner.loading,
    error: state.remittancePartners.originatingPartner.error,
  },
  payout: {
    loaded: !!state.remittancePartners.payoutPartner.data,
    loading: state.remittancePartners.payoutPartner.loading,
    error: state.remittancePartners.payoutPartner.error,
  },
});

export const selectDisplayPartnerInfo = (state) => {
  const originating = state.remittancePartners.originatingPartner.data;
  const payout = state.remittancePartners.payoutPartner.data;

  return {
    originating: {
      name: originating?.name || "Sending Partner",
      logo: state.remittancePartners.partnerLogos.originatingLogo,
      country: originating?.country || "",
    },
    payout: {
      name: payout?.name || "Receiving Partner",
      logo: state.remittancePartners.partnerLogos.payoutLogo,
      country: payout?.country || "",
    },
    showLogos: true,
  };
};

export const selectIsWhiteLabelledSetup = (state) => {
  const config = state.remittancePartners.partnerConfiguration.originating;
  return config.isWhiteLabelled || false;
};

export default remittancePartnersSlice.reducer;
