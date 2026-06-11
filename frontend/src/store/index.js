import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import readerReducer from './slices/readerSlice';

const store = configureStore({
  reducer: {
    auth:   authReducer,
    reader: readerReducer,
  },
  // RTK uses Immer internally — serializability check is on by default.
  // boundingRect (DOMRect) contains methods so we exclude the selection field.
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredPaths: ['reader.selection.boundingRect'],
      },
    }),
});

export default store;
