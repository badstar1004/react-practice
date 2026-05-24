/**
 * devAreaRevReducer.js
 *
 * devAreaCd별 최종 Rev 조회 화면 Redux state
 */

import {
  FETCH_DEV_AREA_LIST_REQUEST,
  FETCH_DEV_AREA_LIST_SUCCESS,
  FETCH_DEV_AREA_LIST_FAILURE,
  FETCH_DEV_AREA_REV_LIST_REQUEST,
  FETCH_DEV_AREA_REV_LIST_SUCCESS,
  FETCH_DEV_AREA_REV_LIST_FAILURE,
} from "./devAreaRevAction";

/** devAreaRev 화면 초기 state */
const initialState = {
  /** devAreaCd 탭 목록 */
  devAreaList: [],
  /** 탭 목록 조회 중 */
  devAreaListLoading: false,
  /** 최종 Rev 기준 그리드 Rev 목록 (saga에서 필터된 결과) */
  revList: [],
  /** Rev 목록 조회 중 */
  listLoading: false,
  /** 마지막 API 에러 */
  error: null,
};

/** devAreaRev Redux reducer */
export default function devAreaRevReducer(
  state = initialState,
  { type, data, error } = {},
) {
  switch (type) {
    case FETCH_DEV_AREA_LIST_REQUEST:
      return {
        ...state,
        devAreaListLoading: true,
        error: null,
      };

    case FETCH_DEV_AREA_LIST_SUCCESS:
      return {
        ...state,
        devAreaListLoading: false,
        devAreaList: data || [],
      };

    case FETCH_DEV_AREA_LIST_FAILURE:
      return {
        ...state,
        devAreaListLoading: false,
        error,
      };

    case FETCH_DEV_AREA_REV_LIST_REQUEST:
      return {
        ...state,
        listLoading: true,
        revList: [],
        error: null,
      };

    case FETCH_DEV_AREA_REV_LIST_SUCCESS:
      return {
        ...state,
        listLoading: false,
        revList: data || [],
      };

    case FETCH_DEV_AREA_REV_LIST_FAILURE:
      return {
        ...state,
        listLoading: false,
        error,
      };

    default:
      return state;
  }
}
