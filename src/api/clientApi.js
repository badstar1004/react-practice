import axios from "axios";

const clientApi = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 5000,
  headers: {
    "Content-Type": "application/json",
  },
});

// 응답 인터셉터 설정
clientApi.interceptors.response.use(
  (response) => response,
  (error) => {
    const response = error.response || {};
    const responseData = response.data || {};
    const status = response.status;
    const message =
      responseData.message ||
      responseData.error ||
      error.message ||
      "API 호출 중 오류가 발생했습니다.";

    return Promise.reject({
      status,
      message,
      originalError: error,
    });
  },
);

export default clientApi;
