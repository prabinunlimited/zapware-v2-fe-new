import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

export const downloadManual = createAsyncThunk(
  "download/manual",
  async ({ partnerId, placement }, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      const bearerToken = auth?.token || localStorage.getItem("bearertoken");

      if (!bearerToken) {
        throw new Error("Authentication token not found");
      }

      const response = await axios.post(
        `${API_URL}/get-manuals`,
        { partnerId, placement },
        {
          headers: {
            Authorization: `Bearer ${bearerToken}`,
            "Content-Type": "application/json",
          },
          timeout: 30000,
        }
      );

      if (!response.data || typeof response.data !== "object") {
        throw new Error("Invalid server response format");
      }

      if (response.data.status !== "success") {
        throw new Error(
          response.data.message || "API returned non-success status"
        );
      }

      const manualData = response.data.data;
      if (!manualData?.file_path) {
        throw new Error("Manual file path not found");
      }

      return {
        file_path: manualData.file_path,
        title: manualData.title || "Manual",
      };
    } catch (error) {
      let errorMessage = "Failed to download manual";
      if (error.response) {
        errorMessage =
          error.response.data?.message ||
          `Server error (${error.response.status})`;
      } else if (error.message.includes("File path")) {
        errorMessage = "Manual file path not found";
      } else if (error.message.includes("Authentication")) {
        errorMessage = "Please login to download the manual";
      }

      return rejectWithValue(errorMessage);
    }
  }
);

const initialState = {
  status: "idle",
  error: null,
  lastDownloadUrl: null,
  progress: 0,
};

const downloadSlice = createSlice({
  name: "download",
  initialState,
  reducers: {
    resetDownloadState: (state) => {
      state.status = "idle";
      state.error = null;
      state.lastDownloadUrl = null;
      state.progress = 0;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(downloadManual.pending, (state) => {
        state.status = "loading";
        state.error = null;
        state.progress = 0;
      })
      .addCase(downloadManual.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.lastDownloadUrl = action.payload.file_path;
        state.error = null;
        state.progress = 100;
      })
      .addCase(downloadManual.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
        state.progress = 0;
      });
  },
});

export const selectDownloadStatus = (state) => state.download.status;
export const selectLastDownloadUrl = (state) => state.download.lastDownloadUrl;
export const selectDownloadError = (state) => state.download.error;
export const selectDownloadProgress = (state) => state.download.progress;
export const { resetDownloadState } = downloadSlice.actions;

export default downloadSlice.reducer;