/** 그리드에서 수정·변경 비교 대상 컬럼 */
export const EDITABLE_FIELDS = ["usageCd"];

/** ag-Grid 공통 컬럼 옵션 */
export const AG_GRID_DEFAULT_COL_DEF = {
  resizable: true,
  sortable: true,
  filter: true,
};

/**
 * row 배열 얕은 복사
 * API 응답을 그리드 state에 넣기 전 참조 분리용
 */
export const cloneRows = (rows) => {
  if (!Array.isArray(rows)) {
    return [];
  }

  return rows.map((row) => {
    return { ...row };
  });
};

/**
 * 비교·표시용 값 정규화
 * null/undefined → 빈 문자열, 앞뒤 공백 제거
 */
export const normalizeValue = (value) => {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).trim();
};

/**
 * 두 행이 동일 Owner Code 행인지 판별
 * workAreaCd + ownerCd 조합으로 식별
 */
export const isSameRow = (rowA, rowB) => {
  if (!rowA || !rowB) {
    return false;
  }

  return (
    normalizeValue(rowA.workAreaCd) === normalizeValue(rowB.workAreaCd) &&
    normalizeValue(rowA.ownerCd) === normalizeValue(rowB.ownerCd)
  );
};

/**
 * 목록에서 targetRow와 동일한 행 검색
 * @returns {Object|null} 매칭 row 또는 null
 */
export const findRowInList = (rows, targetRow) => {
  if (!Array.isArray(rows) || !targetRow) {
    return null;
  }

  return rows.find((row) => {
    return isSameRow(row, targetRow);
  });
};

/**
 * 용도(usageCd) 미선택 여부
 * 빈 문자열 또는 null이면 미선택
 */
export const isUnsetUsageCd = (usageCd) => {
  return usageCd === "" || usageCd === null;
};

/**
 * 원본 대비 편집 가능 필드가 변경되었는지 확인
 * EDITABLE_FIELDS 기준으로만 비교
 */
export const isEditableFieldChanged = (originRow, currentRow) => {
  if (!originRow || !currentRow) {
    return false;
  }

  return EDITABLE_FIELDS.some((field) => {
    return (
      normalizeValue(originRow[field]) !== normalizeValue(currentRow[field])
    );
  });
};

/**
 * API/Redux 공통코드 항목에서 code 값 추출
 * 백엔드 필드명(code, codeValue, value 등) 차이 흡수
 */
const getCodeValue = (option) => {
  return (
    option.code ||
    option.codeValue ||
    option.value ||
    option.usageCd ||
    ""
  );
};

/**
 * API/Redux 공통코드 항목에서 표시명 추출
 * name 계열 필드가 없으면 code 값을 fallback
 */
const getCodeName = (option) => {
  return (
    option.name ||
    option.codeName ||
    option.label ||
    option.usageName ||
    getCodeValue(option)
  );
};

/**
 * 공통코드 목록을 select 옵션 형태 { code, name }으로 통일
 * @param {Array} codeList - Redux commonCode 또는 API 응답
 */
export const normalizeCodeOptions = (codeList) => {
  if (!Array.isArray(codeList) || codeList.length === 0) {
    return [];
  }

  return codeList.map((item) => {
    return {
      code: getCodeValue(item),
      name: getCodeName(item),
    };
  });
};

/**
 * 저장 API 요청용 row — 필요 필드만 추출
 */
export const toSaveRow = (row) => {
  return {
    workAreaCd: row.workAreaCd,
    ownerCd: row.ownerCd,
    usageCd: row.usageCd,
  };
};

/**
 * Owner Code 조회조건 입력 정규화
 * 영문·숫자만 허용하고 대문자로 변환
 */
export const normalizeOwnerCdInput = (value) => {
  if (typeof value !== "string") {
    return "";
  }

  return value.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
};
