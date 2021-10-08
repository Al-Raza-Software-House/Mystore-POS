import React from 'react';
import { Select, FormControl, FormHelperText, InputLabel, MenuItem } from '@material-ui/core';

const SelectInput = ({
  label, input, options, id, fullWidth,
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
       <FormHelperText error={ touched && invalid }>
        {
          touched && error ? <span>{ touched && error }</span> : <span>&nbsp;</span>
        }
        
      </FormHelperText>
    </FormControl>
  );
}
 
export default SelectInput;