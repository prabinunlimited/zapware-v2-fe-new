import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setAccountData } from '../slices/bankLetterSlice';
import { selectSelectedAccount } from '../../../components/Dashboard/Account/AccountSummary/AccountSlice';

export const useBankLetter = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const selectedAccount = useSelector(selectSelectedAccount);

  const navigateToBankLetter = useCallback((customerId) => {
    if (!customerId) {
      alert('Customer ID not found!');
      return;
    }

    if (selectedAccount) {
      // Set account data in Redux before navigation
      dispatch(setAccountData(selectedAccount));
      
      navigate(`/bankletter/${customerId}`, {
        state: { accountData: selectedAccount },
      });
    } else {
      navigate(`/bankletter/${customerId}`);
    }
  }, [dispatch, navigate, selectedAccount]);

  return { navigateToBankLetter };
};