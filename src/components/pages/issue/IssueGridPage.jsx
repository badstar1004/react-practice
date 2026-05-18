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
  fetchIssueListRequest,
  fetchCommonCodeRequest,
} from "store/issue/issueAction";

import Header from "components/common/Header";
import IssueSearchBox from "components/issue/IssueSearchBox";
import CodeSelect from "components/common/CodeSelect";

import "./IssueGridPage.css";

const EDITABLE_FIELDS = ["statusCode", "priorityCode"];
const USAGE_FIELD_NAMES = ["usageCode", "usageCd"];

/**
 * API 연결 전 샘플 데이터를 사용할지 여부입니다.
 * 실제 API 연결 후에는 false로 변경하거나 샘플 관련 코드를 제거하세요.
 */
const USE_SAMPLE_DATA = true;

const initialSearchCondition = {
  statusCode: "",
  priorityCode: "",
  keyword: "",
  startDate: "",
  endDate: "",
};

const cloneRows = (rows) => {
  if (!Array.isArray(rows)) {
    return [];
  }

  return rows.map((row) => {
    return {
      ...row,
    };
  });
};

const createRowMap = (rows) => {
  return rows.reduce((acc, row) => {
    acc[row.issueId] = row;
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

const getUsageValue = (row) => {
  if (!row) {
    return "";
  }

  for (let i = 0; i < USAGE_FIELD_NAMES.length; i += 1) {
    const fieldName = USAGE_FIELD_NAMES[i];

    if (Object.prototype.hasOwnProperty.call(row, fieldName)) {
      return normalizeValue(row[fieldName]);
    }
  }

  return "";
};

const isUnsetUsageRow = (row) => {
  return getUsageValue(row) === "";
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
    option.statusCode ||
    option.priorityCode ||
    ""
  );
};

const getCodeName = (option) => {
  return (
    option.name ||
    option.codeName ||
    option.label ||
    option.statusName ||
    option.priorityName ||
    getCodeValue(option)
  );
};

const findCodeName = (codeList, value) => {
  if (!codeList || codeList.length === 0) {
    return value || "-";
  }

  const found = codeList.find((item) => {
    return toStringValue(getCodeValue(item)) === toStringValue(value);
  });

  return found ? getCodeName(found) : value || "-";
};

const toSaveRow = (row) => {
  return {
    issueId: row.issueId,
    statusCode: row.statusCode,
    priorityCode: row.priorityCode,
  };
};

const createSampleList = () => {
  return [
    {
      issueId: 1,
      title: "로그인 오류",
      usageCode: "",
      statusCode: "OPEN",
      priorityCode: "HIGH",
      dueDate: "2026-05-20",
      assigneeId: 1,
      assigneeName: "관리자",
      createdByName: "관리자",
      createdAt: "2026-05-16",
    },
    {
      issueId: 2,
      title: "AG Grid 콤보박스 적용",
      usageCode: "BOARD",
      statusCode: "IN_PROGRESS",
      priorityCode: "NORMAL",
      dueDate: "2026-05-21",
      assigneeId: 2,
      assigneeName: "홍길동",
      createdByName: "관리자",
      createdAt: "2026-05-16",
    },
    {
      issueId: 3,
      title: "저장 Saga 연결",
      usageCode: "",
      statusCode: "DONE",
      priorityCode: "LOW",
      dueDate: "2026-05-22",
      assigneeId: 3,
      assigneeName: "김철수",
      createdByName: "관리자",
      createdAt: "2026-05-16",
    },
    {
      issueId: 4,
      title: "검색조건 컴포넌트 분리",
      usageCode: "ISSUE",
      statusCode: "",
      priorityCode: "",
      dueDate: "2026-05-23",
      assigneeId: 3,
      assigneeName: "김철수",
      createdByName: "관리자",
      createdAt: "2026-05-16",
    },
    {
      issueId: 5,
      title: "Header count/buttons 적용",
      usageCode: "",
      statusCode: "IN_PROGRESS",
      priorityCode: "HIGH",
      dueDate: "2026-05-24",
      assigneeId: 2,
      assigneeName: "홍길동",
      createdByName: "관리자",
      createdAt: "2026-05-16",
    },
    {
      issueId: 6,
      title: "그리드 스크롤 처리",
      usageCode: "",
      statusCode: "",
      priorityCode: "LOW",
      dueDate: "2026-05-25",
      assigneeId: 1,
      assigneeName: "관리자",
      createdByName: "관리자",
      createdAt: "2026-05-16",
    },
    {
      issueId: 7,
      title: "변경 row 추적",
      usageCode: "",
      statusCode: "OPEN",
      priorityCode: "NORMAL",
      dueDate: "2026-05-26",
      assigneeId: 2,
      assigneeName: "홍길동",
      createdByName: "관리자",
      createdAt: "2026-05-16",
    },
    {
      issueId: 8,
      title: "저장 API 연결 예정",
      usageCode: "SAVE",
      statusCode: "DONE",
      priorityCode: "LOW",
      dueDate: "2026-05-27",
      assigneeId: 3,
      assigneeName: "김철수",
      createdByName: "관리자",
      createdAt: "2026-05-16",
    },
    {
      issueId: 9,
      title: "저장 API 연결 예정",
      usageCode: "SAVE",
      statusCode: "DONE",
      priorityCode: "LOW",
      dueDate: "2026-05-27",
      assigneeId: 3,
      assigneeName: "김철수",
      createdByName: "관리자",
      createdAt: "2026-05-16",
    },
    {
      issueId: 10,
      title: "저장 API 연결 예정",
      usageCode: "SAVE",
      statusCode: "DONE",
      priorityCode: "LOW",
      dueDate: "2026-05-27",
      assigneeId: 3,
      assigneeName: "김철수",
      createdByName: "관리자",
      createdAt: "2026-05-16",
    },
    {
      issueId: 11,
      title: "저장 API 연결 예정",
      usageCode: "SAVE",
      statusCode: "DONE",
      priorityCode: "LOW",
      dueDate: "2026-05-27",
      assigneeId: 3,
      assigneeName: "김철수",
      createdByName: "관리자",
      createdAt: "2026-05-16",
    },
    {
      issueId: 12,
      title: "저장 API 연결 예정",
      usageCode: "SAVE",
      statusCode: "DONE",
      priorityCode: "LOW",
      dueDate: "2026-05-27",
      assigneeId: 3,
      assigneeName: "김철수",
      createdByName: "관리자",
      createdAt: "2026-05-16",
    },
    {
      issueId: 13,
      title: "저장 API 연결 예정",
      usageCode: "SAVE",
      statusCode: "DONE",
      priorityCode: "LOW",
      dueDate: "2026-05-27",
      assigneeId: 3,
      assigneeName: "김철수",
      createdByName: "관리자",
      createdAt: "2026-05-16",
    },
    {
      issueId: 14,
      title: "저장 API 연결 예정",
      usageCode: "SAVE",
      statusCode: "DONE",
      priorityCode: "LOW",
      dueDate: "2026-05-27",
      assigneeId: 3,
      assigneeName: "김철수",
      createdByName: "관리자",
      createdAt: "2026-05-16",
    },
    {
      issueId: 15,
      title: "저장 API 연결 예정",
      usageCode: "SAVE",
      statusCode: "DONE",
      priorityCode: "LOW",
      dueDate: "2026-05-27",
      assigneeId: 3,
      assigneeName: "김철수",
      createdByName: "관리자",
      createdAt: "2026-05-16",
    },
    {
      issueId: 16,
      title: "저장 API 연결 예정",
      usageCode: "SAVE",
      statusCode: "DONE",
      priorityCode: "LOW",
      dueDate: "2026-05-27",
      assigneeId: 3,
      assigneeName: "김철수",
      createdByName: "관리자",
      createdAt: "2026-05-16",
    },
    {
      issueId: 17,
      title: "저장 API 연결 예정",
      usageCode: "SAVE",
      statusCode: "DONE",
      priorityCode: "LOW",
      dueDate: "2026-05-27",
      assigneeId: 3,
      assigneeName: "김철수",
      createdByName: "관리자",
      createdAt: "2026-05-16",
    },
  ];
};

const IssueGridPage = () => {
  const dispatch = useDispatch();

  const issueList = useSelector((state) => {
    return state.get(ISSUE_MGMT)?.issueList || [];
  });

  const statusCodeList = useSelector((state) => {
    return state.get(ISSUE_MGMT)?.statusCodeList || [];
  });

  const priorityCodeList = useSelector((state) => {
    return state.get(ISSUE_MGMT)?.priorityCodeList || [];
  });

  const loading = useSelector((state) => {
    return state.get(ISSUE_MGMT)?.loading;
  });

  const error = useSelector((state) => {
    return state.get(ISSUE_MGMT)?.error;
  });

  const statusOptions = useMemo(() => {
    if (statusCodeList && statusCodeList.length > 0) {
      return statusCodeList;
    }

    return [
      { code: "OPEN", name: "접수" },
      { code: "IN_PROGRESS", name: "진행중" },
      { code: "DONE", name: "완료" },
    ];
  }, [statusCodeList]);

  const priorityOptions = useMemo(() => {
    if (priorityCodeList && priorityCodeList.length > 0) {
      return priorityCodeList;
    }

    return [
      { code: "HIGH", name: "높음" },
      { code: "NORMAL", name: "보통" },
      { code: "LOW", name: "낮음" },
    ];
  }, [priorityCodeList]);

  const [searchCondition, setSearchCondition] = useState(
    initialSearchCondition,
  );
  const [onlyUnsetUsage, setOnlyUnsetUsage] = useState(false);
  const [rowData, setRowData] = useState([]);
  const [changedRowMap, setChangedRowMap] = useState({});
  const [isEditMode, setIsEditMode] = useState(false);

  /**
   * 취소 시 복구할 원본 row 목록입니다.
   */
  const originRowDataRef = useRef([]);

  /**
   * 변경 여부 비교용 원본 row map입니다.
   */
  const originRowMapRef = useRef({});

  /**
   * IssueGridPage 내부에 선언한 AG Grid select renderer입니다.
   * 수정 모드에서는 select를 보여주고, 조회 모드에서는 코드명을 보여줍니다.
   */
  const CodeSelectRenderer = useCallback((props) => {
    const {
      value,
      data,
      node,
      colDef,
      options,
      editable,
      placeholder,
      field,
      addChangedRow,
    } = props;

    const codeOptions = Array.isArray(options) ? options : [];
    const targetField = field || colDef.field;
    const currentValue = toStringValue(value);
    const displayName = findCodeName(codeOptions, currentValue);

    /**
     * select 영역 클릭 시 AG Grid row click 이벤트가 같이 실행되는 것을 막습니다.
     */
    const handleMouseDown = (event) => {
      event.stopPropagation();
    };

    /**
     * select 클릭 이벤트가 row click으로 전파되는 것을 막습니다.
     */
    const handleClick = (event) => {
      event.stopPropagation();
    };

    /**
     * CodeSelect 변경 이벤트입니다.
     *
     * CodeSelect는 onChange(value, event) 형태로 호출합니다.
     */
    const handleChange = (nextValue, event) => {
      if (event) {
        event.stopPropagation();
      }

      if (!data || !node || !targetField) {
        return;
      }

      const prevValue = toStringValue(data[targetField]);
      const nextStringValue = toStringValue(nextValue);

      if (prevValue === nextStringValue) {
        return;
      }

      /**
       * AG Grid 내부 row 값을 변경합니다.
       * 셀 값 반영은 React setRowData보다 node.setDataValue가 더 적합합니다.
       */
      node.setDataValue(targetField, nextValue);

      /**
       * 변경 row 추적용 복사본입니다.
       * data 객체를 직접 mutate하지 않고, 변경된 값만 반영한 row를 만듭니다.
       */
      const updatedRow = {
        ...data,
        [targetField]: nextValue,
      };

      /**
       * changedRowMap 관리용 함수 호출입니다.
       */
      if (typeof addChangedRow === "function") {
        addChangedRow(updatedRow, targetField, nextValue);
      }
    };

    /**
     * 조회 모드에서는 select가 아니라 코드명을 보여줍니다.
     */
    if (!editable) {
      return <span>{displayName}</span>;
    }

    /**
     * 수정 모드에서는 공통 CodeSelect 컴포넌트를 사용합니다.
     */
    return (
      <div onMouseDown={handleMouseDown} onClick={handleClick}>
        <CodeSelect
          value={currentValue}
          options={codeOptions}
          placeholder={placeholder || "선택하세요."}
          onChange={handleChange}
          disabled={!editable}
          className="grid-select"
        />
      </div>
    );
  }, []);

  /**
   * 최초 진입 시 공통코드와 이슈 목록을 조회합니다.
   */
  useEffect(() => {
    dispatch(
      fetchCommonCodeRequest({
        groupCodes: ["ISSUE_STATUS", "ISSUE_PRIORITY"],
      }),
    );

    dispatch(fetchIssueListRequest(initialSearchCondition));
  }, [dispatch]);

  /**
   * Redux issueList가 변경되면 AG Grid용 rowData로 복사합니다.
   */
  useEffect(() => {
    const nextRows = cloneRows(issueList);

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

    originRowDataRef.current = cloneRows(nextRows);
    originRowMapRef.current = createRowMap(nextRows);
  }, [issueList]);

  /**
   * API 연동 전 샘플 데이터 세팅용입니다.
   * 실제 API 연결 후에는 USE_SAMPLE_DATA를 false로 변경하세요.
   */
  useEffect(() => {
    if (!USE_SAMPLE_DATA) {
      return;
    }

    if (issueList && issueList.length > 0) {
      return;
    }

    const sampleList = createSampleList();

    setRowData(sampleList);
    setChangedRowMap({});
    setIsEditMode(false);

    originRowDataRef.current = cloneRows(sampleList);
    originRowMapRef.current = createRowMap(sampleList);
  }, [issueList]);

  /**
   * 개발 중 변경 row 확인용 로그입니다.
   * 개발 완료 후 삭제해도 됩니다.
   */
  useEffect(() => {
    console.log("changedRows 변경됨:", Object.values(changedRowMap));
  }, [changedRowMap]);

  /**
   * changedRowMap을 저장 API로 보내기 좋은 배열 형태로 변환합니다.
   */
  const changedRows = useMemo(() => {
    return Object.keys(changedRowMap).map((issueId) => {
      return changedRowMap[issueId];
    });
  }, [changedRowMap]);

  /**
   * checkbox 상태에 따라 AG Grid에 표시할 row를 계산합니다.
   * 용도 미설정 필터는 서버가 아니라 프론트에서 처리합니다.
   */
  const displayRowData = useMemo(() => {
    if (!onlyUnsetUsage) {
      return rowData;
    }

    return rowData.filter((row) => {
      return isUnsetUsageRow(row);
    });
  }, [rowData, onlyUnsetUsage]);

  /**
   * select renderer에서 값이 변경되었을 때 호출됩니다.
   * issueId 기준으로 변경 row를 누적합니다.
   */
  const addChangedRow = useCallback((changedRow, field, value) => {
    if (
      !changedRow ||
      changedRow.issueId === undefined ||
      changedRow.issueId === null
    ) {
      console.warn("issueId가 없습니다. changedRow:", changedRow);
      return;
    }

    if (!field) {
      console.warn("field가 없습니다.");
      return;
    }

    const issueId = changedRow.issueId;
    const originRow = originRowMapRef.current[issueId];

    if (!originRow) {
      console.warn("원본 row가 없습니다. issueId:", issueId);
      return;
    }

    setChangedRowMap((prevMap) => {
      const prevChangedRow = prevMap[issueId];

      const mergedRow = {
        ...originRow,
        ...prevChangedRow,
        ...changedRow,
        [field]: value,
      };

      const isChanged = isEditableFieldChanged(originRow, mergedRow);

      const nextMap = {
        ...prevMap,
      };

      if (!isChanged) {
        delete nextMap[issueId];
        return nextMap;
      }

      nextMap[issueId] = toSaveRow(mergedRow);

      return nextMap;
    });
  }, []);

  /**
   * 조회조건 변경 처리입니다.
   */
  const handleChangeSearchCondition = useCallback((name, value) => {
    setSearchCondition((prev) => {
      return {
        ...prev,
        [name]: value,
      };
    });
  }, []);

  /**
   * 용도 미설정만 보기 checkbox 변경 처리입니다.
   */
  const handleChangeOnlyUnsetUsage = useCallback((event) => {
    setOnlyUnsetUsage(event.target.checked);
  }, []);

  /**
   * 조회 버튼 클릭 처리입니다.
   */
  const handleSearch = useCallback(() => {
    dispatch(fetchIssueListRequest(searchCondition));
  }, [dispatch, searchCondition]);

  /**
   * 조회조건 초기화 처리입니다.
   */
  const handleReset = useCallback(() => {
    setSearchCondition(initialSearchCondition);
    setOnlyUnsetUsage(false);

    dispatch(fetchIssueListRequest(initialSearchCondition));
  }, [dispatch]);

  /**
   * 수정 모드 진입 처리입니다.
   */
  const handleEdit = useCallback(() => {
    setChangedRowMap({});
    setIsEditMode(true);
  }, []);

  /**
   * 수정 취소 처리입니다.
   */
  const handleCancel = useCallback(() => {
    const originRows = cloneRows(originRowDataRef.current);

    setRowData(originRows);
    setChangedRowMap({});
    setIsEditMode(false);
  }, []);

  /**
   * 저장 버튼 클릭 처리입니다.
   */
  const handleSave = useCallback(() => {
    if (changedRows.length === 0) {
      alert("변경된 데이터가 없습니다.");
      return;
    }

    console.log("저장할 변경 row:", changedRows);

    alert("저장 API는 다음 단계에서 연결합니다.");
  }, [changedRows]);

  /**
   * AG Grid 컬럼 정의입니다.
   */
  const columnDefs = useMemo(() => {
    return [
      {
        headerName: "이슈 ID",
        field: "issueId",
        width: 100,
        editable: false,
        cellClass: "grid-cell-center",
      },
      {
        headerName: "제목",
        field: "title",
        width: 300,
        editable: false,
      },
      {
        headerName: "용도",
        field: "usageCode",
        width: 150,
        editable: false,
        cellClass: "grid-cell-center",
        valueFormatter: (params) => {
          return normalizeValue(params.value) || "-";
        },
      },
      {
        headerName: "상태",
        field: "statusCode",
        width: 150,
        editable: false,
        cellRendererFramework: CodeSelectRenderer,
        cellRendererParams: {
          options: statusOptions,
          editable: isEditMode,
          placeholder: "상태 선택",
          field: "statusCode",
          addChangedRow,
        },
        valueFormatter: (params) => {
          return findCodeName(statusOptions, params.value);
        },
      },
      {
        headerName: "우선순위",
        field: "priorityCode",
        width: 150,
        editable: false,
        cellRendererFramework: CodeSelectRenderer,
        cellRendererParams: {
          options: priorityOptions,
          editable: isEditMode,
          placeholder: "우선순위 선택",
          field: "priorityCode",
          addChangedRow,
        },
        valueFormatter: (params) => {
          return findCodeName(priorityOptions, params.value);
        },
      },
      {
        headerName: "처리예정일",
        field: "dueDate",
        width: 150,
        cellClass: "grid-cell-center",
      },
      {
        headerName: "담당자 ID",
        field: "assigneeId",
        width: 150,
        cellClass: "grid-cell-center",
      },
      {
        headerName: "담당자명",
        field: "assigneeName",
        width: 150,
        cellClass: "grid-cell-center",
      },
      {
        headerName: "작성자",
        field: "createdByName",
        width: 150,
        cellClass: "grid-cell-center",
      },
      {
        headerName: "등록일",
        field: "createdAt",
        width: 170,
        cellClass: "grid-cell-center",
      },
    ];
  }, [
    isEditMode,
    statusOptions,
    priorityOptions,
    addChangedRow,
    CodeSelectRenderer,
  ]);

  /**
   * AG Grid 기본 컬럼 옵션입니다.
   */
  const defaultColDef = useMemo(() => {
    return {
      resizable: true,
      sortable: true,
      filter: true,
    };
  }, []);

  /**
   * Header 오른쪽 버튼 영역입니다.
   */
  const headerButtons = useMemo(() => {
    return (
      <>
        {!isEditMode && (
          <button
            type="button"
            className="btn btn-orange"
            disabled={loading}
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
              disabled={changedRows.length === 0}
              onClick={handleSave}
            >
              저장
            </button>

            <button
              type="button"
              className="btn btn-gray"
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
    changedRows.length,
    handleEdit,
    handleSave,
    handleCancel,
  ]);

  return (
    <div className="page">
      <div className="page-title-area">
        <h1>이슈 관리</h1>
        <p>수정 모드에서 상태/우선순위 컬럼을 콤보박스로 수정합니다.</p>
      </div>

      <IssueSearchBox
        searchCondition={searchCondition}
        statusOptions={statusOptions}
        priorityOptions={priorityOptions}
        onlyUnsetUsage={onlyUnsetUsage}
        onChangeSearchCondition={handleChangeSearchCondition}
        onChangeOnlyUnsetUsage={handleChangeOnlyUnsetUsage}
        onSearch={handleSearch}
        onReset={handleReset}
        disabled={loading}
      />

      {error ? (
        <div className="error-box">
          {error.message ? error.message : "알 수 없는 에러가 발생했습니다."}
        </div>
      ) : null}

      <Header
        title="이슈 목록"
        count={displayRowData.length}
        buttons={headerButtons}
      >
        <div className="ag-theme-balham issue-grid">
          <AgGridReact
            key={isEditMode ? "issue-grid-edit" : "issue-grid-view"}
            rowData={displayRowData}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
          />
        </div>
      </Header>
    </div>
  );
};

export default IssueGridPage;
