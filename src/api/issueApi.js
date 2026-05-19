import clientApi from "./clientApi";

/**
 * OwnerCodeInf 목록 조회
 *
 * params: { ownerCd, usageCd, noUsage }
 */
export function fetchOwnerCodeListApi(params) {
  return clientApi.get("/owner-code-inf", { params: params });
}

/**
 * 용도 공통코드 조회
 */
export function fetchCommonCodeApi(params) {
  return clientApi.get("/owner-code-inf/common-code-list", { params: params });
}

/**
 * 변경 Row 저장 (UsageCd)
 */
export function saveOwnerCodeRowsApi(changedRows) {
  return clientApi.put("/owner-code-inf", changedRows);
}
