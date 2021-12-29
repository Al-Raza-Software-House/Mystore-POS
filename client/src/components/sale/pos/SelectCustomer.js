import React, { useState, useCallback, useEffect } from 'react';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Box, Button, makeStyles, Dialog, DialogContent, DialogActions, Typography, TextField } from '@material-ui/core';
import { connect } from 'react-redux';
import { change, initialize } from 'redux-form';
import CreateCustomer from '../../parties/customers/CreateCustomer';
import Autocomplete from '@material-ui/lab/Autocomplete';

const useStylesTop = makeStyles(theme => ({
  inputNoBorder:{
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
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

function SelectCustomer(props) {
  const classes = useStylesTop();
  const { storeId, formName, customers, disabled=false, addNewRecord=true, dispatch, input: {value, onChange} } = props;
  const [inputValue, setInputValue] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  useEffect(() => {
    const option = customers ? customers.find(record => record._id === value) : null;
    setInputValue( option && option.name ? option.name : "" );
  }, [value, customers]);

  return(
    <>
    <Box display="flex">
      <Autocomplete
      renderInput={(params) => <TextField  {...params} label="Select Customer" InputLabelProps={{ shrink: true }} margin="dense" placeholder="search customer name" variant="outlined" style={{ borderRadius: 0 }} onKeyPress={event => {if(event.key === "Enter") event.preventDefault()}} />}
      classes={{ inputRoot: classes.inputNoBorder, option: classes.option, paper: classes.paper }}
      value={value ? value : null}
      fullWidth={true}
      options={customers}
      getOptionLabel={(option) => option && option.name ? option.name : ""}
      renderOption={SuggestedCustomer}
      disabled={disabled}
      inputValue={inputValue}
      onInputChange={(event, newInputValue) => {
        if(event && event.type === 'blur')
        {
          const option = customers ? customers.find(record => record._id === value) : null;
          setInputValue( option && option.name ? option.name : "" );
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
      noOptionsText="No customers found by this name or mobile"
      onChange={(event, selectedOption) => onChange( selectedOption ? selectedOption._id: null ) }
      getOptionSelected={(option, value) => option._id === value}
      filterOptions={(options, state) => {
        let query = state.inputValue.toLowerCase();
        if(query === "") return [];
        return options.filter(customer => {
          if(customer.name.toLowerCase().indexOf(query) !== -1) return true;
          return customer.mobile.toLowerCase().indexOf(query) !== -1;
        })
      }}
      />
      { addNewRecord && <AddCustomer disabled={disabled} storeId={storeId} formName={formName} dispatch={dispatch} /> }
    </Box>
    
    </>
  )
}

const mapStateToProps = state => {
  return {
    storeId: state.stores.selectedStoreId,
    customers: state.customers[state.stores.selectedStoreId] ? state.customers[state.stores.selectedStoreId] : []
  }
}

export default connect(mapStateToProps)(SelectCustomer);

function SuggestedCustomer(customer, state){
  return(
  <Box width="100%">
    <Box display="flex" justifyContent="space-between" alignItems="center">
      <Typography>{customer.name}</Typography>
      <Typography style={{ color: '#6c6a6a', fontSize: 14 }}>{ customer.allowCredit ? "Credit Limit: " + customer.creditLimit.toLocaleString() : "" }</Typography>
    </Box>
    <Box display="flex" justifyContent="space-between" alignItems="center">
      <Typography style={{ color: '#6c6a6a', fontSize: 14 }}>{customer.mobile}</Typography>
      <Typography style={{ color: '#6c6a6a', fontSize: 14 }}>{ customer.allowCredit ? "Receivable: " + customer.currentBalance.toLocaleString() : "Credit not Allowed" }</Typography>
    </Box>
  </Box>
  )
}

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
  }
}))

function AddCustomer(props){
  const { disabled, dispatch, formName } = props;
  const classes = useStyles();
  const [open, setOpen] = useState(false);
  const handleClose = () => setOpen(false);

  const closeDialog = useCallback((newCustomerId) => {
      setOpen(false);
      dispatch( initialize('createCustomer', {}) );
      dispatch( change(formName, 'customerId', newCustomerId) );
  }, [setOpen, dispatch, formName]);

  return(
    <>
    <Button 
      type="button"
      disabled={disabled}
      title="Add new customer"
      onClick={() => setOpen(true)}
      classes={{ root: classes.actionButton, startIcon: classes.startIcon }}
      disableElevation  startIcon={ <FontAwesomeIcon icon={faPlus} size="xs" /> } size="small" edge="end" variant="outlined">
    </Button>
    <Dialog open={open} fullWidth onClose={handleClose} aria-labelledby="form-dialog-title">
        <DialogContent>
          <CreateCustomer closeDialog={closeDialog} />
        </DialogContent>
      <DialogActions style={{ justifyContent: 'center' }}>
        <Button disableElevation type="button" onClick={handleClose} color="primary">
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
    </>
  )
}


