import React, { useEffect, useRef, useState } from 'react';
import { TableCell, TableRow, Box, IconButton } from '@material-ui/core';
import TextInput from 'components/library/form/TextInput';
import { Field, formValueSelector } from 'redux-form';
import { allowOnlyPostiveNumber } from 'utils';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBoxOpen, faExclamationTriangle, faTimes } from '@fortawesome/free-solid-svg-icons';
import { useSelector } from 'react-redux';

const calculateMargin = (item, cost, showInPercent=false) => {
  if(item.salePrice === 0) return 0;
  let costPrice = isNaN(cost) ? 0 : Number(cost);
  let salePrice = item.packParentId ? item.packSalePrice : item.salePrice;
  let margin = salePrice - costPrice;
  if(!showInPercent) return (+margin.toFixed(2)).toLocaleString();
  return +((margin/salePrice)*100).toFixed(2);
}

function PoItemRow({ item, supplierId, isClosed, removeItem, formName }){
  const costPrice = useSelector(state => formValueSelector(formName)(state, `items[${item._id}].costPrice`));
  const quantity = useSelector(state => formValueSelector(formName)(state, `items[${item._id}].quantity`));

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
          { item.packParentId ? <span style={{ color: '#7c7c7c' }}>Packing <FontAwesomeIcon title="Packing" style={{ marginLeft: 4 }} icon={faBoxOpen} /> </span> : null }
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
        {item.currentStock.toLocaleString()}
        { item.lowStock ? <FontAwesomeIcon title={`Low Stock, Min: ${item.minStock}`} color="#c70000" style={{ marginLeft: 4 }} icon={faExclamationTriangle} /> : null }
        { item.overStock ? <FontAwesomeIcon title={`Over Stock, Max: ${item.maxStock}`} color="#06ba3a" style={{ marginLeft: 4 }} icon={faExclamationTriangle} /> : null }
        { item.packParentId ? <Box style={{ color: '#7c7c7c' }}>units</Box> : null }
      </TableCell>
      <TableCell align="center">
        <Box height="100%" display="flex" justifyContent="center" alignItems="center">
          {
            !renderInputs ? null :
            <Field
              component={TextInput}
              label="Cost Price"
              name={`items[${item._id}].costPrice`}
              placeholder="Cost Price..."
              fullWidth={true}
              variant="outlined"
              margin="dense"
              disabled={!supplierId || isClosed}
              showError={false}
              onKeyDown={allowOnlyPostiveNumber}
            />
          }
        </Box>
      </TableCell>
      <TableCell align="center">
        <Box mb={1}>{ calculateMargin(item, costPrice) }</Box>
        <Box style={{ color: '#7c7c7c' }}>{ calculateMargin(item, costPrice, true) }%</Box>
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
            disabled={!supplierId || isClosed}
            showError={false}
            onKeyDown={allowOnlyPostiveNumber}
          />
        }
      </TableCell>
      <TableCell align="center">
        { Number( ( isNaN(costPrice) ? 0 :  costPrice ) * ( isNaN(quantity) ? 0 :  quantity ) ).toLocaleString() }
      </TableCell>
      <TableCell align="center">
        <IconButton disabled={!supplierId || isClosed} onClick={() => removeItem(item)}>
          <FontAwesomeIcon icon={faTimes} size="xs" />
        </IconButton>
      </TableCell>
    </TableRow>
  )
}

export default React.memo(PoItemRow);