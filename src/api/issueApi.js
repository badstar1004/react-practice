import clientApi from "./clientApi";

/*
  이슈 목록 조회
*/
export function fetchIssueListApi(params) {
  return clientApi.get(`/issues`, { params: params });
}

/*
  공통코드 조회

  params 예시:
  {
    groupCodes: ["GC_000001", "GC_000002"]
  }
*/
export function fetchCommonCodeApi(params) {
  return clientApi.get(`/issues/common-code-list`, { params: params });
}

/*
  변경 Row 저장

  changedRows 예시:
  [
    {
      issueId: 1,
      statusCode: "C_000002",
      priorityCode: "C_000005"
    }
  ]
*/
export function saveIssueRowsApi(changedRows) {
  return clientApi.post(`/issues`, changedRows);
}
