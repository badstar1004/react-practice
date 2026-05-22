/**
 * issueSaga.js
 *
 * OwnerCodeInf API 비동기 처리
 */

import { call, put, takeLatest } from "redux-saga/effects";

import { makeApiError } from "utils/makeApiError";
import {
  fetchOwnerCodeListApi,
  saveOwnerCodeRowsApi,
} from "api/issueApi";

import {
  FETCH_OWNER_CODE_LIST_REQUEST,
  SAVE_OWNER_CODE_ROWS_REQUEST,
  fetchOwnerCodeListRequest,
  fetchOwnerCodeListSuccess,
  fetchOwnerCodeListFailure,
  saveOwnerCodeRowsSuccess,
  saveOwnerCodeRowsFailure,
} from "./issueAction";

/**
 * Owner Code 목록 조회 saga
 * @param {Object} action.payload - 조회조건
 */
function* fetchOwnerCodeListSaga({ payload }) {
  try {
    const response = yield call(fetchOwnerCodeListApi, payload);
    yield put(fetchOwnerCodeListSuccess(response.data));
  } catch (error) {
    yield put(fetchOwnerCodeListFailure(makeApiError(error)));
  }
}

/**
 * Owner Code 변경 행 저장 saga
 * 저장 성공 시 searchConditions로 목록 재조회 — reducer merge 대신 서버 기준 동기화
 */
function* saveOwnerCodeRowsSaga({ payload }) {
  const changedRows = payload.changedRows;
  const searchConditions = payload.searchConditions;

  try {
    const response = yield call(saveOwnerCodeRowsApi, changedRows);
    yield put(saveOwnerCodeRowsSuccess(response.data));
    // 저장 후 최신 목록 반영 (화면 searchConditions 기준)
    yield put(fetchOwnerCodeListRequest(searchConditions));
  } catch (error) {
    yield put(saveOwnerCodeRowsFailure(makeApiError(error)));
  }
}

/**
 * issue saga 루트
 * takeLatest — 동일 action 연속 dispatch 시 마지막 요청만 처리
 */
export default function* issueSaga() {
  yield takeLatest(FETCH_OWNER_CODE_LIST_REQUEST, fetchOwnerCodeListSaga);
  yield takeLatest(SAVE_OWNER_CODE_ROWS_REQUEST, saveOwnerCodeRowsSaga);
}
