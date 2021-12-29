import React from 'react';
import { Grid, makeStyles, CircularProgress, Typography } from '@material-ui/core';
import { ThemeProvider } from '@material-ui/styles';
import theme from '../../config/MuiTheme';

const useStyles = makeStyles(() => ({
  container:{
    height: '100%'
  },
  item: {
    textAlign: "center"
  }
}))

const AppPreloader = ({ message }) => {
  const classes = useStyles();
  return (
    <ThemeProvider theme={theme}>
      <Grid container className={classes.container} alignContent="center" justifyContent="center">
        <Grid item className={classes.item}>
          <CircularProgress color="primary"/>
          <Typography variant="h6">{message}</Typography>
        </Grid>
      </Grid>
    </ThemeProvider>
  );
}
 
export default AppPreloader;