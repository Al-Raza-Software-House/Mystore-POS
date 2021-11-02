import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowsAltV, faTimes, faArrowUp, faArrowDown } from '@fortawesome/free-solid-svg-icons';
import { IconButton, makeStyles, InputAdornment, CircularProgress, FormHelperText, Button, Dialog, DialogTitle, DialogContent, DialogActions, Typography, Box, TableContainer, Table, TableHead, TableRow, TableCell, TableBody } from '@material-ui/core';
import { connect } from 'react-redux';
import { showError, showSuccess } from '../../../store/actions/alertActions';
import { hideProgressBar, showProgressBar } from "../../../store/actions/progressActions";
import { adjustStock, updateItem } from '../../../store/actions/itemActions';
import axios from 'axios';
import { change, Field, formValueSelector, initialize, reduxForm, SubmissionError } from 'redux-form';
import { compose } from 'redux';
import TextInput from '../../library/form/TextInput';
import { useSelector } from 'react-redux';
import SelectInput from '../../library/form/SelectInput';

const formName = "adjustStock";
const formSelector = formValueSelector( formName );

const useStyles = makeStyles(theme => ({
  actionBtn: {
    fontSize: '1.3rem',
    padding: '4px 12px'
  }
}))

function AdjustStock(props){
  const classes = useStyles();
  const [open, setOpen] = useState(false);
  const [variants, setVariants] = useState(null);
  const { storeId, itemId, showProgressBar, hideProgressBar, showError, dispatch, reasons  } = props;
  const { error, invalid, pristine, submitting, submitSucceeded, handleSubmit } = props;
  const values = useSelector(state => formSelector(state, 'variants'));
  useEffect(() => {
    if(submitSucceeded)
    {
      handleClose();
      setVariants(null); //reload the item from server to show updated current stock
    }
  }, [submitSucceeded])

  let anyvalidQuantity = false;
  if(values && values.length)
  {
    for(var i=0; i<values.length; i++)
      if(values[i].adjustmentQuantity !== '0')
      {
        anyvalidQuantity = true;
        break;
      }
  }

  const handleClickOpen = () => {
    if(variants)
    {
      setOpen(true); 
      dispatch( initialize(formName, { variants }) );
      return;
    }
    showProgressBar();
    axios.get('/api/items/load', { params: { storeId, itemId } } ).then( ({ data }) => {
      hideProgressBar();
      let variants = data.item.variants.length ? data.item.variants : [data.item] ;
      for(var i=0; i<variants.length; i++)
      {
        variants[i].adjustmentQuantity = '0';
        variants[i].adjustmentReason = reasons[0] ? reasons[0].id : '';
      }
      setVariants(variants); //if standard item, 
      dispatch( initialize(formName, { variants }) );
      setOpen(true);
    }).catch( err => {
      hideProgressBar();
      showError( err.response && err.response.data.message ? err.response.data.message: err.message );
      handleClose();
    } );
  };
  const handleClose = () => {
    setOpen(false);
  };

  const toggleQuantiy = (index) => {
    if(Number(values[index].adjustmentQuantity) === 0) return;
    dispatch( change(formName, `variants[${index}].adjustmentQuantity`, -1 * values[index].adjustmentQuantity) );
  }

  return (
    <>
      <IconButton onClick={(event) => handleClickOpen(event) } className={classes.actionBtn} title="Adjust Stock">
        <FontAwesomeIcon icon={faArrowsAltV} size="xs" />
      </IconButton>
      {
        variants === null ? null :
        <Dialog fullWidth={true} maxWidth="md" onClose={handleClose} aria-labelledby="customized-dialog-title" open={open}>
          <DialogTitle disableTypography  id="customized-dialog-title" onClose={handleClose}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h6" style={{ flexGrow: 1}}>Adjust Stock - { variants[0].itemName }</Typography>
              <IconButton onClick={handleClose} style={{ width: 30, height: 30 }}>
                <FontAwesomeIcon icon={faTimes}  size="xs" />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent dividers style={{ backgroundColor: '#ececec' }}>
            <form onSubmit={handleSubmit}>
              <Box style={{ backgroundColor: '#fff' }}>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell style={{ minWidth: 250 }}>Name</TableCell>
                        <TableCell style={{ minWidth: 90 }} align="center">Cost Price</TableCell>
                        <TableCell style={{ minWidth: 90 }} align="center">Current Stock</TableCell>
                        <TableCell style={{ minWidth: 120 }} align="center">Quantity(+/-)</TableCell>
                        <TableCell style={{ minWidth: 120 }} align="center">Reason</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {
                        variants.map((item, index) => (
                          <TableRow key={item._id}>
                            <TableCell>
                              <Box mb={1} display="flex" justifyContent="space-between">
                                <span>{item.itemName}</span>
                                {
                                  item.sizeId ?
                                  <span style={{ color: '#7c7c7c' }}> {item.sizeName} | {item.combinationName} </span>
                                  : null
                                }
                              </Box>
                              <Box display="flex" justifyContent="space-between" style={{ color: '#7c7c7c' }}>
                                <span>{item.itemCode}{item.sizeId ? '-'+item.sizeCode+'-'+item.combinationCode : '' }</span>
                                <span>Price: {item.salePrice} </span>
                              </Box>
                            </TableCell>
                            <TableCell align="center">{item.costPrice}</TableCell>
                            <TableCell align="center">{item.currentStock}</TableCell>
                            <TableCell align="center">
                              <Field
                                component={TextInput}
                                label="Quantity"
                                name={`variants[${index}].adjustmentQuantity`}
                                placeholder="Quantity..."
                                fullWidth={true}
                                variant="outlined"
                                margin="dense"
                                type="number"
                                InputProps={{
                                  startAdornment:
                                    <InputAdornment position="start">
                                      <IconButton
                                        aria-label="toggle password visibility"
                                        onClick={() => toggleQuantiy(index)}
                                        onMouseDown={(event) => event.preventDefault()}
                                      >
                                        {
                                          values && values[index] &&  values[index].adjustmentQuantity === '0' ? 
                                          <FontAwesomeIcon icon={faArrowsAltV} size="xs" /> : 
                                          <FontAwesomeIcon icon={ values && values[index] && values[index].adjustmentQuantity > 0 ? faArrowUp : faArrowDown } size="xs" />
                                        }
                                      </IconButton>
                                    </InputAdornment>
                                  }
                                }
                              />
                            </TableCell>
                            <TableCell align="center">
                              <Field
                                  component={SelectInput}
                                  options={reasons}
                                  label=""
                                  name={`variants[${index}].adjustmentReason`}
                                  variant="outlined"
                                  margin="dense"
                                  fullWidth={true}
                                />
                            </TableCell>
                          </TableRow>
                        ))
                      }
                    </TableBody>
                  </Table>
                </TableContainer>

                <Box mt={1} px={3}>
                  <Field
                    component={TextInput}
                    label="Notes"
                    name="notes"
                    placeholder="Notes..."
                    fullWidth={true}
                    variant="outlined"
                    margin="dense"
                    multiline={true}
                    rows={2}
                  />
                </Box>
                
                <Box textAlign="center" >
                  <Button disableElevation type="submit" variant="contained" color="primary" disabled={pristine || submitting || invalid || !anyvalidQuantity } >
                    Adjust Stock
                    { submitting && <CircularProgress  size={20} style={{ marginLeft: 15 }} /> }
                  </Button>
                  {  
                    <FormHelperText error={true}   style={{textAlign: 'center', visibility: !submitting && error ? 'visible' : 'hidden' }}>
                      <Typography component="span">{ error ? error : 'invalid request' }</Typography>
                    </FormHelperText>  
                  }
                </Box>

              </Box>
            </form>
            
          </DialogContent>
          <DialogActions>
            <Button autoFocus onClick={handleClose} color="primary">
              Cancel
            </Button>
          </DialogActions>
        </Dialog>
      }
    </>
  )
}

const onSubmit = (values, dispatch, { storeId, itemId }) => {
  const records = values.variants.map(record => ({ _id: record._id, adjustmentQuantity: record.adjustmentQuantity, adjustmentReason: record.adjustmentReason }));
  return axios.post('/api/items/adjustStock', {storeId, itemId, records, notes: values.notes }).then( response => {
    if(response.data.items.length)
    {
      for(let i = 0; i < response.data.items.length; i++)
      {
        response.data.items[i].packings = response.data.items[i].packings ? response.data.items[i].packings : [];
        response.data.items[i].variants = response.data.items[i].variants ? response.data.items[i].variants : [];
      }
      dispatch( adjustStock(storeId, response.data.items, response.data.now, response.data.lastAction) );
      dispatch( showSuccess("Item stock adjusted") );
    }

  }).catch(err => {
    throw new SubmissionError({
      _error: err.response && err.response.data.message ? err.response.data.message: err.message
    });
  });
}


const validate = (values, props) => {
  return {  }
}

const mapStateToProps = state => {
  const storeId = state.stores.selectedStoreId;
  const records = state.adjustmentReasons[storeId] ? state.adjustmentReasons[storeId] : [];
  const reasons = records.map(record => ({ id: record._id, title: record.name }));
  return{
    reasons,
  }
}

export default compose(
  connect(mapStateToProps, { showProgressBar, hideProgressBar, showSuccess, showError }),
  reduxForm({
    'form': formName,
    validate,
    onSubmit
  })
)(AdjustStock);