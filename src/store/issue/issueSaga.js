import { call, put, takeLatest } from "redux-saga/effects";

import {
  FETCH_OWNER_CODE_LIST_REQUEST,
  FETCH_COMMON_CODE_REQUEST,
  SAVE_OWNER_CODE_ROWS_REQUEST,
  fetchOwnerCodeListSuccess,
  fetchOwnerCodeListFailure,
  fetchCommonCodeSuccess,
  fetchCommonCodeFailure,
  saveOwnerCodeRowsSuccess,
  saveOwnerCodeRowsFailure,
} from "./issueAction";

import {
  fetchOwnerCodeListApi,
  fetchCommonCodeApi,
  saveOwnerCodeRowsApi,
} from "api/issueApi";

function makeError(error) {
  const response = error && error.response ? error.response : null;
  const responseData = response && response.data ? response.data : null;

  return {
    status: response ? response.status : null,
    message:
      responseData && responseData.message
        ? responseData.message
        : error && error.message
          ? error.message
          : "알 수 없는 오류가 발생했습니다.",
    originalError: error,
  };
}

function* fetchOwnerCodeListSaga({ payload }) {
  try {
    const response = yield call(fetchOwnerCodeListApi, payload);
    yield put(fetchOwnerCodeListSuccess(response.data));
  } catch (error) {
    yield put(fetchOwnerCodeListFailure(makeError(error)));
  }
}

function* fetchCommonCodeSaga({ payload }) {
  try {
    const response = yield call(fetchCommonCodeApi, payload);
    yield put(fetchCommonCodeSuccess(response.data));
  } catch (error) {
    yield put(fetchCommonCodeFailure(makeError(error)));
  }
}

function* saveOwnerCodeRowsSaga({ payload }) {
  try {
    const response = yield call(saveOwnerCodeRowsApi, payload);
    yield put(saveOwnerCodeRowsSuccess(response.data, payload));
  } catch (error) {
    yield put(saveOwnerCodeRowsFailure(makeError(error)));
  }
}

export default function* issueSaga() {
  yield takeLatest(FETCH_OWNER_CODE_LIST_REQUEST, fetchOwnerCodeListSaga);
  yield takeLatest(FETCH_COMMON_CODE_REQUEST, fetchCommonCodeSaga);
  yield takeLatest(SAVE_OWNER_CODE_ROWS_REQUEST, saveOwnerCodeRowsSaga);
}
