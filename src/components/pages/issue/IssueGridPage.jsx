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

/** OwnerCodeInf 수정 대상 컬럼 */
const EDITABLE_FIELDS = ["usageCd"];

/** API 연동 전 샘플 데이터 사용 여부 */
const USE_SAMPLE_DATA = true;

const cloneRows = (rows) => {
  if (!Array.isArray(rows)) {
    return [];
  }

  return rows.map((row) => {
    return { ...row };
  });
};

const getRowKey = (row) => {
  if (!row) {
    return "";
  }

  return `${row.workAreaCd}|${row.ownerCd}`;
};

const createRowMap = (rows) => {
  return rows.reduce((acc, row) => {
    acc[getRowKey(row)] = row;
    return acc;
  }, {});
};

const normalizeValue = (value) => {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).trim();
};

const toStringValue = (value) => {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value);
};

const isUnsetUsageRow = (row) => {
  return normalizeValue(row && row.usageCd) === "";
};

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

const findCodeName = (codeList, value) => {
  if (!codeList || codeList.length === 0) {
    return value || "-";
  }

  const found = codeList.find((item) => {
    return toStringValue(item.code) === toStringValue(value);
  });

  return found ? found.name : value || "-";
};

const toSaveRow = (row) => {
  return {
    workAreaCd: row.workAreaCd,
    ownerCd: row.ownerCd,
    usageCd: row.usageCd,
  };
};

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

  const usageOptions = useMemo(() => {
    return normalizeCodeOptions(usageCodeList, [
      { code: "DEV", name: "개발용" },
      { code: "QA", name: "테스트용" },
      { code: "OPS", name: "운영용" },
    ]);
  }, [usageCodeList]);

  const [rowData, setRowData] = useState([]);
  const [changedRowMap, setChangedRowMap] = useState({});
  const [isEditMode, setIsEditMode] = useState(false);
  /** 용도없음 체크 상태에서 수정 진입 시, 화면에 고정할 row key 목록 */
  const [editSnapshotRowKeys, setEditSnapshotRowKeys] = useState(null);

  const originRowDataRef = useRef([]);
  const originRowMapRef = useRef({});
  const gridApiRef = useRef(null);

  useEffect(() => {
    dispatch(
      fetchCommonCodeRequest({
        groupCodes: ["USAGE_CD"],
      }),
    );

    dispatch(fetchOwnerCodeListRequest(OWNER_CODE_SEARCH_INITIAL_ITEM));
  }, [dispatch]);

  useEffect(() => {
    const nextRows = cloneRows(ownerCodeList);

    if (nextRows.length === 0) {
      if (!USE_SAMPLE_DATA) {
        setRowData([]);
        setChangedRowMap({});
        setIsEditMode(false);
        originRowDataRef.current = [];
        originRowMapRef.current = {};
      }

      return;
    }

    setRowData(nextRows);
    setChangedRowMap({});
    setIsEditMode(false);
    setEditSnapshotRowKeys(null);
    originRowDataRef.current = cloneRows(nextRows);
    originRowMapRef.current = createRowMap(nextRows);
  }, [ownerCodeList]);

  useEffect(() => {
    if (!USE_SAMPLE_DATA) {
      return;
    }

    if (ownerCodeList && ownerCodeList.length > 0) {
      return;
    }

    const sampleList = createSampleList();

    setRowData(sampleList);
    setChangedRowMap({});
    setIsEditMode(false);
    setEditSnapshotRowKeys(null);
    originRowDataRef.current = cloneRows(sampleList);
    originRowMapRef.current = createRowMap(sampleList);
  }, [ownerCodeList]);

  const changedRows = useMemo(() => {
    return Object.keys(changedRowMap).map((rowKey) => {
      return changedRowMap[rowKey];
    });
  }, [changedRowMap]);

  const displayRowData = useMemo(() => {
    if (isEditMode && editSnapshotRowKeys && editSnapshotRowKeys.length > 0) {
      const keySet = {};

      editSnapshotRowKeys.forEach((rowKey) => {
        keySet[rowKey] = true;
      });

      return rowData.filter((row) => {
        return keySet[getRowKey(row)];
      });
    }

    if (!rscOwnerCodeSearchForm.item.noUsage) {
      return rowData;
    }

    return rowData.filter((row) => {
      return isUnsetUsageRow(row);
    });
  }, [
    rowData,
    rscOwnerCodeSearchForm.item.noUsage,
    isEditMode,
    editSnapshotRowKeys,
  ]);

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

  const handleGridReady = useCallback((params) => {
    gridApiRef.current = params.api;
  }, []);

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
    if (rscOwnerCodeSearchForm.item.noUsage) {
      const snapshotKeys = rowData
        .filter((row) => {
          return isUnsetUsageRow(row);
        })
        .map((row) => {
          return getRowKey(row);
        });

      setEditSnapshotRowKeys(snapshotKeys);
    } else {
      setEditSnapshotRowKeys(null);
    }

    setChangedRowMap({});
    setIsEditMode(true);
  }, [rowData, rscOwnerCodeSearchForm.item.noUsage]);

  const handleCancel = useCallback(() => {
    const originRows = cloneRows(originRowDataRef.current);

    setRowData(originRows);
    setChangedRowMap({});
    setEditSnapshotRowKeys(null);
    setIsEditMode(false);
  }, []);

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

  const selectUsageRow = useCallback(
    (row) => {
      const api = gridApiRef.current;

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

  useEffect(() => {
    if (prevSavingRef.current && !saving && !error) {
      setIsEditMode(false);
      setChangedRowMap({});
      setEditSnapshotRowKeys(null);
      alert("저장되었습니다.");
    }

    prevSavingRef.current = saving;
  }, [saving, error]);

  useEffect(() => {
    const api = gridApiRef.current;

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
        valueFormatter: (params) => {
          return findCodeName(usageOptions, params.value);
        },
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
            rowData={displayRowData}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            context={gridContext}
            onGridReady={handleGridReady}
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
