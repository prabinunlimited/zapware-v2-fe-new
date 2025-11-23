import { AnimatePresence, motion } from "framer-motion";

const NavigationPopup = ({
  message,
  onClose,
  onConfirm,
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "info", // auto, success, error, warning, info
  showCancelButton = true,
  size = "md",
  autoTheme = true, // Enable automatic theme based on message content
}) => {
  // Auto-detect theme based on message content for API responses
  const detectThemeFromMessage = (msg) => {
    if (!msg || !autoTheme) return type;
    
    const lowerMsg = msg.toLowerCase();
    
    // Success patterns
    const successPatterns = [
      'success', 'successful', 'completed', 'approved', 'completed successfully',
      'transfer completed', 'payment successful', 'done successfully'
    ];
    
    // Error patterns  
    const errorPatterns = [
      'error', 'failed', 'failure', 'insufficient', 'invalid', 'not found',
      'declined', 'rejected', 'unauthorized', 'forbidden', 'bad request'
    ];
    
    // Warning patterns
    const warningPatterns = [
      'warning', 'caution', 'attention', 'verify', 'check', 'confirm'
    ];

    if (successPatterns.some(pattern => lowerMsg.includes(pattern))) {
      return 'success';
    }
    
    if (errorPatterns.some(pattern => lowerMsg.includes(pattern))) {
      return 'error';
    }
    
    if (warningPatterns.some(pattern => lowerMsg.includes(pattern))) {
      return 'warning';
    }
    
    return type;
  };

  const resolvedType = autoTheme ? detectThemeFromMessage(message) : type;

  const getPopupStyles = () => {
    const baseStyles = {
      icon: {
        info: (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
        warning: (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        ),
        error: (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
        success: (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
      },
      gradient: {
        info: "from-blue-500 to-blue-600",
        warning: "from-amber-500 to-amber-600",
        error: "from-red-500 to-red-600",
        success: "from-emerald-500 to-emerald-600",
      },
      lightBg: {
        info: "bg-blue-50 border-blue-200 text-blue-800",
        warning: "bg-amber-50 border-amber-200 text-amber-800",
        error: "bg-red-50 border-red-200 text-red-800",
        success: "bg-emerald-50 border-emerald-200 text-emerald-800",
      },
      iconColor: {
        info: "text-blue-600",
        warning: "text-amber-600",
        error: "text-red-600",
        success: "text-emerald-600",
      },
    };

    return {
      icon: baseStyles.icon[resolvedType],
      gradient: baseStyles.gradient[resolvedType],
      lightBg: baseStyles.lightBg[resolvedType],
      iconColor: baseStyles.iconColor[resolvedType],
    };
  };

  const getTypeTitle = () => {
    const titles = {
      warning: "Attention Required",
      error: "Action Required",
      success: "Success!",
      info: "Information",
    };
    return titles[resolvedType];
  };

  const getTypeSubtitle = () => {
    const subtitles = {
      warning: "Please review before proceeding",
      error: "Please review and try again",
      success: "Action completed successfully",
      info: "Important information",
    };
    return subtitles[resolvedType];
  };

  const getContextualTip = () => {
    const tips = {
      error: "💡 Check your account balance and try with a smaller amount",
      warning: "⚠️ Please verify all details before confirming",
      success: "✅ Your transaction was processed successfully",
      info: "📋 Please review this information carefully",
    };
    return tips[resolvedType];
  };

  const getSizeStyles = () => {
    const sizes = {
      sm: "max-w-sm",
      md: "max-w-md",
      lg: "max-w-lg",
    };
    return sizes[size] || sizes.md;
  };

  const styles = getPopupStyles();
  const title = getTypeTitle();
  const subtitle = getTypeSubtitle();
  const contextualTip = getContextualTip();
  const sizeClass = getSizeStyles();

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className={`bg-white rounded-2xl shadow-2xl w-full ${sizeClass} overflow-hidden border border-gray-100`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header with Dynamic Gradient */}
          <div className={`bg-gradient-to-r ${styles.gradient} px-6 py-5 text-white`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  {styles.icon}
                </div>
                <div>
                  <h3 className="text-xl font-bold tracking-tight">
                    {title}
                  </h3>
                  <p className="text-white text-opacity-90 text-sm mt-1">
                    {subtitle}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full flex items-center justify-center transition-all duration-200 backdrop-blur-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Message Body */}
          <div className="px-6 py-6">
            <div className={`rounded-xl border ${styles.lightBg} p-4 mb-4`}>
              <div className="flex items-start space-x-3">
                <div className={`w-6 h-6 flex-shrink-0 ${styles.iconColor}`}>
                  {styles.icon}
                </div>
                <p className="text-base leading-relaxed font-medium">
                  {message}
                </p>
              </div>
            </div>

            {/* Contextual Tip */}
            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <p className="text-gray-600 text-sm">
                {contextualTip}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row gap-3 justify-end">
              {showCancelButton && (
                <button
                  onClick={onClose}
                  className="px-6 py-3 text-base font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 order-2 sm:order-1"
                >
                  {cancelText}
                </button>
              )}
              <button
                onClick={onConfirm}
                className={`px-6 py-3 text-base font-semibold text-white bg-gradient-to-r ${styles.gradient} rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  resolvedType === "info" ? "focus:ring-blue-500" :
                  resolvedType === "warning" ? "focus:ring-amber-500" :
                  resolvedType === "error" ? "focus:ring-red-500" :
                  "focus:ring-emerald-500"
                } order-1 sm:order-2`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <span>{confirmText}</span>
                  {resolvedType === "success" && (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default NavigationPopup;