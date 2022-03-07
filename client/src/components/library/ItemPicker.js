import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Box, makeStyles, TextField, Typography } from '@material-ui/core';
import Autocomplete from '@material-ui/lab/Autocomplete';
import { useSelector } from 'react-redux';
import barcodeReader from '@wrurik/barcode-scanner';
import ItemPickerPopup from './ItemPickerPopup';
import { matchSorter } from 'match-sorter';


const useStyles = makeStyles(theme => ({
  inputNoBorder:{
    borderRadius: 0,
  },
  option: {
    '&:not(:last-child)':{
      borderBottom: "1px solid #ececec"
    }
  },
  paper: {
    border: "2px solid #d7d7d7"
  }
}));

const packsFirst = (options, { inputValue }) => {
      let matches = matchSorter(options, inputValue, { keys: ["itemNameLC", 'itemCodeLC'] }).slice(0, 10);
      return matches.sort((a, b) => {
        if(a.packParentId !== null && a.packParentId === b.packParentId && Number(a.packQuantity) > Number(b.packQuantity)) //big quantity first
          return -1;
        if(a.packParentId !== null && a.packParentId === b.packParentId && Number(a.packQuantity) < Number(b.packQuantity)) //big quantity first
          return 1;
        if(a._id === b.packParentId) //packing first
          return 1;
        if(b._id === a.packParentId) //packing first
          return -1;
        return 0;
      });
}

const unitsFirst = (options, { inputValue }) => {
      let matches = matchSorter(options, inputValue, { keys: ["itemNameLC", 'itemCodeLC'] }).slice(0, 10);
      return matches.sort((a, b) => {
        if(a.packParentId !== null && a.packParentId === b.packParentId && Number(a.packQuantity) > Number(b.packQuantity)) //big quantity first
          return 1;
        if(a.packParentId !== null && a.packParentId === b.packParentId && Number(a.packQuantity) < Number(b.packQuantity)) //big quantity first
          return -1;
        if(a._id === b.packParentId) //packing first
          return -1;
        if(b._id === a.packParentId) //packing first
          return 1;
        return 0;
      });
}

function ItemPicker(props) {
  const classes = useStyles();
  const { supplierId, selectedItems, selectItem, removeItem, disabled=false, showServiceItems=false, autoFocus=false, sortBy="packs" } = props;
  const storeId = useSelector(state => state.stores.selectedStoreId);
  let items = useSelector(state => state.items[storeId].allItems );
  items = useMemo(() => showServiceItems ? items.filter(item => item.isActive === true) : items.filter(item => item.isServiceItem === false && item.isActive === true), [items, showServiceItems]);
  const [inputValue, setInputValue] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [popupOpen, setPopupOpen] = useState(false);
  const inputRef = useRef();

  const selectSuggestion = useCallback((item) => {
    if(item)
      selectItem(item);
    setInputValue("");
  }, [selectItem]);

  useEffect(() => {
    if(disabled || popupOpen) return;
    let removeListener = barcodeReader.onScan((itemCode) => {
      let scannedCode = itemCode.toLowerCase();
      let records = items.filter(item => {
        if(item.sizeId)
          return `${item.itemCode}-${item.sizeCode}-${item.combinationCode}`.toLowerCase().indexOf( scannedCode ) !== -1;
        else
          return item.itemCode.toLowerCase().indexOf(scannedCode) !== -1;
      });
      if(records.length === 1)
      {
        selectItem(records[0]);
        setInputValue("");
        setShowSuggestions(false);
      }
      else if(records.length === 0 || records.length > 1)
      {
        setInputValue(itemCode);
        inputRef.current.focus();
        setShowSuggestions(true);
      }
    }, {});

    return () => removeListener()
  }, [disabled, items, selectItem, popupOpen]);

  return(
    <Box display="flex" position="relative" id="item-picker-container">
      <Autocomplete
      renderInput={(params) => <TextField  {...params} label="Search Items" autoFocus={autoFocus} InputLabelProps={{ shrink: true }} margin="dense" inputRef={inputRef}  placeholder="type item name or scan code" variant="outlined" style={{ borderRadius: 0 }} onKeyPress={event => {if(event.key === "Enter") event.preventDefault()}} />}
      classes={{ inputRoot: classes.inputNoBorder, option: classes.option, paper: classes.paper }}
      value={null}
      fullWidth={true}
      options={items}
      getOptionLabel={(option) => option && option.itemName ? option.itemName : ""}
      renderOption={SuggestedItem}
      disabled={disabled}
      inputValue={inputValue}
      onInputChange={(event, newInputValue) => {
        if(event && event.type === 'blur')
        {
        }else
        {
          setInputValue(newInputValue);
          if(newInputValue !== "" && !showSuggestions)
            setShowSuggestions(true);
          else if(newInputValue === "" && showSuggestions)
            setShowSuggestions(false);
        }
      }}
      open={showSuggestions}
      onOpen={event => {
        if(event.type === "mousedown" && inputValue !== "")
          setShowSuggestions( true )
      } }
      onClose={event => setShowSuggestions( false ) }
      forcePopupIcon={false}
      clearOnBlur={false}
      noOptionsText="No items found by this name or code"
      onChange={(event, selectedOption) => selectSuggestion( selectedOption ? selectedOption: null ) }
      getOptionSelected={(option, value) => option._id === value}
      filterOptions={ sortBy === 'packs' ? packsFirst : unitsFirst}
      />
      
      <ItemPickerPopup {...{ disabled, supplierId, selectItem, removeItem, selectedItems, showServiceItems, popupOpen, setPopupOpen }} />
    </Box>
  )
}

function SuggestedItem(item, state){
  return(
  <Box width="100%">
    <Box display="flex" justifyContent="space-between" alignItems="center">
      <Typography>{item.itemName}</Typography>
      <Typography style={{ color: '#6c6a6a', fontSize: 14 }}>{item.sizeName} { item.sizeName && item.combinationName ? "|" : ""  } {item.combinationName}</Typography>
    </Box>
    <Box display="flex" justifyContent="space-between" alignItems="center">
      <Typography style={{ color: '#6c6a6a', fontSize: 14 }}>{item.itemCode}{item.sizeCode ? '-' : ""}{item.sizeCode}{item.combinationCode ? '-' : ""}{item.combinationCode}</Typography>
      <Typography style={{ color: '#6c6a6a', fontSize: 14 }}>Price: { item.packParentId ? item.packSalePrice.toLocaleString() : item.salePrice.toLocaleString('en-US') }</Typography>
    </Box>
  </Box>
  )
}


export default ItemPicker;