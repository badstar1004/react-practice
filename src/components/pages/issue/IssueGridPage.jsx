// IssueGridPage.jsx

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

/**
 * 수정 모드에서 변경 여부를 비교할 대상 컬럼입니다.
 *
 * 현재 화면에서는 상태, 우선순위만 수정 대상으로 사용합니다.
 * 나중에 제목, 담당자, 처리예정일도 수정 대상이 되면 여기에 추가하면 됩니다.
 */
const EDITABLE_FIELDS = ["statusCode", "priorityCode"];

/**
 * 용도 컬럼명 후보입니다.
 *
 * 서버 응답이 usageCode로 올 수도 있고,
 * 기존 업무 화면처럼 usageCd로 올 수도 있어서 둘 다 대응합니다.
 *
 * 프로젝트에서 usageCode로 확정되면 ["usageCode"]만 남겨도 됩니다.
 */
const USAGE_FIELD_NAMES = ["usageCode", "usageCd"];

/**
 * API 연동 전 화면 테스트용 샘플 데이터 사용 여부입니다.
 *
 * 실제 API 연동이 완료되면 false로 변경하거나,
 * createSampleList 관련 코드를 삭제하면 됩니다.
 */
const USE_SAMPLE_DATA = true;

/**
 * 조회조건 초기값입니다.
 *
 * 최초 조회 시 사용하고,
 * 조회조건 초기화 버튼을 클릭했을 때도 사용합니다.
 */
const initialSearchCondition = {
  statusCode: "",
  priorityCode: "",
  keyword: "",
  startDate: "",
  endDate: "",
};

/**
 * row 배열을 복사합니다.
 *
 * Redux store에서 가져온 issueList를 바로 AG Grid에서 수정하면
 * 원본 store 데이터와 화면 수정 데이터가 섞일 수 있습니다.
 *
 * 그래서 화면에서 사용할 rowData로 한 번 복사해서 사용합니다.
 */
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

/**
 * issueId 기준으로 row를 빠르게 찾기 위한 Map 객체를 만듭니다.
 *
 * 예:
 * [
 *   { issueId: 1, statusCode: "OPEN" },
 *   { issueId: 2, statusCode: "DONE" }
 * ]
 *
 * 결과:
 * {
 *   1: { issueId: 1, statusCode: "OPEN" },
 *   2: { issueId: 2, statusCode: "DONE" }
 * }
 *
 * 원본 row와 현재 변경 row를 비교할 때 사용합니다.
 */
const createRowMap = (rows) => {
  return rows.reduce((acc, row) => {
    acc[row.issueId] = row;
    return acc;
  }, {});
};

/**
 * 비교용 값 정규화 함수입니다.
 *
 * null, undefined는 빈 문자열로 처리하고,
 * 문자열 앞뒤 공백은 제거합니다.
 *
 * null, undefined, "" 차이 때문에
 * 변경 여부가 잘못 판단되는 것을 방지합니다.
 */
const normalizeValue = (value) => {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).trim();
};

/**
 * select value 비교용 문자열 변환 함수입니다.
 *
 * HTML select의 value는 문자열로 다뤄지는 경우가 많습니다.
 * 숫자/문자 타입 차이로 비교가 틀어지지 않도록 문자열로 맞춥니다.
 */
const toStringValue = (value) => {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value);
};

/**
 * row에서 용도 값을 가져옵니다.
 *
 * usageCode 또는 usageCd 중 실제 row에 존재하는 필드를 찾아서 반환합니다.
 */
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

/**
 * 용도 미설정 row인지 판단합니다.
 *
 * 용도 값이 null, undefined, 빈 문자열이면 미설정으로 봅니다.
 */
const isUnsetUsageRow = (row) => {
  return getUsageValue(row) === "";
};

/**
 * 수정 대상 컬럼이 원본 대비 변경되었는지 판단합니다.
 *
 * 현재는 EDITABLE_FIELDS에 정의된 statusCode, priorityCode만 비교합니다.
 * 사용자가 값을 바꿨다가 다시 원본값으로 되돌리면 false가 됩니다.
 */
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

/**
 * 공통코드 option에서 실제 코드값을 가져옵니다.
 *
 * CodeSelect 컴포넌트는 기본적으로 item.code를 사용하지만,
 * API 응답 필드명이 codeValue, value 등으로 올 수 있는 경우도 대비합니다.
 */
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

/**
 * 공통코드 option에서 화면 표시명을 가져옵니다.
 *
 * CodeSelect 컴포넌트는 기본적으로 item.name을 사용하지만,
 * API 응답 필드명이 codeName, label 등으로 올 수 있는 경우도 대비합니다.
 */
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

/**
 * CodeSelect가 사용하기 좋은 형태로 공통코드 목록을 변환합니다.
 *
 * CodeSelect.jsx는 아래 형태를 기대합니다.
 *
 * {
 *   code: "OPEN",
 *   name: "접수"
 * }
 *
 * 따라서 API 응답이 codeValue/codeName으로 오더라도
 * 여기서 code/name 형태로 맞춰줍니다.
 */
const normalizeCodeOptions = (codeList, fallbackList) => {
  const list = codeList && codeList.length > 0 ? codeList : fallbackList;

  return list.map((item) => {
    return {
      code: getCodeValue(item),
      name: getCodeName(item),
    };
  });
};

/**
 * 코드값을 코드명으로 변환합니다.
 *
 * 예:
 * OPEN -> 접수
 * IN_PROGRESS -> 진행중
 * DONE -> 완료
 *
 * 코드 목록에서 찾지 못하면 value를 그대로 표시합니다.
 */
const findCodeName = (codeList, value) => {
  if (!codeList || codeList.length === 0) {
    return value || "-";
  }

  const found = codeList.find((item) => {
    return toStringValue(item.code) === toStringValue(value);
  });

  return found ? found.name : value || "-";
};

/**
 * 저장 API로 보낼 row 형태를 만듭니다.
 *
 * 화면 row 전체를 보내지 않고,
 * 실제 저장에 필요한 값만 추려냅니다.
 */
const toSaveRow = (row) => {
  return {
    issueId: row.issueId,
    statusCode: row.statusCode,
    priorityCode: row.priorityCode,
  };
};

/**
 * API 연동 전 화면 테스트용 샘플 데이터를 만듭니다.
 *
 * 실제 API 연동 후에는 이 함수와 샘플 데이터 세팅 useEffect를 삭제해도 됩니다.
 */
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
      statusCode: "OPEN",
      priorityCode: "NORMAL",
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
      usageCode: "GRID",
      statusCode: "DONE",
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
  ];
};

const IssueGridPage = () => {
  const dispatch = useDispatch();

  /**
   * Redux store에서 이슈 목록을 가져옵니다.
   *
   * rootReducer에서 ISSUE_MGMT key로 issueReducer를 등록했기 때문에
   * state.get(ISSUE_MGMT) 형태로 접근합니다.
   */
  const issueList = useSelector((state) => {
    return state.get(ISSUE_MGMT)?.issueList || [];
  });

  /**
   * Redux store에서 상태 공통코드 목록을 가져옵니다.
   */
  const statusCodeList = useSelector((state) => {
    return state.get(ISSUE_MGMT)?.statusCodeList || [];
  });

  /**
   * Redux store에서 우선순위 공통코드 목록을 가져옵니다.
   */
  const priorityCodeList = useSelector((state) => {
    return state.get(ISSUE_MGMT)?.priorityCodeList || [];
  });

  /**
   * 조회 loading 상태입니다.
   *
   * 조회 중 버튼 비활성화, 검색조건 비활성화에 사용합니다.
   */
  const loading = useSelector((state) => {
    return state.get(ISSUE_MGMT)?.loading;
  });

  /**
   * API 오류 상태입니다.
   *
   * 에러 박스 표시 여부에 사용합니다.
   */
  const error = useSelector((state) => {
    return state.get(ISSUE_MGMT)?.error;
  });

  /**
   * 상태 코드 옵션입니다.
   *
   * 공통코드 API 응답이 있으면 API 값을 사용하고,
   * 없으면 화면 테스트용 기본 옵션을 사용합니다.
   */
  const statusOptions = useMemo(() => {
    return normalizeCodeOptions(statusCodeList, [
      { code: "OPEN", name: "접수" },
      { code: "IN_PROGRESS", name: "진행중" },
      { code: "DONE", name: "완료" },
    ]);
  }, [statusCodeList]);

  /**
   * 우선순위 코드 옵션입니다.
   *
   * 공통코드 API 응답이 있으면 API 값을 사용하고,
   * 없으면 화면 테스트용 기본 옵션을 사용합니다.
   */
  const priorityOptions = useMemo(() => {
    return normalizeCodeOptions(priorityCodeList, [
      { code: "HIGH", name: "높음" },
      { code: "NORMAL", name: "보통" },
      { code: "LOW", name: "낮음" },
    ]);
  }, [priorityCodeList]);

  /**
   * 조회조건 state입니다.
   *
   * IssueSearchBox에서 상태, 우선순위, 검색어, 시작일, 종료일을 변경합니다.
   */
  const [searchCondition, setSearchCondition] = useState(
    initialSearchCondition,
  );

  /**
   * 용도 미설정만 보기 checkbox state입니다.
   *
   * 이 값은 서버 조회 조건으로 보내지 않고,
   * 현재 프론트가 가지고 있는 rowData를 필터링하는 데 사용합니다.
   */
  const [onlyUnsetUsage, setOnlyUnsetUsage] = useState(false);

  /**
   * AG Grid에 표시할 row 데이터입니다.
   *
   * Redux issueList를 직접 사용하지 않고,
   * 화면에서 수정/취소/변경 추적을 하기 위해 page state로 복사해서 사용합니다.
   */
  const [rowData, setRowData] = useState([]);

  /**
   * 변경된 row를 issueId 기준으로 저장하는 객체입니다.
   *
   * 배열 대신 객체를 사용하는 이유:
   * 같은 row를 여러 번 수정해도 issueId 기준으로 한 건만 유지하기 위해서입니다.
   */
  const [changedRowMap, setChangedRowMap] = useState({});

  /**
   * 수정 모드 여부입니다.
   *
   * true:
   * - 상태/우선순위 컬럼에 CodeSelect 표시
   *
   * false:
   * - 상태/우선순위 컬럼에 코드명 text 표시
   */
  const [isEditMode, setIsEditMode] = useState(false);

  /**
   * 취소 시 복구할 원본 row 목록입니다.
   *
   * useRef를 사용하는 이유:
   * - 원본 데이터는 화면 렌더링 대상이 아님
   * - 값이 바뀌어도 리렌더링할 필요가 없음
   */
  const originRowDataRef = useRef([]);

  /**
   * issueId 기준 원본 row map입니다.
   *
   * 변경된 row가 원본 대비 실제로 변경되었는지 비교할 때 사용합니다.
   */
  const originRowMapRef = useRef({});

  /**
   * AG Grid 상태/우선순위 컬럼에서 사용하는 renderer입니다.
   *
   * 별도 파일로 분리하지 않고 IssueGridPage 내부에 선언했습니다.
   *
   * 주요 역할:
   * - 조회 모드: 코드명을 text로 표시
   * - 수정 모드: CodeSelect 표시
   * - 값 변경 시 node.setDataValue로 AG Grid 내부 값을 반영
   * - addChangedRow로 변경 row를 추적
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

    /**
     * 컬럼에서 전달받은 공통코드 옵션입니다.
     *
     * 상태 컬럼이면 statusOptions,
     * 우선순위 컬럼이면 priorityOptions가 들어옵니다.
     */
    const codeOptions = Array.isArray(options) ? options : [];

    /**
     * 실제 변경할 필드명입니다.
     *
     * cellRendererParams.field가 있으면 그것을 우선 사용하고,
     * 없으면 colDef.field를 사용합니다.
     */
    const targetField = field || colDef.field;

    /**
     * 현재 select 값입니다.
     */
    const currentValue = toStringValue(value);

    /**
     * 조회 모드에서 표시할 코드명입니다.
     */
    const displayName = findCodeName(codeOptions, currentValue);

    /**
     * select 클릭 시 AG Grid row click 이벤트가 같이 실행되지 않도록 막습니다.
     */
    const handleMouseDown = (event) => {
      event.stopPropagation();
    };

    /**
     * select 클릭 이벤트가 row click으로 전파되지 않도록 막습니다.
     */
    const handleClick = (event) => {
      event.stopPropagation();
    };

    /**
     * CodeSelect 값 변경 이벤트입니다.
     *
     * CodeSelect.jsx는 onChange(value, event) 형태로 호출합니다.
     *
     * 처리 순서:
     * 1. 선택한 값 nextValue 확인
     * 2. 기존 값과 같으면 종료
     * 3. node.setDataValue로 AG Grid 내부 row 값 변경
     * 4. 변경 row 복사본 생성
     * 5. addChangedRow로 변경 목록에 반영
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
       *
       * 셀 값 변경은 React setRowData보다
       * AG Grid의 node.setDataValue가 더 직접적입니다.
       */
      node.setDataValue(targetField, nextValue);

      /**
       * 변경 추적용 row 복사본입니다.
       *
       * data 객체를 직접 mutate하지 않고,
       * 변경된 값만 반영한 새 객체를 addChangedRow에 넘깁니다.
       */
      const updatedRow = {
        ...data,
        [targetField]: nextValue,
      };

      /**
       * 변경 row 목록을 관리하는 부모 함수 호출입니다.
       */
      if (typeof addChangedRow === "function") {
        addChangedRow(updatedRow, targetField, nextValue);
      }
    };

    /**
     * 조회 모드에서는 CodeSelect를 보여주지 않고 코드명만 표시합니다.
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
   * 최초 화면 진입 시 실행됩니다.
   *
   * 처리 내용:
   * 1. 상태/우선순위 공통코드 조회
   * 2. 이슈 목록 조회
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
   * Redux issueList가 변경되면 AG Grid용 rowData에 반영합니다.
   *
   * API 조회 성공 후 issueList가 바뀌면:
   * - rowData 갱신
   * - changedRowMap 초기화
   * - 수정 모드 해제
   * - 원본 데이터 ref 갱신
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
   * API 연동 전 화면 테스트용 샘플 데이터를 세팅합니다.
   *
   * 실제 API 연동 후에는 USE_SAMPLE_DATA를 false로 바꾸거나
   * 이 useEffect를 삭제하면 됩니다.
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
   * changedRowMap 변경 확인용 로그입니다.
   *
   * 개발 완료 후 삭제해도 됩니다.
   */
  useEffect(() => {
    console.log("changedRows 변경됨:", Object.values(changedRowMap));
  }, [changedRowMap]);

  /**
   * changedRowMap을 저장 API에 보내기 좋은 배열 형태로 변환합니다.
   *
   * changedRowMap:
   * {
   *   1: { issueId: 1, statusCode: "DONE", priorityCode: "HIGH" }
   * }
   *
   * changedRows:
   * [
   *   { issueId: 1, statusCode: "DONE", priorityCode: "HIGH" }
   * ]
   */
  const changedRows = useMemo(() => {
    return Object.keys(changedRowMap).map((issueId) => {
      return changedRowMap[issueId];
    });
  }, [changedRowMap]);

  /**
   * AG Grid에 실제로 표시할 데이터입니다.
   *
   * onlyUnsetUsage가 false이면 전체 rowData를 표시합니다.
   * onlyUnsetUsage가 true이면 용도 미설정 데이터만 표시합니다.
   *
   * 이 필터는 서버 조회가 아니라 프론트 화면 필터입니다.
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
   * CodeSelectRenderer에서 값이 변경되었을 때 호출됩니다.
   *
   * 역할:
   * 1. 변경된 row의 issueId 확인
   * 2. 원본 row 조회
   * 3. 원본 대비 실제 변경 여부 판단
   * 4. changedRowMap에 issueId 기준으로 변경 row 저장
   * 5. 원본값으로 되돌린 경우 changedRowMap에서 제거
   *
   * 주의:
   * node.setDataValue로 AG Grid 내부 값은 이미 변경되므로
   * 여기서는 setRowData를 다시 호출하지 않습니다.
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

      /**
       * 원본 row + 기존 변경분 + 이번 변경분을 합쳐서
       * 현재 row의 최종 상태를 만듭니다.
       */
      const mergedRow = {
        ...originRow,
        ...prevChangedRow,
        ...changedRow,
        [field]: value,
      };

      /**
       * 원본 대비 실제로 변경되었는지 확인합니다.
       */
      const isChanged = isEditableFieldChanged(originRow, mergedRow);

      const nextMap = {
        ...prevMap,
      };

      /**
       * 원본값으로 되돌아간 경우 변경 목록에서 제거합니다.
       */
      if (!isChanged) {
        delete nextMap[issueId];
        return nextMap;
      }

      /**
       * 저장 API로 보낼 형태만 추려서 저장합니다.
       */
      nextMap[issueId] = toSaveRow(mergedRow);

      return nextMap;
    });
  }, []);

  /**
   * 조회조건 input/select 값 변경 함수입니다.
   *
   * IssueSearchBox에서 아래처럼 호출됩니다.
   *
   * onChangeSearchCondition("statusCode", "OPEN")
   * onChangeSearchCondition("keyword", "로그인")
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
   * 용도 미설정만 보기 checkbox 변경 함수입니다.
   *
   * 서버를 다시 조회하지 않고,
   * onlyUnsetUsage state만 변경합니다.
   *
   * 실제 필터링은 displayRowData에서 처리합니다.
   */
  const handleChangeOnlyUnsetUsage = useCallback((event) => {
    setOnlyUnsetUsage(event.target.checked);
  }, []);

  /**
   * 조회 버튼 클릭 함수입니다.
   *
   * 현재 searchCondition 기준으로 이슈 목록 조회 action을 dispatch합니다.
   */
  const handleSearch = useCallback(() => {
    dispatch(fetchIssueListRequest(searchCondition));
  }, [dispatch, searchCondition]);

  /**
   * 조회조건 초기화 버튼 클릭 함수입니다.
   *
   * 처리 내용:
   * 1. searchCondition 초기화
   * 2. 용도 미설정 checkbox 해제
   * 3. 초기 조건으로 이슈 목록 재조회
   */
  const handleReset = useCallback(() => {
    setSearchCondition(initialSearchCondition);
    setOnlyUnsetUsage(false);

    dispatch(fetchIssueListRequest(initialSearchCondition));
  }, [dispatch]);

  /**
   * 수정 버튼 클릭 함수입니다.
   *
   * 처리 내용:
   * 1. 기존 변경 목록 초기화
   * 2. 수정 모드 ON
   */
  const handleEdit = useCallback(() => {
    setChangedRowMap({});
    setIsEditMode(true);
  }, []);

  /**
   * 취소 버튼 클릭 함수입니다.
   *
   * 처리 내용:
   * 1. rowData를 원본 데이터로 복구
   * 2. 변경 목록 초기화
   * 3. 수정 모드 OFF
   */
  const handleCancel = useCallback(() => {
    const originRows = cloneRows(originRowDataRef.current);

    setRowData(originRows);
    setChangedRowMap({});
    setIsEditMode(false);
  }, []);

  /**
   * 저장 버튼 클릭 함수입니다.
   *
   * 현재는 변경 row 확인까지만 합니다.
   * 이후 saveIssueRowsRequest(changedRows)를 연결하면 됩니다.
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
   * 수정 가능 컬럼에 적용할 cell class를 반환합니다.
   *
   * 수정 모드일 때 editable-cell 클래스를 추가해서
   * 배경색 등으로 수정 가능 영역을 표시합니다.
   */
  const getEditableCellClass = useCallback(() => {
    return isEditMode ? "editable-cell grid-cell-center" : "grid-cell-center";
  }, [isEditMode]);

  /**
   * AG Grid 컬럼 정의입니다.
   *
   * 상태/우선순위 컬럼은 항상 CodeSelectRenderer를 사용합니다.
   * 단, Renderer 내부에서 editable 값에 따라
   * text 또는 CodeSelect를 분기해서 보여줍니다.
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
        cellClass: getEditableCellClass(),
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
        cellClass: getEditableCellClass(),
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
    getEditableCellClass,
    CodeSelectRenderer,
  ]);

  /**
   * AG Grid 전체 컬럼에 공통 적용할 기본 옵션입니다.
   */
  const defaultColDef = useMemo(() => {
    return {
      resizable: true,
      sortable: true,
      filter: true,
    };
  }, []);

  /**
   * Header 오른쪽에 표시할 버튼 영역입니다.
   *
   * 조회 모드:
   * - 수정 버튼
   *
   * 수정 모드:
   * - 변경 건수
   * - 저장 버튼
   * - 취소 버튼
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
