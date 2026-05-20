/**
 * IssueGridPage.jsx
 *
 * OwnerCodeInf(WorkAreaCd, OwnerCd, UsageCd) 관리 화면
 */

import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { AgGridReact } from "ag-grid-react";

import {
  ISSUE_MGMT,
  fetchOwnerCodeListRequest,
  saveOwnerCodeRowsRequest,
} from "store/issue/issueAction";
import {
  COMMON_CODE_MGMT,
  fetchCommonCodeRequest,
} from "store/commonCode/commonCodeAction";

import Header from "components/common/Header";
import PageNotice from "components/common/PageNotice";
import FormItem from "components/common/FormItem";
import CodeSelect from "components/common/CodeSelect";
import {
  AG_GRID_DEFAULT_COL_DEF,
  cloneRows,
  createSampleList,
  findRowInList,
  isEditableFieldChanged,
  isSameRow,
  isUnsetUsageCd,
  normalizeCodeOptions,
  normalizeOwnerCdInput,
  toSaveRow,
  USE_SAMPLE_DATA,
} from "utils/ownerCode";
import { I18N_KEYS } from "i18n/keys";
import { tSelectPlaceholderByLabelKey } from "i18n/helpers";

import "./IssueGridPage.css";

/* ----- 조회조건 초기값 ----- */

const OWNER_CODE_SEARCH_INITIAL_ITEM = {
  ownerCd: "",
  usageCd: "",
  noUsage: false,
};

const IssueGridPage = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const issueState = useSelector((state) => {
    return state.get(ISSUE_MGMT) || {};
  });

  const commonCodeState = useSelector((state) => {
    return state.get(COMMON_CODE_MGMT) || {};
  });

  const ownerCodeList = issueState.ownerCodeList || [];
  const listLoading = Boolean(issueState.listLoading);
  const saving = Boolean(issueState.saving);
  const issueError = issueState.error || null;
  const commonCodeError = commonCodeState.error || null;

  /* ----- 조회조건 form ----- */
  const [searchForm, setSearchForm] = useState({
    item: { ...OWNER_CODE_SEARCH_INITIAL_ITEM },
    initialItem: { ...OWNER_CODE_SEARCH_INITIAL_ITEM },
  });

  const setSearchFormField = useCallback((name, value) => {
    const nextValue =
      name === "ownerCd" ? normalizeOwnerCdInput(value) : value;

    setSearchForm((prev) => {
      return {
        ...prev,
        item: {
          ...prev.item,
          [name]: nextValue,
        },
      };
    });
  }, []);

  const resetSearchForm = useCallback(() => {
    setSearchForm((prev) => {
      return {
        ...prev,
        item: { ...prev.initialItem },
      };
    });
  }, []);

  const usageFallback = useMemo(() => {
    return [
      { code: "DEV", name: t(I18N_KEYS.USAGE_DEV, "개발용") },
      { code: "QA", name: t(I18N_KEYS.USAGE_QA, "테스트용") },
      { code: "OPS", name: t(I18N_KEYS.USAGE_OPS, "운영용") },
    ];
  }, [t]);

  const usageOptions = useMemo(() => {
    return normalizeCodeOptions(
      commonCodeState.usageCodeList,
      usageFallback,
    );
  }, [commonCodeState.usageCodeList, usageFallback]);

  const usageSelectPlaceholder = useMemo(() => {
    return tSelectPlaceholderByLabelKey(t, I18N_KEYS.USAGE, "용도");
  }, [t]);

  /* ----- 그리드 state ----- */
  const [rowData, setRowData] = useState([]);
  const [changedRowMap, setChangedRowMap] = useState({});
  const [isEditMode, setIsEditMode] = useState(false);
  const [notice, setNotice] = useState(null);

  const originRowDataRef = useRef([]);
  const gridRef = useRef(null);
  const prevSavingRef = useRef(false);

  const clearNotice = useCallback(() => {
    setNotice(null);
  }, []);

  const resetGridFromRows = useCallback((rows) => {
    const nextRows = cloneRows(rows);

    setRowData(nextRows);
    setChangedRowMap({});
    setIsEditMode(false);
    originRowDataRef.current = cloneRows(nextRows);

    return nextRows;
  }, []);

  const clearGrid = useCallback(() => {
    setRowData([]);
    setChangedRowMap({});
    setIsEditMode(false);
    originRowDataRef.current = [];
  }, []);

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

    if (nextRows.length > 0) {
      resetGridFromRows(nextRows);
      return;
    }

    if (USE_SAMPLE_DATA) {
      resetGridFromRows(createSampleList());
      return;
    }

    clearGrid();
  }, [ownerCodeList, resetGridFromRows, clearGrid]);

  const changedRows = useMemo(() => {
    return Object.values(changedRowMap);
  }, [changedRowMap]);

  const addChangedRow = useCallback((changedRow, field, value) => {
    const ownerCd = changedRow && changedRow.ownerCd;

    if (!ownerCd) {
      return;
    }

    const originRow = findRowInList(originRowDataRef.current, changedRow);

    if (!originRow) {
      return;
    }

    window.setTimeout(() => {
      setChangedRowMap((prevMap) => {
        const prevChangedRow = prevMap[ownerCd];

        const mergedRow = {
          ...originRow,
          ...prevChangedRow,
          ...changedRow,
          [field]: value,
        };

        const isChanged = isEditableFieldChanged(originRow, mergedRow);
        const nextMap = { ...prevMap };

        if (!isChanged) {
          delete nextMap[ownerCd];
          return nextMap;
        }

        nextMap[ownerCd] = toSaveRow(mergedRow);
        return nextMap;
      });

      setRowData((prevRows) => {
        return prevRows.map((row) => {
          if (!isSameRow(row, changedRow)) {
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

  const selectGridRowNode = useCallback((rowNode) => {
    const api = gridRef.current && gridRef.current.api;

    if (!api || !rowNode) {
      return;
    }

    window.setTimeout(() => {
      if (rowNode.rowIndex === null || rowNode.rowIndex < 0) {
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
  }, []);

  const validateUsageOnSave = useCallback(() => {
    const api = gridRef.current && gridRef.current.api;

    if (!api) {
      return true;
    }

    let invalidNode = null;

    api.forEachNode((node) => {
      if (invalidNode || !node.data) {
        return;
      }

      if (isUnsetUsageCd(node.data.usageCd)) {
        invalidNode = node;
      }
    });

    if (!invalidNode) {
      return true;
    }

    setNotice({
      type: "error",
      message: t(
        I18N_KEYS.USAGE_REQUIRED,
        "용도가 선택되지 않은 데이터가 있습니다. (owner code: {{ownerCd}})",
        { ownerCd: invalidNode.data.ownerCd },
      ),
    });
    selectGridRowNode(invalidNode);

    return false;
  }, [selectGridRowNode, t]);

  const handleEdit = useCallback(() => {
    clearNotice();
    setChangedRowMap({});
    setIsEditMode(true);
  }, [clearNotice]);

  const handleCancel = useCallback(() => {
    clearNotice();
    setChangedRowMap({});
    setIsEditMode(false);
    dispatch(fetchOwnerCodeListRequest(searchForm.item));
  }, [clearNotice, dispatch, searchForm.item]);

  const handleSave = useCallback(() => {
    clearNotice();

    if (!validateUsageOnSave()) {
      return;
    }

    if (changedRows.length === 0) {
      return;
    }

    dispatch(saveOwnerCodeRowsRequest(changedRows));
  }, [changedRows, clearNotice, dispatch, validateUsageOnSave]);

  useEffect(() => {
    if (prevSavingRef.current && !saving && !issueError) {
      setIsEditMode(false);
      setChangedRowMap({});
      setNotice({
        type: "success",
        message: t(I18N_KEYS.SAVE_SUCCESS, "저장되었습니다."),
      });
    }

    prevSavingRef.current = saving;
  }, [saving, issueError, t]);

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

  const searchFormDisabled = listLoading || isEditMode;

  const handleSearchFormSubmit = (event) => {
    event.preventDefault();
    clearNotice();
    dispatch(fetchOwnerCodeListRequest(searchForm.item));
  };

  const handleUsageSearchChange = (value) => {
    setSearchFormField("usageCd", value);
  };

  const handleReset = () => {
    clearNotice();
    resetSearchForm();
    dispatch(fetchOwnerCodeListRequest(OWNER_CODE_SEARCH_INITIAL_ITEM));
  };

  /** AG Grid 용도 컬럼 셀 렌더러 (페이지 내부, 참조 고정) */
  const CodeSelectRenderer = useMemo(() => {
    const toStringValue = (cellValue) => {
      if (cellValue === null || cellValue === undefined) {
        return "";
      }

      return String(cellValue);
    };

    const findCodeName = (options, cellValue) => {
      const list = options || [];
      const found = list.find((item) => {
        return toStringValue(item.code) === toStringValue(cellValue);
      });

      return found ? found.name : toStringValue(cellValue);
    };

    return forwardRef(function CodeSelectRenderer(props, ref) {
      const [value, setValue] = useState(props.value || "");

      useImperativeHandle(ref, () => {
        return {
          refresh(params) {
            setValue(params.value || "");
            return true;
          },
        };
      });

      useEffect(() => {
        setValue(props.value || "");
      }, [props.value]);

      const handleMouseDown = useCallback((event) => {
        event.stopPropagation();
      }, []);

      const handleClick = useCallback((event) => {
        event.stopPropagation();
      }, []);

      const handleChange = useCallback(
        (nextValue, event) => {
          if (event) {
            event.stopPropagation();
          }

          const field = props.field || props.colDef.field;

          setValue(nextValue);

          const updatedRow = Object.assign({}, props.node.data);
          updatedRow[field] = nextValue;

          props.node.setDataValue(field, nextValue);

          if (props.onUsageChange) {
            window.setTimeout(() => {
              props.onUsageChange(updatedRow, field, nextValue);
            }, 0);
          }
        },
        [props],
      );

      const options = props.options || [];
      const editable = props.editable === true;

      if (!editable) {
        return <span>{findCodeName(options, value)}</span>;
      }

      return (
        <div onMouseDown={handleMouseDown} onClick={handleClick}>
          <CodeSelect
            value={value}
            options={options}
            placeholder={
              props.placeholder || props.selectDefaultLabel || "선택하세요."
            }
            onChange={handleChange}
            className="grid-select"
          />
        </div>
      );
    });
  }, []);

  const columnDefs = useMemo(() => {
    return [
      {
        headerName: t(I18N_KEYS.OWNER_CODE, "owner code"),
        field: "ownerCd",
        width: 160,
        editable: false,
      },
      {
        headerName: t(I18N_KEYS.USAGE, "용도"),
        field: "usageCd",
        width: 200,
        editable: false,
        cellRendererFramework: CodeSelectRenderer,
        cellRendererParams: {
          options: usageOptions,
          editable: isEditMode,
          placeholder: usageSelectPlaceholder,
          selectDefaultLabel: t(I18N_KEYS.SELECT_DEFAULT, "선택하세요."),
          field: "usageCd",
          onUsageChange: addChangedRow,
        },
        cellClass: isEditMode
          ? "editable-cell grid-cell-center"
          : "grid-cell-center",
      },
    ];
  }, [
    isEditMode,
    usageOptions,
    addChangedRow,
    usageSelectPlaceholder,
    t,
    CodeSelectRenderer,
  ]);

  const apiError = issueError || commonCodeError;

  const headerButtons = (
    <>
      {!isEditMode && (
        <button
          type="button"
          className="btn btn-orange"
          disabled={listLoading || rowData.length === 0}
          onClick={handleEdit}
        >
          {t(I18N_KEYS.EDIT, "수정")}
        </button>
      )}

      {isEditMode && (
        <>
          <span className="changed-count">
            {t(I18N_KEYS.CHANGED_COUNT, "변경 {{count}}건", {
              count: changedRows.length,
            })}
          </span>

          <button
            type="button"
            className="btn btn-green"
            disabled={saving}
            onClick={handleSave}
          >
            {t(I18N_KEYS.SAVE, "저장")}
          </button>

          <button
            type="button"
            className="btn btn-gray"
            disabled={saving}
            onClick={handleCancel}
          >
            {t(I18N_KEYS.CANCEL, "취소")}
          </button>
        </>
      )}
    </>
  );

  const { item: searchItem } = searchForm;

  return (
    <div className="page owner-code-page">
      <section className="issue-search-box">
        <div className="issue-search-box__title">
          {t(I18N_KEYS.SEARCH_CONDITION, "조회조건")}
        </div>

        <form
          className="issue-search-box__form"
          onSubmit={handleSearchFormSubmit}
        >
          <div className="issue-search-box__row">
            <FormItem
              label={t(I18N_KEYS.OWNER_CODE, "owner code")}
              name="ownerCd"
              value={searchItem.ownerCd}
              onChange={setSearchFormField}
              disabled={searchFormDisabled}
            >
              <input
                type="text"
                className="search-field__control"
                placeholder={t(
                  I18N_KEYS.OWNER_CODE_PLACEHOLDER,
                  "owner code (영문·숫자)",
                )}
              />
            </FormItem>

            <div className="search-field">
              <label className="search-field__label" htmlFor="usageCd">
                {t(I18N_KEYS.USAGE, "용도")}
              </label>
              <CodeSelect
                name="usageCd"
                value={searchItem.usageCd}
                options={usageOptions}
                placeholder={usageSelectPlaceholder}
                onChange={handleUsageSearchChange}
                disabled={searchFormDisabled}
                className="search-field__control search-field__control--select"
              />
            </div>

            <FormItem
              label={t(I18N_KEYS.NO_USAGE, "용도없음")}
              name="noUsage"
              value={searchItem.noUsage}
              onChange={setSearchFormField}
              disabled={searchFormDisabled}
              className="search-field search-field--checkbox"
            >
              <input type="checkbox" />
            </FormItem>

            <div className="issue-search-box__buttons">
              <button
                type="button"
                className="btn btn-gray"
                onClick={handleReset}
                disabled={searchFormDisabled}
              >
                {t(I18N_KEYS.RESET, "초기화")}
              </button>

              <button
                type="submit"
                className="btn btn-blue"
                disabled={searchFormDisabled}
              >
                {t(I18N_KEYS.SEARCH, "검색")}
              </button>
            </div>
          </div>
        </form>
      </section>

      <PageNotice notice={notice} onDismiss={clearNotice} />

      {apiError ? (
        <div className="error-box">
          {apiError.message
            ? apiError.message
            : t(I18N_KEYS.UNKNOWN_ERROR, "알 수 없는 에러가 발생했습니다.")}
        </div>
      ) : null}

      <Header
        title={t(I18N_KEYS.GRID_TITLE, "그리드")}
        count={rowData.length}
        buttons={headerButtons}
      >
        <div className="ag-theme-balham issue-grid">
          <AgGridReact
            ref={gridRef}
            rowData={rowData}
            columnDefs={columnDefs}
            defaultColDef={AG_GRID_DEFAULT_COL_DEF}
            rowSelection="single"
            suppressRowClickSelection={true}
          />
        </div>
      </Header>
    </div>
  );
};

export default IssueGridPage;
