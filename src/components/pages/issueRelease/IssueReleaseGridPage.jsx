/**
 * IssueReleaseGridPage.jsx — 불출 투입량 그리드
 *
 * [와이어프레임]
 * - 탭: 정기 조회 | 불출
 * - 불출 투입량 마지막 Rev 표시
 * - 불출입력 데이터변경(날짜) + 수정
 * - 변환(조회) → P1~P4 피벗 셀 편집 가능
 * - 저장 / 확정
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
  updateIssueReleaseModifyDateRequest,
  confirmIssueReleaseProjectRequest,
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
};

const DEFAULT_COL_DEF = {
  ...AG_GRID_DEFAULT_COL_DEF,
  sortable: false,
  filter: false,
  resizable: true,
};

function pivotFieldName(periodCd, inputDt) {
  return `pivot_${periodCd}__${inputDt}`;
}

function isPivotField(field) {
  return typeof field === "string" && field.startsWith("pivot_");
}

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

    if (record.periodCd && record.inputDt) {
      const field = pivotFieldName(record.periodCd, record.inputDt);
      row[field] = toNumber(row[field]) + qty;
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
    .sort((a, b) => String(a.periodCd).localeCompare(String(b.periodCd)))
    .map((group) => ({
      periodCd: group.periodCd,
      inputDts: Array.from(group.inputDtSet).sort((a, b) =>
        a.localeCompare(b),
      ),
    }));
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

function createMergeColumnDef({ headerName, field, width, pinned }) {
  return {
    headerName,
    field,
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
    cellClassRules: {
      "issue-release-merge-cell": (params) =>
        getRowSpanValue(params.data, field) > 1,
      "issue-release-merge-cell--hidden": (params) =>
        getRowSpanValue(params.data, field) === 0,
    },
  };
}

function buildPivotColumnDefs(periodGroups, isEditMode) {
  if (!Array.isArray(periodGroups) || periodGroups.length === 0) {
    return [];
  }

  return periodGroups.map((group) => ({
    headerName: group.periodCd,
    headerClass: "issue-release-group-header",
    marryChildren: true,
    children: group.inputDts.map((inputDt) => {
      const field = pivotFieldName(group.periodCd, inputDt);

      return {
        headerName: inputDt,
        field,
        width: 96,
        editable: isEditMode,
        cellClassRules: {
          "issue-release-editable-cell": () => isEditMode,
        },
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
          if (!params.data) {
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
  }));
}

function buildColumnDefs(t, periodGroups, isEditMode) {
  return [
    createMergeColumnDef({
      headerName: t(I18N_KEYS.ISSUE_RELEASE_LINE, "Line"),
      field: "lineCd",
      width: 80,
      pinned: "left",
    }),
    {
      headerName: t(I18N_KEYS.ISSUE_RELEASE_AREA, "불출 Area"),
      field: "issueAreaCd",
      width: 100,
      pinned: "left",
      editable: false,
    },
    {
      headerName: t(I18N_KEYS.QTY_TOTAL, "Total"),
      field: "qtyTotal",
      width: 90,
      pinned: "left",
      editable: false,
      cellClass: "issue-release-total-cell",
      valueFormatter: (params) => formatNumber(params.value),
    },
    ...buildPivotColumnDefs(periodGroups, isEditMode),
  ];
}

function flattenRowsForSave(rowData, periodGroups) {
  const rows = [];

  rowData.forEach((row) => {
    periodGroups.forEach((group) => {
      group.inputDts.forEach((inputDt) => {
        const field = pivotFieldName(group.periodCd, inputDt);
        rows.push({
          lineCd: row.lineCd,
          issueAreaCd: row.issueAreaCd,
          projectId: row.projectId,
          periodCd: group.periodCd,
          inputDt,
          qty: toNumber(row[field]),
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
  const modifyDateLoading = Boolean(issueReleaseState.modifyDateLoading);
  const apiError = issueReleaseState.error || null;
  const projectStatus = issueReleaseState.projectStatus || "";

  const [activeTab, setActiveTab] = useState(TAB_ISSUE);
  const [isEditMode, setIsEditMode] = useState(false);
  const [modifyDate, setModifyDate] = useState("");
  const [gridRowData, setGridRowData] = useState([]);
  const [notice, setNotice] = useState(null);

  const sourceRowData = useMemo(
    () => buildIssueReleaseRows(dataList),
    [dataList],
  );

  const periodGroups = useMemo(
    () => buildPeriodColumnGroups(dataList),
    [dataList],
  );

  const lastRev = useMemo(() => {
    const found = dataList.find(
      (record) => record && record.lastRev != null,
    );
    return found ? String(found.lastRev) : "";
  }, [dataList]);

  const projectId = useMemo(() => {
    const found = dataList.find(
      (record) => record && record.projectId != null,
    );
    return found ? String(found.projectId) : "";
  }, [dataList]);

  const columnDefs = useMemo(
    () => buildColumnDefs(t, periodGroups, isEditMode),
    [t, periodGroups, isEditMode],
  );

  const gridContext = useMemo(
    () => ({ isEditMode }),
    [isEditMode],
  );

  useEffect(() => {
    setGridRowData(sourceRowData);
  }, [sourceRowData]);

  useEffect(() => {
    if (issueReleaseState.lastMessage) {
      setNotice({ type: "success", message: issueReleaseState.lastMessage });
    }
  }, [issueReleaseState.lastMessage]);

  const onGridReady = useCallback((params) => {
    gridApiRef.current = params.api;
  }, []);

  const handleConvert = useCallback(() => {
    setIsEditMode(true);
    dispatch(fetchIssueReleaseListRequest({ projectId }));
  }, [dispatch, projectId]);

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
    if (!modifyDate) {
      setNotice({
        type: "error",
        message: t(
          I18N_KEYS.ISSUE_RELEASE_DATE_REQUIRED,
          "날짜를 입력하세요.",
        ),
      });
      return;
    }

    dispatch(
      updateIssueReleaseModifyDateRequest({
        projectId,
        modifyDate,
      }),
    );
  }, [dispatch, modifyDate, projectId, t]);

  const handleConfirm = useCallback(() => {
    if (
      !window.confirm(
        t(
          I18N_KEYS.ISSUE_RELEASE_CONFIRM_PROMPT,
          "프로젝트를 확정하시겠습니까?",
        ),
      )
    ) {
      return;
    }

    dispatch(confirmIssueReleaseProjectRequest({ projectId }));
  }, [dispatch, projectId, t]);

  const onCellValueChanged = useCallback((params) => {
    if (!isPivotField(params.colDef.field)) {
      return;
    }
    setGridRowData((prev) => {
      const next = [...prev];
      const index = params.node.rowIndex;
      if (index >= 0 && index < next.length && params.data) {
        next[index] = { ...params.data };
      }
      return next;
    });
  }, []);

  const isBusy =
    listLoading || saving || confirming || modifyDateLoading;

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
              {t(
                I18N_KEYS.ISSUE_RELEASE_MODIFY_LABEL,
                "불출입력 데이터변경",
              )}
            </div>
            <div className="issue-release-modify-box__controls">
              <input
                type="date"
                className="issue-release-modify-box__date"
                value={modifyDate}
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
                disabled={isBusy || !projectId}
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
                  className="btn btn-green"
                  disabled={isBusy || !isEditMode || gridRowData.length === 0}
                  onClick={handleSave}
                >
                  {t(I18N_KEYS.SAVE, "저장")}
                </button>
              </>
            }
          >
            <div className="ag-theme-balham issue-release-grid">
              <AgGridReact
                key={`issue-release-grid-${periodGroups.length}-${isEditMode ? "edit" : "view"}`}
                rowData={gridRowData}
                columnDefs={columnDefs}
                defaultColDef={DEFAULT_COL_DEF}
                gridOptions={GRID_OPTIONS}
                context={gridContext}
                onGridReady={onGridReady}
                onCellValueChanged={onCellValueChanged}
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
              disabled={isBusy || !projectId}
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
