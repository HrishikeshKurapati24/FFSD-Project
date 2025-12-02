import { configureStore } from '@reduxjs/toolkit';
import notificationReducer from './slices/notificationSlice';
import themeReducer from './slices/themeSlice';

export const store = configureStore({
  reducer: {
    notifications: notificationReducer,
    theme: themeReducer,
  },
});
