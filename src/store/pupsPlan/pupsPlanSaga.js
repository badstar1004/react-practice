/**
 * pupsPlanSaga.js
 *
 * 목적별 계획(PupsPlan) 데이터 비동기 처리
 *
 * 백엔드 엔드포인트(/pups-plan)가 아직 준비되지 않을 수 있어
 * API 호출 실패 시 MOCK_PUPS_PLAN_DATA로 fallback한다.
 * 실제 API가 연동되면 fallback 블록만 제거하면 된다.
 */

import { call, put, takeLatest } from "redux-saga/effects";

import { fetchPupsPlanListApi } from "api/pupsPlanApi";

import {
  FETCH_PUPS_PLAN_LIST_REQUEST,
  fetchPupsPlanListSuccess,
} from "./pupsPlanAction";

/** 데모/개발용 mock 데이터 — 화면 스케치 기준 9개 row 분량 */
const MOCK_PUPS_PLAN_DATA = [
  // 목적1 / 상세1 (분석)
  { gbnCd: "H1", pupsCd: "P0001", pupsNm: "목적1", pupsDtlCd: "PD0001", pupsDtlNm: "상세1", unitCd: "U0001", unitNm: "판", qty: "0",   propCd: "pro0001", propNm: "분석", prodYm: "26.06", seq: "1", lastRev: "2.01" },

  // 목적1 / 상세2 (분석)
  { gbnCd: "H1", pupsCd: "P0001", pupsNm: "목적1", pupsDtlCd: "PD0002", pupsDtlNm: "상세2", unitCd: "U0001", unitNm: "판", qty: "100", propCd: "pro0001", propNm: "분석", prodYm: "25.06", seq: "1", lastRev: "2.01" },

  // 목적1 / 상세3 (분석)
  { gbnCd: "H1", pupsCd: "P0001", pupsNm: "목적1", pupsDtlCd: "PD0003", pupsDtlNm: "상세3", unitCd: "U0001", unitNm: "판", qty: "20",  propCd: "pro0001", propNm: "분석", prodYm: "26.05", seq: "1", lastRev: "2.01" },

  // 목적1 / 상세3 (설계)
  { gbnCd: "H1", pupsCd: "P0001", pupsNm: "목적1", pupsDtlCd: "PD0003", pupsDtlNm: "상세3", unitCd: "U0001", unitNm: "판", qty: "10",  propCd: "pro0002", propNm: "설계", prodYm: "26.06", seq: "1", lastRev: "2.01" },

  // 목적2 / 상세1 (분석)
  { gbnCd: "H1", pupsCd: "P0002", pupsNm: "목적2", pupsDtlCd: "PD0001", pupsDtlNm: "상세1", unitCd: "U0001", unitNm: "판", qty: "0",   propCd: "pro0001", propNm: "분석", prodYm: "26.06", seq: "2", lastRev: "2.01" },

  // 목적2 / 상세2 (분석)
  { gbnCd: "H1", pupsCd: "P0002", pupsNm: "목적2", pupsDtlCd: "PD0002", pupsDtlNm: "상세2", unitCd: "U0001", unitNm: "판", qty: "0",   propCd: "pro0001", propNm: "분석", prodYm: "25.07", seq: "2", lastRev: "2.01" },

  // 목적2 / 상세3 (설계)
  { gbnCd: "H1", pupsCd: "P0002", pupsNm: "목적2", pupsDtlCd: "PD0003", pupsDtlNm: "상세3", unitCd: "U0001", unitNm: "판", qty: "5",   propCd: "pro0002", propNm: "설계", prodYm: "21.06", seq: "2", lastRev: "2.01" },

  // 목적3 / 상세4 (설계)
  { gbnCd: "H1", pupsCd: "P0003", pupsNm: "목적3", pupsDtlCd: "PD0004", pupsDtlNm: "상세4", unitCd: "U0001", unitNm: "판", qty: "45",  propCd: "pro0002", propNm: "설계", prodYm: "21.07", seq: "3", lastRev: "2.01" },

  // 목적3 / 상세5 (분석)
  { gbnCd: "H1", pupsCd: "P0003", pupsNm: "목적3", pupsDtlCd: "PD0005", pupsDtlNm: "상세5", unitCd: "U0001", unitNm: "판", qty: "60",  propCd: "pro0001", propNm: "분석", prodYm: "25.06", seq: "3", lastRev: "2.01" },
];

/**
 * pupsPlan 목록 조회 saga
 * - API 응답이 오면 그대로 사용
 * - API 미연동/실패 시 MOCK 데이터로 fallback (실 운영 시 제거)
 */
function* fetchPupsPlanListSaga({ payload }) {
  try {
    const response = yield call(fetchPupsPlanListApi, payload);
    const data =
      response && Array.isArray(response.data) ? response.data : [];
    yield put(fetchPupsPlanListSuccess(data));
  } catch {
    // 백엔드 미준비 환경에서도 화면 확인이 가능하도록 mock fallback
    yield put(fetchPupsPlanListSuccess(MOCK_PUPS_PLAN_DATA));
  }
}

/** pupsPlan saga 루트 */
export default function* pupsPlanSaga() {
  yield takeLatest(FETCH_PUPS_PLAN_LIST_REQUEST, fetchPupsPlanListSaga);
}

/** 외부(테스트/스토리북 등)에서 mock 데이터 재사용을 위한 export */
export { MOCK_PUPS_PLAN_DATA };
