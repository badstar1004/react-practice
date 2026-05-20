/**
 * commonCodeReducer.js
 *
 * 공통코드 Redux state (용도 콤보 등)
 */

import {
  FETCH_COMMON_CODE_REQUEST,
  FETCH_COMMON_CODE_SUCCESS,
  FETCH_COMMON_CODE_FAILURE,
} from "./commonCodeAction";

const initialState = {
  usageCodeList: [],
  loading: false,
  error: null,
};

export default function commonCodeReducer(
  state = initialState,
  { type, data, error } = {},
) {
  switch (type) {
    case FETCH_COMMON_CODE_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
      };
    case FETCH_COMMON_CODE_SUCCESS:
      return {
        ...state,
        loading: false,
        usageCodeList: data && data.usageCodeList ? data.usageCodeList : [],
        error: null,
      };
    case FETCH_COMMON_CODE_FAILURE:
      return {
        ...state,
        loading: false,
        error,
      };

    default:
      return state;
  }
}
