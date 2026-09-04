import {
  FETCH_ISSUE_RELEASE_LIST_REQUEST,
  FETCH_ISSUE_RELEASE_LIST_SUCCESS,
  FETCH_ISSUE_RELEASE_LIST_FAILURE,
  SAVE_ISSUE_RELEASE_REQUEST,
  SAVE_ISSUE_RELEASE_SUCCESS,
  SAVE_ISSUE_RELEASE_FAILURE,
  CONFIRM_ISSUE_RELEASE_PROJECT_REQUEST,
  CONFIRM_ISSUE_RELEASE_PROJECT_SUCCESS,
  CONFIRM_ISSUE_RELEASE_PROJECT_FAILURE,
  REVISE_ISSUE_RELEASE_REQUEST,
  REVISE_ISSUE_RELEASE_SUCCESS,
  REVISE_ISSUE_RELEASE_FAILURE,
} from "./issueReleaseAction";

const initialState = {
  dataList: [],
  listLoading: false,
  saving: false,
  confirming: false,
  revising: false,
  projectStatus: "",
  lastRev: "",
  error: null,
  lastMessage: null,
};

function resolveLastRev(lastRev, dataList, fallback) {
  if (lastRev != null && lastRev !== "") {
    return String(lastRev);
  }
  const fromRow =
    Array.isArray(dataList) && dataList.length > 0 ? dataList[0]?.lastRev : null;
  if (fromRow != null && fromRow !== "") {
    return String(fromRow);
  }
  return fallback;
}

export default function issueReleaseReducer(
  state = initialState,
  { type, dataList, error, projectStatus, message, lastRev } = {},
) {
  switch (type) {
    case FETCH_ISSUE_RELEASE_LIST_REQUEST:
      return {
        ...state,
        listLoading: true,
        error: null,
      };

    case FETCH_ISSUE_RELEASE_LIST_SUCCESS:
      return {
        ...state,
        listLoading: false,
        dataList: Array.isArray(dataList) ? dataList : [],
        projectStatus: projectStatus || state.projectStatus,
        lastRev: resolveLastRev(lastRev, dataList, state.lastRev),
      };

    case FETCH_ISSUE_RELEASE_LIST_FAILURE:
      return {
        ...state,
        listLoading: false,
        error,
      };

    case SAVE_ISSUE_RELEASE_REQUEST:
      return {
        ...state,
        saving: true,
        error: null,
        lastMessage: null,
      };

    case SAVE_ISSUE_RELEASE_SUCCESS:
      return {
        ...state,
        saving: false,
        lastMessage: message || "저장되었습니다.",
      };

    case SAVE_ISSUE_RELEASE_FAILURE:
      return {
        ...state,
        saving: false,
        error,
      };

    case CONFIRM_ISSUE_RELEASE_PROJECT_REQUEST:
      return {
        ...state,
        confirming: true,
        error: null,
        lastMessage: null,
      };

    case CONFIRM_ISSUE_RELEASE_PROJECT_SUCCESS:
      return {
        ...state,
        confirming: false,
        projectStatus: projectStatus || "CONFIRMED",
        lastRev: resolveLastRev(lastRev, state.dataList, state.lastRev),
        lastMessage: message || "확정되었습니다.",
      };

    case CONFIRM_ISSUE_RELEASE_PROJECT_FAILURE:
      return {
        ...state,
        confirming: false,
        error,
      };

    case REVISE_ISSUE_RELEASE_REQUEST:
      return {
        ...state,
        revising: true,
        error: null,
        lastMessage: null,
      };

    case REVISE_ISSUE_RELEASE_SUCCESS:
      return {
        ...state,
        revising: false,
        dataList: Array.isArray(dataList) ? dataList : state.dataList,
        projectStatus: projectStatus || "DRAFT",
        lastRev: resolveLastRev(lastRev, dataList, state.lastRev),
        lastMessage: message || "이전 Rev를 복사하여 새 Rev를 생성했습니다.",
      };

    case REVISE_ISSUE_RELEASE_FAILURE:
      return {
        ...state,
        revising: false,
        error,
      };

    default:
      return state;
  }
}
