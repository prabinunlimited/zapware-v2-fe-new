// src/hooks/usePartnerConfig.js
import { useSelector, useDispatch } from 'react-redux';
import { useEffect } from 'react';
import { 
  fetchPartnerBasicSetup, 
  selectPartnerBasicConfig, 
  selectPartnerBasicConfigLoading, 
  selectPartnerBasicConfigError,
  selectHeaderColor,
  selectTextColor,
  selectDownloadManualEnabled,
  selectWhiteLabelledPartnerId
} from '../features/Auth/slices/partnerSlice';

export const usePartnerConfig = () => {
  const dispatch = useDispatch();
  const config = useSelector(selectPartnerBasicConfig);
  const loading = useSelector(selectPartnerBasicConfigLoading);
  const error = useSelector(selectPartnerBasicConfigError);
  const headerColor = useSelector(selectHeaderColor);
  const textColor = useSelector(selectTextColor);
  const downloadManualEnabled = useSelector(selectDownloadManualEnabled);
  const partnerId = useSelector(selectWhiteLabelledPartnerId);

  useEffect(() => {
    // Only fetch if we have a valid partner ID and no existing config
    if (partnerId && partnerId !== "0" && !config && !loading) {
      dispatch(fetchPartnerBasicSetup());
    }
  }, [config, loading, dispatch, partnerId]);

  const refresh = () => {
    dispatch(fetchPartnerBasicSetup());
  };

  return {
    config,
    loading,
    error,
    headerColor,
    textColor,
    downloadManualEnabled,
    refresh,
    isConfigured: !!config
  };
};

export default usePartnerConfig;