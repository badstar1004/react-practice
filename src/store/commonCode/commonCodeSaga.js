/**
 * commonCodeSaga.js
 *
 * 공통코드 API 비동기 처리
 */

import { call, put, takeLatest } from "redux-saga/effects";

import { makeApiError } from "utils/makeApiError";
import { fetchCommonCodeApi } from "api/commonCodeApi";

import {
  FETCH_COMMON_CODE_REQUEST,
  fetchCommonCodeSuccess,
  fetchCommonCodeFailure,
} from "./commonCodeAction";

function* fetchCommonCodeSaga({ payload }) {
  try {
    const response = yield call(fetchCommonCodeApi, payload);
    yield put(fetchCommonCodeSuccess(response.data));
  } catch (error) {
    yield put(fetchCommonCodeFailure(makeApiError(error)));
  }
}

export default function* commonCodeSaga() {
  yield takeLatest(FETCH_COMMON_CODE_REQUEST, fetchCommonCodeSaga);
}
