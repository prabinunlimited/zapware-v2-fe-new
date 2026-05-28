// hooks/useTeamMemberActions.js
import { useDispatch, useSelector } from "react-redux";
import { useCallback } from "react";
import {
  fetchRoles,
  addTeamMember,
  updateTeamMember, // ADD THIS
  clearError,
  clearSuccess,
  setShowPopup,
} from "../Slice/teamMemberSlice";

export const useTeamMemberActions = () => {
  const dispatch = useDispatch();

  const loadRoles = useCallback(
    (bearertoken, API_URL) => {
      return dispatch(fetchRoles({ bearertoken, API_URL }));
    },
    [dispatch]
  );

  const createTeamMember = useCallback(
    (customerId, memberData, authToken, API_URL) => {
      return dispatch(
        addTeamMember({ customerId, memberData, authToken, API_URL })
      );
    },
    [dispatch]
  );

  // ADD THIS NEW FUNCTION
  const updateTeamMemberAction = useCallback(
    (customerId, staffId, memberData, authToken, API_URL) => {
      return dispatch(
        updateTeamMember({ customerId, staffId, memberData, authToken, API_URL })
      );
    },
    [dispatch]
  );

  const resetError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  const resetSuccess = useCallback(() => {
    dispatch(clearSuccess());
  }, [dispatch]);

  const updateShowPopup = useCallback(
    (show) => {
      dispatch(setShowPopup(show));
    },
    [dispatch]
  );

  return {
    loadRoles,
    createTeamMember,
    updateTeamMember: updateTeamMemberAction, // ADD THIS
    resetError,
    resetSuccess,
    updateShowPopup,
  };
};

export const useTeamMemberState = () => {
  return useSelector((state) => state.teamMember);
};