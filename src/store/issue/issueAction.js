/**
 * issueAction.js
 *
 * OwnerCodeInf Redux Action Type / Action Creator
 */

import { uniqueKey } from "utils/uniqueKey";

/** Redux store에서 issue slice를 구분하는 키 */
export const ISSUE_MGMT = uniqueKey("page/issue");

/** Owner Code 목록 조회 — REQUEST / SUCCESS / FAILURE */
export const FETCH_OWNER_CODE_LIST_REQUEST = "FETCH_OWNER_CODE_LIST_REQUEST";
export const FETCH_OWNER_CODE_LIST_SUCCESS = "FETCH_OWNER_CODE_LIST_SUCCESS";
export const FETCH_OWNER_CODE_LIST_FAILURE = "FETCH_OWNER_CODE_LIST_FAILURE";

/** Owner Code 행 저장 — REQUEST / SUCCESS / FAILURE */
export const SAVE_OWNER_CODE_ROWS_REQUEST = "SAVE_OWNER_CODE_ROWS_REQUEST";
export const SAVE_OWNER_CODE_ROWS_SUCCESS = "SAVE_OWNER_CODE_ROWS_SUCCESS";
export const SAVE_OWNER_CODE_ROWS_FAILURE = "SAVE_OWNER_CODE_ROWS_FAILURE";

/** Owner Code 목록 조회 요청 — payload: { ownerCd, usageCd, noUsage } */
export const fetchOwnerCodeListRequest = (payload) => ({
  type: FETCH_OWNER_CODE_LIST_REQUEST,
  payload,
});

/** Owner Code 목록 조회 성공 */
export const fetchOwnerCodeListSuccess = (data) => ({
  type: FETCH_OWNER_CODE_LIST_SUCCESS,
  data,
});

/** Owner Code 목록 조회 실패 */
export const fetchOwnerCodeListFailure = (error) => ({
  type: FETCH_OWNER_CODE_LIST_FAILURE,
  error,
});

/** Owner Code 변경 행 저장 요청 — payload: { changedRows, searchConditions } */
export const saveOwnerCodeRowsRequest = (payload) => ({
  type: SAVE_OWNER_CODE_ROWS_REQUEST,
  payload,
});

/** Owner Code 저장 성공 */
export const saveOwnerCodeRowsSuccess = (data) => ({
  type: SAVE_OWNER_CODE_ROWS_SUCCESS,
  data,
});

/** Owner Code 저장 실패 */
export const saveOwnerCodeRowsFailure = (error) => ({
  type: SAVE_OWNER_CODE_ROWS_FAILURE,
  error,
});
