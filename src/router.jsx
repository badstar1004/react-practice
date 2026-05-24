import React from "react";
import { Switch, Route, Redirect, Link } from "react-router-dom";

import IssueGridPage from "components/pages/issue";
import DevAreaRevGridPage from "components/pages/devAreaRev";

function Router() {
  return (
    <>
      <nav className="app-nav">
        <Link to="/issue">Owner Code</Link>
        <Link to="/dev-area-rev">Dev Area Rev</Link>
      </nav>

      <Switch>
        <Route exact path="/">
          <Redirect to="/issue" />
        </Route>

        <Route exact path="/issue" component={IssueGridPage} />
        <Route exact path="/dev-area-rev" component={DevAreaRevGridPage} />
      </Switch>
    </>
  );
}

export default Router;
