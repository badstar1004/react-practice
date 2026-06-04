import { call, put, takeLatest } from "redux-saga/effects";

import {
  fetchIssueReleaseListApi,
  saveIssueReleaseApi,
  updateIssueReleaseModifyDateApi,
  confirmIssueReleaseProjectApi,
} from "api/issueReleaseApi";
import { makeApiError } from "utils/makeApiError";

import {
  FETCH_ISSUE_RELEASE_LIST_REQUEST,
  SAVE_ISSUE_RELEASE_REQUEST,
  UPDATE_ISSUE_RELEASE_MODIFY_DATE_REQUEST,
  CONFIRM_ISSUE_RELEASE_PROJECT_REQUEST,
  fetchIssueReleaseListSuccess,
  fetchIssueReleaseListFailure,
  saveIssueReleaseSuccess,
  saveIssueReleaseFailure,
  updateIssueReleaseModifyDateSuccess,
  updateIssueReleaseModifyDateFailure,
  confirmIssueReleaseProjectSuccess,
  confirmIssueReleaseProjectFailure,
} from "./issueReleaseAction";

/** 와이어프레임 기준 mock — Line 병합 + P1~P4 × 날짜 피벗 */
const MOCK_ISSUE_RELEASE_DATA = [
  { lineCd: "M15", issueAreaCd: "A1", periodCd: "P1", inputDt: "26.04.26", qty: "10", lastRev: "3", projectId: "PRJ001", projectStatus: "DRAFT" },
  { lineCd: "M15", issueAreaCd: "A1", periodCd: "P1", inputDt: "26.08.26", qty: "15", lastRev: "3", projectId: "PRJ001", projectStatus: "DRAFT" },
  { lineCd: "M15", issueAreaCd: "A1", periodCd: "P2", inputDt: "26.05.26", qty: "8", lastRev: "3", projectId: "PRJ001", projectStatus: "DRAFT" },
  { lineCd: "M15", issueAreaCd: "A1", periodCd: "P3", inputDt: "26.06.26", qty: "12", lastRev: "3", projectId: "PRJ001", projectStatus: "DRAFT" },
  { lineCd: "M15", issueAreaCd: "A1", periodCd: "P4", inputDt: "26.07.26", qty: "6", lastRev: "3", projectId: "PRJ001", projectStatus: "DRAFT" },

  { lineCd: "M15", issueAreaCd: "A2", periodCd: "P1", inputDt: "26.04.26", qty: "20", lastRev: "3", projectId: "PRJ001", projectStatus: "DRAFT" },
  { lineCd: "M15", issueAreaCd: "A2", periodCd: "P1", inputDt: "26.08.26", qty: "0", lastRev: "3", projectId: "PRJ001", projectStatus: "DRAFT" },
  { lineCd: "M15", issueAreaCd: "A2", periodCd: "P2", inputDt: "26.05.26", qty: "5", lastRev: "3", projectId: "PRJ001", projectStatus: "DRAFT" },
  { lineCd: "M15", issueAreaCd: "A2", periodCd: "P3", inputDt: "26.06.26", qty: "7", lastRev: "3", projectId: "PRJ001", projectStatus: "DRAFT" },
  { lineCd: "M15", issueAreaCd: "A2", periodCd: "P4", inputDt: "26.07.26", qty: "9", lastRev: "3", projectId: "PRJ001", projectStatus: "DRAFT" },

  { lineCd: "M15", issueAreaCd: "A3", periodCd: "P1", inputDt: "26.04.26", qty: "3", lastRev: "3", projectId: "PRJ001", projectStatus: "DRAFT" },
  { lineCd: "M15", issueAreaCd: "A3", periodCd: "P1", inputDt: "26.08.26", qty: "4", lastRev: "3", projectId: "PRJ001", projectStatus: "DRAFT" },
  { lineCd: "M15", issueAreaCd: "A3", periodCd: "P2", inputDt: "26.05.26", qty: "2", lastRev: "3", projectId: "PRJ001", projectStatus: "DRAFT" },
  { lineCd: "M15", issueAreaCd: "A3", periodCd: "P3", inputDt: "26.06.26", qty: "1", lastRev: "3", projectId: "PRJ001", projectStatus: "DRAFT" },
  { lineCd: "M15", issueAreaCd: "A3", periodCd: "P4", inputDt: "26.07.26", qty: "0", lastRev: "3", projectId: "PRJ001", projectStatus: "DRAFT" },

  { lineCd: "M16", issueAreaCd: "A1", periodCd: "P1", inputDt: "26.04.26", qty: "30", lastRev: "3", projectId: "PRJ001", projectStatus: "DRAFT" },
  { lineCd: "M16", issueAreaCd: "A1", periodCd: "P1", inputDt: "26.08.26", qty: "25", lastRev: "3", projectId: "PRJ001", projectStatus: "DRAFT" },
  { lineCd: "M16", issueAreaCd: "A1", periodCd: "P2", inputDt: "26.05.26", qty: "11", lastRev: "3", projectId: "PRJ001", projectStatus: "DRAFT" },
  { lineCd: "M16", issueAreaCd: "A1", periodCd: "P3", inputDt: "26.06.26", qty: "14", lastRev: "3", projectId: "PRJ001", projectStatus: "DRAFT" },
  { lineCd: "M16", issueAreaCd: "A1", periodCd: "P4", inputDt: "26.07.26", qty: "18", lastRev: "3", projectId: "PRJ001", projectStatus: "DRAFT" },

  { lineCd: "M16", issueAreaCd: "A2", periodCd: "P1", inputDt: "26.04.26", qty: "40", lastRev: "3", projectId: "PRJ001", projectStatus: "DRAFT" },
  { lineCd: "M16", issueAreaCd: "A2", periodCd: "P1", inputDt: "26.08.26", qty: "35", lastRev: "3", projectId: "PRJ001", projectStatus: "DRAFT" },
  { lineCd: "M16", issueAreaCd: "A2", periodCd: "P2", inputDt: "26.05.26", qty: "22", lastRev: "3", projectId: "PRJ001", projectStatus: "DRAFT" },
  { lineCd: "M16", issueAreaCd: "A2", periodCd: "P3", inputDt: "26.06.26", qty: "16", lastRev: "3", projectId: "PRJ001", projectStatus: "DRAFT" },
  { lineCd: "M16", issueAreaCd: "A2", periodCd: "P4", inputDt: "26.07.26", qty: "10", lastRev: "3", projectId: "PRJ001", projectStatus: "DRAFT" },
];

function normalizeListResponse(body) {
  if (Array.isArray(body)) {
    return {
      dataList: body,
      projectStatus: body[0]?.projectStatus || "",
    };
  }
  if (body && Array.isArray(body.list)) {
    return {
      dataList: body.list,
      projectStatus: body.projectStatus || body.list[0]?.projectStatus || "",
    };
  }
  return { dataList: [], projectStatus: "" };
}

function* fetchIssueReleaseListSaga({ payload }) {
  try {
    const response = yield call(fetchIssueReleaseListApi, payload);
    const normalized = normalizeListResponse(response?.data);
    yield put(fetchIssueReleaseListSuccess(normalized));
  } catch {
    const dataList = MOCK_ISSUE_RELEASE_DATA;
    yield put(
      fetchIssueReleaseListSuccess({
        dataList,
        projectStatus: dataList[0]?.projectStatus || "DRAFT",
      }),
    );
  }
}

function* saveIssueReleaseSaga({ payload }) {
  try {
    yield call(saveIssueReleaseApi, payload);
    yield put(saveIssueReleaseSuccess({ message: "저장되었습니다." }));
  } catch (error) {
    yield put(saveIssueReleaseFailure(makeApiError(error)));
  }
}

function* updateModifyDateSaga({ payload }) {
  try {
    yield call(updateIssueReleaseModifyDateApi, payload);
    yield put(
      updateIssueReleaseModifyDateSuccess({ message: "수정일이 반영되었습니다." }),
    );
  } catch (error) {
    yield put(updateIssueReleaseModifyDateFailure(makeApiError(error)));
  }
}

function* confirmProjectSaga({ payload }) {
  try {
    const response = yield call(confirmIssueReleaseProjectApi, payload);
    const projectStatus =
      response?.data?.projectStatus || "CONFIRMED";
    yield put(
      confirmIssueReleaseProjectSuccess({
        projectStatus,
        message: "확정되었습니다.",
      }),
    );
  } catch (error) {
    yield put(confirmIssueReleaseProjectFailure(makeApiError(error)));
  }
}

export default function* issueReleaseSaga() {
  yield takeLatest(FETCH_ISSUE_RELEASE_LIST_REQUEST, fetchIssueReleaseListSaga);
  yield takeLatest(SAVE_ISSUE_RELEASE_REQUEST, saveIssueReleaseSaga);
  yield takeLatest(
    UPDATE_ISSUE_RELEASE_MODIFY_DATE_REQUEST,
    updateModifyDateSaga,
  );
  yield takeLatest(CONFIRM_ISSUE_RELEASE_PROJECT_REQUEST, confirmProjectSaga);
}

export { MOCK_ISSUE_RELEASE_DATA };
