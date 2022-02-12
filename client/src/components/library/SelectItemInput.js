import React from 'react';
import { Box } from '@material-ui/core';
import SelectItem from './SelectItem';


const SelectItemInput = (props) => {
  const {
    input: { value, onChange }
  } = props;


  return (
    <Box width="100%" >
      <SelectItem value={value} onChange={onChange} />
    </Box>
  );
}
 
export default SelectItemInput;