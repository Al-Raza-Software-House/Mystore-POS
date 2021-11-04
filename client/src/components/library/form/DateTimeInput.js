import React from 'react';
import { DateTimePicker, MuiPickersUtilsProvider } from '@material-ui/pickers';
import Utils from '@date-io/moment';

const DateTimeInput = ({
  label, dateFormat, disabled=false,
  meta: { touched, invalid, error },
  input: { value, ...rest },
  ...custom
}) => {
  return (
    <MuiPickersUtilsProvider utils={Utils}>
      <DateTimePicker
        label={label}
        error={ touched && invalid }
        helperText={ touched && error }
        format={dateFormat}
        value={ value ? value : null }
        disabled={disabled}
        {...rest}
        {...custom}
      />
    </MuiPickersUtilsProvider>
    
  );
}
 
export default DateTimeInput;