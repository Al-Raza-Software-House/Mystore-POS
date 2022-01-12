import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { faWindowMaximize, faSearch, faUndo } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Box, Button, makeStyles, Dialog, DialogContent, DialogActions } from '@material-ui/core';
import { useSelector } from 'react-redux';
import { Field, formValueSelector, initialize, reduxForm } from 'redux-form';
import TextInput from './form/TextInput';
import SelectCategory from '../stock/items/itemForm/SelectCategory';
import SelectSupplier from '../stock/items/itemForm/SelectSupplier';
import { useDispatch } from 'react-redux';
import ItemPickerTable from './ItemPickerTable';

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
  let items = useSelector(state => state.items[storeId].allItems );
  items = useMemo(() => showServiceItems ? items.filter(item => item.isActive === true) : items.filter(item => item.isServiceItem === false && item.isActive === true), [items, showServiceItems]);

  const [filteredItems, setFilteredItems] = useState([]);

  useEffect(() => {
    if(popupOpen)
      dispatch( initialize(formName, { supplierId, itemCode: "", itemName: "", categoryId: null }) )
    if(supplierId)
      setFilteredItems( items.filter(item => item.supplierId === supplierId) );
    else
      setFilteredItems(items);
  }, [supplierId, popupOpen, dispatch, items]);

  const itemName = useSelector(state => formSelector(state, "itemName"));
  const itemCode = useSelector(state => formSelector(state, "itemCode"));
  const categoryId = useSelector(state => formSelector(state, "categoryId"));
  const filterSupplierId = useSelector(state => formSelector(state, "supplierId"));

  const searchRecords = useCallback(() => {
    let matches = items.filter(item => {
      if(filterSupplierId && item.supplierId !== filterSupplierId) return false;
      if(categoryId && item.categoryId !== categoryId) return false;
      if(itemName && item.itemName.toLowerCase().indexOf( itemName.toLowerCase() ) === -1 ) return false;
      if(itemCode)
      {
        if(item.sizeId && (`${item.itemCode}-${item.sizeCode}-${item.combinationCode}`).toLowerCase().indexOf( itemCode.toLowerCase() ) === -1)
          return false;
        else if(!item.sizeId && item.itemCode.toLowerCase().indexOf( itemCode.toLowerCase() ) === -1 )
          return false;

      }
      return true;
    });
    setFilteredItems(matches);
  }, [itemName, itemCode, categoryId, filterSupplierId, items]);

  const resetFilters = useCallback(() => {
    dispatch( initialize(formName, { itemCode: "", itemName: "", categoryId: null, supplierId: null }) );
    setFilteredItems(items);
  }, [dispatch, items]);

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
    <Dialog open={popupOpen} fullWidth maxWidth="md" onClose={handleClose} aria-labelledby="form-dialog-title">
      <DialogContent style={{ minHeight: "80vh" }}>
        <Filters searchRecords={searchRecords} resetFilters={resetFilters} />
        <ItemPickerTable items={filteredItems} selectItem={selectItem} removeItem={removeItem} selectedItems={selectedItems} />
      </DialogContent>
      <DialogActions style={{ justifyContent: 'center' }}>
        <Button disableElevation type="button" onClick={handleClose} color="primary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
    </>
  )
}


const Filters = reduxForm({
  'form': formName
})(
  (props) => {
    const { searchRecords, resetFilters } = props;
    const classes = useStyles();
    return(
      <form>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap">
          <Box width={{ xs: "100%", md: "20%" }}>
            <Field
              component={TextInput}
              label="Item Name"
              name="itemName"
              placeholder="Search by item name..."
              fullWidth={true}
              variant="outlined"
              margin="dense"
            />
          </Box>
          <Box width={{ xs: "100%", md: "20%" }}>
            <Field
              component={TextInput}
              label="Item Code"
              name="itemCode"
              placeholder="Search by item code..."
              fullWidth={true}
              variant="outlined"
              margin="dense"
            />
          </Box>
          <Box width={{ xs: "100%", md: "20%" }}>
            <SelectCategory formName={formName} addNewRecord={false} />
          </Box>
          <Box width={{ xs: "100%", md: "20%" }}>
            <SelectSupplier formName={formName} addNewRecord={false} />
          </Box>
          <Box width={{ xs: "100%", md: "15%" }} pt={1}>
            <Button title="Search Items" onClick={searchRecords} startIcon={ <FontAwesomeIcon icon={faSearch} /> } classes={{ root: classes.searchBtn, startIcon: classes.startIcon }} variant="outlined" color="primary" disableElevation ></Button>
            <Button title="Reset Filters"  onClick={resetFilters} startIcon={ <FontAwesomeIcon icon={faUndo}  /> } classes={{ root: classes.searchBtn, startIcon: classes.startIcon }} variant="outlined" color="primary" disableElevation ></Button>
          </Box>
        </Box>
      </form>
    )
  }
);

export default ItemPickerPopup