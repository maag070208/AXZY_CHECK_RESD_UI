import { ITThemeProvider } from "@axzydev/axzy_ui_system";
import store from "@core/store/store";
import dayjs from "dayjs";
import "dayjs/locale/es";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import React from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { HashRouter } from "react-router-dom";
import App from "./App.tsx";
import "./index.css";
import ToastProvider from "./providers/toast.provider.tsx";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale("es");

const customTheme = {
  primary: "#065911",
  secondary: "#54634d",
  danger: "#BA1A1A",
  success: "#4ADE80",
  layout: {
    sidebarBg: "#ffffff",
    sidebarText: "#54634d",
    navbarBg: "#ffffff",
    navbarText: "#1B1B1F",
  },
  table: {
    headerBg: "#ffffff",
    headerText: "#1B1B1F",
    rowBg: "#ffffff",
    rowText: "#1B1B1F",
  },
};

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Provider store={store}>
      <ITThemeProvider theme={customTheme} showFab={true}>
        <ToastProvider>
          <HashRouter>
            <App />
          </HashRouter>
        </ToastProvider>
      </ITThemeProvider>
    </Provider>
  </React.StrictMode>,
);
