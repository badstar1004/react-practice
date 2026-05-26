import { cloneRows, findUsageCodeName } from "utils/devAreaRev";
import { normalizeValue } from "utils/ownerCode";

/** 그리드에서 세로 병합할 컬럼 순서 (상위 → 하위) */
export const DEV_AREA_REV_MERGE_FIELDS = ["ownerCd", "usageCd"];

const NESTED_CHILD_KEYS = ["usageList", "usageItems", "revItems", "children"];

/**
 * API가 중첩 구조(usageList 등)로 내려줄 때 1행 = 1 usage 기준으로 펼침
 */
export const flattenRevListRows = (rows) => {
  if (!Array.isArray(rows)) {
    return [];
  }

  const flat = [];

  rows.forEach((row) => {
    if (!row || typeof row !== "object") {
      return;
    }

    const childKey = NESTED_CHILD_KEYS.find((key) => {
      return Array.isArray(row[key]) && row[key].length > 0;
    });

    if (!childKey) {
      flat.push({ ...row });
      return;
    }

    row[childKey].forEach((child) => {
      const merged = {
        ...row,
        ...(child && typeof child === "object" ? child : {}),
      };

      NESTED_CHILD_KEYS.forEach((key) => {
        delete merged[key];
      });

      flat.push(merged);
    });
  });

  return flat;
};

/**
 * 병합 그룹 키 — 상위 병합 필드 값까지 포함해 하위 컬럼 병합 범위 결정
 */
export const buildMergeGroupKey = (row, mergeFields, upToFieldIndex) => {
  return mergeFields
    .slice(0, upToFieldIndex + 1)
    .map((field) => {
      return normalizeValue(row[field]);
    })
    .join("\u0001");
};

/**
 * 정렬: 병합 필드 순서대로 묶이도록 정렬 (동일 그룹이 연속되게)
 */
export const sortRowsForMerge = (rows, mergeFields = DEV_AREA_REV_MERGE_FIELDS) => {
  const fields = mergeFields.length > 0 ? mergeFields : DEV_AREA_REV_MERGE_FIELDS;

  return [...rows].sort((rowA, rowB) => {
    for (let index = 0; index < fields.length; index += 1) {
      const field = fields[index];
      const valueA = normalizeValue(rowA[field]);
      const valueB = normalizeValue(rowB[field]);

      if (valueA < valueB) {
        return -1;
      }

      if (valueA > valueB) {
        return 1;
      }
    }

    return 0;
  });
};

/**
 * 단일 필드에 대한 rowSpan 메타 부여
 * __rowSpan[field] = N(첫 행) | 0(병합으로 가려지는 행)
 */
export const applyRowSpanForField = (rows, field, mergeFields) => {
  const fieldIndex = mergeFields.indexOf(field);

  if (fieldIndex < 0) {
    return;
  }

  let index = 0;

  while (index < rows.length) {
    const groupKey = buildMergeGroupKey(rows[index], mergeFields, fieldIndex);
    let span = 1;

    while (
      index + span < rows.length &&
      buildMergeGroupKey(rows[index + span], mergeFields, fieldIndex) === groupKey
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
};

/**
 * 조회 데이터 → 병합 메타가 포함된 그리드 rowData
 */
export const buildMergedGridRows = (
  rows,
  mergeFields = DEV_AREA_REV_MERGE_FIELDS,
) => {
  const flat = flattenRevListRows(rows);
  const sorted = sortRowsForMerge(flat, mergeFields);
  const gridRows = cloneRows(sorted);

  mergeFields.forEach((field) => {
    applyRowSpanForField(gridRows, field, mergeFields);
  });

  return gridRows;
};

/** rowSpan 콜백 — ag-Grid colDef.rowSpan */
export const createMergeRowSpan = (field) => {
  return (params) => {
    const spanMap = params.data && params.data.__rowSpan;

    if (!spanMap || spanMap[field] === undefined) {
      return 1;
    }

    const span = spanMap[field];

    if (span === 0) {
      return 1;
    }

    return span;
  };
};

/** 병합으로 가려진 행은 표시값 비움 */
export const createMergeCellValueGetter = (field) => {
  return (params) => {
    const spanMap = params.data && params.data.__rowSpan;

    if (spanMap && spanMap[field] === 0) {
      return "";
    }

    return params.data ? params.data[field] : undefined;
  };
};

export const isMergedHiddenCell = (field, data) => {
  const spanMap = data && data.__rowSpan;
  return Boolean(spanMap && spanMap[field] === 0);
};

/**
 * Rev 목록 그리드용 2단 헤더 컬럼을 데이터·병합 설정에 맞게 생성
 */
export const buildDevAreaRevColumnDefs = ({
  t,
  i18nKeys,
  usageOptions,
  mergeFields = DEV_AREA_REV_MERGE_FIELDS,
  onDetailClick,
  detailLabel,
  DetailButtonRenderer,
}) => {
  const mergeFieldSet = new Set(mergeFields);

  const withMerge = (colDef, field) => {
    if (!mergeFieldSet.has(field)) {
      return colDef;
    }

    return {
      ...colDef,
      rowSpan: createMergeRowSpan(field),
      valueGetter: createMergeCellValueGetter(field),
      cellClassRules: {
        "dev-area-rev-merge-cell": (params) => {
          const span =
            params.data && params.data.__rowSpan && params.data.__rowSpan[field];
          return span > 1;
        },
        "dev-area-rev-merge-cell--hidden": (params) => {
          return isMergedHiddenCell(field, params.data);
        },
      },
    };
  };

  const groupColumnDefs = [
    {
      headerName: t(i18nKeys.OWNER_INFO, "Owner 정보"),
      marryChildren: true,
      children: [
        withMerge(
          {
            headerName: t(i18nKeys.OWNER_CODE, "owner code"),
            field: "ownerCd",
            width: 120,
          },
          "ownerCd",
        ),
        withMerge(
          {
            headerName: t(i18nKeys.USAGE, "용도"),
            field: "usageCd",
            width: 100,
            valueFormatter: (params) => {
              if (isMergedHiddenCell("usageCd", params.data)) {
                return "";
              }

              return findUsageCodeName(usageOptions, params.value);
            },
          },
          "usageCd",
        ),
      ],
    },
    {
      headerName: t(i18nKeys.REV_INFO, "Rev 정보"),
      marryChildren: true,
      children: [
        {
          headerName: t(i18nKeys.FINAL_REV, "최종 Rev"),
          field: "finalRev",
          width: 88,
        },
        {
          headerName: t(i18nKeys.REV_STATUS, "Rev 상태"),
          field: "revStatus",
          width: 100,
        },
        {
          headerName: t(i18nKeys.REV_DESC, "Rev 설명"),
          field: "revDesc",
          minWidth: 160,
          flex: 1,
        },
      ],
    },
    {
      headerName: t(i18nKeys.REG_INFO, "등록 정보"),
      marryChildren: true,
      children: [
        {
          headerName: t(i18nKeys.CREATE_USER, "등록자"),
          field: "createUser",
          width: 100,
        },
        {
          headerName: t(i18nKeys.CREATE_DT, "등록일시"),
          field: "createDt",
          width: 140,
        },
      ],
    },
    {
      headerName: t(i18nKeys.MOD_INFO, "수정 정보"),
      marryChildren: true,
      children: [
        {
          headerName: t(i18nKeys.UPDATE_USER, "수정자"),
          field: "updateUser",
          width: 100,
        },
        {
          headerName: t(i18nKeys.UPDATE_DT, "수정일시"),
          field: "updateDt",
          width: 140,
        },
      ],
    },
  ];

  const listColumnDefs = [
    {
      headerName: t(i18nKeys.ROW_NO, "No"),
      width: 64,
      pinned: "left",
      valueGetter: (params) => {
        return params.node.rowIndex + 1;
      },
    },
    ...groupColumnDefs,
    {
      headerName: t(i18nKeys.VIEW_DETAIL, "상세보기"),
      width: 100,
      pinned: "right",
      sortable: false,
      filter: false,
      cellRendererFramework: DetailButtonRenderer,
      cellRendererParams: {
        detailLabel,
        onDetailClick,
      },
    },
  ];

  return {
    groupColumnDefs,
    listColumnDefs,
  };
};

/** 상세 팝업용 — 병합 없이 2단 헤더만 */
export const buildDevAreaRevDetailColumnDefs = (options) => {
  return buildDevAreaRevColumnDefs({
    ...options,
    mergeFields: [],
  }).groupColumnDefs;
};

/**
 * revList 조회 후 그리드 rowData·columnDefs 동적 구성
 */
export const buildDevAreaRevGridModel = (options) => {
  const {
    revList,
    mergeFields = DEV_AREA_REV_MERGE_FIELDS,
    ...columnOptions
  } = options;

  const rowData = buildMergedGridRows(revList, mergeFields);
  const { listColumnDefs, groupColumnDefs } = buildDevAreaRevColumnDefs({
    ...columnOptions,
    mergeFields,
  });

  return {
    rowData,
    mergeFields,
    columnDefs: listColumnDefs,
    groupColumnDefs,
  };
};
