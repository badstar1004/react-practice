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

/**
 * @param {Object} payload - { groupCodes: ['USAGE_CD'] }
 */
export const fetchCommonCodeRequest = function (payload) {
  return {
    type: FETCH_COMMON_CODE_REQUEST,
    payload,
  };
};

/** 성공 시 data: { usageCodeList: [{ code, name }] } */
export const fetchCommonCodeSuccess = function (data) {
  return {
    type: FETCH_COMMON_CODE_SUCCESS,
    data,
  };
};

export const fetchCommonCodeFailure = function (error) {
  return {
    type: FETCH_COMMON_CODE_FAILURE,
    error,
  };
};
