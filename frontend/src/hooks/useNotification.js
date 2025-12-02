import { useDispatch } from 'react-redux';
import { addNotification } from '../store/slices/notificationSlice';

export const useNotification = () => {
  const dispatch = useDispatch();

  return {
    success: (message, duration = 3000) =>
      dispatch(addNotification({ type: 'success', message, duration })),
    error: (message, duration = 4000) =>
      dispatch(addNotification({ type: 'error', message, duration })),
    info: (message, duration = 3000) =>
      dispatch(addNotification({ type: 'info', message, duration })),
    warning: (message, duration = 3500) =>
      dispatch(addNotification({ type: 'warning', message, duration })),
  };
};
