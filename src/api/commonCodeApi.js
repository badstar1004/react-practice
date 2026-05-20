/**
 * commonCodeApi.js
 *
 * 공통코드 REST API
 */

import clientApi from "./clientApi";

/**
 * 공통코드 목록
 * @param {Object} params - { groupCodes: ['USAGE_CD'] }
 */
export function fetchCommonCodeApi(params) {
  return clientApi.get("/owner-code-inf/common-code-list", { params: params });
}
