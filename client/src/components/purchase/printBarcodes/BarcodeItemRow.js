import React, { useEffect, useRef, useState } from 'react';
import { TableCell, TableRow, Box, IconButton } from '@material-ui/core';
import TextInput from 'components/library/form/TextInput';
import { Field } from 'redux-form';
import { allowOnlyPostiveNumber } from 'utils';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBoxOpen, faTimes } from '@fortawesome/free-solid-svg-icons';

function BarcodeItemRow({ item, removeItem }){
  const [renderInputs, setRenderInputs] = useState(false);
  const renderTimer = useRef();
  useEffect(() => {
    renderTimer.current = setTimeout(() => setRenderInputs(true), 10);
    return () => renderTimer.current && clearTimeout(renderTimer.current);
  }, []);

  return(
    <TableRow hover key={item._id}>
      <TableCell>
        <Box my={1} display="flex" justifyContent="space-between">
          <span>
            {item.itemName}
          </span>
          { item.packParentId ? <span style={{ color: '#7c7c7c' }}>Packing <FontAwesomeIcon title={`Pack of ${item.packQuantity}`} style={{ marginLeft: 4 }} icon={faBoxOpen} /> </span> : null }
          {
            item.sizeName ?
            <span style={{ color: '#7c7c7c' }}> {item.sizeName} | {item.combinationName} </span>
            : null
          }
        </Box>
        <Box mb={1} display="flex" justifyContent="space-between" style={{ color: '#7c7c7c' }}>
          <span>{item.itemCode}{item.sizeCode ? '-'+item.sizeCode+'-'+item.combinationCode : '' }</span>
          <span>Price: { item.packParentId ? item.packSalePrice.toLocaleString() : item.salePrice.toLocaleString() } </span>
        </Box>
      </TableCell>
      <TableCell align="center">
        {
          !renderInputs ? null :
          <Field
            component={TextInput}
            label="Quantity"
            name={`items[${item._id}].quantity`}
            placeholder="Quantity..."
            fullWidth={true}
            variant="outlined"
            margin="dense"
            showError={false}
            inputProps={{ type: "number", min: 1  }}
            onKeyDown={allowOnlyPostiveNumber}
          />
        }
      </TableCell>
      <TableCell align="center">
        <IconButton onClick={() => removeItem(item)}>
          <FontAwesomeIcon icon={faTimes} size="xs" />
        </IconButton>
      </TableCell>
    </TableRow>
  )
}

export default React.memo(BarcodeItemRow);