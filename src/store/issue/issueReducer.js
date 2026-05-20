/**
 * issueReducer.js
 *
 * OwnerCodeInf 화면 Redux state
 */

import { mergeSavedRows } from "utils/ownerCode";

import {
  FETCH_OWNER_CODE_LIST_REQUEST,
  FETCH_OWNER_CODE_LIST_SUCCESS,
  FETCH_OWNER_CODE_LIST_FAILURE,
  SAVE_OWNER_CODE_ROWS_REQUEST,
  SAVE_OWNER_CODE_ROWS_SUCCESS,
  SAVE_OWNER_CODE_ROWS_FAILURE,
} from "./issueAction";

const initialState = {
  ownerCodeList: [],
  listLoading: false,
  saving: false,
  error: null,
};

export default function issueReducer(
  state = initialState,
  { type, data, changedRows, error } = {},
) {
  switch (type) {
    case FETCH_OWNER_CODE_LIST_REQUEST:
      return {
        ...state,
        listLoading: true,
        error: null,
      };
    case FETCH_OWNER_CODE_LIST_SUCCESS:
      return {
        ...state,
        listLoading: false,
        ownerCodeList: data || [],
      };
    case FETCH_OWNER_CODE_LIST_FAILURE:
      return {
        ...state,
        listLoading: false,
        error,
      };

    case SAVE_OWNER_CODE_ROWS_REQUEST:
      return {
        ...state,
        saving: true,
        error: null,
      };
    case SAVE_OWNER_CODE_ROWS_SUCCESS:
      return {
        ...state,
        saving: false,
        ownerCodeList: mergeSavedRows(state.ownerCodeList, changedRows),
        error: null,
      };
    case SAVE_OWNER_CODE_ROWS_FAILURE:
      return {
        ...state,
        saving: false,
        error,
      };

    default:
      return state;
  }
}
