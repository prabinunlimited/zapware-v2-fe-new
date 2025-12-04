import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchCountries,
  fetchStates,
  fetchCities,
  selectCountries,
  selectStates,
  selectCities,
  selectLocationLoading
} from '../features/Auth/slices/locationSlice';

export const useLocationData = (countryId, stateId) => {
  const dispatch = useDispatch();
  const countries = useSelector(selectCountries);
  const states = useSelector(selectStates);
  const cities = useSelector(selectCities);
  const loading = useSelector(selectLocationLoading);

  useEffect(() => {
    if (countries.length === 0) {
      dispatch(fetchCountries());
    }
  }, [dispatch, countries.length]);

  useEffect(() => {
    if (countryId) {
      dispatch(fetchStates(countryId));
    }
  }, [dispatch, countryId]);

  useEffect(() => {
    if (stateId) {
      dispatch(fetchCities(stateId));
    }
  }, [dispatch, stateId]);

  return {
    countries,
    states,
    cities,
    loading,
    hasStates: states.length > 0,
    hasCities: cities.length > 0
  };
};