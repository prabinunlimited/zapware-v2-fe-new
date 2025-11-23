// src/page/Deposit/hooks/useUI.js
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  setIsAmountFocused,
  setCopiedField,
  clearCopiedField,
  setHelpTooltip,
  setShowCancelModal,
} from '../slices/uiSlice';

export const useUI = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  // Use the deposit-specific UI slice with safe fallback
  const uiState = useSelector((state) => state.uiDeposit || {
    isAmountFocused: false,
    copiedField: null,
    helpTooltips: {},
    showCancelModal: false,
  });

  const copyToClipboard = async (text, fieldName) => {
    try {
      await navigator.clipboard.writeText(text);
      dispatch(setCopiedField(fieldName));
      toast.success(`${fieldName} copied to clipboard!`);
      
      setTimeout(() => {
        dispatch(clearCopiedField());
      }, 2000);
    } catch (error) {
      console.error('Copy to clipboard failed:', error);
      toast.error('Failed to copy to clipboard');
    }
  };

  const handleTooltipShow = (field) => {
    dispatch(setHelpTooltip({ field, visible: true }));
  };

  const handleTooltipHide = (field) => {
    dispatch(setHelpTooltip({ field, visible: false }));
  };

  const handleCancel = () => {
    dispatch(setShowCancelModal(true));
  };

  const confirmCancel = () => {
    dispatch(setShowCancelModal(false));
    navigate(-1);
  };

  const downloadReceipt = (transactionData) => {
    // Implementation for receipt download
    console.log('Downloading receipt:', transactionData);
    
    // Create a simple receipt download
    const receiptContent = `
      Deposit Receipt
      ===============
      Reference: ${transactionData.reference_id || 'N/A'}
      Amount: ${transactionData.amount} 
      Currency: ${transactionData.currency}
      Date: ${new Date().toLocaleString()}
      Status: Completed
    `;
    
    const blob = new Blob([receiptContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `deposit-receipt-${transactionData.reference_id || Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Receipt downloaded successfully!');
  };

  return {
    ...uiState,
    copyToClipboard,
    handleTooltipShow,
    handleTooltipHide,
    handleCancel,
    confirmCancel,
    downloadReceipt,
    setIsAmountFocused: (focused) => dispatch(setIsAmountFocused(focused)),
    setShowCancelModal: (show) => dispatch(setShowCancelModal(show)),
  };
};