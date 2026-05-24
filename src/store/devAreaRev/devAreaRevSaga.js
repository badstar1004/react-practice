/**
 * devAreaRevSaga.js
 *
 * devAreaCd별 Rev API 비동기 처리
 */

import { call, put, takeLatest } from "redux-saga/effects";

import { makeApiError } from "utils/makeApiError";
import { resolveFinalRevRows } from "utils/devAreaRev";
import {
  fetchDevAreaListApi,
  fetchDevAreaRevListApi,
} from "api/devAreaRevApi";

import {
  FETCH_DEV_AREA_LIST_REQUEST,
  FETCH_DEV_AREA_REV_LIST_REQUEST,
  fetchDevAreaListSuccess,
  fetchDevAreaListFailure,
  fetchDevAreaRevListSuccess,
  fetchDevAreaRevListFailure,
} from "./devAreaRevAction";

/** devAreaCd 탭 목록 조회 saga */
function* fetchDevAreaListSaga() {
  try {
    const response = yield call(fetchDevAreaListApi);
    yield put(fetchDevAreaListSuccess(response.data));
  } catch (error) {
    yield put(fetchDevAreaListFailure(makeApiError(error)));
  }
}

/**
 * Rev 목록 조회 saga
 * devAreaCd 전체 Rev 조회 → 최종 Rev·그리드 목록 한 번에 반영
 */
function* fetchDevAreaRevListSaga({ payload }) {
  try {
    const response = yield call(fetchDevAreaRevListApi, payload);
    const { revList } = resolveFinalRevRows(response.data);
    yield put(fetchDevAreaRevListSuccess(revList));
  } catch (error) {
    yield put(fetchDevAreaRevListFailure(makeApiError(error)));
  }
}

/** devAreaRev saga 루트 */
export default function* devAreaRevSaga() {
  yield takeLatest(FETCH_DEV_AREA_LIST_REQUEST, fetchDevAreaListSaga);
  yield takeLatest(FETCH_DEV_AREA_REV_LIST_REQUEST, fetchDevAreaRevListSaga);
}
