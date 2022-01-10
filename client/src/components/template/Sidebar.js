import React, { useEffect, useRef } from 'react';
import clsx from 'clsx';
import { makeStyles } from '@material-ui/core/styles';
import { Box, Drawer, List, ListItem, ListItemIcon, ListItemText, Typography } from '@material-ui/core';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTachometerAlt, faLayerGroup, faShoppingCart, faShoppingBasket, faUserFriends, faMoneyBill, faChartLine, faCog, faStoreAlt, faQuestionCircle, faCreditCard, faCircle, faDesktop } from '@fortawesome/free-solid-svg-icons';

import { connect } from 'react-redux';
import { Link, useLocation, Redirect } from 'react-router-dom';
import moment from 'moment';
import { amber } from '@material-ui/core/colors';
import { syncData, stopPing, changeOnlineStatus } from '../../store/actions/systemActions';
import { syncSale } from 'store/actions/saleActions';
import { useMemo } from 'react';
import { isSalesperson } from 'utils';

const drawerWidth = 256;

const useStyles = makeStyles((theme) => ({
  drawer: {
    width: drawerWidth,
    flexShrink: 0,
    whiteSpace: 'nowrap',
    overflowX: 'hidden'
  },
  paper:{
    color: '#606060',
    fontWeight: '500',
    fontSize: '15px',
    justifyContent: "space-between"
  },
  drawerOpen: {
    width: '100%',
    [theme.breakpoints.up('sm')]: {
      width: drawerWidth,
    },
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.easeIn,
      duration: theme.transitions.duration.enteringScreen,
    }),
  },
  drawerClose: {
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
    overflowX: 'hidden',
    width: '0px',
    [theme.breakpoints.up('sm')]: {
      width: theme.spacing(9),
    },
  },
  drawerOpenText: {
    visibility: 'visible',
    transition: theme.transitions.create('visibility', {
      easing: theme.transitions.easing.easeInOut,
      duration: theme.transitions.duration.enteringScreen,
    })
  },
  drawerCloseText: {
    visibility: 'hidden',
    transition: theme.transitions.create('visibility', {
      easing: theme.transitions.easing.easeInOut,
      duration: theme.transitions.duration.enteringScreen,
    })
  },
  drawerIcon:{
    paddingLeft: theme.spacing(1),
    color: '#909090',
    minWidth: '35px'
  },
  drawerActiveIcon:{
    paddingLeft: theme.spacing(1) * 0.5,
    color: theme.palette.primary.main
  },
  activeMenue:{
    boxSizing: 'border-box',
    borderLeft: theme.spacing(1) * 0.5,
    borderColor: theme.palette.primary.main,
    borderStyle: 'solid',
    backgroundColor: 'rgba(0, 0, 0, 0.07)',
    color: theme.palette.primary.main
  },
  toolbar: {
    padding: theme.spacing(0, 1),
    ...theme.mixins.toolbar, //sets min-height to component to force the content appear below the app bar
  },
  expired:{
    color: '#fff',
    backgroundColor: 'red'
  },
  aboutToExpire: {
    color: '#fff',
    backgroundColor: amber[700]
  }
}));

const menues = [
  { to: '/dashboard', title: "Dashboard", icon: <FontAwesomeIcon icon={faTachometerAlt} /> },
  { to: '/stock', title: "Stock", icon: <FontAwesomeIcon icon={faLayerGroup} /> },
  { to: '/sale', title: "Sale", icon: <FontAwesomeIcon icon={faShoppingCart} /> },
  { to: '/purchase', title: "Purchase", icon: <FontAwesomeIcon icon={faShoppingBasket} /> },
  { to: '/parties', title: "Parties", icon: <FontAwesomeIcon icon={faUserFriends} /> },
  { to: '/accounts', title: "Accounts", icon: <FontAwesomeIcon icon={faMoneyBill} /> },
  { to: '/reports', title: "Reports", icon: <FontAwesomeIcon icon={faChartLine} /> },
  { to: '/store-settings', title: "Settings", icon: <FontAwesomeIcon icon={faCog} /> },
  { to: '/billing', title: "Billing", icon: <FontAwesomeIcon icon={faCreditCard} /> },
  { to: '/stores', title: "Stores", icon: <FontAwesomeIcon icon={faStoreAlt} /> },
  { to: '/help', title: "Help", icon: <FontAwesomeIcon icon={faQuestionCircle} /> },
]

const salespersonMenu = [
  { to: '/sale', title: "Sale", icon: <FontAwesomeIcon icon={faShoppingCart} /> },
  { to: '/parties/customers', title: "Customers", icon: <FontAwesomeIcon icon={faUserFriends} /> },
  { to: '/stores', title: "Stores", icon: <FontAwesomeIcon icon={faStoreAlt} /> },
  { to: '/help', title: "Help", icon: <FontAwesomeIcon icon={faQuestionCircle} /> },
]



const publicPages = ['/signin', '/signup', '/reset-password', '/', '/super925'];

function Sidebar({ uid, selectedStoreId, store, userRole, open, setOpen, isLargeScreen, syncData, stopPing, syncSale, online, offlineSales, changeOnlineStatus }) {
  const classes = useStyles();
  const { pathname } = useLocation();
  const pingInterval = useRef();

  //Ping every X seconds to server
  useEffect(() => {
    if(!selectedStoreId && pingInterval.current)
    {
      clearInterval(pingInterval.current);
      pingInterval.current = null;
    }
    else if(selectedStoreId && !pingInterval.current)
    {
      stopPing();//clear ping flag, persited true for ping will not trigger ping
      pingInterval.current = setInterval(syncData, parseInt(process.env.REACT_APP_SERVER_PING_INTERVAL) * 1000);
    }
    return () => {
      if(pingInterval.current)
      {
        clearInterval(pingInterval.current);
        pingInterval.current = null;
      }
    }
  }, [selectedStoreId, syncData, stopPing]);

  useEffect(() => {
    if(!selectedStoreId) changeOnlineStatus(true);
  }, [selectedStoreId, changeOnlineStatus]);

  useEffect(() => {
    if(!online || !selectedStoreId) return;
    syncSale(selectedStoreId);
  }, [syncSale, online, selectedStoreId])

  const expiryStatus = useMemo(() => {
    let status = null;
    if(store)
    {
      const now = moment();
      const expiry = moment(store.expiryDate);
      if(now.isAfter( expiry ))
        status = 'expired';
      else if( now.add(2, 'days').isAfter(expiry) )
        status = 'aboutToExpire'
    }
    return status;
  }, [store]);

  const sideMenues = useMemo(() => {
    let sideMenues = menues;
    if(!selectedStoreId)
      sideMenues = menues.filter(item => (['/stores', '/help'].indexOf(item.to) !== - 1));
    else if(isSalesperson(userRole))
      sideMenues = salespersonMenu;
    return sideMenues;
  }, [selectedStoreId, userRole]);

  //user logged in but is one public page
  if(uid && publicPages.indexOf(pathname) !== -1)
  {
    if(isSalesperson(userRole))
      return <Redirect to="/sale" />
    else
      return <Redirect to="/dashboard" />
  }
  
  //store not selected but user on store selected paths
  if(!selectedStoreId && !pathname.startsWith('/help') && !pathname.startsWith('/stores') && !pathname.startsWith('/account-settings'))
    return <Redirect to="/stores" />
  if(isSalesperson(userRole) && !salespersonMenu.find(record => pathname.startsWith(record.to) ) )
    return <Redirect to="/stores" />
  //store not selected, show only stores, help menue in side bar

  return (
    <Drawer
      variant="permanent"
      className={clsx(classes.drawer, {
        [classes.drawerOpen]: open,
        [classes.drawerClose]: !open,
      })}
      classes={{
        paper: clsx(classes.paper,  {
          [classes.drawerOpen]: open,
          [classes.drawerClose]: !open,
        }),
      }}
    >
      <Box>
        <div className={classes.toolbar} />
        <List>
          {sideMenues.map((item, index) => (
            <ListItem button onClick={() => !isLargeScreen ? setOpen(false) : null} component={Link} key={item.to} to={item.to} 
              className={clsx({ 
                [classes.activeMenue]: pathname.startsWith(item.to),
                [classes.expired]: item.to === '/billing' && expiryStatus === 'expired',
                [classes.aboutToExpire]: item.to === '/billing' && expiryStatus === 'aboutToExpire',
              })}
            >
              <ListItemIcon className={clsx(classes.drawerIcon, { [classes.drawerActiveIcon]: pathname.startsWith(item.to) })}>{ item.icon }</ListItemIcon>
              <ListItemText primary={item.title} disableTypography={true} className={clsx({
                [classes.drawerOpenText]: open,
                [classes.drawerCloseText]: !open,
              })} />
            </ListItem>
          ))}
        </List>
      </Box>
      <Box px={3} mb={3}>
        { offlineSales ? <Typography>{offlineSales} <span className={clsx({
                [classes.drawerOpenText]: open,
                [classes.drawerCloseText]: !open,
              })}>sale(s) are not uploaded </span></Typography> : null }
        <Typography style={{ display:"flex", justifyContent: "flex-start", alignItems: "center" }}> <FontAwesomeIcon icon={faCircle} style={{ color: online ? 'green' : '#828282' }} size="xs" />
          <span className={clsx({
                [classes.drawerOpenText]: open,
                [classes.drawerCloseText]: !open,
              })}> &nbsp; { online ? "Online" : "Offline" }</span>
        </Typography>
        <Typography style={{ fontSize: 14 }} className={clsx({
                [classes.drawerOpenText]: open,
                [classes.drawerCloseText]: !open,
              })}><FontAwesomeIcon icon={faDesktop} /> Version: <b>{process.env.REACT_APP_VERSION}</b></Typography>
              
        <Typography style={{ fontSize: 14 }} className={clsx({
                [classes.drawerOpenText]: open,
                [classes.drawerCloseText]: !open,
              })}>Last Updated: <b>{ moment(process.env.REACT_APP_LAST_UPDATED_ON).format('DD MMM, YYYY') }</b></Typography>
      </Box>
    </Drawer>
  );
}


const mapStateToProps = (state) => {
  const store = state.stores.stores.find(item => item._id === state.stores.selectedStoreId);
  const storeId = state.stores.selectedStoreId;
  let offlineSales = 0;
  if(storeId)
    offlineSales = state.sales[storeId] ? state.sales[storeId].offlineRecords.length : 0;
  return {
   uid: state.auth.uid,
   selectedStoreId: storeId,
   userRole: state.stores.userRole,
   store,
   online: state.system.online,
   appVersion: state.system.appVersion,
   offlineSales
  }
}


export default connect(mapStateToProps, { syncData, stopPing,  syncSale, changeOnlineStatus})(Sidebar);