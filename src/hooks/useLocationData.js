import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchCountries,
  fetchLocationByZip,
  clearZipLookupData,
  selectCountries,
  selectLocationLoading,
  selectZipLookup
} from '../features/Auth/slices/locationSlice';

export const useLocationData = () => {
  const dispatch = useDispatch();
  const countries = useSelector(selectCountries);
  const loading = useSelector(selectLocationLoading);
  const zipLookup = useSelector(selectZipLookup);

  const loadCountries = useCallback(() => {
    if (countries.length === 0) {
      dispatch(fetchCountries());
    }
  }, [dispatch, countries.length]);

  const lookupByZipCode = useCallback((countryCode, zipCode) => {
    if (countryCode && zipCode && zipCode.length >= 3) {
      dispatch(fetchLocationByZip({ countryCode, zipCode }));
    }
  }, [dispatch]);

  const clearZipData = useCallback(() => {
    dispatch(clearZipLookupData());
  }, [dispatch]);

  return {
    countries,
    loading,
    zipLookup,
    lookupByZipCode,
    clearZipData,
    loadCountries
  };
};