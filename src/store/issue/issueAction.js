import { uniqueKey } from "utils/uniqueKey";
/*
  Action 설계 기준

  1. Action Type은 대문자 스네이크 케이스로 작성한다.
  2. Action Creator는 camelCase로 작성한다.
  3. Action Creator는 객체를 반환하며, 객체에는 type과 필요한 payload가 포함된다.
  4. Action Type은 고유해야 하며, 충돌을 방지하기 위해 접두사를 사용할 수 있다.
  5. Action Creator는 필요한 경우 매개변수를 받아 payload를 생성할 수 있다.

  1. REQUEST
     - 화면에서 Saga에게 API 요청을 시작하라고 알림
     - payload 사용 : API 요청에 필요한 데이터 (예: 요청 파라미터, 인증 정보 등)

  2. SUCCESS
     - Saga에서 API 성공 후 Reducer에게 데이터 저장 요청
     - data 사용 : API 응답 데이터

  3. FAILURE
     - Saga에서 API 실패 후 Reducer에게 에러 저장 요청
     - error 사용 : API 에러 정보

*/

/*
  이 key는 action 객체에 넣는 값이 아니라,
  reducer와 page에서 같은 state 위치를 바라보기 위한 key
*/
export const ISSUE_MGMT = uniqueKey("page/issue");

/* ==================================================
  1. 이슈 목록 조회 Action Type
=================================================== */
export const FETCH_ISSUE_LIST_REQUEST = "FETCH_ISSUE_LIST_REQUEST";
export const FETCH_ISSUE_LIST_SUCCESS = "FETCH_ISSUE_LIST_SUCCESS";
export const FETCH_ISSUE_LIST_FAILURE = "FETCH_ISSUE_LIST_FAILURE";

/* ==================================================
  2. 공통코드 조회 Action Type
    - 상태 코드
    - 우선순위 코드
=================================================== */
export const FETCH_COMMON_CODE_REQUEST = "FETCH_COMMON_CODE_REQUEST";
export const FETCH_COMMON_CODE_SUCCESS = "FETCH_COMMON_CODE_SUCCESS";
export const FETCH_COMMON_CODE_FAILURE = "FETCH_COMMON_CODE_FAILURE";

/* ==================================================
   3. 변경 Row 저장 Action Type
=================================================== */
export const SAVE_ISSUE_ROWS_REQUEST = "SAVE_ISSUE_ROWS_REQUEST";
export const SAVE_ISSUE_ROWS_SUCCESS = "SAVE_ISSUE_ROWS_SUCCESS";
export const SAVE_ISSUE_ROWS_FAILURE = "SAVE_ISSUE_ROWS_FAILURE";

/* =========================================================
   4. 이슈 목록 조회 Action Creator
========================================================= */

/**
 * 이슈 목록 조회 요청
 *
 * 화면에서 검색 조건을 payload로 넘깁니다.
 *
 * 예시 payload:
 * {
 *   statusCode: "",
 *   priorityCode: "",
 *   keyword: "",
 *   startDate: "",
 *   endDate: ""
 * }
 */

export const fetchIssueListRequest = function (payload) {
  return {
    type: FETCH_ISSUE_LIST_REQUEST,
    payload,
  };
};

/**
 * 이슈 목록 조회 성공
 *
 * Saga에서 API 응답 데이터를 data로 넘깁니다.
 *
 * 예시 data:
 * [
 *   {
 *     issueId: 1,
 *     title: "로그인 오류",
 *     statusCode: "C_000001",
 *     priorityCode: "C_000005",
 *     dueDate: "2026-05-16",
 *     assigneeId: 1,
 *     assigneeName: "관리자"
 *   }
 * ]
 */

export const fetchIssueListSuccess = function (data) {
  return {
    type: FETCH_ISSUE_LIST_SUCCESS,
    data,
  };
};

/**
 * 이슈 목록 조회 실패
 *
 * Saga에서 catch된 error를 넘깁니다.
 */
export const fetchIssueListFailure = function (error) {
  return {
    type: FETCH_ISSUE_LIST_FAILURE,
    error,
  };
};

/* =========================================================
   5. 공통코드 조회 Action Creator
========================================================= */

/**
 * 공통코드 조회 요청
 *
 * 상태/우선순위 콤보박스에 사용할 공통코드를 조회합니다.
 *
 * 예시 payload:
 * {
 *   groupCodes: ["GC_000001", "GC_000002"]
 * }
 */
export const fetchCommonCodeRequest = function (payload) {
  return {
    type: FETCH_COMMON_CODE_REQUEST,
    payload,
  };
};

/**
 * 공통코드 조회 성공
 *
 * 예시 data:
 * {
 *   statusCodeList: [
 *     { code: "C_000001", name: "신규" },
 *     { code: "C_000002", name: "진행중" },
 *     { code: "C_000003", name: "완료" },
 *     { code: "C_000004", name: "보류" }
 *   ],
 *   priorityCodeList: [
 *     { code: "C_000005", name: "높음" },
 *     { code: "C_000006", name: "보통" },
 *     { code: "C_000007", name: "낮음" }
 *   ]
 * }
 */
export const fetchCommonCodeSuccess = function (data) {
  return {
    type: FETCH_COMMON_CODE_SUCCESS,
    data,
  };
};

/**
 * 공통코드 조회 실패
 */
export const fetchCommonCodeFailure = function (error) {
  return {
    type: FETCH_COMMON_CODE_FAILURE,
    error,
  };
};

/* =========================================================
   6. 변경 Row 저장 Action Creator
========================================================= */

/**
 * 변경 Row 저장 요청
 *
 * 전체 rowData를 저장하지 않고,
 * changedRows에 담긴 변경된 행만 payload로 넘깁니다.
 *
 * 예시 payload:
 * [
 *   {
 *     issueId: 1,
 *     title: "로그인 오류 수정",
 *     statusCode: "C_000002",
 *     priorityCode: "C_000005",
 *     dueDate: "2026-05-20",
 *     assigneeId: 2
 *   }
 * ]
 */
export const saveIssueRowsRequest = function (payload) {
  return {
    type: SAVE_ISSUE_ROWS_REQUEST,
    payload,
  };
};

/**
 * 변경 Row 저장 성공
 *
 * 저장 성공 후 특별히 받을 데이터가 없으면
 * data에는 저장 결과 메시지 정도만 넣어도 됩니다.
 *
 * 예시 data:
 * {
 *   success: true,
 *   message: "저장되었습니다."
 * }
 */
export const saveIssueRowsSuccess = function (data) {
  return {
    type: SAVE_ISSUE_ROWS_SUCCESS,
    data,
  };
};

/**
 * 변경 Row 저장 실패
 */
export const saveIssueRowsFailure = function (error) {
  return {
    type: SAVE_ISSUE_ROWS_FAILURE,
    error,
  };
};
