// src/features/Auth/Registration/Plaid/PlaidCallback.js - SAFE VERSION
import React from 'react';

const PlaidCallback = () => {
  const spinnerStyle = {
    animation: 'spin 1s linear infinite',
    borderRadius: '50%',
    height: '3rem',
    width: '3rem',
    borderBottom: '2px solid #2563eb',
    margin: '0 auto 1rem auto'
  };
  
  const containerStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh'
  };
  
  const textStyle = {
    textAlign: 'center',
    color: '#4b5563'
  };

  return React.createElement(
    'div',
    { style: containerStyle },
    React.createElement(
      'div',
      { style: textStyle },
      [
        React.createElement('div', { key: 'spinner', style: spinnerStyle }),
        React.createElement('p', { key: 'text' }, 'Loading Plaid Connection...')
      ]
    )
  );
};

export default PlaidCallback;