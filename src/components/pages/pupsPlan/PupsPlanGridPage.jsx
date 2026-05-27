/**
 * PupsPlanGridPage.jsx — 목적별 계획 그리드
 *
 * [데이터 흐름 요약]
 * 1. API flat record (한 줄 = seq + 목적 + 상세 + propCd + prodYm + qty …)
 * 2. buildPupsPlanRows → ag-Grid 한 행(row) + 피벗 셀 필드 + __rowSpan(병합)
 * 3. buildPivotColumnGroups → 오른쪽 헤더 그룹(분석/설계 × prodYm)
 * 4. buildLeftColumnDefs + buildPivotColumnDefs → columnDefs (왼쪽 + 오른쪽 한 배열)
 * 5. AgGridReact rowData + columnDefs → 화면 (그리드는 하나, 컬럼만 왼/오 구분)
 *
 * [왼쪽·오른쪽 "합치기"]
 * - 별도 그리드 2개가 아님. rowData 한 벌에 pivot_분석__26.05 같은 필드를 붙이고
 *   columnDefs에서 왼쪽 컬럼 뒤에 ...buildPivotColumnDefs() 로 오른쪽 컬럼을 이어 붙임.
 * - 연결 키: 같은 (seq, gbnCd, pupsCd, pupsDtlCd, propCd, unitCd) → 한 row,
 *   그 row의 pivot_<propCd>__<prodYm> 에 qty 가 들어감.
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

/** 여러 필드 값을 붙여 그룹/행 식별 문자열 생성 (병합·행 묶기용) */
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

/** 연속된 동일 그룹에 rowSpan 메타 부여 (0 = 병합에 가려진 셀) */
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

/**
 * flat record[] → ag-Grid rowData
 * - 왼쪽: seq, gbnCd, pupsNm, pupsDtlNm, unitNm, qty(합계)
 * - 오른쪽: pivot_<propCd>__<prodYm> 에 qty 누적
 */
function buildPupsPlanRows(records) {
  if (!Array.isArray(records) || records.length === 0) {
    return [];
  }

  const rowMap = new Map();

  records.forEach((record) => {
    if (!record || typeof record !== "object") {
      return;
    }

    const key = joinRowFields(record, [
      "seq",
      "gbnCd",
      "pupsCd",
      "pupsDtlCd",
      "propCd",
      "unitCd",
    ]);

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
    if ((rowA.gbnCd ?? "") < (rowB.gbnCd ?? "")) return -1;
    if ((rowA.gbnCd ?? "") > (rowB.gbnCd ?? "")) return 1;
    if ((rowA.pupsCd ?? "") < (rowB.pupsCd ?? "")) return -1;
    if ((rowA.pupsCd ?? "") > (rowB.pupsCd ?? "")) return 1;
    if ((rowA.pupsDtlCd ?? "") < (rowB.pupsDtlCd ?? "")) return -1;
    if ((rowA.pupsDtlCd ?? "") > (rowB.pupsDtlCd ?? "")) return 1;
    if ((rowA.propCd ?? "") < (rowB.propCd ?? "")) return -1;
    if ((rowA.propCd ?? "") > (rowB.propCd ?? "")) return 1;
    if ((rowA.seq ?? "") < (rowB.seq ?? "")) return -1;
    if ((rowA.seq ?? "") > (rowB.seq ?? "")) return 1;
    return 0;
  });

  applyRowSpanForField(rows, "gbnCd", ["gbnCd"]);
  applyRowSpanForField(rows, "pupsNm", ["gbnCd", "pupsCd"]);
  applyRowSpanForField(rows, "pupsDtlNm", ["gbnCd", "pupsCd", "pupsDtlCd"]);

  return rows;
}

/**
 * record 전체를 훑어 오른쪽 피벗 헤더 정보 생성
 * - propCd별 그룹 → propNm(상단 헤더) + prodYm 목록(하단 컬럼)
 */
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

/** 왼쪽 고정 컬럼 + 합계 뒤에 오른쪽 피벗 컬럼 그룹 연결 */
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

/**
 * pivotGroups → ag-Grid column group (children = prodYm 컬럼)
 * field 이름은 buildPupsPlanRows 의 pivot_<propCd>__<prodYm> 와 동일해야 함
 */
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
