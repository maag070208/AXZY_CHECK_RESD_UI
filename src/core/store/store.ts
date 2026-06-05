import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./auth/auth.slice";
import toastReducer from "./toast/toast.slice";
import loaderReducer from "./loader/loader.slice";
import tableReducer from "./tables/tables.slice";

const TOKEN_STORAGE_KEY = "token";

const store = configureStore({
  reducer: {
    auth: authReducer,
    toast: toastReducer,
    loader: loaderReducer,
    table: tableReducer,
  },
});

let lastPersistedToken: string | null = store.getState().auth.token;
store.subscribe(() => {
  const token = store.getState().auth.token;
  if (token === lastPersistedToken) return;
  lastPersistedToken = token;
  try {
    if (token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  } catch {
    return;
  }
});

export type AppState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
