import React from 'react'
import { Box, FormHelperText, IconButton } from '@material-ui/core';
import { allowOnlyPostiveNumber } from '../../../utils';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTimes } from '@fortawesome/free-solid-svg-icons';
import TextInput from '../../library/form/TextInput';
import { Field } from 'redux-form';
import DateInput from '../../library/form/DateInput';

function ReturnBatches({ fields, disabled,  meta }){
  const { error } = meta;
  return(
    <>
    {
      fields.map( (batch, index) => (
      <Box width="100%" display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" key={index}>
        <Box width={{ xs: '100%', md: '25%' }}>
          <Field
            component={TextInput}
            label="Batch No."
            name={`${batch}.batchNumber`}
            placeholder="Batch No..."
            fullWidth={true}
            variant="outlined"
            margin="dense"
            type="text"
            showError={false}
            disabled={disabled}
          />
        </Box>
        <Box width={{ xs: '100%', md: '30%' }}>
          <Field
            component={DateInput}
            dateFormat="DD MMM, YYYY"
            label="Expiry Date."
            name={`${batch}.batchExpiryDate`}
            placeholder="Expiry Date..."
            fullWidth={true}
            inputVariant="outlined"
            margin="dense"
            type="text"
            disabled={disabled}
          />
        </Box>
        <Box width={{ xs: '100%', md: '25%' }}>
          <Field
            component={TextInput}
            label="Batch Quantity"
            name={`${batch}.batchQuantity`}
            placeholder="Batch Qunatity..."
            fullWidth={true}
            variant="outlined"
            margin="dense"
            type="text"
            disabled={disabled}
            showError={false}
            onKeyDown={allowOnlyPostiveNumber}
          />
        </Box>
        <Box width={{ xs: '100%', md: '10%' }}>
          {
            index === 0 ?
            <IconButton onClick={() => fields.push({ batchNumber: "", batchExpiryDate: null, batchQuantity: 0 })} title="Add another batch">
              <FontAwesomeIcon icon={faPlus} size="xs"  />
            </IconButton>
            :
            <IconButton onClick={() => fields.remove(index)} title="Remove this batch">
              <FontAwesomeIcon icon={faTimes} size="xs"  />
            </IconButton>
          }
        </Box>
      </Box>
      ))
    }
    {
      error ? 
      <Box mt={1} textAlign="center" width="100%">
        <FormHelperText error={error ? true : false} style={{ textAlign: "center" }}>
          {error}
        </FormHelperText>
      </Box>
      : null
    }
    </>
  )
}

export default ReturnBatches;