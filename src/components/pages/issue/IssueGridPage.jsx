/**
 * IssueGridPage.jsx
 *
 * OwnerCodeInf(WorkAreaCd, OwnerCd, UsageCd) 관리 화면
 */

import React, {
  forwardRef,
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
import Form from "components/common/Form";
import Row from "components/common/Row";
import Col from "components/common/Col";
import FormItem from "components/common/FormItem";
import {
  AG_GRID_DEFAULT_COL_DEF,
  cloneRows,
  isUnsetUsageCd,
  normalizeCodeOptions,
  toSaveRow,
} from "utils/ownerCode";
import { I18N_KEYS } from "i18n/keys";
import { tSelectPlaceholderByLabelKey } from "i18n/helpers";

import "./IssueGridPage.css";

/** 조회조건 초기값 — 폼·검색·초기화 시 공통으로 사용 */
const initSearchCondition = {
  ownerCd: "",
  usageCd: "",
  noUsage: false,
};

/**
 * 용도 코드값을 공통코드 목록에서 찾아 표시명으로 변환
 * 매칭되지 않으면 원본 코드값을 그대로 반환
 */
const findUsageCodeName = (options, cellValue) => {
  const value = cellValue === null || cellValue === undefined ? "" : String(cellValue);
  const list = options || [];
  const found = list.find((item) => {
    return String(item.code) === value;
  });

  return found ? found.name : value;
};

/**
 * 그리드 용도(usageCd) 컬럼 셀 렌더러
 * - 수정 모드: select 드롭다운
 * - 조회 모드: 코드명 텍스트 표시
 */
const CodeSelectRenderer = forwardRef(function CodeSelectRenderer(props, ref) {
  // ag-Grid가 셀 갱신 시 refresh()를 호출할 수 있도록 노출
  useImperativeHandle(ref, () => {
    return {
      refresh() {
        return true;
      },
    };
  });

  const field = props.field || props.colDef.field;
  const options = props.options || [];
  const editable = props.editable === true;
  const value = props.value || "";

  // 수정 가능 셀은 배경색으로 구분
  const cellWrapStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: "100%",
    boxSizing: "border-box",
    textAlign: "center",
    ...(editable ? { backgroundColor: "#fff4cc" } : {}),
  };

  return (
    <div style={cellWrapStyle}>
      {editable ? (
        <select
          value={value}
          className="grid-select"
          onChange={(event) => {
            const nextValue = event.target.value;

            // ag-Grid 행 데이터에 선택값 반영
            props.node.setDataValue(field, nextValue);

            // 변경된 행을 저장 대상(changedRowMap)에 등록
            if (props.onUsageChange && props.node.data) {
              props.onUsageChange(props.node.data);
            }
          }}
        >
          <option value="">
            {props.placeholder || props.selectDefaultLabel || "선택하세요."}
          </option>

          {options.map((item) => {
            return (
              <option key={item.code} value={item.code}>
                {item.name}
              </option>
            );
          })}
        </select>
      ) : (
        findUsageCodeName(options, value)
      )}
    </div>
  );
});

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

  /** 조회조건 Form 입력값 — 검색 전까지는 그리드 조회에 반영되지 않음 */
  const [formValues, setFormValues] = useState({ ...initSearchCondition });
  /** 검색 버튼으로 확정된 조회조건 — 저장·취소 후 재조회 기준 */
  const [searchConditions, setSearchConditions] = useState({
    ...initSearchCondition,
  });
  /** ag-Grid에 표시할 Owner Code 행 목록 */
  const [rowData, setRowData] = useState([]);
  /** 저장 대상 변경 행 — key: ownerCd */
  const [changedRowMap, setChangedRowMap] = useState({});
  /** true이면 그리드 용도 셀 편집 가능 */
  const [isEditMode, setIsEditMode] = useState(false);
  const [notice, setNotice] = useState(null);

  const gridRef = useRef(null);

  const usageOptions = normalizeCodeOptions(commonCodeState.usageCodeList);
  const usageSelectPlaceholder = tSelectPlaceholderByLabelKey(
    t,
    I18N_KEYS.USAGE,
    "용도",
  );
  const changedRows = Object.values(changedRowMap);
  const searchConditionDisabled = listLoading || isEditMode;
  const apiError = issueError || commonCodeError;

  // 최초 진입: 용도 공통코드 + Owner Code 목록 조회
  useEffect(() => {
    dispatch(
      fetchCommonCodeRequest({
        groupCodes: ["USAGE_CD"],
      }),
    );
    dispatch(fetchOwnerCodeListRequest(initSearchCondition));
  }, [dispatch]);

  // API 조회 결과 반영 — 그리드 데이터 갱신 및 편집 상태 초기화
  useEffect(() => {
    const nextRows = cloneRows(ownerCodeList);

    setRowData(nextRows.length > 0 ? nextRows : []);
    setChangedRowMap({});
    setIsEditMode(false);
  }, [ownerCodeList]);

  // 저장 API 실패 시 낙관적 성공 알림 제거
  useEffect(() => {
    if (!issueError) {
      return;
    }

    setNotice((prev) => {
      if (prev && prev.type === "success") {
        return null;
      }

      return prev;
    });
  }, [issueError]);

  // 수정 모드 전환 시 용도 컬럼 셀(select/텍스트) 재렌더
  useEffect(() => {
    const api = gridRef.current && gridRef.current.api;

    if (!api) {
      return;
    }

    api.refreshCells({
      force: true,
      columns: ["usageCd"],
    });
  }, [isEditMode]);

  /**
   * 조회조건 Form 필드 변경 핸들러
   * @param {Object} _changeValue - 변경된 필드 { name, value }
   * @param {Object} allValue - 변경 반영된 전체 폼 값
   */
  function handleFormValueChange(_changeValue, allValue) {
    setFormValues(allValue);
  }

  /**
   * 검색 버튼 — 입력값을 조회조건으로 확정 후 목록 API 호출
   */
  function handleSearchFormSubmit() {
    setNotice(null);
    const nextSearchConditions = { ...formValues };
    setSearchConditions(nextSearchConditions);
    dispatch(fetchOwnerCodeListRequest(nextSearchConditions));
  }

  /**
   * 초기화 — 조회조건·폼을 초기값으로 되돌리고 목록 재조회
   */
  function handleReset() {
    setNotice(null);
    setFormValues({ ...initSearchCondition });
    setSearchConditions({ ...initSearchCondition });
    dispatch(fetchOwnerCodeListRequest(initSearchCondition));
  }

  /**
   * 수정 모드 진입 — 그리드 용도 셀을 select로 편집 가능하게 전환
   */
  function handleEdit() {
    setNotice(null);
    setChangedRowMap({});
    setIsEditMode(true);
  }

  /**
   * 저장 — 용도 미선택 행 검증 후 변경분 API 저장
   * 저장 성공 후 재조회는 issueSaga에서 처리
   */
  function handleSave() {
    setNotice(null);

    const api = gridRef.current && gridRef.current.api;
    let invalidNode = null;

    // 그리드 전체 행 중 용도가 비어 있는 첫 행 탐색
    if (api) {
      api.forEachNode((node) => {
        if (invalidNode || !node.data) {
          return;
        }

        if (isUnsetUsageCd(node.data.usageCd)) {
          invalidNode = node;
        }
      });
    }

    if (invalidNode) {
      setNotice({
        type: "error",
        message: t(
          I18N_KEYS.USAGE_REQUIRED,
          "용도가 선택되지 않은 데이터가 있습니다. (owner code: {{ownerCd}})",
          { ownerCd: invalidNode.data.ownerCd },
        ),
      });

      // 오류 행을 선택·스크롤하여 사용자에게 위치 안내
      if (api && invalidNode.rowIndex !== null && invalidNode.rowIndex >= 0) {
        if (api.deselectAll) {
          api.deselectAll();
        }

        if (invalidNode.setSelected) {
          invalidNode.setSelected(true);
        }

        api.ensureIndexVisible(invalidNode.rowIndex, "middle");
      }

      return;
    }

    if (changedRows.length === 0) {
      return;
    }

    dispatch(
      saveOwnerCodeRowsRequest({
        changedRows,
        searchConditions,
      }),
    );
    setNotice({
      type: "success",
      message: t(I18N_KEYS.SAVE_SUCCESS, "저장되었습니다."),
    });
  }

  /**
   * 취소 — 편집 내용 버리고 마지막 검색 조건으로 목록 재조회
   */
  function handleCancel() {
    setNotice(null);
    setChangedRowMap({});
    setIsEditMode(false);
    dispatch(fetchOwnerCodeListRequest(searchConditions));
  }

  /** PageNotice 닫기 */
  function handleDismissNotice() {
    setNotice(null);
  }

  /**
   * 그리드 용도 셀 변경 시 호출 — ownerCd 기준으로 저장 대상 행 누적
   * @param {Object} row - 변경된 ag-Grid 행 데이터
   */
  function handleUsageChange(row) {
    const ownerCd = row && row.ownerCd;

    if (!ownerCd) {
      return;
    }

    setChangedRowMap((prevMap) => {
      return {
        ...prevMap,
        [ownerCd]: toSaveRow(row),
      };
    });
  }

  /**
   * ag-Grid columnDefs — useMemo로 참조 안정화
   *
   * columnDefs가 매 렌더마다 새 배열이 되면 ag-Grid가 컬럼을 불필요하게
   * 재구성할 수 있어, 실제로 columnDefs 내용에 영향을 주는 값만 deps에 넣습니다.
   *
   * deps
   * - t: headerName·selectDefaultLabel 등 i18n 문구
   * - usageOptions: 용도 셀 select 옵션(공통코드 로드 후 갱신)
   * - usageSelectPlaceholder: 용도 placeholder 문구
   * - isEditMode: cellRendererParams.editable — 수정/조회 모드 전환
   *
   * handleUsageChange는 deps에 넣지 않음
   * - setChangedRowMap만 사용하므로 렌더마다 함수 참조가 바뀌어도 동작 동일
   * - deps에 넣으면 매 렌더 memo가 무효화되어 useMemo 효과가 없어짐
   */
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
          onUsageChange: handleUsageChange,
        },
      },
    ];
  }, [t, usageOptions, usageSelectPlaceholder, isEditMode]);

  return (
    <div className="page owner-code-page">
      <section className="issue-search-box">
        <div className="issue-search-box__title">
          {t(I18N_KEYS.SEARCH_CONDITION, "조회조건")}
        </div>

        <Form
          className="issue-search-box__form"
          values={formValues}
          onValueChange={handleFormValueChange}
          onSubmit={handleSearchFormSubmit}
          disabled={searchConditionDisabled}
        >
          <Row>
            <Col span={6}>
              <FormItem
                label={t(I18N_KEYS.OWNER_CODE, "owner code")}
                name="ownerCd"
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
            </Col>

            <Col span={6}>
              <FormItem label={t(I18N_KEYS.USAGE, "용도")} name="usageCd">
                <select className="search-field__control search-field__control--select">
                  <option value="">{usageSelectPlaceholder}</option>

                  {usageOptions.map((item) => {
                    return (
                      <option key={item.code} value={item.code}>
                        {item.name}
                      </option>
                    );
                  })}
                </select>
              </FormItem>
            </Col>

            <Col span={6}>
              <FormItem
                label={t(I18N_KEYS.NO_USAGE, "용도없음")}
                name="noUsage"
                className="search-field search-field--checkbox"
              >
                <input type="checkbox" />
              </FormItem>
            </Col>

            <Col span={6}>
              <div className="issue-search-box__buttons">
                <button
                  type="button"
                  className="btn btn-gray"
                  disabled={searchConditionDisabled}
                  onClick={handleReset}
                >
                  {t(I18N_KEYS.RESET, "초기화")}
                </button>

                <button
                  type="submit"
                  className="btn btn-blue"
                  disabled={searchConditionDisabled}
                >
                  {t(I18N_KEYS.SEARCH, "검색")}
                </button>
              </div>
            </Col>
          </Row>
        </Form>
      </section>

      <PageNotice notice={notice} onDismiss={handleDismissNotice} />

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
        buttons={
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
        }
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
