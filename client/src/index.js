import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import store from './store/';
import { Provider } from 'react-redux';
import theme from './config/MuiTheme';
import { ThemeProvider } from '@material-ui/styles';
import { configureAxios } from './config/axios'; //setup Axios interceptors

configureAxios(store);

const AppSetup = (
  <Provider store={store}>
      <ThemeProvider theme={theme}>
        <App />
      </ThemeProvider>
  </Provider>
);
ReactDOM.render(AppSetup, document.getElementById('root'));