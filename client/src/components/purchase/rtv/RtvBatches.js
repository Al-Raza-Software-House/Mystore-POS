import React, { useMemo } from 'react'
import { Box, FormHelperText, IconButton } from '@material-ui/core';
import { allowOnlyPostiveNumber } from '../../../utils';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTimes } from '@fortawesome/free-solid-svg-icons';
import TextInput from '../../library/form/TextInput';
import { Field } from 'redux-form';
import moment from 'moment';
import SelectInput from '../../library/form/SelectInput';

function RtvBatches({ fields, supplierId, beforeLastEndOfDay, batches,  meta }){
  const batchOptions = useMemo(() => {
    let options = [{id: 0, title: "Select Batch" }];
    if(batches.length)
      options = [...options, ...batches.map(record => ({ id: `${record.batchNumber}----${record.batchExpiryDate}`, title: `${record.batchNumber} - ${ moment(record.batchExpiryDate).format("DD MMM, YYYY") }` }) ) ];
    return options;
  }, [batches])

  if(!batches || batches.length  === 0) return null;
  const { error } = meta;
  return(
    <>
    {
      fields.map( (batch, index) => (
      <Box width="100%" display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" key={index}>
        <Box width={{ xs: '100%', md: '50%' }}>
          <Field
            component={SelectInput}
            name={`${batch}.batchNumber`}
            fullWidth={true}
            variant="outlined"
            margin="dense"
            type="text"
            options={batchOptions}
            showError={false}
            disabled={!supplierId || beforeLastEndOfDay}
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
            disabled={!supplierId || beforeLastEndOfDay}
            showError={false}
            onKeyDown={allowOnlyPostiveNumber}
          />
        </Box>
        <Box width={{ xs: '100%', md: '10%' }}>
          {
            index === 0 ?
            <IconButton onClick={() => fields.push({ batchNumber: 0, batchQuantity: 0 })} title="Add another batch">
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

export default RtvBatches;