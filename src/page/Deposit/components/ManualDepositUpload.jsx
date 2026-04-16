// src/page/Deposit/components/ManualDepositUpload.jsx
import React, { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiUpload, FiFile, FiX, FiCheck, FiAlertCircle } from "react-icons/fi";
import { RingLoader } from "react-spinners";
import {
  FaCloudUploadAlt,
  FaImage,
  FaFilePdf,
  FaFileAlt,
} from "react-icons/fa";
import { toast } from "react-toastify";

const ManualDepositUpload = ({
  selectedCurrency,
  amount,
  description,
  onDescriptionChange,
  onFileSelect,
  onUploadSuccess,
  onUploadError,
  isSubmitting = false,
  maxFileSize = 5 * 1024 * 1024, // 5MB default
  acceptedFileTypes = [
    ".pdf",
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
    ".bmp",
    ".tiff",
    ".webp",
  ],
}) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileError, setFileError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const validateFile = (file) => {
    // Check file size
    if (file.size > maxFileSize) {
      setFileError(
        `File size must be less than ${formatFileSize(maxFileSize)}`,
      );
      return false;
    }

    // Check file type
    const fileExtension = file.name
      .substring(file.name.lastIndexOf("."))
      .toLowerCase();
    if (!acceptedFileTypes.includes(fileExtension)) {
      setFileError(`File type must be: ${acceptedFileTypes.join(", ")}`);
      return false;
    }

    setFileError("");
    return true;
  };

  const handleFileSelect = (file) => {
    if (!file) return;

    if (validateFile(file)) {
      setSelectedFile(file);
      onFileSelect?.(file);

      // Create preview for images
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreview(reader.result);
        };
        reader.readAsDataURL(file);
      } else {
        setPreview(null);
      }

      // Simulate upload progress (replace with actual upload)
      simulateUpload(file);
    }
  };

  const simulateUpload = (file) => {
    setIsUploading(true);
    setUploadProgress(0);

    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          onUploadSuccess?.(file);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setPreview(null);
    setFileError("");
    setUploadProgress(0);
    setIsUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const getFileIcon = () => {
    if (!selectedFile)
      return <FaCloudUploadAlt className="w-12 h-12 text-blue-500" />;

    const extension = selectedFile.name.split(".").pop().toLowerCase();
    if (["jpg", "jpeg", "png", "gif", "bmp", "webp"].includes(extension)) {
      return <FaImage className="w-12 h-12 text-green-500" />;
    } else if (extension === "pdf") {
      return <FaFilePdf className="w-12 h-12 text-red-500" />;
    }
    return <FaFileAlt className="w-12 h-12 text-blue-500" />;
  };

  const getFileTypeColor = () => {
    if (!selectedFile) return "text-blue-500";
    const extension = selectedFile.name.split(".").pop().toLowerCase();
    if (["jpg", "jpeg", "png", "gif", "bmp", "webp"].includes(extension)) {
      return "text-green-500";
    } else if (extension === "pdf") {
      return "text-red-500";
    }
    return "text-blue-500";
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Description Field */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2 font-sans">
          Deposit Description <span className="text-red-500">*</span>
        </label>
        <textarea
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="Enter a clear description for this deposit (e.g., 'Salary deposit for March 2024')"
          rows={3}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-sans text-gray-900 placeholder-gray-400 transition-all"
          disabled={isSubmitting || isUploading}
        />
        <p className="mt-1 text-xs text-gray-500 font-sans">
          Please provide a clear description to help us identify your deposit
        </p>
      </div>

      {/* File Upload Area */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2 font-sans">
          Upload Deposit Receipt / Proof <span className="text-red-500">*</span>
        </label>

        <div
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => !selectedFile && fileInputRef.current?.click()}
          className={`
            relative border-2 border-dashed rounded-xl p-6
            transition-all duration-200 cursor-pointer
            ${
              isDragging
                ? "border-blue-500 bg-blue-50"
                : selectedFile
                  ? "border-green-500 bg-green-50"
                  : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
            }
            ${isSubmitting || isUploading ? "opacity-50 cursor-not-allowed" : ""}
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileChange}
            accept={acceptedFileTypes.join(",")}
            className="hidden"
            disabled={isSubmitting || isUploading}
          />

          <AnimatePresence mode="wait">
            {!selectedFile ? (
              // Empty State
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-center"
              >
                <FaCloudUploadAlt className="mx-auto w-16 h-16 text-blue-500 mb-4" />
                <p className="text-lg font-medium text-gray-700 mb-2">
                  Drag & drop your file here
                </p>
                <p className="text-sm text-gray-500 mb-4">or click to browse</p>
                <p className="text-xs text-gray-400">
                  Supported formats: {acceptedFileTypes.join(", ")} (Max:{" "}
                  {formatFileSize(maxFileSize)})
                </p>
              </motion.div>
            ) : (
              // File Selected State
              <motion.div
                key="file"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative"
              >
                {/* Preview for images */}
                {preview ? (
                  <div className="relative mb-4">
                    <img
                      src={preview}
                      alt="Preview"
                      className="max-h-48 mx-auto rounded-lg shadow-md object-contain"
                    />
                  </div>
                ) : (
                  <div className="flex justify-center mb-4">
                    {getFileIcon()}
                  </div>
                )}

                {/* File Info */}
                <div className="text-center mb-4">
                  <p className={`font-medium ${getFileTypeColor()}`}>
                    {selectedFile.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {formatFileSize(selectedFile.size)}
                  </p>
                </div>

                {/* Upload Progress */}
                {isUploading && (
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Uploading...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <motion.div
                        className="bg-blue-600 h-2 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${uploadProgress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  </div>
                )}

                {/* Success Message */}
                {uploadProgress === 100 && !isUploading && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-center text-green-600 mb-4"
                  >
                    <FiCheck className="mr-2" />
                    <span>Upload complete!</span>
                  </motion.div>
                )}

                {/* Remove Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveFile();
                  }}
                  className="absolute top-0 right-0 p-1 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-colors"
                  disabled={isSubmitting}
                >
                  <FiX className="w-5 h-5" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Error Message */}
        <AnimatePresence>
          {fileError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-2 flex items-center text-red-600 text-sm"
            >
              <FiAlertCircle className="mr-1" />
              {fileError}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Upload Tips */}
        {!selectedFile && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
            <h4 className="text-sm font-medium text-blue-800 mb-2 flex items-center">
              <FiAlertCircle className="mr-1" />
              Upload Tips:
            </h4>
            <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
              <li>
                Upload a clear screenshot or photo of your bank transfer receipt
              </li>
              <li>
                Make sure all details (amount, date, reference) are visible
              </li>
              <li>Accepted formats: PDF, JPG, PNG, GIF (max 5MB)</li>
              <li>File will be automatically validated upon upload</li>
            </ul>
          </div>
        )}
      </div>

      {/* Summary Section */}
      {selectedFile && description && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-green-50 rounded-lg border border-green-200"
        >
          <div className="flex items-start">
            <FiCheck className="text-green-600 mt-0.5 mr-2 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-green-800">
                Ready to submit your manual deposit
              </p>
              <p className="text-xs text-green-700 mt-1">
                Amount: {selectedCurrency} {amount || "0.00"} | Description:{" "}
                {description}
              </p>
              <p className="text-xs text-green-700">
                File: {selectedFile.name} ({formatFileSize(selectedFile.size)})
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default ManualDepositUpload;
