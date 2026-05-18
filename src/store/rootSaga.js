import { all } from "redux-saga/effects";
import issueSaga from "./issue/issueSaga";

export default function* rootSaga() {
  yield all([issueSaga()]);
}
