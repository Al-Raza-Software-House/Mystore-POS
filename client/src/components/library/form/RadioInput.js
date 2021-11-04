import React from 'react';
import { FormControl, RadioGroup, Radio, FormControlLabel, FormLabel, FormHelperText } from '@material-ui/core';

const RadioInput = ({
  label, input, options, id, fullWidth, row=true, disabled=false,
  meta: { touched, invalid, error },
  input: {value, onChange, ...rest},
  ...custom
}) => {
  return (
    <FormControl fullWidth={fullWidth} error={ touched && invalid }>
    <FormLabel component="legend">{label}</FormLabel>
      <RadioGroup {...rest} onChange={(event, value) => onChange( parseInt(value) )} value={parseInt(value)} {...custom} row={row} >
        {
          options.map(item => (
            <FormControlLabel key={item.id} value={item.id} label={item.title} control={<Radio color="primary" disabled={disabled} />} labelPlacement="end"/>
          ))
        }
      </RadioGroup>
      { touched && error && 
        <FormHelperText error={true}>{ error }</FormHelperText> 
      }
    </FormControl>
  );
}
 
export default RadioInput;