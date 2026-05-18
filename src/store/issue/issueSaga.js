import { call, put, takeLatest } from "redux-saga/effects";

import {
  FETCH_ISSUE_LIST_REQUEST,
  FETCH_COMMON_CODE_REQUEST,
  SAVE_ISSUE_ROWS_REQUEST,
  fetchIssueListSuccess,
  fetchIssueListFailure,
  fetchCommonCodeSuccess,
  fetchCommonCodeFailure,
  saveIssueRowsSuccess,
  saveIssueRowsFailure,
} from "./issueAction";

import {
  fetchIssueListApi,
  fetchCommonCodeApi,
  saveIssueRowsApi,
} from "api/issueApi";

/*
  에러 객체 정리 함수

  Axios 에러는 경우에 따라 구조가 다릅니다.

  1. 서버 응답이 있는 경우
     error.response.data

  2. 서버 응답이 없는 경우
     error.message

  React 16.x 환경을 고려해서 optional chaining은 쓰지 않습니다.
*/

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

/* =========================================================
   1. 이슈 목록 조회 Saga
========================================================= */
function* fetchIssueListSaga({ payload }) {
  try {
    /*
      payload 예시:
      {
        statusCode: "",
        priorityCode: "",
        keyword: "",
        startDate: "",
        endDate: ""
      }
    */
    const response = yield call(fetchIssueListApi, payload);

    /*
      response.data 예시:
      [
        {
          issueId: 1,
          title: "로그인 오류",
          statusCode: "C_000001",
          priorityCode: "C_000005",
          dueDate: "2026-05-20",
          assigneeId: 1,
          assigneeName: "관리자"
        }
      ]
    */
    yield put(fetchIssueListSuccess(response.data));
  } catch (error) {
    yield put(fetchIssueListFailure(makeError(error)));
  }
}

/* =========================================================
   2. 공통코드 조회 Saga
========================================================= */
function* fetchCommonCodeSaga({ payload }) {
  try {
    /*
      payload 예시:
      {
        groupCodes: ["GC_000001", "GC_000002"]
      }
    */
    const response = yield call(fetchCommonCodeApi, payload);

    /*
      response.data 예시:
      {
        statusCodeList: [
          { code: "C_000001", name: "신규" },
          { code: "C_000002", name: "진행중" },
          { code: "C_000003", name: "완료" },
          { code: "C_000004", name: "보류" }
        ],
        priorityCodeList: [
          { code: "C_000005", name: "높음" },
          { code: "C_000006", name: "보통" },
          { code: "C_000007", name: "낮음" }
        ]
      }
    */
    yield put(fetchCommonCodeSucess(response.data));
  } catch (error) {
    yield put(fetchCommonCodeFailure(makeError(error)));
  }
}

function* saveIssueRowsSaga({ payload }) {
  try {
    /*
      payload 예시:
      [
        {
          issueId: 1,
          title: "로그인 오류 수정",
          statusCode: "C_000002",
          priorityCode: "C_000005",
          dueDate: "2026-05-20",
          assigneeId: 2
        }
      ]
    */
    const response = yield call(saveIssueRowsApi, payload);

    /*
      response.data 예시:
      {
        success: true,
        message: "저장되었습니다."
      }
    */
    yield put(saveIssueRowsSuccess(response.data));
  } catch (error) {
    yield put(saveIssueRowsFailure(makeError(error)));
  }
}

/* =========================================================
   4. Watcher Saga
========================================================= */
export default function* issueSaga() {
  /*
    takeLatest

    같은 REQUEST action이 여러 번 빠르게 발생하면,
    가장 마지막 요청만 처리합니다.

    목록 조회/검색에는 takeLatest가 적합합니다.
    사용자가 조회 버튼을 빠르게 여러 번 눌러도 마지막 조회 결과만 반영됩니다.
  */
  yield takeLatest(FETCH_ISSUE_LIST_REQUEST, fetchIssueListSaga);

  /*
    공통코드도 보통 마지막 요청만 의미가 있으므로 takeLatest를 사용합니다.
  */
  yield takeLatest(FETCH_COMMON_CODE_REQUEST, fetchCommonCodeSaga);

  /*
    저장도 여기서는 takeLatest를 사용합니다.

    단, 실무에서는 저장 버튼을 saving === true일 때 disabled 처리해서
    중복 저장 요청 자체를 막는 것이 좋습니다.
  */
  yield takeLatest(SAVE_ISSUE_ROWS_REQUEST, saveIssueRowsSaga);
}
