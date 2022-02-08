import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Box, makeStyles, TextField, Typography } from '@material-ui/core';
import Autocomplete from '@material-ui/lab/Autocomplete';
import { useSelector } from 'react-redux';
import barcodeReader from '@wrurik/barcode-scanner';
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

function SelectItem(props) {
  const classes = useStyles();
  const { value, onChange, disabled=false, showServiceItems=false, autoFocus=false } = props;
  const storeId = useSelector(state => state.stores.selectedStoreId);
  const allItems = useSelector(state => state.items[storeId].allItems );

  const items = useMemo(() => showServiceItems ? allItems.filter(item => item.packParentId === null) : allItems.filter(item => item.isServiceItem === false && item.packParentId === null), [allItems, showServiceItems]);
  const [inputValue, setInputValue] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    const option = items ? items.find(record => record._id === value) : null;
    setInputValue( option && option.itemName ? option.itemName : "" );
  }, [value, items]);
  const inputRef = useRef();  

  useEffect(() => {
    if(disabled) return;
    let removeListener = barcodeReader.onScan((itemCode) => {
      let records = items.filter(item => {
        if(item.sizeId)
          return `${item.itemCode}-${item.sizeCode}-${item.combinationCode}`.toLowerCase().indexOf(itemCode.toLowerCase()) !== -1;
        else
          return item.itemCode.toLowerCase().indexOf(itemCode) !== -1;
      });
      if(records.length === 1)
      {
        onChange(records[0]._id);
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
  }, [disabled, items, onChange]);

  return(
    <Box display="flex" position="relative" id="item-picker-container">
      <Autocomplete
      renderInput={(params) => <TextField  {...params} label="Select Item" autoFocus={autoFocus} InputLabelProps={{ shrink: true }} margin="dense" inputRef={inputRef}  placeholder="type item name or scan code" variant="outlined" style={{ borderRadius: 0 }} onKeyPress={event => {if(event.key === "Enter") event.preventDefault()}} />}
      classes={{ inputRoot: classes.inputNoBorder, option: classes.option, paper: classes.paper }}
      value={value}
      fullWidth={true}
      options={items}
      getOptionLabel={(option) => option && option.itemName ? option.itemName : ""}
      renderOption={SuggestedItem}
      disabled={disabled}
      inputValue={inputValue}
      onInputChange={(event, newInputValue) => {
        if(event && event.type === 'blur')
        {
          const option = items ? items.find(record => record._id === value) : null;
          setInputValue( option && option.itemName ? option.itemName : "" );
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
      onOpen={event => setShowSuggestions( true ) }
      onClose={event => setShowSuggestions( false ) }
      clearOnBlur={false}
      noOptionsText="No items found by this name or code"
      onChange={(event, selectedOption) => onChange( selectedOption ? selectedOption._id: null ) }
      getOptionSelected={(option, value) => option._id === value}
      filterOptions={(options, { inputValue }) => matchSorter(options, inputValue, { keys: ["itemNameLC", 'itemCodeLC'] }).slice(0, 10)}
      />
      
    </Box>
  )
}

function SuggestedItem(item){
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


export default SelectItem;