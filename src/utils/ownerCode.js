/** 수정·변경 비교 대상 컬럼 */
export const EDITABLE_FIELDS = ["usageCd"];

/** API 미연동 시 개발 환경에서만 샘플 데이터 사용 */
export const USE_SAMPLE_DATA = import.meta.env.DEV;

export const USAGE_OPTIONS_FALLBACK = [
  { code: "DEV", name: "개발용" },
  { code: "QA", name: "테스트용" },
  { code: "OPS", name: "운영용" },
];

export const AG_GRID_DEFAULT_COL_DEF = {
  resizable: true,
  sortable: true,
  filter: true,
};

/** row 배열 얕은 복사 */
export const cloneRows = (rows) => {
  if (!Array.isArray(rows)) {
    return [];
  }

  return rows.map((row) => {
    return { ...row };
  });
};

export const normalizeValue = (value) => {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).trim();
};

export const isSameRow = (rowA, rowB) => {
  if (!rowA || !rowB) {
    return false;
  }

  return (
    normalizeValue(rowA.workAreaCd) === normalizeValue(rowB.workAreaCd) &&
    normalizeValue(rowA.ownerCd) === normalizeValue(rowB.ownerCd)
  );
};

export const findRowInList = (rows, targetRow) => {
  if (!Array.isArray(rows) || !targetRow) {
    return null;
  }

  return rows.find((row) => {
    return isSameRow(row, targetRow);
  });
};

export const isUnsetUsageCd = (usageCd) => {
  return usageCd === "" || usageCd === null;
};

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

const getCodeValue = (option) => {
  return (
    option.code ||
    option.codeValue ||
    option.value ||
    option.usageCd ||
    ""
  );
};

const getCodeName = (option) => {
  return (
    option.name ||
    option.codeName ||
    option.label ||
    option.usageName ||
    getCodeValue(option)
  );
};

export const normalizeCodeOptions = (codeList, fallbackList) => {
  const list = codeList && codeList.length > 0 ? codeList : fallbackList;

  return list.map((item) => {
    return {
      code: getCodeValue(item),
      name: getCodeName(item),
    };
  });
};

export const toSaveRow = (row) => {
  return {
    workAreaCd: row.workAreaCd,
    ownerCd: row.ownerCd,
    usageCd: row.usageCd,
  };
};

export const mergeSavedRows = (list, changedRows) => {
  if (!Array.isArray(changedRows) || changedRows.length === 0) {
    return list;
  }

  return list.map((row) => {
    const changed = changedRows.find((item) => {
      return isSameRow(item, row);
    });

    return changed ? { ...row, ...changed } : row;
  });
};

/** API 연동 전 그리드 테스트용 샘플 */
export const createSampleList = () => {
  return [
    { workAreaCd: "DEFAULT", ownerCd: "CD", usageCd: "DEV" },
    { workAreaCd: "DEFAULT", ownerCd: "EU", usageCd: "DEV" },
    { workAreaCd: "DEFAULT", ownerCd: "US", usageCd: "" },
    { workAreaCd: "DEFAULT", ownerCd: "JP", usageCd: "" },
    { workAreaCd: "DEFAULT", ownerCd: "KR", usageCd: "QA" },
    { workAreaCd: "DEFAULT", ownerCd: "CN", usageCd: "OPS" },
    { workAreaCd: "DEFAULT", ownerCd: "UK", usageCd: "DEV" },
    { workAreaCd: "DEFAULT", ownerCd: "DE", usageCd: "QA" },
    { workAreaCd: "DEFAULT", ownerCd: "FR", usageCd: "" },
    { workAreaCd: "DEFAULT", ownerCd: "AU", usageCd: "OPS" },
    { workAreaCd: "DEFAULT", ownerCd: "CA", usageCd: "DEV" },
    { workAreaCd: "DEFAULT", ownerCd: "IN", usageCd: "" },
    { workAreaCd: "DEFAULT", ownerCd: "BR", usageCd: "QA" },
    { workAreaCd: "DEFAULT", ownerCd: "MX", usageCd: "OPS" },
    { workAreaCd: "DEFAULT", ownerCd: "SG", usageCd: "DEV" },
  ];
};

/** Owner Code 조회조건 입력 정규화 (영문·숫자, 대문자) */
export const normalizeOwnerCdInput = (value) => {
  if (typeof value !== "string") {
    return "";
  }

  return value.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
};
