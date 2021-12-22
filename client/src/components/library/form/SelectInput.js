import React from 'react';
import { Select, FormControl, FormHelperText, InputLabel, MenuItem } from '@material-ui/core';

const SelectInput = ({
  label, input, options, id, fullWidth, showError=true, ignoreTouch=false,
  meta: { touched, invalid, error },
  ...custom
}) => {
  return (
    <FormControl fullWidth={fullWidth} error={ touched && invalid }>
      <InputLabel htmlFor={id}>
      {label}
      </InputLabel>
      <Select
        {...input}
        {...custom}
      >
        {
          options.map(item => (
            <MenuItem value={item.id} key={item.id}>{item.title}</MenuItem>
          ))
        }
      </Select>
      {
        showError ? 
        <FormHelperText error={ (ignoreTouch || touched) && invalid }>
          {
            (ignoreTouch || touched) && error ? <span>{ (ignoreTouch || touched) && error }</span> : <span>&nbsp;</span>
          }
          
        </FormHelperText>
        : null
      }
    </FormControl>
  );
}
 
export default SelectInput;