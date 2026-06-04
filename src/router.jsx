import React from "react";
import { Switch, Route, Redirect, Link } from "react-router-dom";

import IssueGridPage from "components/pages/issue";
import DevAreaRevGridPage from "components/pages/devAreaRev";
import PupsPlanGridPage from "components/pages/pupsPlan";
import IssueReleaseGridPage from "components/pages/issueRelease";

function Router() {
  return (
    <>
      <nav className="app-nav">
        <Link to="/issue">Owner Code</Link>
        <Link to="/dev-area-rev">Dev Area Rev</Link>
        <Link to="/pups-plan">목적별 계획</Link>
        <Link to="/issue-release">불출</Link>
      </nav>

      <Switch>
        <Route exact path="/">
          <Redirect to="/issue" />
        </Route>

        <Route exact path="/issue" component={IssueGridPage} />
        <Route exact path="/dev-area-rev" component={DevAreaRevGridPage} />
        <Route exact path="/pups-plan" component={PupsPlanGridPage} />
        <Route exact path="/issue-release" component={IssueReleaseGridPage} />
      </Switch>
    </>
  );
}

export default Router;
