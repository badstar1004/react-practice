import { all } from "redux-saga/effects";
import issueSaga from "./issue/issueSaga";
import commonCodeSaga from "./commonCode/commonCodeSaga";

export default function* rootSaga() {
  yield all([issueSaga(), commonCodeSaga()]);
}
