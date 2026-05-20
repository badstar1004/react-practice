/**
 * issueApi.js
 *
 * OwnerCodeInf REST API
 */

import clientApi from "./clientApi";

export function fetchOwnerCodeListApi(params) {
  return clientApi.get("/owner-code-inf", { params: params });
}

export function saveOwnerCodeRowsApi(changedRows) {
  return clientApi.put("/owner-code-inf", changedRows);
}
