/**
 * issueReducer.js
 *
 * OwnerCodeInf 화면 Redux state
 */

import {
  FETCH_OWNER_CODE_LIST_REQUEST,
  FETCH_OWNER_CODE_LIST_SUCCESS,
  FETCH_OWNER_CODE_LIST_FAILURE,
  SAVE_OWNER_CODE_ROWS_REQUEST,
  SAVE_OWNER_CODE_ROWS_SUCCESS,
  SAVE_OWNER_CODE_ROWS_FAILURE,
} from "./issueAction";

/** Owner Code 화면 초기 state */
const initialState = {
  /** API 조회 결과 — 그리드 rowData 원본 */
  ownerCodeList: [],
  /** 목록 조회 중 여부 */
  listLoading: false,
  /** 저장 API 진행 중 여부 */
  saving: false,
  /** 마지막 API 에러 (조회·저장 공통) */
  error: null,
};

/**
 * Owner Code Redux reducer
 * 저장 성공 후 목록 갱신은 saga에서 fetchOwnerCodeListRequest 재호출로 처리
 */
export default function issueReducer(
  state = initialState,
  { type, data, error } = {},
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
      // ownerCodeList는 저장 직후 saga 재조회 결과로 갱신
      return {
        ...state,
        saving: false,
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
