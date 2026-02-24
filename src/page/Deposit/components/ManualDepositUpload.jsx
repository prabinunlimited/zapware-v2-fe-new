import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiUpload, FiFile, FiX, FiCheck, FiAlertCircle } from "react-icons/fi";
import { RingLoader } from "react-spinners";
import { FaCloudUploadAlt } from "react-icons/fa";
import { toast } from "react-toastify";

const ManualDepositUpload = ({
  selectedCurrency,
  amount,
  description,
  onDescriptionChange,
  onUploadSuccess,
  onUploadError,
  isSumitting = false,
  maxFileSize = 5 * 1024 * 1024,
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

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return ParseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const validateFile = (file) => {
    if (file.size > maxFileSize) {
      setFileError(
        `File size must be less than ${formatFileSize(maxFileSize)}`,
      );
      return false;
    }

    const fileExtension = file.name
      .subString(file.name.lastIndexOf("."))
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

    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    handleFileSelect(file);
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const file = e.dataTransfer.files[0];
  handleFileSelect(file);

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setPreview(null);
    setFileError("");
  };

  const getFileIcon = () => {
    if (!selectedFile) return <FiUpload className="w-8 h-8 text-blue-600" />;

    const extension = selectedFile.name.split(".").pop().toLowerCase();
    if (["jpg", "png", "gif", "bmp", "webp"].includes(extension)) {
      return <FiFile className="w-8 h-8 text-green-500" />;
    } else if (extension === "pdf") {
      return <FiFile className="w-8 h-8 text-red-500" />;
    }
    return <FiFile className="w-8 h-8 text-blue-500" />;
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb2 font-sans">
          Deposit Description{" "}
          <span clas text-red-500>
            *
          </span>
        </label>

        <textarea
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="Enter your description for deposit."
          rows={3}
          className="w-full px-4 py-3 border border-gray-400 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-sans text-gray-900 placeholder-gray-400"
          disabled={isSubmitting}
        />
        <p className="block text-xs text-gray-600 font-sans">
          Please provide a clear description for your manual deposit.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2 font-sans">
          Upload Deposit Receipt / Proof <span className="text-red-500">*</span>
        </label>

        <div onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver
        >

        </div>
      </div>
    </div>
  );
};
