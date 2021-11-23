import React from 'react';
import { Box, TextField, makeStyles, FormHelperText } from '@material-ui/core';
import { DateRangePicker } from "materialui-daterange-picker";
import moment from 'moment';

const useStyles = makeStyles(theme => ({
  container:{
    position: 'relative'
  },
  picker: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 90000,
    width: 'max-content'
  }
}));

const DateRangeInput = (props) => {
  const {
    label, dateFormat,
    meta: { touched, invalid, error },
    input: { value, onChange },
    ...custom
  } = props;
  const classes = useStyles();
  const [open, setOpen] = React.useState(false);
  const toggle = () => setOpen(!open);

  const handleChange = (range) => {
    if(range.startDate && range.endDate)
    {
      const rangeString = moment(range.startDate).format("DD MMM, YYYY") + " - " + moment(range.endDate).format("DD MMM, YYYY");
      onChange(rangeString);
    }
    setOpen(false);
  }

  

  return (
    <Box width="100%" className={classes.container}>
      <TextField 
        label={label}
        InputProps={{
          readOnly: true
        }}
        value={value}
        {...custom}
       onFocus={() => setOpen(true)}
      />
      <FormHelperText error={ touched && invalid }>
        {
          touched && error ? <span>{ touched && error }</span> : <span>&nbsp;</span>
        }
        
      </FormHelperText>
      <Box className={classes.picker}>
          <DateRangePicker
            open={open}
            toggle={toggle}
            onChange={handleChange}
          />
      </Box>
      
    </Box>
  );
}
 
export default DateRangeInput;