import { all } from "redux-saga/effects";
import issueSaga from "./issue/issueSaga";
import commonCodeSaga from "./commonCode/commonCodeSaga";
import devAreaRevSaga from "./devAreaRev/devAreaRevSaga";

export default function* rootSaga() {
  yield all([issueSaga(), commonCodeSaga(), devAreaRevSaga()]);
}
