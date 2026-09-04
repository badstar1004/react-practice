/**
 * IssueReleaseGridPage.jsx — 불출 투입량 그리드
 *
 * [와이어프레임]
 * - 탭: 정기 조회 | 불출
 * - 불출 투입량 마지막 Rev 표시
 * - 불출입력 데이터변경(날짜) + 수정
 * - 변환(조회) → 첫 Rev(이전 Rev 없음)는 현재/과거월 편집 가능
 * - 변경 → 이전 Rev 복사, lastRev+1, 수정 상태 (현재/과거월 잠금)
 * - 저장 / 확정(해당 Rev 확정)
 */

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { AgGridReact } from "ag-grid-react";

import {
  ISSUE_RELEASE_MGMT,
  fetchIssueReleaseListRequest,
  saveIssueReleaseRequest,
  confirmIssueReleaseProjectRequest,
  reviseIssueReleaseRequest,
} from "store/issueRelease/issueReleaseAction";
import Header from "components/common/Header";
import PageNotice from "components/common/PageNotice";
import { AG_GRID_DEFAULT_COL_DEF } from "utils/ownerCode";
import { I18N_KEYS } from "i18n/keys";

import "./IssueReleaseGridPage.css";

const TAB_REGULAR = "regular";
const TAB_ISSUE = "issue";

const GRID_OPTIONS = {
  suppressRowTransform: true,
  suppressMovableColumns: true,
};

/** 월 컬럼의 field·colId — 26.08 을 변환한 26_08 (월은 01~12만 허용) */
const MONTH_FIELD_PATTERN = /^\d{2}_(?:0[1-9]|1[0-2])$/;
/** 월 데이터(inputDt) — 26.08 처럼 YY.MM */
const MONTH_INPUT_DT_PATTERN = /^(\d{2})\.(0[1-9]|1[0-2])$/;

/** 26.08 → 26_08 */
function pivotFieldName(inputDt) {
  return String(inputDt || "").replace(".", "_");
}

/** 26_08 같은 월 컬럼인지 — lineCd·qtyTotal·__rowSpan 등은 형식이 달라 제외된다. */
function isPivotField(field) {
  return typeof field === "string" && MONTH_FIELD_PATTERN.test(field);
}

/** 26_08 → 26.08 */
function getInputDtFromPivotField(field) {
  return isPivotField(field) ? field.replace("_", ".") : "";
}

function parseInputDtYearMonth(inputDt) {
  if (typeof inputDt !== "string") {
    return null;
  }
  const matched = inputDt.trim().match(MONTH_INPUT_DT_PATTERN);
  if (!matched) {
    return null;
  }
  return (2000 + Number(matched[1])) * 100 + Number(matched[2]);
}

function getCurrentYearMonth() {
  const now = new Date();
  return now.getFullYear() * 100 + (now.getMonth() + 1);
}

function isLockedInputDt(inputDt, lockPastMonths) {
  if (!lockPastMonths) {
    return false;
  }
  const yearMonth = parseInputDtYearMonth(inputDt);
  if (yearMonth == null) {
    return false;
  }
  return yearMonth <= getCurrentYearMonth();
}

function isLockedPivotField(field, lockPastMonths) {
  return isLockedInputDt(getInputDtFromPivotField(field), lockPastMonths);
}

function isFirstPlanRev(lastRev) {
  const rev = Number(lastRev);
  return !Number.isFinite(rev) || rev <= 1;
}

function hasPreviousRev(lastRev) {
  return !isFirstPlanRev(lastRev);
}

function isConfirmedStatus(status) {
  return String(status || "").toUpperCase() === "CONFIRMED";
}

function isTotalField(field) {
  return field === "qtyTotal";
}

function isEnterKey(event) {
  if (!event) {
    return false;
  }
  return event.key === "Enter" || event.which === 13 || event.keyCode === 13;
}

function isDeleteKey(event) {
  if (!event) {
    return false;
  }
  return event.key === "Delete" || event.which === 46 || event.keyCode === 46;
}

function suppressKeyboardEvent(params) {
  const event = params.event;
  const api = params.api;
  const colDef = params.colDef || {};
  const isEnter =
    Boolean(event) &&
    (event.key === "Enter" || event.which === 13 || event.keyCode === 13);
  const isDelete =
    Boolean(event) &&
    (event.key === "Delete" || event.which === 46 || event.keyCode === 46);
  if (!isEnter && !isDelete) {
    return false;
  }

  const isEditableMonth =
    isPivotField(colDef.field) && colDef.editable === true;

  if (isEnter && isEditableMonth) {
    return false;
  }
  if (
    isDelete &&
    (params.editing || !(isEditableMonth || isTotalField(colDef.field)))
  ) {
    return false;
  }

  if (isDelete && api && typeof api.getCellRanges === "function") {
    (api.getCellRanges() || []).forEach((cellRange) => {
      if (
        !cellRange ||
        !cellRange.startRow ||
        !cellRange.endRow ||
        !Array.isArray(cellRange.columns)
      ) {
        return;
      }
      const rowStart = Math.min(
        cellRange.startRow.rowIndex,
        cellRange.endRow.rowIndex,
      );
      const rowEnd = Math.max(
        cellRange.startRow.rowIndex,
        cellRange.endRow.rowIndex,
      );

      for (let rowIdx = rowStart; rowIdx <= rowEnd; rowIdx += 1) {
        cellRange.columns.forEach((column) => {
          const rangeColDef = column.getColDef ? column.getColDef() : null;
          if (
            !rangeColDef ||
            rangeColDef.editable !== true ||
            !isPivotField(rangeColDef.field)
          ) {
            return;
          }
          const rowNode = api.getDisplayedRowAtIndex(rowIdx);
          if (rowNode) {
            rowNode.setDataValue(column, 0);
          }
        });
      }
    });
    api.refreshCells({ columns: ["qtyTotal"], force: true });
  }

  if (event && typeof event.preventDefault === "function") {
    event.preventDefault();
  }
  if (event && typeof event.stopPropagation === "function") {
    event.stopPropagation();
  }
  return true;
}

const DEFAULT_COL_DEF = {
  ...AG_GRID_DEFAULT_COL_DEF,
  sortable: false,
  filter: false,
  resizable: true,
  suppressMovable: true,
  suppressKeyboardEvent,
};

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function joinRowFields(row, fields) {
  return fields.map((name) => row[name] ?? "").join("\u0001");
}

function getRowSpanValue(data, field) {
  const spanMap = data && data.__rowSpan;
  if (!spanMap || spanMap[field] === undefined) {
    return 1;
  }
  return spanMap[field];
}

function applyRowSpanForField(rows, columnField, groupFields) {
  let index = 0;

  while (index < rows.length) {
    const groupKey = joinRowFields(rows[index], groupFields);
    let span = 1;

    while (
      index + span < rows.length &&
      joinRowFields(rows[index + span], groupFields) === groupKey
    ) {
      span += 1;
    }

    if (!rows[index].__rowSpan) {
      rows[index].__rowSpan = {};
    }
    rows[index].__rowSpan[columnField] = span;

    for (let offset = 1; offset < span; offset += 1) {
      if (!rows[index + offset].__rowSpan) {
        rows[index + offset].__rowSpan = {};
      }
      rows[index + offset].__rowSpan[columnField] = 0;
    }

    index += span;
  }
}

function buildIssueReleaseRows(records) {
  if (!Array.isArray(records) || records.length === 0) {
    return [];
  }

  const rowMap = new Map();

  records.forEach((record) => {
    if (!record || typeof record !== "object") {
      return;
    }

    const key = joinRowFields(record, ["lineCd", "issueAreaCd"]);

    if (!rowMap.has(key)) {
      rowMap.set(key, {
        lineCd: record.lineCd,
        issueAreaCd: record.issueAreaCd,
        projectId: record.projectId,
        qtyTotal: 0,
      });
    }

    const row = rowMap.get(key);
    const qty = toNumber(record.qty);
    row.qtyTotal += qty;

    // 월은 Period 를 통틀어 중복되지 않으므로 한 월 = 한 컬럼 = 한 레코드다.
    if (record.periodCd && record.inputDt) {
      row[pivotFieldName(record.inputDt)] = qty;
    }
  });

  const rows = Array.from(rowMap.values());

  rows.sort((rowA, rowB) => {
    if ((rowA.lineCd ?? "") < (rowB.lineCd ?? "")) return -1;
    if ((rowA.lineCd ?? "") > (rowB.lineCd ?? "")) return 1;
    if ((rowA.issueAreaCd ?? "") < (rowB.issueAreaCd ?? "")) return -1;
    if ((rowA.issueAreaCd ?? "") > (rowB.issueAreaCd ?? "")) return 1;
    return 0;
  });

  applyRowSpanForField(rows, "lineCd", ["lineCd"]);

  return rows;
}

function buildPeriodColumnGroups(records) {
  if (!Array.isArray(records) || records.length === 0) {
    return [];
  }

  const groupMap = new Map();

  records.forEach((record) => {
    if (!record || !record.periodCd) {
      return;
    }

    if (!groupMap.has(record.periodCd)) {
      groupMap.set(record.periodCd, {
        periodCd: record.periodCd,
        inputDtSet: new Set(),
      });
    }

    if (record.inputDt) {
      groupMap.get(record.periodCd).inputDtSet.add(String(record.inputDt));
    }
  });

  return Array.from(groupMap.values())
    .sort((a, b) =>
      String(a.periodCd).localeCompare(String(b.periodCd), undefined, {
        numeric: true,
      }),
    )
    .map((group) => ({
      periodCd: group.periodCd,
      inputDts: Array.from(group.inputDtSet).sort((a, b) => a.localeCompare(b)),
    }));
}

function toIsoFirstDayOfNextMonth() {
  const now = new Date();
  const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const month = String(next.getMonth() + 1).padStart(2, "0");
  const day = String(next.getDate()).padStart(2, "0");
  return `${next.getFullYear()}-${month}-${day}`;
}

/** 날짜 입력값(YYYY-MM-DD) → 월 컬럼(YY.MM) */
function toInputDt(isoDate) {
  if (typeof isoDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) {
    return "";
  }
  return `${isoDate.slice(2, 4)}.${isoDate.slice(5, 7)}`;
}

function nextPeriodCd(periodGroups) {
  let max = 0;
  (periodGroups || []).forEach((group) => {
    const matched = String(group.periodCd || "").match(/^P(\d+)$/i);
    if (matched) {
      max = Math.max(max, Number(matched[1]));
    }
  });
  return `P${max + 1}`;
}

function mergePeriodGroups(baseGroups, extraColumns) {
  const groupMap = new Map();

  (baseGroups || []).forEach((group) => {
    groupMap.set(group.periodCd, {
      periodCd: group.periodCd,
      inputDts: [...(group.inputDts || [])],
    });
  });

  (extraColumns || []).forEach((column) => {
    if (!column || !column.periodCd || !column.inputDt) {
      return;
    }
    if (!groupMap.has(column.periodCd)) {
      groupMap.set(column.periodCd, {
        periodCd: column.periodCd,
        inputDts: [],
      });
    }
    const group = groupMap.get(column.periodCd);
    if (group.inputDts.indexOf(column.inputDt) === -1) {
      group.inputDts.push(column.inputDt);
      group.inputDts.sort((a, b) => a.localeCompare(b));
    }
  });

  return Array.from(groupMap.values()).sort((a, b) =>
    String(a.periodCd).localeCompare(String(b.periodCd), undefined, {
      numeric: true,
    }),
  );
}

function hasInputDt(periodGroups, inputDt) {
  return (periodGroups || []).some(
    (group) => (group.inputDts || []).indexOf(inputDt) !== -1,
  );
}

function ensureExtraMonthFields(rows, extraColumns) {
  if (!Array.isArray(rows)) {
    return [];
  }
  if (!Array.isArray(extraColumns) || extraColumns.length === 0) {
    return rows.map((row) => ({ ...row }));
  }

  return rows.map((row) => {
    const next = { ...row };
    extraColumns.forEach((column) => {
      const field = pivotFieldName(column.inputDt);
      if (next[field] === undefined || next[field] === null) {
        next[field] = 0;
      }
    });
    next.qtyTotal = Object.keys(next).reduce((sum, key) => {
      if (!isPivotField(key)) {
        return sum;
      }
      return sum + toNumber(next[key]);
    }, 0);
    return next;
  });
}

function formatNumber(value) {
  if (value === null || value === undefined || value === "") {
    return "";
  }
  const num = Number(value);
  if (!Number.isFinite(num)) {
    return "";
  }
  return num.toLocaleString();
}

function getDisplayedColIds(columnApi) {
  if (!columnApi || typeof columnApi.getAllDisplayedColumns !== "function") {
    return [];
  }
  return columnApi.getAllDisplayedColumns().map((column) => column.getColId());
}

function normalizeCellRange(range, colIds) {
  if (
    !range ||
    range.startRow == null ||
    !range.startColId ||
    !Array.isArray(colIds)
  ) {
    return null;
  }

  const startColIdx = colIds.indexOf(range.startColId);
  const endColIdx = colIds.indexOf(range.endColId || range.startColId);
  if (startColIdx < 0 || endColIdx < 0) {
    return null;
  }

  return {
    minRow: Math.min(
      range.startRow,
      range.endRow == null ? range.startRow : range.endRow,
    ),
    maxRow: Math.max(
      range.startRow,
      range.endRow == null ? range.startRow : range.endRow,
    ),
    minColIdx: Math.min(startColIdx, endColIdx),
    maxColIdx: Math.max(startColIdx, endColIdx),
    colIds,
  };
}

/** Community 에는 getCellRanges 가 없어 Enterprise 와 같은 형태로 범위를 만든다. */
function buildCellRanges(api, columnApi, customRange) {
  if (!api || !columnApi) {
    return [];
  }

  let range = customRange;
  if (!range) {
    const focused = api.getFocusedCell && api.getFocusedCell();
    if (!focused || !focused.column) {
      return [];
    }
    range = {
      startRow: focused.rowIndex,
      endRow: focused.rowIndex,
      startColId: focused.column.getColId(),
      endColId: focused.column.getColId(),
    };
  }

  const normalized = normalizeCellRange(range, getDisplayedColIds(columnApi));
  if (!normalized) {
    return [];
  }

  const columns = [];
  for (
    let colIdx = normalized.minColIdx;
    colIdx <= normalized.maxColIdx;
    colIdx += 1
  ) {
    const column = columnApi.getColumn(normalized.colIds[colIdx]);
    if (column) {
      columns.push(column);
    }
  }

  return [
    {
      startRow: { rowIndex: normalized.minRow },
      endRow: { rowIndex: normalized.maxRow },
      columns,
    },
  ];
}

function isCellInRange(rowIndex, colId, range, columnApi) {
  const normalized = normalizeCellRange(range, getDisplayedColIds(columnApi));
  if (!normalized || rowIndex == null || !colId) {
    return false;
  }
  if (rowIndex < normalized.minRow || rowIndex > normalized.maxRow) {
    return false;
  }
  const colIdx = normalized.colIds.indexOf(colId);
  return colIdx >= normalized.minColIdx && colIdx <= normalized.maxColIdx;
}

// cellClassRules 는 column 없이 colDef·rowIndex·columnApi 만 넘겨준다.
function rangeCellClassRule(params) {
  const getRange = params.context && params.context.getRange;
  const colDef = params.colDef;
  if (!getRange || !colDef) {
    return false;
  }
  return isCellInRange(
    params.rowIndex,
    colDef.colId || colDef.field,
    getRange(),
    params.columnApi,
  );
}

function withRangeCellClassRules(rules) {
  return {
    ...rules,
    "issue-release-range-cell": rangeCellClassRule,
  };
}

function getColumnParent(column) {
  if (!column) {
    return null;
  }
  if (typeof column.getParent === "function" && column.getParent()) {
    return column.getParent();
  }
  if (typeof column.getOriginalParent === "function") {
    return column.getOriginalParent();
  }
  return null;
}

function getGroupHeaderLeafColIds(columnApi, groupUniqueId) {
  const displayed = columnApi.getAllDisplayedColumns();
  return displayed
    .filter((column) => {
      let parent = getColumnParent(column);
      while (parent) {
        const uniqueId =
          typeof parent.getUniqueId === "function" ? parent.getUniqueId() : "";
        const groupId =
          typeof parent.getGroupId === "function" ? parent.getGroupId() : "";
        if (uniqueId === groupUniqueId || groupId === groupUniqueId) {
          return true;
        }
        parent = getColumnParent(parent);
      }
      return false;
    })
    .map((column) => column.getColId());
}

function applyPivotValueToRow(row, field, value, lockPastMonths) {
  if (
    !row ||
    !isPivotField(field) ||
    isLockedPivotField(field, lockPastMonths)
  ) {
    return;
  }
  row[field] = toNumber(value);
  row.qtyTotal = Object.keys(row).reduce((sum, key) => {
    if (!isPivotField(key)) {
      return sum;
    }
    return sum + toNumber(row[key]);
  }, 0);
}

function createMergeColumnDef({ headerName, field, width, pinned }) {
  return {
    headerName,
    field,
    colId: field,
    width,
    pinned,
    rowSpan: (params) => {
      const span = getRowSpanValue(params.data, field);
      return span === 0 ? 1 : span;
    },
    valueGetter: (params) => {
      if (!params.data || getRowSpanValue(params.data, field) === 0) {
        return "";
      }
      return params.data[field];
    },
    cellClassRules: withRangeCellClassRules({
      "issue-release-merge-cell": (params) =>
        getRowSpanValue(params.data, field) > 1,
      "issue-release-merge-cell--hidden": (params) =>
        getRowSpanValue(params.data, field) === 0,
    }),
  };
}

function buildPivotColumnDefs(periodGroups, isEditMode, lockPastMonths) {
  if (!Array.isArray(periodGroups) || periodGroups.length === 0) {
    return [];
  }

  return periodGroups.map((group) => {
    const groupLocked =
      lockPastMonths &&
      group.inputDts.length > 0 &&
      group.inputDts.every((inputDt) => isLockedInputDt(inputDt, true));

    return {
      headerName: group.periodCd,
      headerClass: groupLocked
        ? "issue-release-group-header issue-release-locked-group-header"
        : "issue-release-group-header",
      groupId: String(group.periodCd),
      marryChildren: true,
      children: group.inputDts.map((inputDt) => {
        const field = pivotFieldName(inputDt);
        const locked = isLockedInputDt(inputDt, lockPastMonths);
        const canEdit = isEditMode && !locked;

        return {
          headerName: inputDt,
          field,
          colId: field,
          width: 96,
          editable: canEdit,
          headerClass: locked ? "issue-release-locked-header" : undefined,
          cellClassRules: withRangeCellClassRules({
            "issue-release-editable-cell": () => canEdit,
            "issue-release-locked-cell": () => locked,
          }),
          valueGetter: (params) => {
            if (!params.data) {
              return "";
            }
            const value = params.data[field];
            return value === undefined || value === null ? 0 : value;
          },
          valueFormatter: (params) => formatNumber(params.value),
          valueParser: (params) => {
            const parsed = Number(params.newValue);
            return Number.isFinite(parsed) ? parsed : 0;
          },
          valueSetter: (params) => {
            if (!params.data || locked) {
              return false;
            }
            const next = toNumber(params.newValue);
            params.data[field] = next;

            const pivotSum = Object.keys(params.data).reduce((sum, key) => {
              if (!isPivotField(key)) {
                return sum;
              }
              return sum + toNumber(params.data[key]);
            }, 0);
            params.data.qtyTotal = pivotSum;
            return true;
          },
        };
      }),
    };
  });
}

function buildColumnDefs(t, periodGroups, isEditMode, lockPastMonths) {
  return [
    createMergeColumnDef({
      headerName: t(I18N_KEYS.ISSUE_RELEASE_LINE, "Line"),
      field: "lineCd",
      colId: "lineCd",
      width: 80,
      pinned: "left",
    }),
    {
      headerName: t(I18N_KEYS.ISSUE_RELEASE_AREA, "불출 Area"),
      field: "issueAreaCd",
      colId: "issueAreaCd",
      width: 100,
      pinned: "left",
      editable: false,
      cellClassRules: withRangeCellClassRules({}),
    },
    {
      headerName: t(I18N_KEYS.QTY_TOTAL, "Total"),
      field: "qtyTotal",
      colId: "qtyTotal",
      width: 90,
      pinned: "left",
      editable: false,
      cellClass: "issue-release-total-cell",
      cellClassRules: withRangeCellClassRules({}),
      valueFormatter: (params) => formatNumber(params.value),
    },
    ...buildPivotColumnDefs(periodGroups, isEditMode, lockPastMonths),
  ];
}

function flattenRowsForSave(rowData, periodGroups) {
  const rows = [];

  rowData.forEach((row) => {
    periodGroups.forEach((group) => {
      group.inputDts.forEach((inputDt) => {
        const field = pivotFieldName(inputDt);
        rows.push({
          lineCd: row.lineCd,
          issueAreaCd: row.issueAreaCd,
          projectId: row.projectId,
          periodCd: group.periodCd,
          inputDt,
          qty: Math.round(toNumber(row[field])),
        });
      });
    });
  });

  return rows;
}

const IssueReleaseGridPage = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const gridApiRef = useRef(null);
  const columnApiRef = useRef(null);
  const cellRangeRef = useRef(null);
  const rangeDragRef = useRef(false);
  const headerDragRef = useRef(false);

  const issueReleaseState = useSelector(
    (state) => state.get(ISSUE_RELEASE_MGMT) || {},
  );

  const dataList = useMemo(
    () =>
      Array.isArray(issueReleaseState.dataList)
        ? issueReleaseState.dataList
        : [],
    [issueReleaseState.dataList],
  );

  const listLoading = Boolean(issueReleaseState.listLoading);
  const saving = Boolean(issueReleaseState.saving);
  const confirming = Boolean(issueReleaseState.confirming);
  const revising = Boolean(issueReleaseState.revising);
  const modifyDateLoading = Boolean(issueReleaseState.modifyDateLoading);
  const apiError = issueReleaseState.error || null;
  const projectStatus = issueReleaseState.projectStatus || "";
  const isBusy =
    listLoading || saving || confirming || modifyDateLoading || revising;

  const [activeTab, setActiveTab] = useState(TAB_ISSUE);
  const [isEditMode, setIsEditMode] = useState(false);
  const [modifyDate, setModifyDate] = useState("");
  const [extraPeriodColumns, setExtraPeriodColumns] = useState([]);
  const [gridRowData, setGridRowData] = useState([]);
  const [notice, setNotice] = useState(null);

  const sourceRowData = useMemo(
    () => buildIssueReleaseRows(dataList),
    [dataList],
  );

  const periodGroups = useMemo(
    () =>
      mergePeriodGroups(buildPeriodColumnGroups(dataList), extraPeriodColumns),
    [dataList, extraPeriodColumns],
  );

  const lastRev = useMemo(() => {
    if (issueReleaseState.lastRev != null && issueReleaseState.lastRev !== "") {
      return String(issueReleaseState.lastRev);
    }
    const found = dataList.find((record) => record && record.lastRev != null);
    return found ? String(found.lastRev) : "1";
  }, [dataList, issueReleaseState.lastRev]);

  const confirmed = isConfirmedStatus(projectStatus);
  const lockPastMonths = hasPreviousRev(lastRev) || revising;

  const projectId = useMemo(() => {
    const found = dataList.find((record) => record && record.projectId != null);
    return found ? String(found.projectId) : "";
  }, [dataList]);

  const columnDefs = useMemo(
    () => buildColumnDefs(t, periodGroups, isEditMode, lockPastMonths),
    [t, periodGroups, isEditMode, lockPastMonths],
  );

  // 범위 하이라이트 cellClassRules 전용 — 키 처리는 params(api/colDef)로 직접 한다.
  const gridContext = useMemo(
    () => ({ getRange: () => cellRangeRef.current }),
    [],
  );

  // 범위가 바뀌면 강제 refresh 로 cellClassRules 를 다시 평가시켜 하이라이트를 갱신한다.
  const commitCellRange = useCallback((nextRange) => {
    cellRangeRef.current = nextRange;
    const api = gridApiRef.current;
    if (api) {
      api.refreshCells({ force: true });
    }
  }, []);

  const clearRangeToZero = useCallback(() => {
    const api = gridApiRef.current;
    if (!api || typeof api.getCellRanges !== "function") {
      return;
    }

    (api.getCellRanges() || []).forEach((cellRange) => {
      if (
        !cellRange ||
        !cellRange.startRow ||
        !cellRange.endRow ||
        !Array.isArray(cellRange.columns)
      ) {
        return;
      }
      const rowStart = Math.min(
        cellRange.startRow.rowIndex,
        cellRange.endRow.rowIndex,
      );
      const rowEnd = Math.max(
        cellRange.startRow.rowIndex,
        cellRange.endRow.rowIndex,
      );

      for (let rowIdx = rowStart; rowIdx <= rowEnd; rowIdx += 1) {
        cellRange.columns.forEach((column) => {
          const colDef = column.getColDef ? column.getColDef() : null;
          if (
            !colDef ||
            colDef.editable !== true ||
            !isPivotField(colDef.field)
          ) {
            return;
          }
          const rowNode = api.getDisplayedRowAtIndex(rowIdx);
          if (rowNode) {
            rowNode.setDataValue(column, 0);
          }
        });
      }
    });
    api.refreshCells({ columns: ["qtyTotal"], force: true });
  }, []);

  const selectColumnIds = useCallback(
    (colIds) => {
      const api = gridApiRef.current;
      const columnApi = columnApiRef.current;
      if (!api || !columnApi || !colIds.length) {
        return;
      }
      const displayed = getDisplayedColIds(columnApi);
      const indexes = colIds
        .map((colId) => displayed.indexOf(colId))
        .filter((idx) => idx >= 0)
        .sort((a, b) => a - b);
      if (indexes.length === 0) {
        return;
      }
      const rowCount = api.getDisplayedRowCount();
      commitCellRange({
        startRow: 0,
        endRow: Math.max(rowCount - 1, 0),
        startColId: displayed[indexes[0]],
        endColId: displayed[indexes[indexes.length - 1]],
      });
    },
    [commitCellRange],
  );

  useEffect(() => {
    setGridRowData(ensureExtraMonthFields(sourceRowData, extraPeriodColumns));
  }, [sourceRowData]);

  useEffect(() => {
    setGridRowData((prev) => ensureExtraMonthFields(prev, extraPeriodColumns));
  }, [extraPeriodColumns]);

  useEffect(() => {
    if (issueReleaseState.lastMessage) {
      setNotice({ type: "success", message: issueReleaseState.lastMessage });
    }
  }, [issueReleaseState.lastMessage]);

  const onGridReady = useCallback((params) => {
    gridApiRef.current = params.api;
    columnApiRef.current = params.columnApi;
    params.api.getCellRanges = () =>
      buildCellRanges(params.api, params.columnApi, cellRangeRef.current);
  }, []);

  const onCellMouseDown = useCallback(
    (params) => {
      const event = params.event;
      if (!event || event.button !== 0 || !params.column || !params.node) {
        return;
      }

      const colId = params.column.getColId();
      const rowIndex = params.node.rowIndex;
      const current = cellRangeRef.current;

      rangeDragRef.current = true;
      headerDragRef.current = false;

      if (event.shiftKey && current) {
        commitCellRange({
          ...current,
          endRow: rowIndex,
          endColId: colId,
        });
        return;
      }

      commitCellRange({
        startRow: rowIndex,
        endRow: rowIndex,
        startColId: colId,
        endColId: colId,
      });
    },
    [commitCellRange],
  );

  const onCellMouseOver = useCallback(
    (params) => {
      if (!rangeDragRef.current || headerDragRef.current) {
        return;
      }
      if (!params.column || !params.node) {
        return;
      }
      const current = cellRangeRef.current;
      if (!current) {
        return;
      }
      const api = gridApiRef.current;
      if (api && typeof api.stopEditing === "function") {
        api.stopEditing();
      }
      commitCellRange({
        ...current,
        endRow: params.node.rowIndex,
        endColId: params.column.getColId(),
      });
    },
    [commitCellRange],
  );

  const onGridHeaderMouseDown = useCallback(
    (event) => {
      if (event.button !== 0) {
        return;
      }
      if (event.target.closest(".ag-cell, .ag-header-cell-resize")) {
        return;
      }

      const columnApi = columnApiRef.current;
      const api = gridApiRef.current;
      if (!columnApi || !api) {
        return;
      }

      const groupCell = event.target.closest(".ag-header-group-cell");
      if (groupCell) {
        const groupId = groupCell.getAttribute("col-id");
        const leafIds = getGroupHeaderLeafColIds(columnApi, groupId);
        if (leafIds.length > 0) {
          event.preventDefault();
          rangeDragRef.current = false;
          headerDragRef.current = true;
          selectColumnIds(leafIds);
        }
        return;
      }

      const headerCell = event.target.closest(".ag-header-cell");
      if (!headerCell) {
        return;
      }
      const colId = headerCell.getAttribute("col-id");
      if (!colId) {
        return;
      }

      event.preventDefault();
      rangeDragRef.current = false;
      headerDragRef.current = true;

      const current = cellRangeRef.current;
      if (event.shiftKey && current) {
        const rowCount = api.getDisplayedRowCount();
        commitCellRange({
          startRow: 0,
          endRow: Math.max(rowCount - 1, 0),
          startColId: current.startColId,
          endColId: colId,
        });
        return;
      }

      selectColumnIds([colId]);
    },
    [commitCellRange, selectColumnIds],
  );

  const onGridHeaderMouseOver = useCallback(
    (event) => {
      if (!headerDragRef.current) {
        return;
      }
      const headerCell = event.target.closest(".ag-header-cell");
      if (!headerCell) {
        return;
      }
      const colId = headerCell.getAttribute("col-id");
      const current = cellRangeRef.current;
      const api = gridApiRef.current;
      if (!colId || !current || !api) {
        return;
      }
      const rowCount = api.getDisplayedRowCount();
      commitCellRange({
        startRow: 0,
        endRow: Math.max(rowCount - 1, 0),
        startColId: current.startColId,
        endColId: colId,
      });
    },
    [commitCellRange],
  );

  useEffect(() => {
    const onMouseUp = () => {
      rangeDragRef.current = false;
      headerDragRef.current = false;
    };
    window.addEventListener("mouseup", onMouseUp);
    return () => window.removeEventListener("mouseup", onMouseUp);
  }, []);

  useEffect(() => {
    const onKeyDown = (event) => {
      const target = event.target;
      if (
        target &&
        typeof target.closest === "function" &&
        target.closest("input, textarea, select")
      ) {
        return;
      }

      const api = gridApiRef.current;
      const columnApi = columnApiRef.current;
      const focused = api && api.getFocusedCell ? api.getFocusedCell() : null;
      const focusedField =
        focused && focused.column && focused.column.getColDef()
          ? focused.column.getColDef().field
          : "";

      if (isEnterKey(event) && isTotalField(focusedField)) {
        event.preventDefault();
        return;
      }

      if (isDeleteKey(event)) {
        if (!isEditMode || event.defaultPrevented) {
          return;
        }
        event.preventDefault();
        clearRangeToZero();
        return;
      }

      const isCopy =
        (event.ctrlKey || event.metaKey) &&
        (event.key === "c" || event.key === "C");
      const isPaste =
        (event.ctrlKey || event.metaKey) &&
        (event.key === "v" || event.key === "V");
      if (!isCopy && !isPaste) {
        return;
      }

      const range = cellRangeRef.current;
      const normalized = normalizeCellRange(
        range,
        getDisplayedColIds(columnApi),
      );
      if (!api || !normalized) {
        return;
      }

      if (isCopy) {
        const lines = [];
        for (
          let rowIdx = normalized.minRow;
          rowIdx <= normalized.maxRow;
          rowIdx += 1
        ) {
          const rowNode = api.getDisplayedRowAtIndex(rowIdx);
          const row = rowNode && rowNode.data;
          const cells = [];
          for (
            let colIdx = normalized.minColIdx;
            colIdx <= normalized.maxColIdx;
            colIdx += 1
          ) {
            const colId = normalized.colIds[colIdx];
            const column = columnApi.getColumn(colId);
            const field =
              column && column.getColDef() ? column.getColDef().field : colId;
            const value = row ? row[field] : "";
            cells.push(value == null ? "" : String(value));
          }
          lines.push(cells.join("\t"));
        }
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(lines.join("\n"));
        }
        event.preventDefault();
        return;
      }

      if (!isEditMode) {
        return;
      }

      event.preventDefault();
      navigator.clipboard.readText().then((text) => {
        const pasteRows = String(text || "")
          .replace(/\r\n/g, "\n")
          .replace(/\r/g, "\n")
          .split("\n")
          .filter(
            (line, index, list) => !(index === list.length - 1 && line === ""),
          )
          .map((line) => line.split("\t"));

        setGridRowData((prev) => {
          const next = prev.map((row) => ({ ...row }));
          pasteRows.forEach((pasteCols, rowOffset) => {
            const rowIdx = normalized.minRow + rowOffset;
            if (rowIdx > normalized.maxRow || rowIdx >= next.length) {
              return;
            }
            pasteCols.forEach((cellValue, colOffset) => {
              const colIdx = normalized.minColIdx + colOffset;
              if (colIdx > normalized.maxColIdx) {
                return;
              }
              const colId = normalized.colIds[colIdx];
              const column = columnApi.getColumn(colId);
              const field =
                column && column.getColDef() ? column.getColDef().field : colId;
              applyPivotValueToRow(
                next[rowIdx],
                field,
                cellValue,
                lockPastMonths,
              );
            });
          });
          return next;
        });
      });
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [clearRangeToZero, isEditMode, lockPastMonths]);

  useEffect(() => {
    if (listLoading) {
      return;
    }
    if (confirmed) {
      setIsEditMode(false);
      return;
    }
    if (dataList.length > 0) {
      setIsEditMode(true);
    }
  }, [confirmed, dataList.length, listLoading]);

  const handleConvert = useCallback(() => {
    dispatch(fetchIssueReleaseListRequest({ projectId }));
  }, [dispatch, projectId]);

  const handleChangeRev = useCallback(() => {
    if (gridRowData.length === 0) {
      setNotice({
        type: "error",
        message: t(
          I18N_KEYS.ISSUE_RELEASE_MONTH_NEED_DATA,
          "먼저 변환으로 데이터를 불러오세요.",
        ),
      });
      return;
    }

    if (!confirmed) {
      setNotice({
        type: "error",
        message: t(
          I18N_KEYS.ISSUE_RELEASE_CHANGE_NEED_CONFIRM,
          "확정된 Rev만 변경할 수 있습니다.",
        ),
      });
      return;
    }

    const api = gridApiRef.current;
    if (api) {
      api.stopEditing();
    }

    dispatch(
      reviseIssueReleaseRequest({
        projectId,
        lastRev,
        rows: flattenRowsForSave(gridRowData, periodGroups),
      }),
    );
  }, [confirmed, dispatch, gridRowData, lastRev, periodGroups, projectId, t]);

  const handleSave = useCallback(() => {
    const api = gridApiRef.current;
    if (api) {
      api.stopEditing();
    }

    const payload = {
      projectId,
      rows: flattenRowsForSave(gridRowData, periodGroups),
    };

    dispatch(saveIssueReleaseRequest(payload));
  }, [dispatch, gridRowData, periodGroups, projectId]);

  const handleModifyDate = useCallback(() => {
    if (gridRowData.length === 0) {
      setNotice({
        type: "error",
        message: t(
          I18N_KEYS.ISSUE_RELEASE_MONTH_NEED_DATA,
          "먼저 변환으로 데이터를 불러오세요.",
        ),
      });
      return;
    }

    if (confirmed || !isEditMode) {
      setNotice({
        type: "error",
        message: t(
          I18N_KEYS.ISSUE_RELEASE_MONTH_NEED_EDIT,
          "수정 상태에서만 월을 추가할 수 있습니다.",
        ),
      });
      return;
    }

    if (!modifyDate) {
      setNotice({
        type: "error",
        message: t(I18N_KEYS.ISSUE_RELEASE_DATE_REQUIRED, "날짜를 입력하세요."),
      });
      return;
    }

    const inputDt = toInputDt(modifyDate);
    if (!inputDt) {
      setNotice({
        type: "error",
        message: t(I18N_KEYS.ISSUE_RELEASE_DATE_REQUIRED, "날짜를 입력하세요."),
      });
      return;
    }

    if (hasPreviousRev(lastRev) && isLockedInputDt(inputDt, true)) {
      setNotice({
        type: "error",
        message: t(
          I18N_KEYS.ISSUE_RELEASE_MONTH_LOCKED,
          "현재월과 과거월은 입력할 수 없습니다.",
        ),
      });
      return;
    }

    if (hasInputDt(periodGroups, inputDt)) {
      setNotice({
        type: "error",
        message: t(
          I18N_KEYS.ISSUE_RELEASE_MONTH_EXISTS,
          "이미 추가된 월입니다.",
        ),
      });
      return;
    }

    const periodCd = nextPeriodCd(periodGroups);
    setExtraPeriodColumns((prev) => [...prev, { periodCd, inputDt }]);
    setIsEditMode(true);
    setNotice({
      type: "success",
      message: t(
        I18N_KEYS.ISSUE_RELEASE_MONTH_ADDED,
        "{{periodCd}} {{inputDt}} 월이 추가되었습니다.",
        { periodCd, inputDt },
      ),
    });
  }, [
    confirmed,
    gridRowData,
    isEditMode,
    lastRev,
    modifyDate,
    periodGroups,
    t,
  ]);

  const handleConfirm = useCallback(() => {
    if (
      !window.confirm(
        t(
          I18N_KEYS.ISSUE_RELEASE_CONFIRM_PROMPT,
          "Rev {{rev}}을(를) 확정하시겠습니까?",
          { rev: lastRev || "1" },
        ),
      )
    ) {
      return;
    }

    dispatch(confirmIssueReleaseProjectRequest({ projectId, lastRev }));
    setIsEditMode(false);
  }, [dispatch, lastRev, projectId, t]);

  const onCellValueChanged = useCallback((params) => {
    if (!isPivotField(params.colDef.field) || !params.api || !params.node) {
      return;
    }
    // valueSetter 가 같은 row 객체의 월·합계를 이미 바꿨으므로 setGridRowData 는 필요 없다.
    params.api.refreshCells({
      rowNodes: [params.node],
      columns: ["qtyTotal"],
      force: true,
    });
  }, []);

  return (
    <div className="page issue-release-page">
      <div className="issue-release-tabs">
        <button
          type="button"
          className={
            activeTab === TAB_REGULAR
              ? "issue-release-tabs__button is-active"
              : "issue-release-tabs__button"
          }
          onClick={() => setActiveTab(TAB_REGULAR)}
        >
          {t(I18N_KEYS.ISSUE_RELEASE_TAB_REGULAR, "정기 조회")}
        </button>
        <button
          type="button"
          className={
            activeTab === TAB_ISSUE
              ? "issue-release-tabs__button is-active"
              : "issue-release-tabs__button"
          }
          onClick={() => setActiveTab(TAB_ISSUE)}
        >
          {t(I18N_KEYS.ISSUE_RELEASE_TAB_ISSUE, "불출")}
        </button>
      </div>

      {activeTab === TAB_REGULAR ? (
        <div className="issue-release-placeholder">
          <p>
            {t(
              I18N_KEYS.ISSUE_RELEASE_REGULAR_PLACEHOLDER,
              "정기 조회 화면은 준비 중입니다.",
            )}
          </p>
        </div>
      ) : (
        <>
          <div className="issue-release-summary">
            <span className="issue-release-summary__title">
              {t(I18N_KEYS.ISSUE_RELEASE_SUMMARY, "불출 투입량")}
            </span>
            {lastRev ? (
              <span className="issue-release-summary__rev">
                {t(I18N_KEYS.ISSUE_RELEASE_LAST_REV, "마지막 Rev")}. {lastRev}
              </span>
            ) : null}
            {projectStatus ? (
              <span className="issue-release-summary__status">
                {t(I18N_KEYS.REV_STATUS, "Rev 상태")}: {projectStatus}
              </span>
            ) : null}
          </div>

          <section className="issue-release-modify-box">
            <div className="issue-release-modify-box__label">
              {t(I18N_KEYS.ISSUE_RELEASE_MODIFY_LABEL, "불출입력 데이터변경")}
            </div>
            <div className="issue-release-modify-box__controls">
              <input
                type="date"
                className="issue-release-modify-box__date"
                value={modifyDate}
                min={
                  hasPreviousRev(lastRev)
                    ? toIsoFirstDayOfNextMonth()
                    : undefined
                }
                placeholder={t(
                  I18N_KEYS.ISSUE_RELEASE_DATE_PLACEHOLDER,
                  "날짜를 입력하세요",
                )}
                disabled={isBusy}
                onChange={(event) => setModifyDate(event.target.value)}
              />
              <button
                type="button"
                className="btn btn-orange"
                disabled={
                  isBusy || confirmed || !isEditMode || gridRowData.length === 0
                }
                onClick={handleModifyDate}
              >
                {t(I18N_KEYS.EDIT, "수정")}
              </button>
            </div>
          </section>

          <PageNotice notice={notice} onDismiss={() => setNotice(null)} />

          {apiError && (
            <div className="error-box">
              {apiError.message ||
                t(I18N_KEYS.UNKNOWN_ERROR, "알 수 없는 에러")}
            </div>
          )}

          <Header
            title={t(I18N_KEYS.ISSUE_RELEASE_GRID_TITLE, "불출 투입량 그리드")}
            count={gridRowData.length}
            buttons={
              <>
                <button
                  type="button"
                  className="btn btn-blue"
                  disabled={isBusy}
                  onClick={handleConvert}
                >
                  {t(I18N_KEYS.ISSUE_RELEASE_CONVERT, "변환")}
                </button>
                <button
                  type="button"
                  className="btn btn-orange"
                  disabled={isBusy || gridRowData.length === 0 || !confirmed}
                  onClick={handleChangeRev}
                >
                  {t(I18N_KEYS.ISSUE_RELEASE_CHANGE, "변경")}
                </button>
                <button
                  type="button"
                  className="btn btn-green"
                  disabled={
                    isBusy ||
                    !isEditMode ||
                    confirmed ||
                    gridRowData.length === 0
                  }
                  onClick={handleSave}
                >
                  {t(I18N_KEYS.SAVE, "저장")}
                </button>
              </>
            }
          >
            <div
              className="ag-theme-balham issue-release-grid"
              onMouseDown={onGridHeaderMouseDown}
              onMouseOver={onGridHeaderMouseOver}
            >
              <AgGridReact
                key={`issue-release-grid-${periodGroups.length}-${isEditMode ? "edit" : "view"}-${lastRev}-${lockPastMonths ? "lock" : "open"}`}
                rowData={gridRowData}
                columnDefs={columnDefs}
                defaultColDef={DEFAULT_COL_DEF}
                gridOptions={GRID_OPTIONS}
                context={gridContext}
                onGridReady={onGridReady}
                onCellValueChanged={onCellValueChanged}
                onCellMouseDown={onCellMouseDown}
                onCellMouseOver={onCellMouseOver}
                headerHeight={36}
                groupHeaderHeight={36}
                singleClickEdit
                stopEditingWhenGridLosesFocus
                overlayLoadingTemplate={`<span class="ag-overlay-loading-center">${t(
                  I18N_KEYS.SEARCH,
                  "조회",
                )}...</span>`}
                overlayNoRowsTemplate={`<span class="ag-overlay-no-rows-center">${t(
                  I18N_KEYS.NO_DATA,
                  "조회된 데이터가 없습니다.",
                )}</span>`}
              />
              {listLoading && (
                <div className="issue-release-grid__loading" role="status">
                  {t(I18N_KEYS.SEARCH, "조회")}...
                </div>
              )}
            </div>
          </Header>

          <div className="issue-release-footer">
            <button
              type="button"
              className="btn btn-blue issue-release-footer__confirm"
              disabled={
                isBusy || confirmed || !projectId || gridRowData.length === 0
              }
              onClick={handleConfirm}
            >
              {t(I18N_KEYS.ISSUE_RELEASE_CONFIRM, "확정")}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default IssueReleaseGridPage;
