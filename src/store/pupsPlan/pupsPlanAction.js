/**
 * pupsPlanAction.js
 *
 * 목적별 계획(PupsPlan) 그리드 화면 Redux Action
 */

import { uniqueKey } from "utils/uniqueKey";

/** Redux store에서 pupsPlan slice를 구분하는 키 */
export const PUPS_PLAN_MGMT = uniqueKey("page/pupsPlan");

/** 계획 목록 조회 — REQUEST / SUCCESS / FAILURE */
export const FETCH_PUPS_PLAN_LIST_REQUEST = "FETCH_PUPS_PLAN_LIST_REQUEST";
export const FETCH_PUPS_PLAN_LIST_SUCCESS = "FETCH_PUPS_PLAN_LIST_SUCCESS";
export const FETCH_PUPS_PLAN_LIST_FAILURE = "FETCH_PUPS_PLAN_LIST_FAILURE";

export const fetchPupsPlanListRequest = (payload) => ({
  type: FETCH_PUPS_PLAN_LIST_REQUEST,
  payload,
});

export const fetchPupsPlanListSuccess = (data) => ({
  type: FETCH_PUPS_PLAN_LIST_SUCCESS,
  data,
});

export const fetchPupsPlanListFailure = (error) => ({
  type: FETCH_PUPS_PLAN_LIST_FAILURE,
  error,
});
