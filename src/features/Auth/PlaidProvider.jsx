import React, { createContext, useState, useContext, useCallback } from 'react';
import { initiatePlaidLink, exchangePlaidToken } from './plaidService';

const PlaidContext = createContext();

export const PlaidProvider = ({ children }) => {
  const [plaidState, setPlaidState] = useState({
    loading: false,
    error: null,
    linkUrl: null,
    mode: 'iframe', // 'iframe' or 'redirect'
  });

  const initiatePlaid = useCallback(async (customerId) => {
    setPlaidState(prev => ({ ...prev, loading: true, error: null }));
    
    const result = await initiatePlaidLink(customerId, window.location.hostname);
    
    if (result.success) {
      setPlaidState(prev => ({
        ...prev,
        loading: false,
        linkUrl: result.url,
      }));
      
      // Use the current mode value directly from setState callback
      setPlaidState(prev => {
        if (prev.mode === 'redirect') {
          window.location.href = result.url;
        }
        return prev;
      });
    } else {
      setPlaidState(prev => ({
        ...prev,
        loading: false,
        error: result.error,
      }));
    }
  }, []); // No dependencies needed

  const handlePlaidSuccess = useCallback(async (publicToken) => {
    setPlaidState(prev => ({ ...prev, loading: true }));
    const result = await exchangePlaidToken(publicToken);
    
    if (result.success) {
      setPlaidState(prev => ({
        ...prev,
        loading: false,
        linkUrl: null,
      }));
      return { success: true, data: result.data };
    } else {
      setPlaidState(prev => ({
        ...prev,
        loading: false,
        error: result.error,
      }));
      return { success: false, error: result.error };
    }
  }, []);

  const resetPlaid = useCallback(() => {
    setPlaidState({
      loading: false,
      error: null,
      linkUrl: null,
      mode: 'iframe',
    });
  }, []);

  const setMode = useCallback((mode) => {
    setPlaidState(prev => ({ ...prev, mode }));
  }, []);

  return (
    <PlaidContext.Provider
      value={{
        ...plaidState,
        initiatePlaid,
        handlePlaidSuccess,
        resetPlaid,
        setMode,
      }}
    >
      {children}
    </PlaidContext.Provider>
  );
};

export const usePlaid = () => useContext(PlaidContext);