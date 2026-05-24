/**
 * devAreaRevAction.js
 *
 * devAreaCd별 최종 Rev 조회 화면 Redux Action
 */

import { uniqueKey } from "utils/uniqueKey";

/** Redux store에서 devAreaRev slice를 구분하는 키 */
export const DEV_AREA_REV_MGMT = uniqueKey("page/devAreaRev");

/** devAreaCd 탭 목록 — REQUEST / SUCCESS / FAILURE */
export const FETCH_DEV_AREA_LIST_REQUEST = "FETCH_DEV_AREA_LIST_REQUEST";
export const FETCH_DEV_AREA_LIST_SUCCESS = "FETCH_DEV_AREA_LIST_SUCCESS";
export const FETCH_DEV_AREA_LIST_FAILURE = "FETCH_DEV_AREA_LIST_FAILURE";

/** Rev 목록 조회 — devAreaCd 기준 전체 조회 후 최종 Rev 추출 */
export const FETCH_DEV_AREA_REV_LIST_REQUEST = "FETCH_DEV_AREA_REV_LIST_REQUEST";
export const FETCH_DEV_AREA_REV_LIST_SUCCESS = "FETCH_DEV_AREA_REV_LIST_SUCCESS";
export const FETCH_DEV_AREA_REV_LIST_FAILURE = "FETCH_DEV_AREA_REV_LIST_FAILURE";

/** devAreaCd 탭 목록 조회 요청 */
export const fetchDevAreaListRequest = () => ({
  type: FETCH_DEV_AREA_LIST_REQUEST,
});

/** devAreaCd 탭 목록 조회 성공 — data: [{ devAreaCd, devAreaName }] */
export const fetchDevAreaListSuccess = (data) => ({
  type: FETCH_DEV_AREA_LIST_SUCCESS,
  data,
});

/** devAreaCd 탭 목록 조회 실패 */
export const fetchDevAreaListFailure = (error) => ({
  type: FETCH_DEV_AREA_LIST_FAILURE,
  error,
});

/** Rev 목록 조회 요청 — payload: { devAreaCd } */
export const fetchDevAreaRevListRequest = (payload) => ({
  type: FETCH_DEV_AREA_REV_LIST_REQUEST,
  payload,
});

/** Rev 목록 조회 성공 — data: 최종 Rev 기준 revList 배열 */
export const fetchDevAreaRevListSuccess = (data) => ({
  type: FETCH_DEV_AREA_REV_LIST_SUCCESS,
  data,
});

/** Rev 목록 조회 실패 */
export const fetchDevAreaRevListFailure = (error) => ({
  type: FETCH_DEV_AREA_REV_LIST_FAILURE,
  error,
});
