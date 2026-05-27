/**
 * PupsPlanGridPage.jsx
 *
 * 목적별 계획(PupsPlan) 그리드 — 페이지 로직 전부 이 파일에 포함
 */

import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { AgGridReact } from "ag-grid-react";

import {
  PUPS_PLAN_MGMT,
  fetchPupsPlanListRequest,
} from "store/pupsPlan/pupsPlanAction";
import Header from "components/common/Header";
import { AG_GRID_DEFAULT_COL_DEF } from "utils/ownerCode";
import { I18N_KEYS } from "i18n/keys";

import "./PupsPlanGridPage.css";

const LEFT_ROW_KEY_FIELDS = [
  "seq",
  "gbnCd",
  "pupsCd",
  "pupsDtlCd",
  "propCd",
  "unitCd",
];

const SORT_FIELDS = ["gbnCd", "pupsCd", "pupsDtlCd", "propCd", "seq"];

const MERGE_KEY_FIELDS = {
  gbnCd: ["gbnCd"],
  pupsNm: ["gbnCd", "pupsCd"],
  pupsDtlNm: ["gbnCd", "pupsCd", "pupsDtlCd"],
};

const KEY_SEPARATOR = "\u0001";

const PUPS_PLAN_GRID_OPTIONS = {
  suppressRowTransform: true,
};

const PUPS_PLAN_DEFAULT_COL_DEF = {
  ...AG_GRID_DEFAULT_COL_DEF,
  sortable: false,
  filter: false,
  resizable: true,
};

function pivotFieldName(propCd, prodYm) {
  return `pivot_${propCd}__${prodYm}`;
}

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function rowKey(row, fields) {
  return fields.map((field) => row[field] ?? "").join(KEY_SEPARATOR);
}

function getRowSpanValue(data, field) {
  const spanMap = data && data.__rowSpan;
  if (!spanMap || spanMap[field] === undefined) {
    return 1;
  }
  return spanMap[field];
}

function applyRowSpanForField(rows, field, keyFields) {
  let index = 0;

  while (index < rows.length) {
    const groupKey = rowKey(rows[index], keyFields);
    let span = 1;

    while (
      index + span < rows.length &&
      rowKey(rows[index + span], keyFields) === groupKey
    ) {
      span += 1;
    }

    if (!rows[index].__rowSpan) {
      rows[index].__rowSpan = {};
    }
    rows[index].__rowSpan[field] = span;

    for (let offset = 1; offset < span; offset += 1) {
      if (!rows[index + offset].__rowSpan) {
        rows[index + offset].__rowSpan = {};
      }
      rows[index + offset].__rowSpan[field] = 0;
    }

    index += span;
  }
}

function buildPupsPlanRows(records) {
  if (!Array.isArray(records) || records.length === 0) {
    return [];
  }

  const rowMap = new Map();

  records.forEach((record) => {
    if (!record || typeof record !== "object") {
      return;
    }

    const key = rowKey(record, LEFT_ROW_KEY_FIELDS);

    if (!rowMap.has(key)) {
      rowMap.set(key, {
        seq: record.seq,
        gbnCd: record.gbnCd,
        pupsCd: record.pupsCd,
        pupsNm: record.pupsNm,
        pupsDtlCd: record.pupsDtlCd,
        pupsDtlNm: record.pupsDtlNm,
        propCd: record.propCd,
        propNm: record.propNm,
        unitCd: record.unitCd,
        unitNm: record.unitNm,
        qty: 0,
      });
    }

    const row = rowMap.get(key);
    const qty = toNumber(record.qty);

    row.qty += qty;

    if (record.propCd && record.prodYm) {
      const field = pivotFieldName(record.propCd, record.prodYm);
      row[field] = toNumber(row[field]) + qty;
    }
  });

  const rows = Array.from(rowMap.values());

  rows.sort((rowA, rowB) => {
    for (let i = 0; i < SORT_FIELDS.length; i += 1) {
      const field = SORT_FIELDS[i];
      const valueA = rowA[field] ?? "";
      const valueB = rowB[field] ?? "";

      if (valueA < valueB) return -1;
      if (valueA > valueB) return 1;
    }
    return 0;
  });

  Object.entries(MERGE_KEY_FIELDS).forEach(([field, keyFields]) => {
    applyRowSpanForField(rows, field, keyFields);
  });

  return rows;
}

function buildPivotColumnGroups(records) {
  if (!Array.isArray(records) || records.length === 0) {
    return [];
  }

  const groupMap = new Map();

  records.forEach((record) => {
    if (!record || !record.propCd) {
      return;
    }

    if (!groupMap.has(record.propCd)) {
      groupMap.set(record.propCd, {
        propCd: record.propCd,
        propNm: record.propNm || record.propCd,
        prodYmSet: new Set(),
      });
    }

    if (record.prodYm) {
      groupMap.get(record.propCd).prodYmSet.add(String(record.prodYm));
    }
  });

  return Array.from(groupMap.values())
    .sort((a, b) => String(a.propCd).localeCompare(String(b.propCd)))
    .map((group) => ({
      propCd: group.propCd,
      propNm: group.propNm,
      prodYms: Array.from(group.prodYmSet).sort((a, b) => a.localeCompare(b)),
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

function buildLeftColumnDefs(t, pivotGroups) {
  return [
    {
      headerName: t(I18N_KEYS.GBN_CD, "구분"),
      field: "gbnCd",
      width: 80,
      pinned: "left",
      rowSpan: (params) => {
        const span = getRowSpanValue(params.data, "gbnCd");
        return span === 0 ? 1 : span;
      },
      valueGetter: (params) => {
        if (!params.data || getRowSpanValue(params.data, "gbnCd") === 0) {
          return "";
        }
        return params.data.gbnCd;
      },
      cellClassRules: {
        "pups-plan-merge-cell": (params) =>
          getRowSpanValue(params.data, "gbnCd") > 1,
        "pups-plan-merge-cell--hidden": (params) =>
          getRowSpanValue(params.data, "gbnCd") === 0,
      },
    },
    {
      headerName: t(I18N_KEYS.PUPS_NM, "목적"),
      field: "pupsNm",
      width: 110,
      pinned: "left",
      rowSpan: (params) => {
        const span = getRowSpanValue(params.data, "pupsNm");
        return span === 0 ? 1 : span;
      },
      valueGetter: (params) => {
        if (!params.data || getRowSpanValue(params.data, "pupsNm") === 0) {
          return "";
        }
        return params.data.pupsNm;
      },
      cellClassRules: {
        "pups-plan-merge-cell": (params) =>
          getRowSpanValue(params.data, "pupsNm") > 1,
        "pups-plan-merge-cell--hidden": (params) =>
          getRowSpanValue(params.data, "pupsNm") === 0,
      },
    },
    {
      headerName: t(I18N_KEYS.PUPS_DTL_NM, "상세"),
      field: "pupsDtlNm",
      width: 110,
      pinned: "left",
      rowSpan: (params) => {
        const span = getRowSpanValue(params.data, "pupsDtlNm");
        return span === 0 ? 1 : span;
      },
      valueGetter: (params) => {
        if (!params.data || getRowSpanValue(params.data, "pupsDtlNm") === 0) {
          return "";
        }
        return params.data.pupsDtlNm;
      },
      cellClassRules: {
        "pups-plan-merge-cell": (params) =>
          getRowSpanValue(params.data, "pupsDtlNm") > 1,
        "pups-plan-merge-cell--hidden": (params) =>
          getRowSpanValue(params.data, "pupsDtlNm") === 0,
      },
    },
    {
      headerName: t(I18N_KEYS.UNIT_NM, "단위"),
      field: "unitNm",
      width: 80,
      pinned: "left",
    },
    {
      headerName: t(I18N_KEYS.QTY_TOTAL, "합계"),
      field: "qty",
      width: 90,
      pinned: "left",
      cellClass: "pups-plan-total-cell",
      valueFormatter: (params) => formatNumber(params.value),
    },
    ...buildPivotColumnDefs(pivotGroups),
  ];
}

function buildPivotColumnDefs(pivotGroups) {
  if (!Array.isArray(pivotGroups) || pivotGroups.length === 0) {
    return [];
  }

  return pivotGroups.map((group) => ({
    headerName: group.propNm,
    headerClass: "pups-plan-group-header",
    marryChildren: true,
    children: group.prodYms.map((prodYm) => {
      const field = pivotFieldName(group.propCd, prodYm);

      return {
        headerName: prodYm,
        field,
        width: 90,
        cellClass: "pups-plan-pivot-cell",
        valueGetter: (params) => {
          if (!params.data) {
            return "";
          }
          const value = params.data[field];
          return value === undefined || value === null ? 0 : value;
        },
        valueFormatter: (params) => formatNumber(params.value),
      };
    }),
  }));
}

const PupsPlanGridPage = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const pupsPlanState = useSelector(
    (state) => state.get(PUPS_PLAN_MGMT) || {},
  );

  const dataList = useMemo(
    () =>
      Array.isArray(pupsPlanState.dataList) ? pupsPlanState.dataList : [],
    [pupsPlanState.dataList],
  );
  const listLoading = Boolean(pupsPlanState.listLoading);
  const apiError = pupsPlanState.error || null;

  const rowData = useMemo(() => buildPupsPlanRows(dataList), [dataList]);
  const pivotGroups = useMemo(
    () => buildPivotColumnGroups(dataList),
    [dataList],
  );

  console.log("pivotGroups", pivotGroups);

  const lastRev = useMemo(() => {
    const found = dataList.find(
      (record) => record && record.lastRev != null,
    );
    return found ? String(found.lastRev) : "";
  }, [dataList]);

  const [columnDefs, setColumnDefs] = useState([]);

  useEffect(() => {
    setColumnDefs(buildLeftColumnDefs(t, pivotGroups));
  }, [t, pivotGroups]);

  useEffect(() => {
    dispatch(fetchPupsPlanListRequest());
  }, [dispatch]);

  return (
    <div className="page pups-plan-page">
      {apiError && (
        <div className="error-box">
          {apiError.message || t(I18N_KEYS.UNKNOWN_ERROR, "알 수 없는 에러")}
        </div>
      )}

      <Header
        title={t(I18N_KEYS.PUPS_PLAN_GRID_TITLE, "계획 그리드")}
        count={rowData.length}
        subInfo={
          lastRev ? (
            <span className="pups-plan-last-rev">
              {t(I18N_KEYS.FINAL_REV, "최종 Rev")}: {lastRev}
            </span>
          ) : null
        }
      >
        <div className="ag-theme-balham pups-plan-grid">
          <AgGridReact
            key={`pups-plan-grid-${rowData.length}-${pivotGroups.length}`}
            rowData={rowData}
            columnDefs={columnDefs}
            defaultColDef={PUPS_PLAN_DEFAULT_COL_DEF}
            gridOptions={PUPS_PLAN_GRID_OPTIONS}
            headerHeight={36}
            groupHeaderHeight={36}
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
            <div className="pups-plan-grid__loading" role="status">
              {t(I18N_KEYS.SEARCH, "조회")}...
            </div>
          )}
        </div>
      </Header>
    </div>
  );
};

export default PupsPlanGridPage;
