import React, { useEffect, useRef } from 'react';
import { Box, Button, makeStyles } from '@material-ui/core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {  faSearch, faSync, faUndo } from '@fortawesome/free-solid-svg-icons';
import { changeFilters } from '../../store/actions/closingActions';
import { Field, reduxForm, getFormValues, initialize } from 'redux-form';
import { useSelector } from 'react-redux';
import { compose } from 'redux';
import { connect } from 'react-redux';
import DateRangeInput from '../library/form/DateRangeInput';

const formName = 'closingsFilters';

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

const defaultFilters = {
  dateRange: "",
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

function ClosingFilters(props){
  const { dispatch, pristine, dirty } = props;
  const { storeId, storeFilters } = props;
  
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

  return(
    <>
    <Box width="100%" justifyContent="flex-end" alignItems="flex-start" display="flex" pt={2}>
      <Box flexGrow={1} display="flex" justifyContent="flex-start" alignItems="center" flexWrap="wrap">
        <Box width={{ xs: '100%', md: '40%' }} mr={2} >
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
        <Box width={{ xs: '100%', md: '31%' }} alignSelf="flex-start" display="flex" pt={1}>
            <Button title="Search" disabled={pristine || !dirty} onClick={searchRecords} startIcon={ <FontAwesomeIcon icon={faSearch} /> } classes={{ root: classes.searchBtn, startIcon: classes.startIcon }} variant="outlined" color="primary" disableElevation ></Button>
            <Button title={ filtersApplied ? "Reset Filters" : "Refresh" }  onClick={resetFilters} startIcon={ <FontAwesomeIcon icon={filtersApplied ? faUndo : faSync}  /> } classes={{ root: classes.searchBtn, startIcon: classes.startIcon }} variant="outlined" color="primary" disableElevation ></Button>
        </Box>
      </Box>
    </Box>
    </>
  )
}

const mapStateToProps = state => {
  const storeId = state.stores.selectedStoreId;
  const closings = state.closings[storeId] ? state.closings[storeId] : {
    records: [],
    totalRecords: 0,
    recordsLoaded: false,
    filters: {}
  }
  return {
    storeId,
    storeFilters: closings.filters
  }
}

export default compose(
  connect(mapStateToProps),
  reduxForm({
    form: formName,
    initialValues: defaultFilters
  })
)
(ClosingFilters);