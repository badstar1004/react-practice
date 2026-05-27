/**
 * pupsPlanReducer.js
 *
 * 목적별 계획(PupsPlan) 그리드 화면 Redux state
 */

import {
  FETCH_PUPS_PLAN_LIST_REQUEST,
  FETCH_PUPS_PLAN_LIST_SUCCESS,
  FETCH_PUPS_PLAN_LIST_FAILURE,
} from "./pupsPlanAction";

const initialState = {
  /** API 원본 record 배열 (flat) — 페이지에서 피벗·병합 변환 후 사용 */
  dataList: [],
  /** 목록 조회 중 */
  listLoading: false,
  /** 마지막 API 에러 */
  error: null,
};

export default function pupsPlanReducer(
  state = initialState,
  { type, data, error } = {},
) {
  switch (type) {
    case FETCH_PUPS_PLAN_LIST_REQUEST:
      return {
        ...state,
        listLoading: true,
        error: null,
      };

    case FETCH_PUPS_PLAN_LIST_SUCCESS:
      return {
        ...state,
        listLoading: false,
        dataList: Array.isArray(data) ? data : [],
      };

    case FETCH_PUPS_PLAN_LIST_FAILURE:
      return {
        ...state,
        listLoading: false,
        error,
      };

    default:
      return state;
  }
}
