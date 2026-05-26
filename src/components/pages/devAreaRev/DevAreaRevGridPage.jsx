/**
 * DevAreaRevGridPage.jsx
 *
 * [이 파일에서 하는 일]
 * 1. 탭·검색으로 Rev 목록 API 조회
 * 2. 조회 결과를 그리드 행(rowData)으로 변환 (중첩 데이터 펼치기 + 병합 계산)
 * 3. ag-Grid에 스케치처럼 표시 (용도 | Owner Code | 최종 Rev | Rev 설명 | 등록정보)
 *
 * [그리드 병합 요약]
 * - 용도: 같은 usageCd끼리 세로 병합
 * - Owner Code: 같은 용도 + ownerCd끼리 병합
 * - 최종 Rev·설명·등록: 같은 용도 + finalRev끼리 병합 (Owner와 무관 → 운영용 3행 Rev=3 한 칸)
 */

import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { AgGridReact } from "ag-grid-react";

import {
  DEV_AREA_REV_MGMT,
  fetchDevAreaListRequest,
  fetchDevAreaRevListRequest,
} from "store/devAreaRev/devAreaRevAction";
import {
  COMMON_CODE_MGMT,
  fetchCommonCodeRequest,
} from "store/commonCode/commonCodeAction";

import Header from "components/common/Header";
import PageNotice from "components/common/PageNotice";
import Modal from "components/common/Modal";
import Form from "components/common/Form";
import Row from "components/common/Row";
import Col from "components/common/Col";
import FormItem from "components/common/FormItem";
import {
  AG_GRID_DEFAULT_COL_DEF,
  cloneRows,
  findUsageCodeName,
} from "utils/devAreaRev";
import { normalizeCodeOptions, normalizeValue } from "utils/ownerCode";
import { I18N_KEYS } from "i18n/keys";

import "./DevAreaRevGridPage.css";

// ---------------------------------------------------------------------------
// 설정 (병합·정렬 규칙 — 여기만 바꿔도 동작 변경 가능)
// ---------------------------------------------------------------------------

/** API가 자식 배열로 내려줄 때 찾을 필드명 */
const NESTED_CHILD_KEYS = ["usageList", "usageItems", "revItems", "children"];

/** 행 정렬 순서 (같은 용도·Owner·Rev끼리 붙어 있어야 병합됨) */
const SORT_FIELDS = ["usageCd", "ownerCd", "finalRev"];

/**
 * 컬럼마다 "무엇이 같으면 병합할지" 정의
 * 예) finalRev: ["usageCd", "finalRev"] → 용도가 같고 Rev 숫자가 같으면 병합
 */
const MERGE_KEY_FIELDS = {
  usageCd: ["usageCd"],
  ownerCd: ["usageCd", "ownerCd"],
  finalRev: ["usageCd", "finalRev"],
  revDesc: ["usageCd", "finalRev"],
  createUser: ["usageCd", "finalRev"],
  createDt: ["usageCd", "finalRev"],
};

const MERGED_GRID_DEFAULT_COL_DEF = {
  ...AG_GRID_DEFAULT_COL_DEF,
  sortable: false,
  filter: false,
};

// ---------------------------------------------------------------------------
// ag-Grid cellClassRules / rowClassRules
// - colDef.cellClassRules: { "CSS클래스명": (params) => true/false }
// - gridOptions.rowClassRules: 행 전체에 클래스 적용 (동일 형식)
// - true이면 클래스가 붙고, false이면 제거됨 (병합 셀 스타일에 사용)
// ---------------------------------------------------------------------------

/** __rowSpan[field] 값 (0 = 병합에 가려진 행, 1 = 병합 없음, 2+ = 병합 마스터) */
function getRowSpanValue(data, field) {
  const spanMap = data && data.__rowSpan;
  if (!spanMap || spanMap[field] === undefined) {
    return 1;
  }
  return spanMap[field];
}

function isMergedHiddenCell(field, data) {
  return getRowSpanValue(data, field) === 0;
}

/** 병합 컬럼 공통 cellClassRules */
function createMergeCellClassRules(field) {
  return {
    "dev-area-rev-merge-cell": (params) =>
      getRowSpanValue(params.data, field) > 1,
    "dev-area-rev-merge-cell--hidden": (params) =>
      isMergedHiddenCell(field, params.data),
  };
}

/** 용도 컬럼 추가 rule (그룹 라벨 셀 강조) */
const USAGE_CELL_CLASS_RULES = {
  "dev-area-rev-usage-cell": (params) =>
    !isMergedHiddenCell("usageCd", params.data),
};

/** 목록 그리드 행 rule — 용도가 바뀔 때 구분선 느낌 */
const LIST_GRID_ROW_CLASS_RULES = {
  "dev-area-rev-row--usage-start": (params) => {
    if (!params.data || params.node.rowIndex === 0) {
      return true;
    }
    const prev = params.api.getDisplayedRowAtIndex(params.node.rowIndex - 1);
    const prevData = prev && prev.data;
    return (
      normalizeValue(prevData && prevData.usageCd) !==
      normalizeValue(params.data.usageCd)
    );
  },
};

const MERGED_GRID_OPTIONS = {
  suppressRowTransform: true,
  rowClassRules: LIST_GRID_ROW_CLASS_RULES,
};

// ---------------------------------------------------------------------------
// 1단계: API 응답 → 평면 행 배열
// ---------------------------------------------------------------------------

function flattenRevListRows(rows) {
  if (!Array.isArray(rows)) {
    return [];
  }

  const flat = [];

  rows.forEach((row) => {
    if (!row || typeof row !== "object") {
      return;
    }

    const childKey = NESTED_CHILD_KEYS.find(
      (key) => Array.isArray(row[key]) && row[key].length > 0,
    );

    if (!childKey) {
      flat.push({ ...row });
      return;
    }

    row[childKey].forEach((child) => {
      const merged = {
        ...row,
        ...(child && typeof child === "object" ? child : {}),
      };
      NESTED_CHILD_KEYS.forEach((key) => delete merged[key]);
      flat.push(merged);
    });
  });

  return flat;
}

// ---------------------------------------------------------------------------
// 2단계: 병합되도록 정렬
// ---------------------------------------------------------------------------

function sortRowsForMerge(rows) {
  return [...rows].sort((rowA, rowB) => {
    for (let i = 0; i < SORT_FIELDS.length; i += 1) {
      const field = SORT_FIELDS[i];
      const valueA = normalizeValue(rowA[field]);
      const valueB = normalizeValue(rowB[field]);

      if (valueA < valueB) return -1;
      if (valueA > valueB) return 1;
    }
    return 0;
  });
}

// ---------------------------------------------------------------------------
// 3단계: 각 행에 병합 정보(__rowSpan) 붙이기
// ---------------------------------------------------------------------------

function buildMergeGroupKey(row, keyFields) {
  return keyFields.map((field) => normalizeValue(row[field])).join("\u0001");
}

/** 한 컬럼(field)에 대해 연속된 같은 그룹의 rowSpan 계산 */
function applyRowSpanForField(rows, field, keyFields) {
  let index = 0;

  while (index < rows.length) {
    const groupKey = buildMergeGroupKey(rows[index], keyFields);
    let span = 1;

    while (
      index + span < rows.length &&
      buildMergeGroupKey(rows[index + span], keyFields) === groupKey
    ) {
      span += 1;
    }

    if (!rows[index].__rowSpan) rows[index].__rowSpan = {};
    rows[index].__rowSpan[field] = span;

    for (let offset = 1; offset < span; offset += 1) {
      if (!rows[index + offset].__rowSpan) rows[index + offset].__rowSpan = {};
      rows[index + offset].__rowSpan[field] = 0;
    }

    index += span;
  }
}

/** revList → 그리드에 넣을 rowData (병합 메타 포함) */
function buildMergedGridRows(revList) {
  const flat = flattenRevListRows(revList);
  const sorted = sortRowsForMerge(flat);
  const gridRows = cloneRows(sorted);

  Object.entries(MERGE_KEY_FIELDS).forEach(([field, keyFields]) => {
    applyRowSpanForField(gridRows, field, keyFields);
  });

  return gridRows;
}

// ---------------------------------------------------------------------------
// 4단계: ag-Grid 컬럼 정의 (병합 옵션 포함)
// ---------------------------------------------------------------------------

function withMergeColumn(colDef, field, extraCellClassRules = {}) {
  const keyFields = MERGE_KEY_FIELDS[field];
  if (!keyFields) {
    return colDef;
  }

  return {
    ...colDef,
    rowSpan: (params) => {
      const span = getRowSpanValue(params.data, field);
      return span === 0 ? 1 : span;
    },
    valueGetter: (params) => {
      if (isMergedHiddenCell(field, params.data)) {
        return "";
      }
      return params.data ? params.data[field] : undefined;
    },
    cellClassRules: {
      ...createMergeCellClassRules(field),
      ...extraCellClassRules,
    },
  };
}

/** 목록 그리드 컬럼: 용도 | Owner Code | 최종 Rev | Rev 설명 | 등록정보 | 상세보기 */
function buildListColumnDefs({
  t,
  usageOptions,
  onDetailClick,
  detailLabel,
  DetailButtonRenderer,
}) {
  return [
    withMergeColumn(
      {
        headerName: t(I18N_KEYS.USAGE, "용도"),
        field: "usageCd",
        width: 110,
        pinned: "left",
        valueFormatter: (params) => {
          if (isMergedHiddenCell("usageCd", params.data)) return "";
          return findUsageCodeName(usageOptions, params.value);
        },
      },
      "usageCd",
      USAGE_CELL_CLASS_RULES,
    ),
    withMergeColumn(
      {
        headerName: t(I18N_KEYS.OWNER_CODE, "Owner Code"),
        field: "ownerCd",
        width: 110,
      },
      "ownerCd",
    ),
    withMergeColumn(
      {
        headerName: t(I18N_KEYS.FINAL_REV, "최종 Rev"),
        field: "finalRev",
        width: 88,
      },
      "finalRev",
    ),
    withMergeColumn(
      {
        headerName: t(I18N_KEYS.REV_DESC, "Rev 설명"),
        field: "revDesc",
        minWidth: 180,
        flex: 1,
      },
      "revDesc",
    ),
    {
      headerName: t(I18N_KEYS.REG_INFO, "등록정보"),
      marryChildren: true,
      children: [
        withMergeColumn(
          {
            headerName: t(I18N_KEYS.CREATE_USER, "등록자"),
            field: "createUser",
            width: 100,
          },
          "createUser",
        ),
        withMergeColumn(
          {
            headerName: t(I18N_KEYS.CREATE_DT, "등록일시"),
            field: "createDt",
            width: 140,
          },
          "createDt",
        ),
      ],
    },
    {
      headerName: t(I18N_KEYS.VIEW_DETAIL, "상세보기"),
      width: 100,
      pinned: "right",
      sortable: false,
      filter: false,
      cellRendererFramework: DetailButtonRenderer,
      cellRendererParams: { detailLabel, onDetailClick },
    },
  ];
}

/** 상세 팝업 컬럼 (병합 없음) */
function buildDetailColumnDefs({ t, usageOptions }) {
  return [
    {
      headerName: t(I18N_KEYS.USAGE, "용도"),
      field: "usageCd",
      width: 110,
      valueFormatter: (params) => findUsageCodeName(usageOptions, params.value),
    },
    {
      headerName: t(I18N_KEYS.OWNER_CODE, "Owner Code"),
      field: "ownerCd",
      width: 110,
    },
    {
      headerName: t(I18N_KEYS.FINAL_REV, "최종 Rev"),
      field: "finalRev",
      width: 88,
    },
    {
      headerName: t(I18N_KEYS.REV_DESC, "Rev 설명"),
      field: "revDesc",
      minWidth: 160,
      flex: 1,
    },
    {
      headerName: t(I18N_KEYS.REG_INFO, "등록정보"),
      marryChildren: true,
      children: [
        {
          headerName: t(I18N_KEYS.CREATE_USER, "등록자"),
          field: "createUser",
          width: 100,
        },
        {
          headerName: t(I18N_KEYS.CREATE_DT, "등록일시"),
          field: "createDt",
          width: 140,
        },
      ],
    },
    {
      headerName: t(I18N_KEYS.MOD_INFO, "수정 정보"),
      marryChildren: true,
      children: [
        {
          headerName: t(I18N_KEYS.UPDATE_USER, "수정자"),
          field: "updateUser",
          width: 100,
        },
        {
          headerName: t(I18N_KEYS.UPDATE_DT, "수정일시"),
          field: "updateDt",
          width: 140,
        },
      ],
    },
  ];
}

// ---------------------------------------------------------------------------
// 상세보기 버튼 셀
// ---------------------------------------------------------------------------

const DetailButtonRenderer = forwardRef(
  function DetailButtonRenderer(props, ref) {
    useImperativeHandle(ref, () => ({ refresh: () => true }));

    return (
      <div className="grid-detail-cell">
        <button
          type="button"
          className="grid-detail-btn"
          onClick={(event) => {
            event.stopPropagation();
            if (props.onDetailClick && props.data) {
              props.onDetailClick(props.data);
            }
          }}
        >
          {props.detailLabel}
        </button>
      </div>
    );
  },
);

// ---------------------------------------------------------------------------
// 페이지 컴포넌트
// ---------------------------------------------------------------------------

const DevAreaRevGridPage = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const devAreaRevState = useSelector(
    (state) => state.get(DEV_AREA_REV_MGMT) || {},
  );
  const commonCodeState = useSelector(
    (state) => state.get(COMMON_CODE_MGMT) || {},
  );

  const devAreaList = devAreaRevState.devAreaList || [];
  const revList = devAreaRevState.revList || [];
  const listLoading =
    devAreaRevState.devAreaListLoading || devAreaRevState.listLoading;
  const apiError = devAreaRevState.error || commonCodeState.error || null;

  const [activeDevAreaCd, setActiveDevAreaCd] = useState("");
  const [detailRow, setDetailRow] = useState(null);
  const [notice, setNotice] = useState(null);

  const usageOptions = normalizeCodeOptions(commonCodeState.usageCodeList);
  const finalRevDisplay =
    revList.length > 0 && revList[0].finalRev !== undefined
      ? String(revList[0].finalRev)
      : "";

  const handleDetailClick = useCallback((row) => {
    setDetailRow(row);
  }, []);

  // revList가 바뀔 때마다: 펼치기 → 정렬 → 병합 → rowData / columnDefs
  const rowData = useMemo(() => buildMergedGridRows(revList), [revList]);

  const columnDefs = useMemo(
    () =>
      buildListColumnDefs({
        t,
        usageOptions,
        onDetailClick: handleDetailClick,
        detailLabel: t(I18N_KEYS.VIEW_DETAIL, "상세보기"),
        DetailButtonRenderer,
      }),
    [t, usageOptions, handleDetailClick],
  );

  const detailColumnDefs = useMemo(
    () => buildDetailColumnDefs({ t, usageOptions }),
    [t, usageOptions],
  );

  useEffect(() => {
    dispatch(fetchDevAreaListRequest());
    dispatch(fetchCommonCodeRequest({ groupCodes: ["USAGE_CD"] }));
  }, [dispatch]);

  useEffect(() => {
    if (devAreaList.length > 0 && !activeDevAreaCd) {
      setActiveDevAreaCd(devAreaList[0].devAreaCd);
    }
  }, [devAreaList, activeDevAreaCd]);

  useEffect(() => {
    if (activeDevAreaCd) {
      dispatch(fetchDevAreaRevListRequest({ devAreaCd: activeDevAreaCd }));
    }
  }, [activeDevAreaCd, dispatch]);

  function handleTabChange(devAreaCd) {
    if (devAreaCd !== activeDevAreaCd) setActiveDevAreaCd(devAreaCd);
  }

  function handleSearch() {
    if (activeDevAreaCd) {
      dispatch(fetchDevAreaRevListRequest({ devAreaCd: activeDevAreaCd }));
    }
  }

  function handleReset() {
    if (devAreaList.length > 0) setActiveDevAreaCd(devAreaList[0].devAreaCd);
  }

  return (
    <div className="page dev-area-rev-page">
      <div className="dev-area-tabs">
        {devAreaList.map((item) => (
          <button
            key={item.devAreaCd}
            type="button"
            className={
              item.devAreaCd === activeDevAreaCd
                ? "dev-area-tabs__button is-active"
                : "dev-area-tabs__button"
            }
            disabled={listLoading}
            onClick={() => handleTabChange(item.devAreaCd)}
          >
            {item.devAreaName || item.devAreaCd}
          </button>
        ))}
      </div>

      <section className="issue-search-box">
        <div className="issue-search-box__title">
          {t(I18N_KEYS.SEARCH_CONDITION, "조회조건")}
        </div>

        <Form
          values={{ finalRev: finalRevDisplay }}
          onSubmit={handleSearch}
          disabled={listLoading || !activeDevAreaCd}
        >
          <Row>
            <Col span={6}>
              <FormItem
                label={t(I18N_KEYS.FINAL_REV_READONLY, "최종 Rev (조회)")}
                name="finalRev"
              >
                <input
                  type="text"
                  readOnly
                  className="search-field__control search-field__control--readonly"
                />
              </FormItem>
            </Col>
            <Col span={18}>
              <div className="issue-search-box__buttons">
                <button
                  type="button"
                  className="btn btn-gray"
                  disabled={listLoading}
                  onClick={handleReset}
                >
                  {t(I18N_KEYS.RESET, "초기화")}
                </button>
                <button
                  type="submit"
                  className="btn btn-blue"
                  disabled={listLoading}
                >
                  {t(I18N_KEYS.SEARCH, "검색")}
                </button>
              </div>
            </Col>
          </Row>
        </Form>
      </section>

      <PageNotice notice={notice} onDismiss={() => setNotice(null)} />

      {apiError && (
        <div className="error-box">
          {apiError.message || t(I18N_KEYS.UNKNOWN_ERROR, "알 수 없는 에러")}
        </div>
      )}

      <Header
        title={t(I18N_KEYS.REV_GRID_TITLE, "Rev 목록")}
        count={rowData.length}
      >
        <div className="ag-theme-balham dev-area-rev-grid">
          <AgGridReact
            key={`rev-grid-${activeDevAreaCd}-${rowData.length}`}
            rowData={rowData}
            columnDefs={columnDefs}
            defaultColDef={MERGED_GRID_DEFAULT_COL_DEF}
            gridOptions={MERGED_GRID_OPTIONS}
            headerHeight={36}
            groupHeaderHeight={36}
          />
        </div>
      </Header>

      <Modal
        open={Boolean(detailRow)}
        wide
        bodyClassName="modal-panel__body--grid"
        title={t(I18N_KEYS.DETAIL_TITLE, "상세 보기")}
        onClose={() => setDetailRow(null)}
      >
        <div className="ag-theme-balham dev-area-rev-detail-grid">
          <AgGridReact
            rowData={detailRow ? [detailRow] : []}
            columnDefs={detailColumnDefs}
            defaultColDef={AG_GRID_DEFAULT_COL_DEF}
            headerHeight={36}
            groupHeaderHeight={36}
            domLayout="autoHeight"
          />
        </div>
      </Modal>
    </div>
  );
};

export default DevAreaRevGridPage;
