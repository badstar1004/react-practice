import { AG_GRID_DEFAULT_COL_DEF, cloneRows } from "utils/ownerCode";

export { AG_GRID_DEFAULT_COL_DEF, cloneRows };

/**
 * Rev 전체 목록에서 최종 Rev 번호와 해당 Rev 행만 추출
 */
export const resolveFinalRevRows = (rows) => {
  const list = Array.isArray(rows) ? rows : [];

  if (list.length === 0) {
    return { finalRev: null, revList: [] };
  }

  const finalRev = Math.max(
    ...list.map((row) => {
      return Number(row.finalRev) || 0;
    }),
  );

  const revList = list.filter((row) => {
    return Number(row.finalRev) === finalRev;
  });

  return { finalRev, revList };
};

/** 용도 코드 → 공통코드 표시명 */
export const findUsageCodeName = (options, cellValue) => {
  if (cellValue === null || cellValue === undefined) {
    return "";
  }

  const value = String(cellValue);
  const found = (options || []).find((item) => {
    return String(item.code) === value;
  });

  return found ? found.name : value;
};
