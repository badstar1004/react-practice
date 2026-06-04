import {
  FETCH_ISSUE_RELEASE_LIST_REQUEST,
  FETCH_ISSUE_RELEASE_LIST_SUCCESS,
  FETCH_ISSUE_RELEASE_LIST_FAILURE,
  SAVE_ISSUE_RELEASE_REQUEST,
  SAVE_ISSUE_RELEASE_SUCCESS,
  SAVE_ISSUE_RELEASE_FAILURE,
  UPDATE_ISSUE_RELEASE_MODIFY_DATE_REQUEST,
  UPDATE_ISSUE_RELEASE_MODIFY_DATE_SUCCESS,
  UPDATE_ISSUE_RELEASE_MODIFY_DATE_FAILURE,
  CONFIRM_ISSUE_RELEASE_PROJECT_REQUEST,
  CONFIRM_ISSUE_RELEASE_PROJECT_SUCCESS,
  CONFIRM_ISSUE_RELEASE_PROJECT_FAILURE,
} from "./issueReleaseAction";

const initialState = {
  dataList: [],
  listLoading: false,
  saving: false,
  confirming: false,
  modifyDateLoading: false,
  projectStatus: "",
  error: null,
  lastMessage: null,
};

export default function issueReleaseReducer(
  state = initialState,
  { type, dataList, error, projectStatus, message } = {},
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

    case UPDATE_ISSUE_RELEASE_MODIFY_DATE_REQUEST:
      return {
        ...state,
        modifyDateLoading: true,
        error: null,
        lastMessage: null,
      };

    case UPDATE_ISSUE_RELEASE_MODIFY_DATE_SUCCESS:
      return {
        ...state,
        modifyDateLoading: false,
        lastMessage: message || "수정일이 반영되었습니다.",
      };

    case UPDATE_ISSUE_RELEASE_MODIFY_DATE_FAILURE:
      return {
        ...state,
        modifyDateLoading: false,
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
        lastMessage: message || "확정되었습니다.",
      };

    case CONFIRM_ISSUE_RELEASE_PROJECT_FAILURE:
      return {
        ...state,
        confirming: false,
        error,
      };

    default:
      return state;
  }
}
