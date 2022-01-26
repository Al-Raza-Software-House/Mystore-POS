import React, { useEffect, useMemo } from 'react';
import { Box, Button, makeStyles, Typography, Collapse } from '@material-ui/core';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faChevronUp, faPlus, faUndo } from '@fortawesome/free-solid-svg-icons';
import { changeFilters } from '../../../store/actions/itemActions';
import SelectCategory from './itemForm/SelectCategory';
import SelectSupplier from './itemForm/SelectSupplier';
import SelectCategoryProperty from './itemForm/SelectCategoryProperty';
import SelectItemProperty from './itemForm/SelectItemProperty';
import { Field, reduxForm, initialize, getFormValues } from 'redux-form';
import SelectInput from '../../library/form/SelectInput';
import { useSelector } from 'react-redux';
import SearchInput from 'components/library/form/SearchInput';

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
  {id: 0, title: "Item type"},
  {id: 1, title: "Low stock items"},
  {id: 2, title: "Over stock items"},
  {id: 3, title: "Service items"},
  {id: 4, title: "Active items"},
  {id: 5, title: "Inactive items"},
]

const defaultFilters = {
  itemCodeName: "",
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
  const { dispatch } = props;
  const { storeId, moreFilters, setMoreFilters, categoryId } = props;
  const classes = useStyles();
  const formFilters = useSelector(state => getFormValues(formName)(state));

  useEffect(() => {
    dispatch( changeFilters(storeId, formFilters) );
  }, [formFilters, storeId, dispatch])

  //for reset button
  let filtersApplied = useMemo(() => areFiltersApplied(formFilters), [formFilters]);

  const resetFilters = () => {
    dispatch( initialize(formName, defaultFilters) );
  }

  return(
    <>
    <Box width="100%" justifyContent="flex-end" alignItems="flex-start" display="flex" mb={0}>
      <Box flexGrow={1} display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap">
        <Box width={{ xs: '100%', md: '25%' }} >
          <Field
              component={SearchInput}
              label="Search"
              name="itemCodeName"
              placeholder="Search by item name or code..."
              fullWidth={true}
              variant="outlined"
              margin="dense"
              showError={false}
            />
        </Box>
        <Box width={{ xs: '100%', md: '20%' }} >
          <SelectCategory formName={formName} addNewRecord={false} showError={false}/>
        </Box>
        <Box width={{ xs: '100%', md: '20%' }}>
          <SelectSupplier formName={formName} addNewRecord={false} showError={false}/>
        </Box>
        <Box width={{ xs: '100%', md: '16%' }}>
          <Field
            component={SelectInput}
            options={itemTypes}
            label=""
            id="itemType"
            name="itemType"
            variant="outlined"
            margin="dense"
            fullWidth={true}
            showError={false}
          />
        </Box>
        <Box minWidth="125px" alignSelf="flex-start" pt={1} display="flex" >
            <Button title="Show More Filters"  onClick={() => setMoreFilters(!moreFilters) } startIcon={ moreFilters ? <FontAwesomeIcon icon={faChevronUp} /> : <FontAwesomeIcon icon={faChevronDown} /> } classes={{ root: classes.searchBtn, startIcon: classes.startIcon }} variant="outlined" color="primary" disableElevation ></Button>
            {
              filtersApplied ? 
              <Button title="Reset Filters"  onClick={resetFilters} startIcon={ <FontAwesomeIcon icon={faUndo}  /> } classes={{ root: classes.searchBtn, startIcon: classes.startIcon }} variant="outlined" color="primary" disableElevation ></Button>
              : null
            }
        </Box>
      </Box>
      <Box pt={1} minWidth="86px" display="flex" justifyContent="center">
        <Button startIcon={ <FontAwesomeIcon icon={faPlus} /> } variant="contained" color="primary" disableElevation component={Link} to="/stock/items/create" >New</Button>
      </Box>
    </Box>
    <Collapse in={moreFilters} style={{width: '100%'}}>
      <Typography className={classes.heading}>Item Properties</Typography>
      <Box display="flex" flexWrap="wrap" justifyContent="space-between" alignItems="center" width="100%" mb={1}>
        <Box width={{ xs: '100%', md: '24%' }} >
          <SelectItemProperty formName={formName} propertyId="property1" addNewRecord={false} showError={false} />
        </Box>
        <Box width={{ xs: '100%', md: '24%' }} >
          <SelectItemProperty formName={formName} propertyId="property2" addNewRecord={false} showError={false} />
        </Box>
        <Box width={{ xs: '100%', md: '24%' }}>
          <SelectItemProperty formName={formName} propertyId="property3" addNewRecord={false} showError={false} />
        </Box>
        <Box width={{ xs: '100%', md: '24%' }}>
          <SelectItemProperty formName={formName} propertyId="property4" addNewRecord={false} showError={false} />
        </Box>  
      </Box>
      {
        !categoryId ? null :
        <>
        <Typography className={classes.heading}>Category Properties</Typography>
        <Box display="flex" flexWrap="wrap" justifyContent="space-between" alignItems="center" width="100%" mb={1}>
          <Box width={{ xs: '100%', md: '24%' }} >
            <SelectCategoryProperty formName={formName} categoryId={categoryId} propertyId="property1" addNewRecord={false} showError={false} />
          </Box>
          <Box width={{ xs: '100%', md: '24%' }} >
            <SelectCategoryProperty formName={formName} categoryId={categoryId} propertyId="property2" addNewRecord={false} showError={false}/>
          </Box>
          <Box width={{ xs: '100%', md: '24%' }} >
            <SelectCategoryProperty formName={formName} categoryId={categoryId} propertyId="property3" addNewRecord={false} showError={false} />
          </Box>
          <Box width={{ xs: '100%', md: '24%' }} >
            <SelectCategoryProperty formName={formName} categoryId={categoryId} propertyId="property4" addNewRecord={false} showError={false}/>
          </Box>
        </Box>
        </>
      }
    </Collapse>
    </>
  )
}


export default reduxForm({
  form: formName
})(ItemFilters);