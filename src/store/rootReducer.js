import { combineReducers } from "redux-immutable";
import { ISSUE_MGMT } from "store/issue/issueAction";
import issueReducer from "store/issue/issueReducer";
import { COMMON_CODE_MGMT } from "store/commonCode/commonCodeAction";
import commonCodeReducer from "store/commonCode/commonCodeReducer";
import { DEV_AREA_REV_MGMT } from "store/devAreaRev/devAreaRevAction";
import devAreaRevReducer from "store/devAreaRev/devAreaRevReducer";

const rootReducer = combineReducers({
  [ISSUE_MGMT]: issueReducer,
  [COMMON_CODE_MGMT]: commonCodeReducer,
  [DEV_AREA_REV_MGMT]: devAreaRevReducer,
});

export default rootReducer;
