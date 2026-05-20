import { combineReducers } from "redux-immutable";
import { ISSUE_MGMT } from "store/issue/issueAction";
import issueReducer from "store/issue/issueReducer";
import { COMMON_CODE_MGMT } from "store/commonCode/commonCodeAction";
import commonCodeReducer from "store/commonCode/commonCodeReducer";

const rootReducer = combineReducers({
  [ISSUE_MGMT]: issueReducer,
  [COMMON_CODE_MGMT]: commonCodeReducer,
});

export default rootReducer;
