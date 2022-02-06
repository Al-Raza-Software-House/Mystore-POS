import React, { useEffect, useMemo } from 'react';
import { Box, Button, makeStyles, Paper } from '@material-ui/core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUndo } from '@fortawesome/free-solid-svg-icons';
import { reduxForm, initialize, getFormValues } from 'redux-form';
import { useSelector } from 'react-redux';
import SelectCategory from 'components/stock/items/itemForm/SelectCategory';
import SelectSupplier from 'components/stock/items/itemForm/SelectSupplier';
import ReactGA from "react-ga4";

const formName = 'stockValueFilters';

const useStyles = makeStyles(theme => ({
  stats:{
    backgroundColor: "#fff",
    width: 180,
    height: 150,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    color: "#2196f3",
    fontSize: 16,
    marginBottom: theme.spacing(2)
  }
}));

const defaultFilters = {
  categoryId: null,
  supplierId: null
}

const areFiltersApplied = (filters) => {
  let filtersApplied = false;
  for(let key in filters)
  {
    if(!filters.hasOwnProperty(key)) continue;
    if(typeof filters[key] === 'object')
      for(let subKey in filters[key])
      {
        if(!filters[key].hasOwnProperty(subKey)) continue;
        if(filters[key][subKey] !== defaultFilters[key][subKey])
        {
          filtersApplied = true;
          break;
        }
      }
    else if(filters[key] !== defaultFilters[key])
    {
      filtersApplied = true;
    }
    if(filtersApplied) break;
  }
  return filtersApplied;
}

function StockValue(props){
  const { dispatch } = props;
  const storeId = useSelector(state => state.stores.selectedStoreId);
  const classes = useStyles();
  const formFilters = useSelector(state => getFormValues(formName)(state));

  useEffect(() => {
    ReactGA.send({ hitType: "pageview", page: "/reports/stock/stockvalue", 'title' : "Reports-Stock-Value" });
  }, []);

  const allItems = useSelector(state => state.items[storeId] ? state.items[storeId].allItems : [] );
  const parentItems = useMemo(() => allItems.filter(record => !record.isServiceItem && record.packParentId === null), [allItems]);

  const stats = useMemo(() => {
    let stats = {
      items: 0,
      stock: 0,
      cost: 0,
      retail: 0,
      margin: 0
    }
    let items = parentItems;
    if(formFilters && formFilters.categoryId)
      items = items.filter(item => item.categoryId === formFilters.categoryId);
    if(formFilters && formFilters.supplierId)
      items = items.filter(item => item.supplierId === formFilters.supplierId);

    stats.items = items.length;
    stats.stock = items.length === 0 ? 0 : items.reduce((total, item) => total + item.currentStock, 0);
    stats.cost = items.length === 0 ? 0 : items.reduce((total, item) => total + (item.currentStock * item.costPrice), 0);
    stats.retail = items.length === 0 ? 0 : items.reduce((total, item) => total + (item.currentStock * item.salePrice), 0);

    stats.stock = +stats.stock.toFixed(2);
    stats.cost = Math.round(stats.cost);
    stats.retail = Math.round(stats.retail);
    stats.margin = stats.retail - stats.cost;
    return stats;
  }, [parentItems, formFilters])
  //for reset button
  let filtersApplied = useMemo(() => areFiltersApplied(formFilters), [formFilters]);

  const resetFilters = () => {
    dispatch( initialize(formName, defaultFilters) );
  }

  return(
    <>
    <Box width="100%" justifyContent="flex-end" alignItems="flex-start" display="flex" mb={0}>
      <Box flexGrow={1} display="flex" justifyContent="flex-start" alignItems="center" flexWrap="wrap">
        <Box width={{ xs: '100%', md: '30%' }} mx={2}>
          <SelectCategory formName={formName} addNewRecord={false} showError={false}/>
        </Box>
        <Box width={{ xs: '100%', md: '30%' }} mx={2}>
          <SelectSupplier formName={formName} addNewRecord={false} showError={false}/>
        </Box>
        <Box minWidth="125px" alignSelf="flex-start" pt={1} display="flex" >
            {
              filtersApplied ? 
              <Button title="Reset Filters"  onClick={resetFilters} startIcon={ <FontAwesomeIcon icon={faUndo}  /> } variant="outlined" color="primary" disableElevation >Reset</Button>
              : null
            }
        </Box>
      </Box>
    </Box>
    <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" mt={4}>
      <Paper className={classes.stats} elevation={5}>
        <Box style={{ color: "#2196f3", fontWeight: 'bold', fontSize: 26 }} mb={3} >{ stats.items.toLocaleString() }</Box>
        <span style={{ color: "#606060" }} >Items</span>
      </Paper>

      <Paper className={classes.stats} elevation={5}>
        <Box style={{ color: "#2196f3", fontWeight: 'bold', fontSize: 26 }} mb={3} >{ stats.stock.toLocaleString() }</Box>
        <span style={{ color: "#606060" }} >Stock</span>
      </Paper>

      <Paper className={classes.stats} elevation={5}>
        <Box style={{ color: "#2196f3", fontWeight: 'bold', fontSize: 26 }} mb={3} >{ stats.cost.toLocaleString() }</Box>
        <span style={{ color: "#606060" }} >Cost</span>
      </Paper>

      <Paper className={classes.stats} elevation={5}>
        <Box style={{ color: "#2196f3", fontWeight: 'bold', fontSize: 26 }} mb={3} >{ stats.retail.toLocaleString() }</Box>
        <span style={{ color: "#606060" }} >Retail</span>
      </Paper>

      <Paper className={classes.stats} elevation={5}>
        <Box style={{ color: "#2196f3", fontWeight: 'bold', fontSize: 26 }} mb={3} >{ stats.margin.toLocaleString() }</Box>
        <span style={{ color: "#606060" }} >Margin</span>
      </Paper>
    </Box>
    </>
  )
}


export default reduxForm({
  form: formName
})(StockValue);