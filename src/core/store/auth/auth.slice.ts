import { createSlice } from "@reduxjs/toolkit";
import { decodeToken, isExpired } from "react-jwt";

interface AuthState {
  id: number | null;
  name: string | null;
  email: string | null;
  role: string | null;
  clientId: number | null;
  token: string | null;
}

const initialState: AuthState = {
  id: null,
  name: null,
  email: null,
  role: null,
  clientId: null,
  token: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  selectors: {
    isAuthenticated: (state) => !!state.token,
  },
  reducers: {
    setAuth: (state, action) => {
      const token = action.payload;
      const decoded: any = decodeToken(token);
      const expired = isExpired(token);
      if (!decoded || expired) {
        state.id = null;
        state.name = null;
        state.email = null;
        state.role = null;
        state.clientId = null;
        state.token = null;
        return;
      }

      // ✅ JWT simple y directo
      state.id = decoded.id ?? null;
      state.name = decoded.name ?? "Usuario";
      state.email = decoded.email ?? null;
      state.role = decoded.role ?? null;
      state.clientId = decoded.clientId ?? null;
      state.token = token;
    },

    logout: (state) => {
      state.id = null;
      state.name = null;
      state.email = null;
      state.role = null;
      state.clientId = null;
      state.token = null;
    },
  },
});

export default authSlice.reducer;

export const { setAuth, logout } = authSlice.actions;
export const { isAuthenticated } = authSlice.selectors;
