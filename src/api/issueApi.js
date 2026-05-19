/**
 * issueApi.js
 *
 * OwnerCodeInf REST API
 *
 * 테이블: WorkAreaCd(PK), OwnerCd(PK), UsageCd(null)
 */

import clientApi from "./clientApi";

/**
 * 목록 조회
 * @param {Object} params - { ownerCd, usageCd, noUsage }
 */
export function fetchOwnerCodeListApi(params) {
  return clientApi.get("/owner-code-inf", { params: params });
}

/**
 * 용도 공통코드 목록
 * @param {Object} params - { groupCodes: ['USAGE_CD'] }
 */
export function fetchCommonCodeApi(params) {
  return clientApi.get("/owner-code-inf/common-code-list", { params: params });
}

/**
 * 변경 행 일괄 저장
 * @param {Array} changedRows - [{ workAreaCd, ownerCd, usageCd }]
 */
export function saveOwnerCodeRowsApi(changedRows) {
  return clientApi.put("/owner-code-inf", changedRows);
}
