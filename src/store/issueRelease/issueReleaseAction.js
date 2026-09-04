import { uniqueKey } from "utils/uniqueKey";

export const ISSUE_RELEASE_MGMT = uniqueKey("page/issueRelease");

export const FETCH_ISSUE_RELEASE_LIST_REQUEST =
  "FETCH_ISSUE_RELEASE_LIST_REQUEST";
export const FETCH_ISSUE_RELEASE_LIST_SUCCESS =
  "FETCH_ISSUE_RELEASE_LIST_SUCCESS";
export const FETCH_ISSUE_RELEASE_LIST_FAILURE =
  "FETCH_ISSUE_RELEASE_LIST_FAILURE";

export const SAVE_ISSUE_RELEASE_REQUEST = "SAVE_ISSUE_RELEASE_REQUEST";
export const SAVE_ISSUE_RELEASE_SUCCESS = "SAVE_ISSUE_RELEASE_SUCCESS";
export const SAVE_ISSUE_RELEASE_FAILURE = "SAVE_ISSUE_RELEASE_FAILURE";

export const UPDATE_ISSUE_RELEASE_MODIFY_DATE_REQUEST =
  "UPDATE_ISSUE_RELEASE_MODIFY_DATE_REQUEST";
export const UPDATE_ISSUE_RELEASE_MODIFY_DATE_SUCCESS =
  "UPDATE_ISSUE_RELEASE_MODIFY_DATE_SUCCESS";
export const UPDATE_ISSUE_RELEASE_MODIFY_DATE_FAILURE =
  "UPDATE_ISSUE_RELEASE_MODIFY_DATE_FAILURE";

export const CONFIRM_ISSUE_RELEASE_PROJECT_REQUEST =
  "CONFIRM_ISSUE_RELEASE_PROJECT_REQUEST";
export const CONFIRM_ISSUE_RELEASE_PROJECT_SUCCESS =
  "CONFIRM_ISSUE_RELEASE_PROJECT_SUCCESS";
export const CONFIRM_ISSUE_RELEASE_PROJECT_FAILURE =
  "CONFIRM_ISSUE_RELEASE_PROJECT_FAILURE";

export const REVISE_ISSUE_RELEASE_REQUEST = "REVISE_ISSUE_RELEASE_REQUEST";
export const REVISE_ISSUE_RELEASE_SUCCESS = "REVISE_ISSUE_RELEASE_SUCCESS";
export const REVISE_ISSUE_RELEASE_FAILURE = "REVISE_ISSUE_RELEASE_FAILURE";

export const fetchIssueReleaseListRequest = (payload) => ({
  type: FETCH_ISSUE_RELEASE_LIST_REQUEST,
  payload,
});

export const fetchIssueReleaseListSuccess = ({
  dataList,
  projectStatus,
  lastRev,
}) => ({
  type: FETCH_ISSUE_RELEASE_LIST_SUCCESS,
  dataList,
  projectStatus,
  lastRev,
});

export const fetchIssueReleaseListFailure = (error) => ({
  type: FETCH_ISSUE_RELEASE_LIST_FAILURE,
  error,
});

export const saveIssueReleaseRequest = (payload) => ({
  type: SAVE_ISSUE_RELEASE_REQUEST,
  payload,
});

export const saveIssueReleaseSuccess = (data = {}) => ({
  type: SAVE_ISSUE_RELEASE_SUCCESS,
  ...data,
});

export const saveIssueReleaseFailure = (error) => ({
  type: SAVE_ISSUE_RELEASE_FAILURE,
  error,
});

export const updateIssueReleaseModifyDateRequest = (payload) => ({
  type: UPDATE_ISSUE_RELEASE_MODIFY_DATE_REQUEST,
  payload,
});

export const updateIssueReleaseModifyDateSuccess = (data = {}) => ({
  type: UPDATE_ISSUE_RELEASE_MODIFY_DATE_SUCCESS,
  ...data,
});

export const updateIssueReleaseModifyDateFailure = (error) => ({
  type: UPDATE_ISSUE_RELEASE_MODIFY_DATE_FAILURE,
  error,
});

export const confirmIssueReleaseProjectRequest = (payload) => ({
  type: CONFIRM_ISSUE_RELEASE_PROJECT_REQUEST,
  payload,
});

export const confirmIssueReleaseProjectSuccess = (data = {}) => ({
  type: CONFIRM_ISSUE_RELEASE_PROJECT_SUCCESS,
  ...data,
});

export const confirmIssueReleaseProjectFailure = (error) => ({
  type: CONFIRM_ISSUE_RELEASE_PROJECT_FAILURE,
  error,
});

export const reviseIssueReleaseRequest = (payload) => ({
  type: REVISE_ISSUE_RELEASE_REQUEST,
  payload,
});

export const reviseIssueReleaseSuccess = (data = {}) => ({
  type: REVISE_ISSUE_RELEASE_SUCCESS,
  ...data,
});

export const reviseIssueReleaseFailure = (error) => ({
  type: REVISE_ISSUE_RELEASE_FAILURE,
  error,
});
