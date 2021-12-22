import React, { useEffect } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Switch, Route, useHistory, useLocation } from 'react-router-dom';
import AccountSettings from '../user/AccountSettings';
import { connect } from 'react-redux';
import Dashboard from '../dashboard/Dashboard';
import Stores from '../stores/Stores';
import CreateStore from '../stores/CreateStore';
import StoreSettingsRouter from '../settings/StoreSettingsRouter';
import { salesPerson as salesPersonBlackList } from '../../config/routesBlackList';
import { userTypes } from '../../utils/constants';
import InterfaceBlock from '../library/InterfaceBlock';
import HelpRouter from '../help/HelpRouter';
import BillingRouter from '../billing/BillingRouter';
import StockRouter from '../stock/StockRouter';
import AccountsRouter from '../accounts/AccountsRouter';
import PartiesRouter from '../parties/PartiesRouter';
import PurchaseRouter from '../purchase/PurchaseRouter';
import SaleRouter from '../sale/SaleRouter';


const useStyles = makeStyles((theme) => ({
  content: {
    flexGrow: 1,
    padding: theme.spacing(0),
    paddingTop: theme.spacing(8),
    boxSizing: 'border-box',
    height: '100%',
    width: 'calc(100% - 256px)',
    position: 'relative'
  }
}));

function Content({ userRole }) {
  const classes = useStyles();
  const history = useHistory();
  const location = useLocation();
  useEffect(() => {
    if(userRole === userTypes.USER_ROLE_SALESPERSON && salesPersonBlackList.indexOf(location.pathname) !== -1)
      history.push('/dashboard');
  }, [location.pathname, history, userRole])

  return (
    <main className={classes.content}>
      <InterfaceBlock />
      <Switch>
        <Route exact path="/account-settings" component={AccountSettings} />
        <Route exact path="/dashboard" component={Dashboard} />

        <Route path="/stock" component={StockRouter} />
        <Route path="/sale" component={SaleRouter} />
        <Route path="/purchase" component={PurchaseRouter} />
        <Route path="/parties" component={PartiesRouter} />
        <Route path="/accounts" component={AccountsRouter} />
        
        <Route path="/store-settings" component={StoreSettingsRouter} />
        <Route path="/billing" component={BillingRouter} />

        <Route exact path="/stores" component={Stores} />
        <Route exact path="/stores/create" component={CreateStore} />
        
        <Route path="/help" component={HelpRouter} />

      </Switch>
    </main>
  );
}




const mapStateToProps = (state) => {
  return {
   userRole: state.stores.userRole
  }
}

export default connect(mapStateToProps)(Content);