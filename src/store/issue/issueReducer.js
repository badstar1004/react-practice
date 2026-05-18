import {
  FETCH_ISSUE_LIST_REQUEST,
  FETCH_ISSUE_LIST_SUCCESS,
  FETCH_ISSUE_LIST_FAILURE,
  FETCH_COMMON_CODE_REQUEST,
  FETCH_COMMON_CODE_SUCCESS,
  FETCH_COMMON_CODE_FAILURE,
  SAVE_ISSUE_ROWS_REQUEST,
  SAVE_ISSUE_ROWS_SUCCESS,
  SAVE_ISSUE_ROWS_FAILURE,
} from "./issueAction";

/*
  initialState

  issueList
  - AG Grid에 표시할 이슈 목록 데이터

  statusCodeList
  - 상태 컬럼 콤보박스 옵션
  - 예: 접수, 진행중, 완료

  priorityCodeList
  - 우선순위 컬럼 콤보박스 옵션
  - 예: 높음, 보통, 낮음

  loading
  - 목록 조회 또는 공통코드 조회 중 여부

  saving
  - 변경 row 저장 중 여부

  error
  - API 실패 시 에러 정보
*/

const initialState = {
  issueList: [],

  statusCodeList: [],
  prioritryCodeList: [],

  loading: false,
  saving: false,

  error: null,
};

export default function issueReducer(
  state = initialState,
  { type, payload, data, error } = {},
) {
  switch (type) {
    /* =========================================================
       1. 이슈 목록 조회
    ========================================================= */
    case FETCH_ISSUE_LIST_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
      };
    case FETCH_ISSUE_LIST_SUCCESS:
      return {
        ...state,
        loading: false,
        issueList: payload,
      };
    case FETCH_ISSUE_LIST_FAILURE:
      return {
        ...state,
        loading: false,
        error,
      };

    /* =========================================================
       2. 공통코드 조회
    ========================================================= */
    case FETCH_COMMON_CODE_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
      };
    case FETCH_COMMON_CODE_SUCCESS:
      return {
        ...state,
        loading: false,
        /*
          data 예시:
          {
            statusCodeList: [
              { code: "C_000001", name: "접수" },
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
        statusCodeList: data.statusCodeList,
        priorityCodeList: data.priorityCodeList,
      };
    case FETCH_COMMON_CODE_FAILURE:
      return {
        ...state,
        loading: false,
        error,
      };

    /* =========================================================
       3. 변경 Row 저장
    ========================================================= */
    case SAVE_ISSUE_ROWS_REQUEST:
      return {
        ...state,
        saving: true,
        error: null,
      };
    case SAVE_ISSUE_ROWS_SUCCESS:
      return {
        ...state,
        saving: false,
        issueList: state.issueList.map((issue) =>
          issue.id === payload.id ? { ...issue, ...payload } : issue,
        ),
      };
    case SAVE_ISSUE_ROWS_FAILURE:
      return {
        ...state,
        saving: false,
        error,
      };

    default:
      return state;
  }
}
