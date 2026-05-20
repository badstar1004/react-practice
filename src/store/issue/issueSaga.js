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
  fetchOwnerCodeListSuccess,
  fetchOwnerCodeListFailure,
  saveOwnerCodeRowsSuccess,
  saveOwnerCodeRowsFailure,
} from "./issueAction";

function* fetchOwnerCodeListSaga({ payload }) {
  try {
    const response = yield call(fetchOwnerCodeListApi, payload);
    yield put(fetchOwnerCodeListSuccess(response.data));
  } catch (error) {
    yield put(fetchOwnerCodeListFailure(makeApiError(error)));
  }
}

function* saveOwnerCodeRowsSaga({ payload }) {
  try {
    const response = yield call(saveOwnerCodeRowsApi, payload);
    yield put(saveOwnerCodeRowsSuccess(response.data, payload));
  } catch (error) {
    yield put(saveOwnerCodeRowsFailure(makeApiError(error)));
  }
}

export default function* issueSaga() {
  yield takeLatest(FETCH_OWNER_CODE_LIST_REQUEST, fetchOwnerCodeListSaga);
  yield takeLatest(SAVE_OWNER_CODE_ROWS_REQUEST, saveOwnerCodeRowsSaga);
}
