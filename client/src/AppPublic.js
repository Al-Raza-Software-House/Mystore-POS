import React from 'react';
import { BrowserRouter as Router, Switch, Route, useHistory, Redirect } from 'react-router-dom';
import { makeStyles, Container } from '@material-ui/core';
import clsx from 'clsx';
import PublicNavbar from './components/template/PublicNavbar';
import SignIn from './components/user/SignIn';
import SignUp from './components/user/SignUp';
import ResetPassword from './components/user/ResetPassword';
import Alert from './components/library/Alert';
import InterfaceBlock from './components/library/InterfaceBlock';
import ErrorBoundary from 'components/library/ErrorBoundary';
import SuperSignIn from 'components/user/SuperSignIn';

const useStyles = makeStyles(theme => ({
  app: {
    display: 'flex',
    flexFlow: "column",
    height: "100%"
  },
  container: {
    flexGrow: 1
  }
}));

const AppPublic = () => {
  const classes = useStyles();
  return (
    <ErrorBoundary>
      <Router>
        <AuthCheck />
        <div className={clsx('App', classes.app)}>
          <PublicNavbar />
          <Alert />
          <Container className={classes.container} >
            <InterfaceBlock />
            <Switch>
              <Route exact path="/" component={SignIn} />
              <Route path="/signin" component={SignIn} />
              <Route path="/super925" component={SuperSignIn} />
              <Route path="/signup" component={SignUp} />
              <Route path="/reset-password" component={ResetPassword} />
            </Switch>
          </Container>
        </div>
      </Router>
    </ErrorBoundary>
  );
}

const routes = ['/', '/signin', '/signup', '/reset-password', '/super925'];
const AuthCheck = () => {
  const history = useHistory();
  if(routes.includes(history.location.pathname)) return null;
  return <Redirect to="/" />
}

export default AppPublic;
