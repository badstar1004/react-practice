/**
 * IssueGridPage.jsx
 *
 * OwnerCodeInf(WorkAreaCd, OwnerCd, UsageCd) 관리 화면
 *
 * - 조회조건: IssueSearchBox + useForm(rscOwnerCodeSearchForm)
 * - 그리드: AG Grid, 수정 모드에서 UsageCd만 CodeSelect로 편집
 * - 저장: 변경된 행만 API 전송, 저장 전 그리드 행 용도 필수 검사
 */

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useDispatch, useSelector } from "react-redux";
import { AgGridReact } from "ag-grid-react";

import {
  ISSUE_MGMT,
  fetchOwnerCodeListRequest,
  fetchCommonCodeRequest,
  saveOwnerCodeRowsRequest,
} from "store/issue/issueAction";

import Header from "components/common/Header";
import IssueSearchBox from "components/issue/IssueSearchBox";
import CodeSelectRenderer from "components/grid/CodeSelectRenderer";
import { useForm, OWNER_CODE_SEARCH_INITIAL_ITEM } from "hooks/useForm";

import "./IssueGridPage.css";

/** 수정·변경 비교 대상 컬럼 (OwnerCodeInf.UsageCd) */
const EDITABLE_FIELDS = ["usageCd"];

/** API 미연동 시 화면 테스트용 샘플 데이터 사용 여부 */
const USE_SAMPLE_DATA = true;

/** row 배열 얕은 복사 (Redux/원본과 화면 state 분리) */
const cloneRows = (rows) => {
  if (!Array.isArray(rows)) {
    return [];
  }

  return rows.map((row) => {
    return { ...row };
  });
};

/** PK 기준 row 고유 키 (workAreaCd + ownerCd) */
const getRowKey = (row) => {
  if (!row) {
    return "";
  }

  return `${row.workAreaCd}|${row.ownerCd}`;
};

/** row 배열 → { rowKey: row } Map (원본·변경 비교용) */
const createRowMap = (rows) => {
  return rows.reduce((acc, row) => {
    acc[getRowKey(row)] = row;
    return acc;
  }, {});
};

/** null/undefined/공백 정규화 */
const normalizeValue = (value) => {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).trim();
};

/** UsageCd 미설정 여부 */
const isUnsetUsageRow = (row) => {
  return normalizeValue(row && row.usageCd) === "";
};

/** 원본 대비 수정 대상 컬럼 변경 여부 */
const isEditableFieldChanged = (originRow, currentRow) => {
  if (!originRow || !currentRow) {
    return false;
  }

  return EDITABLE_FIELDS.some((field) => {
    return (
      normalizeValue(originRow[field]) !== normalizeValue(currentRow[field])
    );
  });
};

/** API 응답 옵션 → CodeSelect { code, name } 형태 */
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

const normalizeCodeOptions = (codeList, fallbackList) => {
  const list = codeList && codeList.length > 0 ? codeList : fallbackList;

  return list.map((item) => {
    return {
      code: getCodeValue(item),
      name: getCodeName(item),
    };
  });
};

/** 저장 API 요청 body 한 행 */
const toSaveRow = (row) => {
  return {
    workAreaCd: row.workAreaCd,
    ownerCd: row.ownerCd,
    usageCd: row.usageCd,
  };
};

/** API 연동 전 그리드 테스트용 샘플 (15건) */
const createSampleList = () => {
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

const IssueGridPage = () => {
  const dispatch = useDispatch();
  const { rscOwnerCodeSearchForm, setSearchFormField, resetSearchForm } =
    useForm();

  /* ----- Redux state ----- */
  const ownerCodeList = useSelector((state) => {
    return state.get(ISSUE_MGMT)?.ownerCodeList || [];
  });

  const usageCodeList = useSelector((state) => {
    return state.get(ISSUE_MGMT)?.usageCodeList || [];
  });

  const loading = useSelector((state) => {
    return state.get(ISSUE_MGMT)?.loading;
  });

  const saving = useSelector((state) => {
    return state.get(ISSUE_MGMT)?.saving;
  });

  const error = useSelector((state) => {
    return state.get(ISSUE_MGMT)?.error;
  });

  /** 용도 콤보 옵션 (API 없으면 fallback) */
  const usageOptions = useMemo(() => {
    return normalizeCodeOptions(usageCodeList, [
      { code: "DEV", name: "개발용" },
      { code: "QA", name: "테스트용" },
      { code: "OPS", name: "운영용" },
    ]);
  }, [usageCodeList]);

  /* ----- 화면 전용 state (Redux issueList와 분리) ----- */
  const [rowData, setRowData] = useState([]);
  /** { rowKey: 저장용 row } 변경 행 추적 */
  const [changedRowMap, setChangedRowMap] = useState({});
  const [isEditMode, setIsEditMode] = useState(false);

  /** 마지막 조회(검색) 시점 원본 — 취소 시 복구 */
  const originRowDataRef = useRef([]);
  const originRowMapRef = useRef({});
  const gridRef = useRef(null);

  /** 그리드·원본·수정 상태를 조회 결과 기준으로 한 번에 초기화 */
  const resetGridFromRows = useCallback((rows) => {
    const nextRows = cloneRows(rows);

    setRowData(nextRows);
    setChangedRowMap({});
    setIsEditMode(false);
    originRowDataRef.current = cloneRows(nextRows);
    originRowMapRef.current = createRowMap(nextRows);

    return nextRows;
  }, []);

  /** 목록이 없을 때 그리드 비우기 */
  const clearGrid = useCallback(() => {
    setRowData([]);
    setChangedRowMap({});
    setIsEditMode(false);
    originRowDataRef.current = [];
    originRowMapRef.current = {};
  }, []);

  /** 최초 진입: 용도 공통코드 + 목록 조회 */
  useEffect(() => {
    dispatch(
      fetchCommonCodeRequest({
        groupCodes: ["USAGE_CD"],
      }),
    );

    dispatch(fetchOwnerCodeListRequest(OWNER_CODE_SEARCH_INITIAL_ITEM));
  }, [dispatch]);

  /** API 목록 수신 → rowData·원본 ref 갱신 */
  useEffect(() => {
    const nextRows = cloneRows(ownerCodeList);

    if (nextRows.length === 0) {
      if (!USE_SAMPLE_DATA) {
        clearGrid();
      }

      return;
    }

    resetGridFromRows(nextRows);
  }, [ownerCodeList, resetGridFromRows, clearGrid]);

  /** 샘플 데이터 (USE_SAMPLE_DATA && API 빈 목록) */
  useEffect(() => {
    if (!USE_SAMPLE_DATA) {
      return;
    }

    if (ownerCodeList && ownerCodeList.length > 0) {
      return;
    }

    resetGridFromRows(createSampleList());
  }, [ownerCodeList, resetGridFromRows]);

  const changedRows = useMemo(() => {
    return Object.keys(changedRowMap).map((rowKey) => {
      return changedRowMap[rowKey];
    });
  }, [changedRowMap]);

  /**
   * AG Grid에 넘길 rowData
   * - 조회 조건은 조회 버튼 클릭 시점의 API 응답으로만 반영
   * - 화면에서는 별도 "용도없음(noUsage)" 로컬 필터링 없이 조회 결과를 그대로 표시
   */
  const displayRowData = useMemo(() => {
    return rowData;
  }, [rowData]);

  /**
   * 그리드 셀에서 용도 변경 시 호출 (CodeSelectRenderer → context)
   * setTimeout: AG Grid 렌더 중 React setState 경고 방지
   */
  const addChangedRow = useCallback((changedRow, field, value) => {
    const rowKey = getRowKey(changedRow);

    if (!rowKey) {
      return;
    }

    const originRow = originRowMapRef.current[rowKey];

    if (!originRow) {
      return;
    }

    window.setTimeout(() => {
      setChangedRowMap((prevMap) => {
        const prevChangedRow = prevMap[rowKey];

        const mergedRow = {
          ...originRow,
          ...prevChangedRow,
          ...changedRow,
          [field]: value,
        };

        const isChanged = isEditableFieldChanged(originRow, mergedRow);
        const nextMap = { ...prevMap };

        if (!isChanged) {
          delete nextMap[rowKey];
          return nextMap;
        }

        nextMap[rowKey] = toSaveRow(mergedRow);
        return nextMap;
      });

      setRowData((prevRows) => {
        return prevRows.map((row) => {
          if (getRowKey(row) !== rowKey) {
            return row;
          }

          return {
            ...row,
            [field]: value,
          };
        });
      });
    }, 0);
  }, []);

  const gridContext = useMemo(() => {
    return {
      addChangedRow: addChangedRow,
    };
  }, [addChangedRow]);

  const handleChangeSearchField = useCallback(
    (name, value) => {
      setSearchFormField(name, value);
    },
    [setSearchFormField],
  );

  const handleSearch = useCallback(() => {
    dispatch(fetchOwnerCodeListRequest(rscOwnerCodeSearchForm.item));
  }, [dispatch, rscOwnerCodeSearchForm.item]);

  const handleReset = useCallback(() => {
    resetSearchForm();
    dispatch(fetchOwnerCodeListRequest(OWNER_CODE_SEARCH_INITIAL_ITEM));
  }, [dispatch, resetSearchForm]);

  const handleEdit = useCallback(() => {
    setChangedRowMap({});
    setIsEditMode(true);
  }, []);

  /** 마지막 검색 결과(originRowDataRef)로 복구 */
  const handleCancel = useCallback(() => {
    resetGridFromRows(originRowDataRef.current);
  }, [resetGridFromRows]);

  /** rowKey로 AG Grid RowNode 탐색 */
  const findRowNodeByKey = useCallback((api, rowKey) => {
    if (!api || !rowKey) {
      return null;
    }

    let targetNode = api.getRowNode(rowKey);

    if (targetNode) {
      return targetNode;
    }

    api.forEachNode((node) => {
      if (!targetNode && node.data && getRowKey(node.data) === rowKey) {
        targetNode = node;
      }
    });

    return targetNode;
  }, []);

  /** 저장 검증 실패 시 해당 행 선택·스크롤 */
  const selectUsageRow = useCallback(
    (row) => {
      const api = gridRef.current && gridRef.current.api;

      if (!api || !row) {
        return;
      }

      const rowKey = getRowKey(row);

      window.setTimeout(() => {
        const rowNode = findRowNodeByKey(api, rowKey);

        if (!rowNode || rowNode.rowIndex === null || rowNode.rowIndex < 0) {
          return;
        }

        if (api.deselectAll) {
          api.deselectAll();
        }

        if (rowNode.setSelected) {
          rowNode.setSelected(true);
        }

        api.ensureIndexVisible(rowNode.rowIndex, "middle");
      }, 200);
    },
    [findRowNodeByKey],
  );

  /**
   * 저장 전 검증: 그리드(수정 모드면 displayRowData) 행 중 UsageCd 미선택 확인
   */
  const validateUsageOnSave = useCallback(() => {
    const rowsToValidate = isEditMode ? displayRowData : rowData;

    const rowWithoutUsage = rowsToValidate.find((row) => {
      return isUnsetUsageRow(row);
    });

    if (!rowWithoutUsage) {
      return true;
    }

    alert(
      `용도가 선택되지 않은 데이터가 있습니다. (owner code: ${rowWithoutUsage.ownerCd})`,
    );
    selectUsageRow(rowWithoutUsage);

    return false;
  }, [isEditMode, displayRowData, rowData, selectUsageRow]);

  const handleSave = useCallback(() => {
    if (!validateUsageOnSave()) {
      return;
    }

    if (changedRows.length === 0) {
      return;
    }

    dispatch(saveOwnerCodeRowsRequest(changedRows));
  }, [changedRows, dispatch, validateUsageOnSave]);

  const prevSavingRef = useRef(false);

  /** 저장 완료 후 수정 모드 종료 */
  useEffect(() => {
    if (prevSavingRef.current && !saving && !error) {
      setIsEditMode(false);
      setChangedRowMap({});
      alert("저장되었습니다.");
    }

    prevSavingRef.current = saving;
  }, [saving, error]);

  /** 수정 모드 전환 시 용도 컬럼 셀 리프레시 (조회↔편집 UI) */
  useEffect(() => {
    const api = gridRef.current && gridRef.current.api;

    if (!api) {
      return;
    }

    window.setTimeout(() => {
      api.refreshCells({
        force: true,
        columns: ["usageCd"],
      });
    }, 0);
  }, [isEditMode]);

  const getEditableCellClass = useCallback(() => {
    return isEditMode ? "editable-cell grid-cell-center" : "grid-cell-center";
  }, [isEditMode]);

  const columnDefs = useMemo(() => {
    return [
      {
        headerName: "owner code",
        field: "ownerCd",
        width: 160,
        editable: false,
        cellClass: "grid-cell-center",
      },
      {
        headerName: "용도",
        field: "usageCd",
        width: 200,
        editable: false,
        cellRendererFramework: CodeSelectRenderer,
        cellRendererParams: {
          options: usageOptions,
          editable: isEditMode,
          placeholder: "용도를(을) 선택하세요",
          field: "usageCd",
        },
        cellClass: getEditableCellClass(),
        /* 조회 모드 표시는 CodeSelectRenderer에서 처리 (valueFormatter 중복 제거) */
      },
    ];
  }, [isEditMode, usageOptions, getEditableCellClass]);

  const defaultColDef = useMemo(() => {
    return {
      resizable: true,
      sortable: true,
      filter: true,
    };
  }, []);

  const headerButtons = useMemo(() => {
    return (
      <>
        {!isEditMode && (
          <button
            type="button"
            className="btn btn-orange"
            disabled={loading || displayRowData.length === 0}
            onClick={handleEdit}
          >
            수정
          </button>
        )}

        {isEditMode && (
          <>
            <span className="changed-count">변경 {changedRows.length}건</span>

            <button
              type="button"
              className="btn btn-green"
              disabled={saving}
              onClick={handleSave}
            >
              저장
            </button>

            <button
              type="button"
              className="btn btn-gray"
              disabled={saving}
              onClick={handleCancel}
            >
              취소
            </button>
          </>
        )}
      </>
    );
  }, [
    isEditMode,
    loading,
    saving,
    displayRowData.length,
    changedRows.length,
    handleEdit,
    handleSave,
    handleCancel,
  ]);

  return (
    <div className="page owner-code-page">
      <IssueSearchBox
        rscOwnerCodeSearchForm={rscOwnerCodeSearchForm}
        usageOptions={usageOptions}
        onChangeSearchField={handleChangeSearchField}
        onReset={handleReset}
        onSearch={handleSearch}
        disabled={loading || isEditMode}
      />

      {error ? (
        <div className="error-box">
          {error.message ? error.message : "알 수 없는 에러가 발생했습니다."}
        </div>
      ) : null}

      <Header
        title="그리드"
        count={displayRowData.length}
        buttons={headerButtons}
      >
        <div className="ag-theme-balham issue-grid">
          <AgGridReact
            ref={gridRef}
            rowData={displayRowData}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            context={gridContext}
            immutableData={true}
            rowSelection="single"
            suppressRowClickSelection={true}
            getRowNodeId={(data) => {
              return getRowKey(data);
            }}
          />
        </div>
      </Header>
    </div>
  );
};

export default IssueGridPage;
