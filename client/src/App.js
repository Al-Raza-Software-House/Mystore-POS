import React, { useEffect, Suspense } from 'react';
import AppPreloader from './components/template/AppPreloader';
import { connect } from 'react-redux';
import { loadAuth } from './store/actions/authActions';
import AppPublic from './AppPublic';
import ErrorBoundary from 'components/library/ErrorBoundary';
const Template = React.lazy(() => import('./components/template/Template'));

function App({ isAuthLoaded, isStorageLoaded, loadAuth, uid }) {
  useEffect(() => {
    if(isStorageLoaded)
      loadAuth(); //check if user already signed-in on page load
  }, [isStorageLoaded, loadAuth]);
  
  

  if(!isAuthLoaded || !isStorageLoaded) return <AppPreloader message="Loading App..." />;
  if(!uid) return <AppPublic />;
  if(uid)
    return (
      <ErrorBoundary>
        <Suspense fallback={<AppPreloader message="Signing in..." />}>
          <Template />
        </Suspense>
      </ErrorBoundary>
    )
  return <AppPreloader message="Something went wrong..." />
}

const mapStateToProps = state => {
  return {
    isStorageLoaded: state.storage.loaded,
    isAuthLoaded: state.auth.isLoaded,
    uid: state.auth.uid ? state.auth.uid : null,
    alert: state.alert
  }
}

export default connect(mapStateToProps, { loadAuth })(App);
