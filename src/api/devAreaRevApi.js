import clientApi from "./clientApi";

/** devAreaCd 탭 목록 조회 */
export const fetchDevAreaListApi = () => clientApi.get("/dev-area-rev/dev-areas");

/**
 * devAreaCd 기준 Rev 전체 목록 조회
 * 최종 Rev·그리드 필터는 saga에서 resolveFinalRevRows로 처리
 * @param {Object} params - { devAreaCd }
 */
export const fetchDevAreaRevListApi = (params) =>
  clientApi.get("/dev-area-rev", { params });
