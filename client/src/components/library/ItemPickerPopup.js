import React, { useEffect, useCallback, useMemo, useRef } from 'react';
import { faWindowMaximize,  faUndo } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Box, Button, makeStyles, Dialog, DialogContent, DialogActions } from '@material-ui/core';
import { useSelector } from 'react-redux';
import { Field, formValueSelector, initialize, reduxForm } from 'redux-form';
import SelectCategory from '../stock/items/itemForm/SelectCategory';
import SelectSupplier from '../stock/items/itemForm/SelectSupplier';
import { useDispatch } from 'react-redux';
import ItemPickerTable from './ItemPickerTable';
import { matchSorter } from 'match-sorter';
import SearchInput from './form/SearchInput';
import { useState } from 'react';

const useStyles = makeStyles(theme => ({
  startIcon: {
    marginRight: 0
  },
  actionButton:{
    marginTop: 8,
    marginBottom: 4, 
    paddingLeft: 0, 
    paddingRight: 0, 
    minWidth: 40,
    width: 40,
    height: 40,
    borderLeft: 0,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0
  },
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
}))
const formName = "itemPickerPopupFilters";
const formSelector = formValueSelector(formName);
function ItemPickerPopup(props){
  const {  disabled, supplierId, showServiceItems, selectItem, removeItem, selectedItems, popupOpen, setPopupOpen } = props;
  const classes = useStyles();
  const handleClose = () => setPopupOpen(false);
  const dispatch = useDispatch();

  const storeId = useSelector(state => state.stores.selectedStoreId);
  const storeItems = useSelector(state => state.items[storeId].allItems );
  const activeItems = useMemo(() => showServiceItems ? storeItems.filter(item => item.isActive === true) : storeItems.filter(item => item.isServiceItem === false && item.isActive === true), [storeItems, showServiceItems]);

  useEffect(() => {
    if(popupOpen)
      dispatch( initialize(formName, { itemCodeName: "", categoryId: null, supplierId }) )
  }, [supplierId, popupOpen, dispatch]);

  const itemCodeName = useSelector(state => formSelector(state, "itemCodeName"));
  const categoryId = useSelector(state => formSelector(state, "categoryId"));
  const filterSupplierId = useSelector(state => formSelector(state, "supplierId"));

  const filteredItems = useMemo(() => {
    let items = activeItems;
    if(categoryId)
      items = items.filter(item => item.categoryId === categoryId);
    if(filterSupplierId)
      items = items.filter(item => item.supplierId === filterSupplierId);
    if(itemCodeName)
    {
      items = matchSorter(items, itemCodeName, { keys: ["itemNameLC", 'itemCodeLC'] })
    }
    return items;
  }, [itemCodeName, categoryId, filterSupplierId, activeItems])

  const [renderPopup, setRenderPopup] = useState(false);
  const timerRef = useRef();
  useEffect(() => {
    timerRef.current = setTimeout(() => setRenderPopup(true), 100);
    return () => timerRef.current && clearTimeout(timerRef.current);
  }, []);

  return(
    <>
    <Button 
      type="button"
      disabled={disabled}
      title="Show Item List"
      onClick={() => setPopupOpen(true)}
      classes={{ root: classes.actionButton, startIcon: classes.startIcon }}
      disableElevation  startIcon={ <FontAwesomeIcon icon={faWindowMaximize} size="xs" /> } size="small" edge="end" variant="outlined">
    </Button>
    {
      !renderPopup ? null : 
      <Dialog open={popupOpen} fullWidth maxWidth="md" onClose={handleClose} aria-labelledby="form-dialog-title">
        <DialogContent style={{ minHeight: "80vh" }}>
          <Filters />
          <ItemPickerTable items={filteredItems} selectItem={selectItem} removeItem={removeItem} selectedItems={selectedItems} />
        </DialogContent>
        <DialogActions style={{ justifyContent: 'center' }}>
          <Button disableElevation type="button" onClick={handleClose} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    }
    </>
  )
}


const Filters = reduxForm({
  'form': formName
})(
  (props) => {
    const { dispatch } = props;
    const classes = useStyles();
    
    const resetFilters = useCallback(() => {
      dispatch( initialize(formName, { itemCodeName: "", categoryId: null, supplierId: null }) );
    }, [dispatch]);

    return(
      <form>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" mb={1}>
          <Box width={{ xs: "100%", md: "35%" }}>
            <Field
              component={SearchInput}
              label="Search by name or code"
              name="itemCodeName"
              placeholder="Search by item name or code..."
              fullWidth={true}
              variant="outlined"
              margin="dense"
              showError={false}
            />
          </Box>
          <Box width={{ xs: "100%", md: "25%" }}>
            <SelectCategory formName={formName} addNewRecord={false} showError={false} />
          </Box>
          <Box width={{ xs: "100%", md: "25%" }}>
            <SelectSupplier formName={formName} addNewRecord={false} showError={false} />
          </Box>
          <Box width="50px" pt={1}>
            <Button title="Reset Filters"  onClick={resetFilters} startIcon={ <FontAwesomeIcon icon={faUndo}  /> } classes={{ root: classes.searchBtn, startIcon: classes.startIcon }} variant="outlined" color="primary" disableElevation ></Button>
          </Box>
        </Box>
      </form>
    )
  }
);

export default ItemPickerPopup