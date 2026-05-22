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

/**
 * Owner Code 목록 조회 요청
 * @param {Object} payload - 조회조건 { ownerCd, usageCd, noUsage }
 */
export const fetchOwnerCodeListRequest = function (payload) {
  return {
    type: FETCH_OWNER_CODE_LIST_REQUEST,
    payload,
  };
};

/**
 * Owner Code 목록 조회 성공
 * @param {Array} data - API 응답 row 목록
 */
export const fetchOwnerCodeListSuccess = function (data) {
  return {
    type: FETCH_OWNER_CODE_LIST_SUCCESS,
    data,
  };
};

/**
 * Owner Code 목록 조회 실패
 * @param {Object} error - makeApiError 형태 에러
 */
export const fetchOwnerCodeListFailure = function (error) {
  return {
    type: FETCH_OWNER_CODE_LIST_FAILURE,
    error,
  };
};

/**
 * Owner Code 변경 행 저장 요청
 * @param {Object} payload - { changedRows, searchConditions }
 */
export const saveOwnerCodeRowsRequest = function (payload) {
  return {
    type: SAVE_OWNER_CODE_ROWS_REQUEST,
    payload,
  };
};

/**
 * Owner Code 저장 성공
 * @param {*} data - API 응답 (재조회는 saga에서 처리)
 */
export const saveOwnerCodeRowsSuccess = function (data) {
  return {
    type: SAVE_OWNER_CODE_ROWS_SUCCESS,
    data,
  };
};

/**
 * Owner Code 저장 실패
 * @param {Object} error - makeApiError 형태 에러
 */
export const saveOwnerCodeRowsFailure = function (error) {
  return {
    type: SAVE_OWNER_CODE_ROWS_FAILURE,
    error,
  };
};
