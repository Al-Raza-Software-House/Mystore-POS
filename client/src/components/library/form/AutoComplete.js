import React, { useEffect, useState } from 'react';
import Autocomplete from '@material-ui/lab/Autocomplete';
import { TextField, makeStyles, Box, FormHelperText } from '@material-ui/core';
import clsx from 'clsx';

const useStyles = makeStyles(theme => ({
  inputNoBorder:{
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
  }
}));

const AutoComplete = ({
  label, placeholder, options, getOptionLabel, addNewRecord, showError=true,
  input: {value, onChange, ...rest},
  meta: { touched, invalid, error },
  ...custom
}) => {
  const classes = useStyles();
  const [inputValue, setInputValue] = useState("");
  useEffect(() => {
    const option = options ? options.find(item => item._id === value) : null;
    setInputValue( getOptionLabel(option) );
  }, [value, options, getOptionLabel]);
  return (
    <Box width="100%">
      <Autocomplete 
        options={options}
        getOptionLabel={getOptionLabel}
        renderInput={(params) => <TextField  {...params} label={label} margin="dense" error={ touched && invalid } helperText={ touched && error } placeholder={placeholder} variant="outlined" style={{ borderRadius: 0 }} />}
        classes={{
          inputRoot: clsx({
            [classes.inputNoBorder]: addNewRecord === true
          })
        }}
        {...custom}
        autoComplete={true}
        onChange={(event, selectedOption) => onChange( selectedOption ? selectedOption._id: null ) }
        getOptionSelected={(option, value) => option._id === value}
        inputValue={inputValue}
        onInputChange={(event, newInputValue) => {
          if(event && event.type === 'blur')
          {
            const option = options ? options.find(item => item._id === value) : null;
            setInputValue( getOptionLabel(option) );
          }else
          {
            setInputValue(newInputValue);
          }
        }}
        value={value ? value : null}
      />
      {
        showError ? 
        <FormHelperText error={ invalid }>
          {
            error ? <span>{ error }</span> : <span>&nbsp;</span>
          }
          
        </FormHelperText>
        : null
      }
    </Box>
  );
}
 
export default AutoComplete;