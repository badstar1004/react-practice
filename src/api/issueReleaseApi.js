import clientApi from "./clientApi";

/** 불출 투입량 목록 조회 (변환) */
export const fetchIssueReleaseListApi = (params) =>
  clientApi.get("/issue-release", { params });

/** 불출 투입량 저장 */
export const saveIssueReleaseApi = (payload) =>
  clientApi.post("/issue-release/save", payload);

/** 프로젝트 확정 */
export const confirmIssueReleaseProjectApi = (payload) =>
  clientApi.post("/issue-release/confirm", payload);

/** 확정 후 이전 Rev 복사 + 새 Rev 생성 */
export const reviseIssueReleaseApi = (payload) =>
  clientApi.post("/issue-release/revise", payload);
