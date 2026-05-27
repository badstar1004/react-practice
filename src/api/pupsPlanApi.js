import clientApi from "./clientApi";

/**
 * 목적별 계획(PupsPlan) 목록 조회
 * - 필요 시 조회조건을 params로 전달
 */
export const fetchPupsPlanListApi = (params) =>
  clientApi.get("/pups-plan", { params });
