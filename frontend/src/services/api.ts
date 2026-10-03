import axios, {
  AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
} from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5050/api";

/** Origin the API is served from, used to resolve uploaded image paths. */
const API_ORIGIN = API_URL.replace(/\/api\/?$/, "");

/**
 * Turn a stored image reference into something an `<img>` can load. Bundled
 * artwork lives in `public/`, but seller uploads are served by the API, so
 * those paths need the API origin prepended when the app runs on another port.
 */
export const assetUrl = (src?: string | null): string | undefined => {
  if (!src) return undefined;
  if (/^(https?:|data:|blob:)/i.test(src)) return src;
  return src.startsWith("/uploads/") ? `${API_ORIGIN}${src}` : src;
};

export interface UploadedAsset {
  url: string;
  name: string;
  size: number;
  contentType: string;
}

/** POST raw image bytes; the backend stores the file and returns its path. */
export async function uploadImage(file: Blob, fileName: string): Promise<UploadedAsset> {
  const response = await client.post<{ data: UploadedAsset }>("/uploads", file, {
    headers: {
      "Content-Type": file.type || "application/octet-stream",
      "X-File-Name": fileName,
    },
    timeout: 60000,
  });
  return response.data.data;
}

export const TOKEN_KEY = "campora.token";

export class ApiError extends Error {
  status: number;
  details?: string[] | Record<string, string>;

  constructor(message: string, status: number, details?: ApiError["details"]) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

const client: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 20000,
  headers: { "Content-Type": "application/json" },
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string; details?: unknown }>) => {
    if (error.code === "ECONNABORTED") {
      return Promise.reject(new ApiError("The request took too long. Please try again.", 0));
    }
    if (!error.response) {
      return Promise.reject(
        new ApiError(
          "We could not reach the Campora API. Make sure the backend is running on port 5050.",
          0
        )
      );
    }
    const { status, data } = error.response;
    const message = data?.message || "Something went wrong. Please try again.";
    return Promise.reject(
      new ApiError(message, status, data?.details as ApiError["details"])
    );
  }
);

const unwrap = <T>(response: { data: { data: T } }): T => response.data.data;

async function request<T>(config: AxiosRequestConfig): Promise<T> {
  return unwrap<T>(await client.request<{ data: T }>(config));
}

export const api = {
  get: <T>(url: string, config?: AxiosRequestConfig) => request<T>({ ...config, method: "GET", url }),
  post: <T>(url: string, body?: unknown, config?: AxiosRequestConfig) =>
    request<T>({ ...config, method: "POST", url, data: body }),
  patch: <T>(url: string, body?: unknown, config?: AxiosRequestConfig) =>
    request<T>({ ...config, method: "PATCH", url, data: body }),
  del: <T>(url: string, config?: AxiosRequestConfig) =>
    request<T>({ ...config, method: "DELETE", url }),
  raw: client,
};

export const errorMessage = (error: unknown, fallback = "Something went wrong") =>
  error instanceof Error && error.message ? error.message : fallback;
