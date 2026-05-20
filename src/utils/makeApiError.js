/** Axios 에러 → 화면 표시용 객체 */
export function makeApiError(error) {
  const response = error && error.response ? error.response : null;
  const responseData = response && response.data ? response.data : null;

  return {
    status: response ? response.status : null,
    message:
      responseData && responseData.message
        ? responseData.message
        : error && error.message
          ? error.message
          : "알 수 없는 오류가 발생했습니다.",
    originalError: error,
  };
}
