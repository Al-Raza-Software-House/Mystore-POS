import React, { useCallback, useMemo, useState } from 'react';
import { Box, Dialog, DialogContent, DialogActions, Button, DialogTitle, IconButton, Typography, FormHelperText } from '@material-ui/core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCreditCard, faSave, faTimesCircle, faTrashAlt } from '@fortawesome/free-solid-svg-icons';
import { allowOnlyNumber } from 'utils';
import { change, Field, formValueSelector } from 'redux-form';
import TextInput from 'components/library/form/TextInput';
import { useDispatch, useSelector } from 'react-redux';
import { useEffect } from 'react';
import SelectInput from 'components/library/form/SelectInput';
import SelectCustomer from './SelectCustomer';

function Payment({ storeId, pristine, submitting, invalid, dirty, totalQuantity, totalAmount, formName, banks, handleSubmit, onSubmit, sale, editSale, disableEdit, online }) {
  const [open, setOpen] = useState(false);
  const { customerId, cashPaid, creditAmount, bankAmount } = useSelector(state => formValueSelector(formName)(state, "customerId", "creditAmount", "cashPaid", "bankAmount"));
  const customer = useSelector(state => customerId ? state.customers[storeId].find(record => record._id === customerId) : null);
  const dispatch = useDispatch();

  useEffect(() => {
    if(sale && pristine) return;
    dispatch( change(formName, 'cashPaid', totalAmount) );
  }, [open, totalAmount, dispatch, formName, sale, pristine]);

  useEffect(() => {
    if(!customer || !customer.allowCredit)
      dispatch( change(formName, 'creditAmount', 0) );
  }, [dispatch, formName, customer]);

  const totalPayment = useMemo(() => {
    let cash = isNaN(cashPaid) ? 0 : Number(cashPaid);
    let credit = isNaN(creditAmount) ? 0 : Number(creditAmount);
    let bank = isNaN(bankAmount) ? 0 : Number(bankAmount);
    let total = +( cash + credit + bank ).toFixed(2);
    return total;
    
  }, [cashPaid, creditAmount, bankAmount]);

  const paymentError = useMemo(() => {
    let error = false;
    let cash = isNaN(cashPaid) ? 0 : Number(cashPaid);
    let credit = isNaN(creditAmount) ? 0 : Number(creditAmount);
    let bank = isNaN(bankAmount) ? 0 : Number(bankAmount);

    let netTotal = Number(totalAmount);

    let totalPayment = +( cash + credit + bank ).toFixed(2);
    let bankPlusCredit = +( credit + bank ).toFixed(2);
    if(!error && netTotal > 0) //Postive amount
    {
      if(totalPayment < netTotal)
      error = `Total payment(${totalPayment.toLocaleString()}) is less than Net Total(${netTotal.toLocaleString()})`;

      else if(bankPlusCredit > netTotal && customer && customer.allowCredit)
      error = `Credit amount(${credit.toLocaleString()}) plus bank amount(${bank.toLocaleString()}) should not be greater than Net Total(${netTotal.toLocaleString()})`;
    
      else if(bankPlusCredit > netTotal && (!customer || !customer.allowCredit))
        error = `Bank amount(${bank.toLocaleString()}) should not be greater than Net Total(${netTotal.toLocaleString()})`;
      
      else if(customer && customer.allowCredit && ( customer.currentBalance + credit ) > customer.creditLimit )
        error = `Credit amount(${credit.toLocaleString()}) plus current receivable(${customer.currentBalance.toLocaleString()}) is greater than customer's credit limit(${customer.creditLimit.toLocaleString()})`;
    }else if(!error && netTotal < 0) //Postive amount
    {
      if(totalPayment > netTotal)
        error = `Total payment(${totalPayment.toLocaleString()}) is less than Net Total(${netTotal.toLocaleString()})`;

      else if(bankPlusCredit < netTotal && customer && customer.allowCredit)
      error = `Credit amount(${credit.toLocaleString()}) plus bank amount(${bank.toLocaleString()}) should not be greater than Net Total(${netTotal.toLocaleString()})`;
    
      else if(bankPlusCredit < netTotal && (!customer || !customer.allowCredit))
        error = `Bank amount(${bank.toLocaleString()}) should not be greater than Net Total(${netTotal.toLocaleString()})`;
      
      else if(customer && customer.allowCredit && ( customer.currentBalance + credit ) > customer.creditLimit )
        error = `Credit amount(${credit.toLocaleString()}) plus current receivable(${customer.currentBalance.toLocaleString()}) is greater than customer's credit limit(${customer.creditLimit.toLocaleString()})`;
    }
    return error;
  }, [cashPaid, customer, creditAmount, bankAmount, totalAmount]);

  const clearAmounts = useCallback(() => {
    dispatch( change(formName, "cashPaid", totalAmount) );
    dispatch( change(formName, "creditAmount", 0) );
    dispatch( change(formName, "bankAmount", 0) );
  }, [dispatch, totalAmount, formName])


  const handleClose = () => setOpen(false);
  const submitSale = () => {
    setOpen(false);
    if(sale) editSale();
    else
      handleSubmit(onSubmit)();
  }
  return(
    <>
    <Button variant="outlined" onClick={() => setOpen(true) } color="primary" disabled={pristine || submitting || invalid || !dirty || Number(totalQuantity) === 0 || disableEdit} startIcon={<FontAwesomeIcon icon={faCreditCard} />} >{ sale ? "Update": "Payment"}</Button>
    <Dialog  maxWidth="sm" fullWidth={true}  open={open} onClose={handleClose} aria-labelledby="form-dialog-title" onClick={(event) => { event.stopPropagation(); }}>
        <DialogTitle disableTypography style={{ display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "#ececec", padding: "0px 12px" }}>
          <Typography variant="h6">Payment</Typography>
          <IconButton aria-label="close" onClick={handleClose}>
            <FontAwesomeIcon icon={faTimesCircle} />
          </IconButton>
        </DialogTitle>
        <DialogContent style={{ padding: 0 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" style={{ backgroundColor: "#2196f3", color: "#fff" }} px={2} py={1}>
            <Typography variant="h5">Net Total</Typography>
            <Typography variant="h5">{totalAmount.toLocaleString()}</Typography>
          </Box>
          <Box px={2} mt={1}>
            <Field
              component={SelectCustomer}
              formName={formName}
              name="customerId"
              disabled={disableEdit}
              addNewRecord={online}
            />
          </Box>
          <Box px={2} mt={1}>
            <Field
              component={TextInput}
              autoFocus
              label="Cash"
              name="cashPaid"
              placeholder="Cash..."
              fullWidth={true}
              inputProps={{ style: { textAlign: "right" } }}
              onFocus={(event) => {
                event.currentTarget.select();
              }}
              variant="outlined"
              margin="dense"
              type="text"
              showError={false}
              onKeyDown={allowOnlyNumber}
            />
          </Box>
          {
            customer && customer.allowCredit ?
            <Box display="flex" justifyContent="space-between" alignItems="center" px={2} mt={1}>
              <Box width={{ xs: "100%", md: "50%" }}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography>{customer.name}</Typography>
                  <Typography style={{ color: '#6c6a6a', fontSize: 14 }}>{ customer.allowCredit ? "Credit Limit: " + customer.creditLimit.toLocaleString() : "" }</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography style={{ color: '#6c6a6a', fontSize: 14 }}>{customer.mobile}</Typography>
                  <Typography style={{ color: '#6c6a6a', fontSize: 14 }}>{ customer.allowCredit ? "Receivable: " + customer.currentBalance.toLocaleString() : "Credit not Allowed" }</Typography>
                </Box>
              </Box>
              
              <Box width={{ xs: "100%", md: "45%" }}>
                <Field
                  component={TextInput}
                  label="Credit"
                  name="creditAmount"
                  placeholder="Credit Amount..."
                  fullWidth={true}
                  inputProps={{ style: { textAlign: "right" } }}
                  onFocus={(event) => {
                    event.currentTarget.select();
                  }}
                  variant="outlined"
                  margin="dense"
                  type="text"
                  showError={false}
                  onKeyDown={allowOnlyNumber}
                />
              </Box>
            </Box>
            : null
          }
          {
            banks.length === 0 ?  null : 
            <Box px={2} mt={1} display="flex" justifyContent="space-between">
              <Box width={{ xs: "100%", md: "32%" }} pt={1}>
                <Field
                  component={SelectInput}
                  options={banks}
                  name="bankId"
                  fullWidth={true}
                  variant="outlined"
                  margin="dense"
                  showError={false}
                />
              </Box>
              <Box width={{ xs: "100%", md: "32%" }}>
                <Field
                    component={TextInput}
                    name="chequeTxnId"
                    label="Cheque No./Txn ID"
                    placeholder="Cheque No./Transaction ID..."
                    type="text"
                    fullWidth={true}
                    variant="outlined"
                    margin="dense"
                    showError={false}
                  />
              </Box>
              <Box width={{ xs: "100%", md: "32%" }}>
                <Field
                  component={TextInput}
                  label="Bank Amount"
                  name="bankAmount"
                  placeholder="Bank Amount..."
                  fullWidth={true}
                  inputProps={{ style: { textAlign: "right" } }}
                  onFocus={(event) => {
                    event.currentTarget.select();
                  }}
                  variant="outlined"
                  margin="dense"
                  type="text"
                  showError={false}
                  onKeyDown={allowOnlyNumber}
                />
              </Box>
            </Box>
          }
          <Box display="flex" justifyContent="space-between" alignItems="center" borderTop="1px solid #ececec" px={2} py={1} mt={2}>
            <Typography variant="h5">Payment</Typography>
            <Typography variant="h5">{totalPayment.toLocaleString()}</Typography>
          </Box>
          <Box display="flex" justifyContent="space-between" alignItems="center" borderTop="1px solid #ececec" color="#2196f3" px={2} py={1} >
            <Typography variant="h5">Balance</Typography>
            <Typography variant="h5">{ (+(totalPayment - totalAmount).toFixed(2)).toLocaleString() }</Typography>
          </Box>

          <Box borderTop="1px solid #ececec" px={2} textAlign="center" pt={1}>
            <FormHelperText style={{ textAlign: "center", marginBottom: "10px" }}  error={true}>{ paymentError ?  paymentError : " "}</FormHelperText>
            <Button variant="outlined" style={{ margin: 8, marginTop: 0 }} color="primary" startIcon={<FontAwesomeIcon icon={faTrashAlt} />} onClick={clearAmounts} > Clear </Button>
            <Button variant="contained" style={{ margin: 8, marginTop: 0 }} type="submit" disabled={pristine || submitting || invalid || !dirty || Number(totalQuantity) === 0 || Boolean(paymentError)} color="primary" onClick={submitSale} startIcon={<FontAwesomeIcon icon={faSave} />} > Save </Button>
          </Box>

        </DialogContent>
        <DialogActions style={{ justifyContent: 'flex-end', backgroundColor: "#ececec", padding: "4px 12px" }}>
          <Button disableElevation onClick={(event) => { event.stopPropagation(); handleClose(); }} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default Payment;