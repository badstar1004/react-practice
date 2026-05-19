/**
 * issueAction.js
 *
 * OwnerCodeInf Redux Action Type / Action Creator
 *
 * 흐름: REQUEST(화면) → Saga(API) → SUCCESS/FAILURE(Reducer)
 */

import { uniqueKey } from "utils/uniqueKey";

/** rootReducer 등록 키 (Immutable Map) */
export const ISSUE_MGMT = uniqueKey("page/issue");

/* ==================================================
 * 1. Owner Code 목록 조회
 * ================================================== */
export const FETCH_OWNER_CODE_LIST_REQUEST = "FETCH_OWNER_CODE_LIST_REQUEST";
export const FETCH_OWNER_CODE_LIST_SUCCESS = "FETCH_OWNER_CODE_LIST_SUCCESS";
export const FETCH_OWNER_CODE_LIST_FAILURE = "FETCH_OWNER_CODE_LIST_FAILURE";

/* ==================================================
 * 2. 용도 공통코드 조회
 * ================================================== */
export const FETCH_COMMON_CODE_REQUEST = "FETCH_COMMON_CODE_REQUEST";
export const FETCH_COMMON_CODE_SUCCESS = "FETCH_COMMON_CODE_SUCCESS";
export const FETCH_COMMON_CODE_FAILURE = "FETCH_COMMON_CODE_FAILURE";

/* ==================================================
 * 3. 변경 Row 저장 (UsageCd)
 * ================================================== */
export const SAVE_OWNER_CODE_ROWS_REQUEST = "SAVE_OWNER_CODE_ROWS_REQUEST";
export const SAVE_OWNER_CODE_ROWS_SUCCESS = "SAVE_OWNER_CODE_ROWS_SUCCESS";
export const SAVE_OWNER_CODE_ROWS_FAILURE = "SAVE_OWNER_CODE_ROWS_FAILURE";

/**
 * 목록 조회 요청
 * @param {Object} payload - { ownerCd, usageCd, noUsage }
 */
export const fetchOwnerCodeListRequest = function (payload) {
  return {
    type: FETCH_OWNER_CODE_LIST_REQUEST,
    payload,
  };
};

/** 목록 조회 성공 — data: OwnerCodeInf[] */
export const fetchOwnerCodeListSuccess = function (data) {
  return {
    type: FETCH_OWNER_CODE_LIST_SUCCESS,
    data,
  };
};

export const fetchOwnerCodeListFailure = function (error) {
  return {
    type: FETCH_OWNER_CODE_LIST_FAILURE,
    error,
  };
};

/**
 * 공통코드 조회 요청
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

/**
 * 변경 행 저장 요청
 * @param {Array} payload - [{ workAreaCd, ownerCd, usageCd }, ...]
 */
export const saveOwnerCodeRowsRequest = function (payload) {
  return {
    type: SAVE_OWNER_CODE_ROWS_REQUEST,
    payload,
  };
};

export const saveOwnerCodeRowsSuccess = function (data, changedRows) {
  return {
    type: SAVE_OWNER_CODE_ROWS_SUCCESS,
    data,
    changedRows,
  };
};

export const saveOwnerCodeRowsFailure = function (error) {
  return {
    type: SAVE_OWNER_CODE_ROWS_FAILURE,
    error,
  };
};
