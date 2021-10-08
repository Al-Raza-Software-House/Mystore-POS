import React, { useState } from 'react';
import { Tabs, Tab, makeStyles } from '@material-ui/core';
import { Link, useLocation } from 'react-router-dom';
import { useEffect } from 'react';

const useStyles = makeStyles(theme => ({
  tab: {
    textTransform: 'capitalize',
    color: '#606060',
    borderBottomWidth: '3px'
  },
  indicator: {
    height: '4px',
    borderTopLeftRadius: '5px',
    borderTopRightRadius: '5px',
  }
}));

function StyledTabs({ menues, minWidth='80px' }){
  const classes = useStyles();
  const { pathname } = useLocation();
  let index = menues.findIndex(item => item.to === pathname);
  const [selected, setSelected] = useState(index >= 0 ? index: 0);
  useEffect(() => {
    let index = menues.slice().reverse().findIndex(item => pathname.startsWith(item.to) );
    index = menues.length - 1 - index;
    if(index >= 0)
      setSelected(index);
  }, [pathname, menues]);
  return(
    <Tabs 
      onChange={(event, newValue) => setSelected(newValue)} 
      value={selected}
      variant="scrollable"
      scrollButtons="auto"
      indicatorColor="primary"
      textColor="primary"
      classes={{
        indicator: classes.indicator
      }}
      >
      {
        menues.map(item => (
          <Tab label={item.title} key={item.to} to={item.to} component={Link} className={classes.tab} style={{ minWidth }} />
        ))
      }
    </Tabs>
  )
}

export default StyledTabs;