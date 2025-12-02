import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  // Array of { id, type: 'success'|'error'|'info'|'warning', message, duration }
  notifications: [],
};

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addNotification: (state, action) => {
      const { type, message, duration = 3000, id: providedId } = action.payload;
      const id = providedId ?? Date.now();
      state.notifications.push({ id, type, message, duration });
    },
    removeNotification: (state, action) => {
      const id = action.payload;
      state.notifications = state.notifications.filter((n) => n.id !== id);
    },
    clearAllNotifications: (state) => {
      state.notifications = [];
    },
  },
});

export const { addNotification, removeNotification, clearAllNotifications } = notificationSlice.actions;
export default notificationSlice.reducer;
