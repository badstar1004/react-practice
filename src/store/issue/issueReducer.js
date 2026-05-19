import {
  FETCH_OWNER_CODE_LIST_REQUEST,
  FETCH_OWNER_CODE_LIST_SUCCESS,
  FETCH_OWNER_CODE_LIST_FAILURE,
  FETCH_COMMON_CODE_REQUEST,
  FETCH_COMMON_CODE_SUCCESS,
  FETCH_COMMON_CODE_FAILURE,
  SAVE_OWNER_CODE_ROWS_REQUEST,
  SAVE_OWNER_CODE_ROWS_SUCCESS,
  SAVE_OWNER_CODE_ROWS_FAILURE,
} from "./issueAction";

const initialState = {
  ownerCodeList: [],
  usageCodeList: [],
  loading: false,
  saving: false,
  error: null,
};

const mergeSavedRows = (list, changedRows) => {
  if (!Array.isArray(changedRows) || changedRows.length === 0) {
    return list;
  }

  const changedMap = changedRows.reduce((acc, row) => {
    const key = `${row.workAreaCd}|${row.ownerCd}`;
    acc[key] = row;
    return acc;
  }, {});

  return list.map((row) => {
    const key = `${row.workAreaCd}|${row.ownerCd}`;
    return changedMap[key] ? { ...row, ...changedMap[key] } : row;
  });
};

export default function issueReducer(
  state = initialState,
  { type, payload, data, changedRows, error } = {},
) {
  switch (type) {
    case FETCH_OWNER_CODE_LIST_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
      };
    case FETCH_OWNER_CODE_LIST_SUCCESS:
      return {
        ...state,
        loading: false,
        ownerCodeList: data || [],
      };
    case FETCH_OWNER_CODE_LIST_FAILURE:
      return {
        ...state,
        loading: false,
        error,
      };

    case FETCH_COMMON_CODE_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
      };
    case FETCH_COMMON_CODE_SUCCESS:
      return {
        ...state,
        loading: false,
        usageCodeList: data && data.usageCodeList ? data.usageCodeList : [],
      };
    case FETCH_COMMON_CODE_FAILURE:
      return {
        ...state,
        loading: false,
        error,
      };

    case SAVE_OWNER_CODE_ROWS_REQUEST:
      return {
        ...state,
        saving: true,
        error: null,
      };
    case SAVE_OWNER_CODE_ROWS_SUCCESS:
      return {
        ...state,
        saving: false,
        ownerCodeList: mergeSavedRows(state.ownerCodeList, changedRows),
        error: null,
      };
    case SAVE_OWNER_CODE_ROWS_FAILURE:
      return {
        ...state,
        saving: false,
        error,
      };

    default:
      return state;
  }
}
