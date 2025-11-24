// hooks/useTeamActions.js
import { useDispatch, useSelector } from 'react-redux';
import { useCallback } from 'react';
import { 
  fetchTeamMembers, 
  deleteTeamMember, 
  clearError 
} from '../Slice/teamSlice';

export const useTeamActions = () => {
  const dispatch = useDispatch();

  const loadTeamMembers = useCallback((customerId, authToken, API_URL) => {
    return dispatch(fetchTeamMembers({ customerId, authToken, API_URL }));
  }, [dispatch]);

  const removeTeamMember = useCallback((staffId, authToken, API_URL) => {
    return dispatch(deleteTeamMember({ staffId, authToken, API_URL }));
  }, [dispatch]);

  const resetError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  return {
    loadTeamMembers,
    removeTeamMember,
    resetError,
  };
};

export const useTeamState = () => {
  return useSelector((state) => state.team);
};