import React, { useEffect, useRef } from 'react';
import { Box, Button, makeStyles, Typography, Collapse } from '@material-ui/core';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faChevronUp, faPlus, faSearch, faUndo } from '@fortawesome/free-solid-svg-icons';
import { changeFilters } from '../../../store/actions/itemActions';
import SelectCategory from './itemForm/SelectCategory';
import SelectSupplier from './itemForm/SelectSupplier';
import SelectCategoryProperty from './itemForm/SelectCategoryProperty';
import SelectItemProperty from './itemForm/SelectItemProperty';
import { Field, reduxForm, getFormValues, initialize } from 'redux-form';
import TextInput from '../../library/form/TextInput';
import SelectInput from '../../library/form/SelectInput';
import { useSelector } from 'react-redux';

const formName = 'itemListFilters';

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

const itemTypes = [
  {id: 0, title: "Select item type"},
  {id: 1, title: "Low stock items"},
  {id: 2, title: "Over stock items"},
  {id: 3, title: "Expired items"},
  {id: 4, title: "Service items"},
  {id: 5, title: "Active items"},
  {id: 6, title: "Inactive items"},
]

const defaultFilters = {
  itemCode: "",
  itemName: "",
  categoryId: null,
  supplierId: null,
  itemType: 0,
  itemPropertyValues: {
    property1: null,
    property2: null,
    property3: null,
    property4: null,
  },
  categoryPropertyValues: {
    property1: null,
    property2: null,
    property3: null,
    property4: null,
  }
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

function ItemFilters(props){
  const { dispatch, pristine, dirty } = props;
  const { storeId, moreFilters, setMoreFilters, categoryId, storeFilters } = props;
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
    dispatch( changeFilters(storeId, defaultFilters) );
  }

  const searchItems = () => {
    dispatch( initialize(formName, filters) );
    dispatch( changeFilters(storeId, filters) );
  }

  return(
    <>
    <Box width="100%" justifyContent="flex-end" alignItems="flex-start" display="flex">
      <Box flexGrow={1} display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap">
        <Box width={{ xs: '100%', md: '31%' }} >
          <Field
              component={TextInput}
              label="Item Code"
              name="itemCode"
              placeholder="Enter item code..."
              fullWidth={true}
              variant="outlined"
              margin="dense"
            />
        </Box>
        <Box width={{ xs: '100%', md: '31%' }} >
          <Field
            component={TextInput}
            label="Item Name"
            name="itemName"
            placeholder="Enter item name..."
            fullWidth={true}
            variant="outlined"
            margin="dense"
          />
        </Box>
        <Box width={{ xs: '100%', md: '31%' }} alignSelf="flex-start" pt={1} display="flex" >
          <Box>
            <Button title="Search Items" disabled={pristine || !dirty} onClick={searchItems} startIcon={ <FontAwesomeIcon icon={faSearch} /> } classes={{ root: classes.searchBtn, startIcon: classes.startIcon }} variant="outlined" color="primary" disableElevation ></Button>
            <Button title="Reset Filters" disabled={!filtersApplied} onClick={resetFilters} startIcon={ <FontAwesomeIcon icon={faUndo} /> } classes={{ root: classes.searchBtn, startIcon: classes.startIcon }} variant="outlined" color="primary" disableElevation ></Button>
          </Box>
          <Button color="primary" onClick={() => setMoreFilters(!moreFilters) } endIcon={ moreFilters ? <FontAwesomeIcon icon={faChevronUp} /> : <FontAwesomeIcon icon={faChevronDown} /> }>{ moreFilters ? "Less" : "More" }</Button>
        </Box>
      </Box>
      <Box pt={1} minWidth="160px" display="flex" justifyContent="center">
        <Button startIcon={ <FontAwesomeIcon icon={faPlus} /> } variant="contained" color="primary" disableElevation component={Link} to="/stock/items/create" >New Item</Button>
      </Box>
    </Box>
    <Collapse in={moreFilters} style={{width: '100%'}}>
      <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap">
        <Box width={{ xs: '100%', md: '31%' }} >
          <SelectCategory formName={formName} addNewRecord={false}/>
        </Box>
        <Box width={{ xs: '100%', md: '31%' }} >
          <SelectSupplier formName={formName} addNewRecord={false}/>
        </Box>
        <Box width={{ xs: '100%', md: '31%' }} >
          <Field
            component={SelectInput}
            options={itemTypes}
            label=""
            id="itemType"
            name="itemType"
            variant="outlined"
            margin="dense"
            fullWidth={true}
          />
        </Box>
      </Box>
      <Typography className={classes.heading}>Item Properties</Typography>
      <Box display="flex" flexWrap="wrap" justifyContent="space-between" alignItems="center" width="100%">
        <Box width={{ xs: '100%', md: '24%' }} >
          <SelectItemProperty formName={formName} propertyId="property1" addNewRecord={false} />
        </Box>
        <Box width={{ xs: '100%', md: '24%' }} >
          <SelectItemProperty formName={formName} propertyId="property2" addNewRecord={false} />
        </Box>
        <Box width={{ xs: '100%', md: '24%' }}>
          <SelectItemProperty formName={formName} propertyId="property3" addNewRecord={false} />
        </Box>
        <Box width={{ xs: '100%', md: '24%' }}>
          <SelectItemProperty formName={formName} propertyId="property4" addNewRecord={false} />
        </Box>  
      </Box>
      {
        !categoryId ? null :
        <>
        <Typography className={classes.heading}>Category Properties</Typography>
        <Box display="flex" flexWrap="wrap" justifyContent="space-between" alignItems="center" width="100%">
          <Box width={{ xs: '100%', md: '24%' }} >
            <SelectCategoryProperty formName={formName} categoryId={categoryId} propertyId="property1" addNewRecord={false} />
          </Box>
          <Box width={{ xs: '100%', md: '24%' }} >
            <SelectCategoryProperty formName={formName} categoryId={categoryId} propertyId="property2" addNewRecord={false} />
          </Box>
          <Box width={{ xs: '100%', md: '24%' }} >
            <SelectCategoryProperty formName={formName} categoryId={categoryId} propertyId="property3" addNewRecord={false} />
          </Box>
          <Box width={{ xs: '100%', md: '24%' }} >
            <SelectCategoryProperty formName={formName} categoryId={categoryId} propertyId="property4" addNewRecord={false} />
          </Box>
        </Box>
        </>
      }
    </Collapse>
    </>
  )
}

export default reduxForm({
  form: formName,
  initialValues: defaultFilters
})(ItemFilters);