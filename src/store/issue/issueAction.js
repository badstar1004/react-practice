/**
 * issueAction.js
 *
 * OwnerCodeInf Redux Action Type / Action Creator
 */

import { uniqueKey } from "utils/uniqueKey";

export const ISSUE_MGMT = uniqueKey("page/issue");

export const FETCH_OWNER_CODE_LIST_REQUEST = "FETCH_OWNER_CODE_LIST_REQUEST";
export const FETCH_OWNER_CODE_LIST_SUCCESS = "FETCH_OWNER_CODE_LIST_SUCCESS";
export const FETCH_OWNER_CODE_LIST_FAILURE = "FETCH_OWNER_CODE_LIST_FAILURE";

export const SAVE_OWNER_CODE_ROWS_REQUEST = "SAVE_OWNER_CODE_ROWS_REQUEST";
export const SAVE_OWNER_CODE_ROWS_SUCCESS = "SAVE_OWNER_CODE_ROWS_SUCCESS";
export const SAVE_OWNER_CODE_ROWS_FAILURE = "SAVE_OWNER_CODE_ROWS_FAILURE";

export const fetchOwnerCodeListRequest = function (payload) {
  return {
    type: FETCH_OWNER_CODE_LIST_REQUEST,
    payload,
  };
};

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
