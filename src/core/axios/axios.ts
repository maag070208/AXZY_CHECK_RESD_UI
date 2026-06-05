import axios, {
  AxiosError,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import { logout } from "../store/auth/auth.slice";
import store from "../store/store";
import { TResult } from "../types/TResult";

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_BASE_URL || "http://localhost:4444/api/v2",
});
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const state = store.getState();
    const token = state.auth.token;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  },
);

axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      store.dispatch(logout());

      if (window.location.hash !== "#/login") {
        window.location.hash = "#/login";
      }
    }

    return Promise.reject(error);
  },
);

const handleError = <T>(error: any): TResult<T> => {
  if (error.response?.data) {
    return error.response.data as TResult<T>;
  }
  return {
    success: false,
    data: null as any,
    messages: [error.message || "Error de conexión"],
  };
};

export const post = async <T>(
  url: string,
  data: unknown,
  config?: AxiosRequestConfig,
): Promise<TResult<T>> => {
  try {
    const response = await axiosInstance.post(url, data, config);
    return response.data;
  } catch (error) {
    return handleError<T>(error);
  }
};

export const get = async <T>(
  url: string,
  config?: AxiosRequestConfig,
): Promise<TResult<T>> => {
  try {
    const response = await axiosInstance.get(url, config);
    return response.data;
  } catch (error) {
    return handleError<T>(error);
  }
};

export const patch = async <T>(
  url: string,
  data: unknown,
  config?: AxiosRequestConfig,
): Promise<TResult<T>> => {
  try {
    const response = await axiosInstance.patch(url, data, config);
    return response.data;
  } catch (error) {
    return handleError<T>(error);
  }
};

export const put = async <T>(
  url: string,
  data: unknown,
  config?: AxiosRequestConfig,
): Promise<TResult<T>> => {
  try {
    const response = await axiosInstance.put(url, data, config);
    return response.data;
  } catch (error) {
    return handleError<T>(error);
  }
};

export const remove = async <T>(
  url: string,
  config?: AxiosRequestConfig,
): Promise<TResult<T>> => {
  try {
    const response = await axiosInstance.delete(url, config);
    return response.data;
  } catch (error) {
    return handleError<T>(error);
  }
};

export { axiosInstance };
