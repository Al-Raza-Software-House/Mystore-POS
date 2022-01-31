import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import store from './store/';
import { Provider } from 'react-redux';
import theme from './config/MuiTheme';
import { ThemeProvider } from '@material-ui/styles';
import { configureAxios } from './config/axios'; //setup Axios interceptors
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import ReactGA from "react-ga4";

configureAxios(store);
ReactGA.initialize(process.env.REACT_APP_GA_ID, {
  testMode: process.env.NODE_ENV !== 'production'
});
const AppSetup = (
  <Provider store={store}>
      <ThemeProvider theme={theme}>
        <App />
      </ThemeProvider>
  </Provider>
);
ReactDOM.render(AppSetup, document.getElementById('root'));
serviceWorkerRegistration.register();