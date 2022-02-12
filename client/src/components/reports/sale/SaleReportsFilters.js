import { Box } from '@material-ui/core';
import DateRangeInput from 'components/library/form/DateRangeInput';
import SelectCategory from 'components/stock/items/itemForm/SelectCategory';
import SelectSupplier from 'components/stock/items/itemForm/SelectSupplier';
import React from 'react';
import { Field, reduxForm } from 'redux-form';
const formName  = 'saleReportsFilters';

const SaleReportsFilters = React.memo(
  () => {

    return(
      <Box display="flex" justifyContent="space-between" alignItems="center" >
        <Box width={{ xs: '100%', md: '30%' }} >
          <Field
            component={DateRangeInput}
            label="Date Range"
            name="dateRange"
            placeholder="Select Date Range..."
            fullWidth={true}
            variant="outlined"
            margin="dense"
            showError={false}
          />
        </Box>
        <Box width={{ xs: '100%', md: '30%' }} >
          <SelectCategory formName={formName} addNewRecord={false} showError={false}/>
        </Box>
        <Box width={{ xs: '100%', md: '30%' }} >
          <SelectSupplier formName={formName} addNewRecord={false} showError={false}/>
        </Box>
      </Box>
    )
  }
)

export default reduxForm({
  form: formName
})(SaleReportsFilters);