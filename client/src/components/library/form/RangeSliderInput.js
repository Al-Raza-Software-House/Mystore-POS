import React, { useCallback, useState, useEffect } from 'react'
import { Slider, FormControl, FormHelperText, FormLabel, Box  } from '@material-ui/core';

const SliderInput = ({
  label, options, id, fullWidth, valueLabel,
  meta: { touched, invalid, error },
  input: { onChange, name, value },
  marks,
  fromLabel,
  toLabel,
  defaultValue,
  ...custom
}) => {
  const handleChange = useCallback((event, value) => onChange(value), [onChange]);
  const [fromText, setFromText] = useState('');
  const [toText, setToText] = useState('');
  useEffect(() => {
    if(value === '' )
      onChange(defaultValue);
  }, [value, defaultValue, onChange]);

  useEffect(() => {
    if(value === "") return;
    setFromText( fromLabel(value[0]) );
    setToText( toLabel(value[1]) );
  }, [fromLabel, toLabel, value])
  return (
    <FormControl fullWidth={fullWidth} error={ touched && invalid }>
      <Box display="flex" justifyContent="space-between">
        <FormLabel component="legend">{ fromText }</FormLabel>
        <FormLabel component="legend">{ toText }</FormLabel>
      </Box>
      <Slider 
        label={label}
        name={name}
        value={value === "" ? defaultValue : value}
        onChange={handleChange}
        marks={marks}
        {...custom}
      />
      { touched && error && 
        <FormHelperText error={true}>{ error }</FormHelperText> 
      }
    </FormControl>
    
  );
}
 
export default SliderInput;