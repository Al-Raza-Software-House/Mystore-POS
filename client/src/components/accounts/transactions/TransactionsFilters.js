import React, { useEffect, useRef, useMemo } from 'react';
import { Box, Button, makeStyles, Collapse } from '@material-ui/core';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faChevronUp, faPlus, faSearch, faSync, faUndo } from '@fortawesome/free-solid-svg-icons';
import { changeFilters } from '../../../store/actions/accountActions';
import { Field, reduxForm, getFormValues, initialize } from 'redux-form';
import SelectInput from '../../library/form/SelectInput';
import { useSelector } from 'react-redux';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { paymentModes } from '../../../utils/constants';
import DateRangeInput from '../../library/form/DateRangeInput';

const formName = 'transactionsFilters';

const useStyles = makeStyles(theme => ({
  searchBtn: {
    paddingLeft: 0,
    paddingRight: 0,
    minWidth: 45,
    minHeight: 40,
    display: 'inline-flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16
  },
  startIcon: {
    marginRight: 0
  },
  heading: {
    fontSize: theme.typography.pxToRem(15),
    fontWeight: theme.typography.fontWeightBold
  }
}));

const paymentModeOptions = [
  { id: 0, title: "Select transaction type" },
  { id: paymentModes.PAYMENT_MODE_CASH, title: "Cash" },
  { id: paymentModes.PAYMENT_MODE_BANK, title: "Bank" },
]

const defaultFilters = {
  dateRange: "",
  type: 0,
  userId: 0,
  bankId: 0,
  headId: 0
}

const areFiltersApplied = (filters) => {
  let filtersApplied = false;
  for(let key in filters)
  {
    if(!filters.hasOwnProperty(key)) continue;
    if(filters[key] !== defaultFilters[key])
    {
      filtersApplied = true;
    }
    if(filtersApplied) break;
  }
  return filtersApplied;
}

function TransactionsFilters(props){
  const { dispatch, pristine, dirty } = props;
  const { storeId, heads, banks, users, moreFilters, setMoreFilters, storeFilters } = props;
  
  const classes = useStyles();
  const filters = useSelector(state => getFormValues(formName)(state));
  const pageLoad = useRef();

  //Run only at page load, if filtersWereApplied before, clearfilters and reload items
  useEffect(() => {
    if(pageLoad.current) return;
    pageLoad.current = storeFilters;
    let filtersApplied = areFiltersApplied(storeFilters);
      if(filtersApplied)
        dispatch( changeFilters(storeId, defaultFilters) );
  }, [dispatch, storeId, storeFilters]);

  //for reset button
  let filtersApplied = areFiltersApplied(storeFilters);

  const resetFilters = () => {
    dispatch( initialize(formName, defaultFilters) );
    dispatch( changeFilters(storeId, {...defaultFilters}) );
  }

  const searchRecords = () => {
    dispatch( initialize(formName, filters) );
    dispatch( changeFilters(storeId, filters) );
  }

  const headOptions = useMemo(() => {
    let options = heads.map(head => ({ id: head._id, title: head.name }) );
    return [{ id: 0, title: "Select account head" }, ...options]
  }, [heads]);

  const bankOptions = useMemo(() => {
    let options = banks.map(bank => ({ id: bank._id, title: bank.name }) );
    return [{ id: 0, title: "Select bank" }, ...options]
  }, [banks]);

  const userOptions = useMemo(() => {
    let options = users.map(user => ({ id: user._id, title: user.name }) );
    return [{ id: 0, title: "Select user" }, ...options]
  }, [users]);

  return(
    <>
    <Box width="100%" justifyContent="flex-end" alignItems="flex-start" display="flex">
      <Box flexGrow={1} display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap">
        <Box width={{ xs: '100%', md: '31%' }} >
          <Field
            component={SelectInput}
            options={headOptions}
            name="headId"
            fullWidth={true}
            variant="outlined"
            margin="dense"
          />
        </Box>
        <Box width={{ xs: '100%', md: '31%' }} >
          <Field
            component={SelectInput}
            options={paymentModeOptions}
            name="type"
            fullWidth={true}
            variant="outlined"
            margin="dense"
          />
        </Box>
        <Box width={{ xs: '100%', md: '31%' }} alignSelf="flex-start" display="flex" >
          <Box>
            <Button title="Search" disabled={pristine || !dirty} onClick={searchRecords} startIcon={ <FontAwesomeIcon icon={faSearch} /> } classes={{ root: classes.searchBtn, startIcon: classes.startIcon }} variant="outlined" color="primary" disableElevation ></Button>
            <Button title={ filtersApplied ? "Reset Filters" : "Refresh" }  onClick={resetFilters} startIcon={ <FontAwesomeIcon icon={filtersApplied ? faUndo : faSync}  /> } classes={{ root: classes.searchBtn, startIcon: classes.startIcon }} variant="outlined" color="primary" disableElevation ></Button>
          </Box>
          <Button color="primary" onClick={() => setMoreFilters(!moreFilters) } endIcon={ moreFilters ? <FontAwesomeIcon icon={faChevronUp} /> : <FontAwesomeIcon icon={faChevronDown} /> }>{ moreFilters ? "Less" : "More" }</Button>
        </Box>
      </Box>
      <Box pt={1} minWidth="160px" display="flex" justifyContent="center">
        <Button startIcon={ <FontAwesomeIcon icon={faPlus} /> } variant="contained" color="primary" disableElevation component={Link} to="/accounts/transactions/new" >New Transaction</Button>
      </Box>
    </Box>
    <Collapse in={moreFilters} style={{width: '100%'}}>
      <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap">
        <Box width={{ xs: '100%', md: '31%' }} >
          <Field
            component={DateRangeInput}
            label="Date Range"
            name="dateRange"
            placeholder="Select Date Range..."
            fullWidth={true}
            variant="outlined"
            margin="dense"
          />
        </Box>
        <Box width={{ xs: '100%', md: '31%' }} >
          <Field
            component={SelectInput}
            options={bankOptions}
            name="bankId"
            fullWidth={true}
            variant="outlined"
            margin="dense"
          />
        </Box>
        <Box width={{ xs: '100%', md: '31%' }} >
          <Field
            component={SelectInput}
            options={userOptions}
            name="userId"
            fullWidth={true}
            variant="outlined"
            margin="dense"
          />
        </Box>
      </Box>
    </Collapse>
    </>
  )
}

const mapStateToProps = state => {
  const storeId = state.stores.selectedStoreId;
  const store = state.stores.stores.find(store => store._id === storeId);
  const storeTxns = state.accounts.transactions[storeId] ? state.accounts.transactions[storeId] : {
    records: [],
    totalRecords: 0,
    recordsLoaded: false,
    filters: {}
  }
  return {
    storeId,
    users: store.users.map(user => user.record),
    heads: state.accounts.heads[storeId] ? state.accounts.heads[storeId] : [],
    banks: state.accounts.banks[storeId] ? state.accounts.banks[storeId] : [],
    storeFilters: storeTxns.filters
  }
}

export default compose(
  connect(mapStateToProps),
  reduxForm({
    form: formName,
    initialValues: defaultFilters
  })
)
(TransactionsFilters);