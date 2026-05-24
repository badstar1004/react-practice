/**
 * commonCodeAction.js
 *
 * 공통코드 Redux Action
 */

import { uniqueKey } from "utils/uniqueKey";

export const COMMON_CODE_MGMT = uniqueKey("commonCode");

export const FETCH_COMMON_CODE_REQUEST = "FETCH_COMMON_CODE_REQUEST";
export const FETCH_COMMON_CODE_SUCCESS = "FETCH_COMMON_CODE_SUCCESS";
export const FETCH_COMMON_CODE_FAILURE = "FETCH_COMMON_CODE_FAILURE";

/** 공통코드 조회 요청 — payload: { groupCodes: ['USAGE_CD'] } */
export const fetchCommonCodeRequest = (payload) => ({
  type: FETCH_COMMON_CODE_REQUEST,
  payload,
});

/** 공통코드 조회 성공 — data: { usageCodeList: [{ code, name }] } */
export const fetchCommonCodeSuccess = (data) => ({
  type: FETCH_COMMON_CODE_SUCCESS,
  data,
});

/** 공통코드 조회 실패 */
export const fetchCommonCodeFailure = (error) => ({
  type: FETCH_COMMON_CODE_FAILURE,
  error,
});
