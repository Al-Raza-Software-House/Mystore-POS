import React from 'react'
import { FormControlLabel, Switch } from '@material-ui/core';
const SwitchInput = ({ input, label }) => (
  <div>
    <FormControlLabel
      control={
        <Switch 
          checked={input.value ? true : false}
          onChange={input.onChange}
          color="primary"
          name={input.name}
        />
      }
      label={label}
    />
  </div>
)

export default SwitchInput;