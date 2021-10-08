import React, { useEffect, useState } from 'react';
import { FormControl, FormGroup, FormControlLabel, FormHelperText, Checkbox } from '@material-ui/core';

const CheckboxGroup = ({
  label, input, options, id, fullWidth, row=true,
  meta: { touched, invalid, error },
  input: {value, onChange, ...rest},
  ...custom
}) => {
  const [choices, setChoices] = useState([]);
  useEffect(() => {
    if(!options) return;
    let data = options.map(item => {
      const choice = {...item};
      if(value)
        choice.checked = value.includes(item.id) ? true : false;
      else
        choice.checked = item.id === null ? true : false;
      return choice;
    });
    setChoices(data);
  }, [options, value])
  const handleChange = (isChecked, id) => {
    if(isChecked)
    {
      if(id === null)
        onChange(null);
      else
        onChange(!value ? [id] : [...value, id]);
    }else
    {
      if(id === null)
        onChange(null);
      else
      {
        let newVal = value.filter(item => item !== id);
        newVal.length ? onChange(newVal) : onChange(null);
      }
    }
  }
  return (
    <FormControl fullWidth={fullWidth} error={ touched && invalid }>
      <FormGroup row={row} >
        {
          choices.map(item => (
            <FormControlLabel key={item.id} checked={item.checked} onChange={() => handleChange(!item.checked, item.id)} label={item.title} control={<Checkbox color="primary"  />} labelPlacement="end"/>
          ))
        }
      </FormGroup>
      { touched && error && 
        <FormHelperText error={true}>{ error }</FormHelperText> 
      }
    </FormControl>
  );
}
 
export default CheckboxGroup;