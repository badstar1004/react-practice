import React from "react";
import { Switch, Route, Redirect } from "react-router-dom";

import IssueGridPage from "components/pages/issue";

function Router() {
  return (
    <Switch>
      <Route exact path="/">
        <Redirect to="/issue" />
      </Route>

      <Route exact path="/issue" component={IssueGridPage} />
    </Switch>
  );
}

export default Router;
