import React from 'react';
import PropTypes from 'prop-types';

const PopupModal = ({ isOpen, title, message, type, onClose }) => {
  if (!isOpen) return null;

  const getColorClass = () => {
    switch (type) {
      case 'error':
        return 'bg-red-100 border-red-400 text-red-700';
      case 'success':
        return 'bg-green-100 border-green-400 text-green-700';
      case 'warning':
        return 'bg-yellow-100 border-yellow-400 text-yellow-700';
      default:
        return 'bg-blue-100 border-blue-400 text-blue-700';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`border-l-4 p-4 ${getColorClass()} rounded-lg shadow-lg max-w-md w-full`}>
        <div className="flex justify-between items-start">
          <div className="flex items-center">
            <h3 className="font-bold text-lg">{title}</h3>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            &times;
          </button>
        </div>
        <div className="mt-2">
          <p>{message}</p>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded ${
              type === 'error'
                ? 'bg-red-500 hover:bg-red-600'
                : type === 'success'
                ? 'bg-green-500 hover:bg-green-600'
                : 'bg-blue-500 hover:bg-blue-600'
            } text-white`}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

PopupModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  title: PropTypes.string.isRequired,
  message: PropTypes.string.isRequired,
  type: PropTypes.oneOf(['success', 'error', 'warning', 'info']),
  onClose: PropTypes.func.isRequired,
};

PopupModal.defaultProps = {
  type: 'info',
};

export default PopupModal;