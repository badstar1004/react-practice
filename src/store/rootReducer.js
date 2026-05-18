import { combineReducers } from "redux-immutable";
import { ISSUE_MGMT } from "store/issue/issueAction";
import issueReducer from "store/issue/issueReducer";

const rootReducer = combineReducers({
  [ISSUE_MGMT]: issueReducer,
});

export default rootReducer;
