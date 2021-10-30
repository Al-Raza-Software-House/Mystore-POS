import React, { useEffect, useState } from 'react';
import Autocomplete from '@material-ui/lab/Autocomplete';
import { TextField, makeStyles, Box, FormHelperText, Chip } from '@material-ui/core';
import clsx from 'clsx';

const useStyles = makeStyles(theme => ({
  inputNoBorder:{
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
  }
}));

const MultiAutoComplete = ({
  label, placeholder, options, getOptionLabel, addNewRecord,
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
        multiple
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
        onChange={(e, newValue) => {
          onChange(newValue);
        }}
        filterSelectedOptions
        filterOptions={(options, state) => {
          const currentValue = value ? value : [];
          const selectedIds = [];
          currentValue.forEach(element => {
            selectedIds.push(element._id);
          });
          let newOptions = options.filter(item => !selectedIds.includes(item._id));
          return newOptions;
        }}
        getOptionSelected={(option, value) => option === value}
        inputValue={inputValue}
        
        value={value ? value : []}
        renderTags={(tagValue, getTagProps) =>
          tagValue.map((option, index) => (
            <Chip
              label={option.title}
              {...getTagProps({ index })}
              disabled={ option.preventDelete ? true : false }
            />
          ))
        }
      />
      <FormHelperText error={ invalid }>
        {
          error ? <span>{ error }</span> : <span>&nbsp;</span>
        }
        
      </FormHelperText>
    </Box>
  );
}
 
export default MultiAutoComplete;