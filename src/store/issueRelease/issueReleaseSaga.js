import { call, put, takeLatest } from "redux-saga/effects";

import {
  fetchIssueReleaseListApi,
  saveIssueReleaseApi,
  confirmIssueReleaseProjectApi,
  reviseIssueReleaseApi,
} from "api/issueReleaseApi";
import { makeApiError } from "utils/makeApiError";

import {
  FETCH_ISSUE_RELEASE_LIST_REQUEST,
  SAVE_ISSUE_RELEASE_REQUEST,
  CONFIRM_ISSUE_RELEASE_PROJECT_REQUEST,
  REVISE_ISSUE_RELEASE_REQUEST,
  fetchIssueReleaseListSuccess,
  saveIssueReleaseSuccess,
  confirmIssueReleaseProjectSuccess,
  reviseIssueReleaseSuccess,
  reviseIssueReleaseFailure,
} from "./issueReleaseAction";

const DEFAULT_PROJECT_ID = "PRJ001";
const STATUS_DRAFT = "DRAFT";
const STATUS_CONFIRMED = "CONFIRMED";

/** 와이어프레임 기준 mock — Line 병합 + P1~P4 × 날짜 피벗. 첫 계획은 Rev 1 */
const MOCK_ISSUE_RELEASE_SEED = [
  { lineCd: "M15", issueAreaCd: "A1", periodCd: "P1", inputDt: "26.04", qty: "10" },
  { lineCd: "M15", issueAreaCd: "A1", periodCd: "P1", inputDt: "26.08", qty: "15" },
  { lineCd: "M15", issueAreaCd: "A1", periodCd: "P2", inputDt: "26.05", qty: "8" },
  { lineCd: "M15", issueAreaCd: "A1", periodCd: "P3", inputDt: "26.06", qty: "12" },
  { lineCd: "M15", issueAreaCd: "A1", periodCd: "P4", inputDt: "26.07", qty: "6" },

  { lineCd: "M15", issueAreaCd: "A2", periodCd: "P1", inputDt: "26.04", qty: "20" },
  { lineCd: "M15", issueAreaCd: "A2", periodCd: "P1", inputDt: "26.08", qty: "0" },
  { lineCd: "M15", issueAreaCd: "A2", periodCd: "P2", inputDt: "26.05", qty: "5" },
  { lineCd: "M15", issueAreaCd: "A2", periodCd: "P3", inputDt: "26.06", qty: "7" },
  { lineCd: "M15", issueAreaCd: "A2", periodCd: "P4", inputDt: "26.07", qty: "9" },

  { lineCd: "M15", issueAreaCd: "A3", periodCd: "P1", inputDt: "26.04", qty: "3" },
  { lineCd: "M15", issueAreaCd: "A3", periodCd: "P1", inputDt: "26.08", qty: "4" },
  { lineCd: "M15", issueAreaCd: "A3", periodCd: "P2", inputDt: "26.05", qty: "2" },
  { lineCd: "M15", issueAreaCd: "A3", periodCd: "P3", inputDt: "26.06", qty: "1" },
  { lineCd: "M15", issueAreaCd: "A3", periodCd: "P4", inputDt: "26.07", qty: "0" },

  { lineCd: "M16", issueAreaCd: "A1", periodCd: "P1", inputDt: "26.04", qty: "30" },
  { lineCd: "M16", issueAreaCd: "A1", periodCd: "P1", inputDt: "26.08", qty: "25" },
  { lineCd: "M16", issueAreaCd: "A1", periodCd: "P2", inputDt: "26.05", qty: "11" },
  { lineCd: "M16", issueAreaCd: "A1", periodCd: "P3", inputDt: "26.06", qty: "14" },
  { lineCd: "M16", issueAreaCd: "A1", periodCd: "P4", inputDt: "26.07", qty: "18" },

  { lineCd: "M16", issueAreaCd: "A2", periodCd: "P1", inputDt: "26.04", qty: "40" },
  { lineCd: "M16", issueAreaCd: "A2", periodCd: "P1", inputDt: "26.08", qty: "35" },
  { lineCd: "M16", issueAreaCd: "A2", periodCd: "P2", inputDt: "26.05", qty: "22" },
  { lineCd: "M16", issueAreaCd: "A2", periodCd: "P3", inputDt: "26.06", qty: "16" },
  { lineCd: "M16", issueAreaCd: "A2", periodCd: "P4", inputDt: "26.07", qty: "10" },
];

function stampRows(rows, lastRev, projectStatus, projectId = DEFAULT_PROJECT_ID) {
  return (rows || []).map((row) => ({
    ...row,
    qty: row.qty == null ? "0" : String(row.qty),
    lastRev: String(lastRev),
    projectStatus,
    projectId: row.projectId || projectId,
  }));
}

const mockProject = {
  lastRev: "1",
  projectStatus: STATUS_DRAFT,
  dataList: stampRows(MOCK_ISSUE_RELEASE_SEED, "1", STATUS_DRAFT),
};

function snapshotMock() {
  return {
    dataList: stampRows(
      mockProject.dataList,
      mockProject.lastRev,
      mockProject.projectStatus,
    ),
    projectStatus: mockProject.projectStatus,
    lastRev: mockProject.lastRev,
  };
}

function applyMockMeta(lastRev, projectStatus) {
  if (lastRev != null && lastRev !== "") {
    mockProject.lastRev = String(lastRev);
  }
  if (projectStatus) {
    mockProject.projectStatus = projectStatus;
  }
  mockProject.dataList = stampRows(
    mockProject.dataList,
    mockProject.lastRev,
    mockProject.projectStatus,
  );
}

function applyMockRows(rows, lastRev, projectStatus, projectId) {
  const nextRev = lastRev != null && lastRev !== "" ? String(lastRev) : mockProject.lastRev;
  const nextStatus = projectStatus || mockProject.projectStatus;
  mockProject.lastRev = nextRev;
  mockProject.projectStatus = nextStatus;
  mockProject.dataList =
    Array.isArray(rows) && rows.length > 0
      ? stampRows(rows, nextRev, nextStatus, projectId || DEFAULT_PROJECT_ID)
      : stampRows(mockProject.dataList, nextRev, nextStatus, projectId);
}

function nextRevFrom(lastRev) {
  const parsed = Number(lastRev);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return "2";
  }
  return String(parsed + 1);
}

function normalizeListResponse(body) {
  if (Array.isArray(body)) {
    return {
      dataList: body,
      projectStatus: body[0]?.projectStatus || "",
      lastRev: body[0]?.lastRev != null ? String(body[0].lastRev) : "",
    };
  }
  if (body && Array.isArray(body.list)) {
    const lastRev =
      body.lastRev != null && body.lastRev !== ""
        ? String(body.lastRev)
        : body.list[0]?.lastRev != null
          ? String(body.list[0].lastRev)
          : "";
    return {
      dataList: body.list,
      projectStatus: body.projectStatus || body.list[0]?.projectStatus || "",
      lastRev,
    };
  }
  return { dataList: [], projectStatus: "", lastRev: "" };
}

function* fetchIssueReleaseListSaga({ payload }) {
  try {
    const response = yield call(fetchIssueReleaseListApi, payload);
    const normalized = normalizeListResponse(response?.data);
    if (normalized.dataList.length > 0) {
      applyMockRows(
        normalized.dataList,
        normalized.lastRev,
        normalized.projectStatus,
        payload?.projectId,
      );
    }
    yield put(fetchIssueReleaseListSuccess(normalized));
  } catch {
    yield put(fetchIssueReleaseListSuccess(snapshotMock()));
  }
}

function* saveIssueReleaseSaga({ payload }) {
  try {
    yield call(saveIssueReleaseApi, payload);
    applyMockRows(
      payload?.rows,
      mockProject.lastRev,
      mockProject.projectStatus,
      payload?.projectId,
    );
    yield put(saveIssueReleaseSuccess({ message: "저장되었습니다." }));
  } catch {
    applyMockRows(
      payload?.rows,
      mockProject.lastRev,
      mockProject.projectStatus,
      payload?.projectId,
    );
    yield put(saveIssueReleaseSuccess({ message: "저장되었습니다." }));
  }
}

function* confirmProjectSaga({ payload }) {
  try {
    const response = yield call(confirmIssueReleaseProjectApi, payload);
    const projectStatus = response?.data?.projectStatus || STATUS_CONFIRMED;
    applyMockMeta(mockProject.lastRev, projectStatus);
    yield put(
      confirmIssueReleaseProjectSuccess({
        projectStatus,
        lastRev: mockProject.lastRev,
        message: `Rev ${mockProject.lastRev}이(가) 확정되었습니다.`,
      }),
    );
  } catch {
    applyMockMeta(mockProject.lastRev, STATUS_CONFIRMED);
    yield put(
      confirmIssueReleaseProjectSuccess({
        projectStatus: STATUS_CONFIRMED,
        lastRev: mockProject.lastRev,
        message: `Rev ${mockProject.lastRev}이(가) 확정되었습니다.`,
      }),
    );
  }
}

function* reviseIssueReleaseSaga({ payload }) {
  const lastRev = nextRevFrom(payload?.lastRev || mockProject.lastRev);

  try {
    const response = yield call(reviseIssueReleaseApi, payload);
    const nextRev = String(response?.data?.lastRev || lastRev);
    const projectStatus = response?.data?.projectStatus || STATUS_DRAFT;
    applyMockRows(payload?.rows, nextRev, projectStatus, payload?.projectId);
    yield put(
      reviseIssueReleaseSuccess({
        dataList: snapshotMock().dataList,
        lastRev: nextRev,
        projectStatus,
        message: `이전 Rev를 복사하여 Rev ${nextRev}을(를) 생성했습니다.`,
      }),
    );
  } catch (error) {
    try {
      applyMockRows(payload?.rows, lastRev, STATUS_DRAFT, payload?.projectId);
      yield put(
        reviseIssueReleaseSuccess({
          dataList: snapshotMock().dataList,
          lastRev,
          projectStatus: STATUS_DRAFT,
          message: `이전 Rev를 복사하여 Rev ${lastRev}을(를) 생성했습니다.`,
        }),
      );
    } catch (fallbackError) {
      yield put(reviseIssueReleaseFailure(makeApiError(error || fallbackError)));
    }
  }
}

export default function* issueReleaseSaga() {
  yield takeLatest(FETCH_ISSUE_RELEASE_LIST_REQUEST, fetchIssueReleaseListSaga);
  yield takeLatest(SAVE_ISSUE_RELEASE_REQUEST, saveIssueReleaseSaga);
  yield takeLatest(CONFIRM_ISSUE_RELEASE_PROJECT_REQUEST, confirmProjectSaga);
  yield takeLatest(REVISE_ISSUE_RELEASE_REQUEST, reviseIssueReleaseSaga);
}
