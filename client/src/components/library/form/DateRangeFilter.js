import React from 'react';
import { Box, TextField, makeStyles } from '@material-ui/core';
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

const DateRangeFilter = (props) => {
  const {
    label, value,
    initialRange, onChange,
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
      <Box className={classes.picker}>
          <DateRangePicker
            open={open}
            toggle={toggle}
            initialDateRange={initialRange}
            onChange={handleChange}
          />
      </Box>
      
    </Box>
  );
}
 
export default DateRangeFilter;