import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  value: '',
  initialized: false
};

const hostnameSlice = createSlice({
  name: "hostname",
  initialState,
  reducers: {
    setHostname: (state, action) => {
      state.value = action.payload;
      state.initialized = true;
    }
  }
});

export const { setHostname } = hostnameSlice.actions;
export const selectHostname = (state) => state.hostname.value;
export const selectIsInitialized = (state) => state.hostname.initialized;

export default hostnameSlice.reducer;