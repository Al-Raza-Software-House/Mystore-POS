import React, { useCallback } from 'react'
import { Slider, FormControl, FormHelperText, FormLabel  } from '@material-ui/core';

const SliderInput = ({
  label, options, id, fullWidth, valueLabel,
  meta: { touched, invalid, error },
  input: { onChange, name, value },
  ...custom
}) => {
  const handleChange = useCallback((event, value) => onChange(value), [onChange]);
  return (
    <FormControl fullWidth={fullWidth} error={ touched && invalid }>
      <FormLabel component="legend">{label} { valueLabel ? `(${valueLabel})` : null }</FormLabel>
      <Slider 
        label={label}
        name={name}
        value={value === "" ? 0 : value}
        onChange={handleChange}
      {...custom}
      />
      { touched && error && 
        <FormHelperText error={true}>{ error }</FormHelperText> 
      }
    </FormControl>
    
  );
}
 
export default SliderInput;