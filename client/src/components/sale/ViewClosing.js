import React, { useCallback, useEffect, useState } from 'react';
import { makeStyles, Button, Box, Typography, FormHelperText, IconButton, InputAdornment, Popover } from '@material-ui/core'
import { change, Field, formValueSelector, initialize, reduxForm, SubmissionError } from 'redux-form';
import axios from 'axios';
import TextInput from 'components/library/form/TextInput';
import { showProgressBar, hideProgressBar } from 'store/actions/progressActions';
import { connect } from 'react-redux';
import { showError, showSuccess } from 'store/actions/alertActions';
import { compose } from 'redux';
import { Redirect, useHistory, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import moment from 'moment';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faMoneyBill, faPrint, faTrash } from '@fortawesome/free-solid-svg-icons';
import { closingStates } from 'utils/constants';
import { allowOnlyNumber } from 'utils';
import NoteCounter from './NoteCounter';
import CheckboxInput from 'components/library/form/CheckboxInput';
import { addNewClosing, deleteClosing, updateClosing } from 'store/actions/closingActions';
import { lastEndOfDayUpdated } from 'store/actions/storeActions';

const useStyles = makeStyles(theme => ({
  box: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 'auto'
  },
  progress: {
    marginLeft: theme.spacing(1)
  },
  formError: {
    textAlign: "center"
  }
}));

const formName = "closingForm";

function ViewClosing(props) {
  const history = useHistory();
  const { storeId, closingId } = useParams();
  const { dispatch, handleSubmit, pristine, submitSucceeded, submitting, error, invalid, dirty, printClosing} = props;

  const storeRecord  = useSelector(state => {
    let closings = state.closings[storeId] ? state.closings[storeId].records : [];
    return closings.find(record => record._id === closingId);
  });

  const [open, setOpen] = useState(false);

  const cashCounted = useSelector(state => formValueSelector(formName)(state, "cashCounted"));

  const [closing, setClosing] = useState({});

  useEffect(() => {
    if(!storeRecord) return;
    setClosing(storeRecord);
    if(storeRecord.status === closingStates.CLOSING_STATUS_CLOSED)
    {
      dispatch( initialize(formName, storeRecord) );
      return;
    }
    dispatch( showProgressBar() );
    axios.get('/api/closings', { params: { storeId, closingId } }).then( ({ data }) => {
      dispatch( hideProgressBar() );
      if(data.closing)
      {
        setClosing(data.closing);
        dispatch( initialize(formName, data.closing) );
      }
    }).catch(err => {
      dispatch(hideProgressBar());
      dispatch( showError( err.response && err.response.data.message ? err.response.data.message: err.message ) );
    });

  }, [storeRecord, dispatch, storeId, closingId])

  const classes = useStyles();
  

  useEffect(() => {
    if(submitSucceeded)
      history.push('/sale/closings');
  }, [submitSucceeded, history])

  const handleDelete = useCallback((event) => {
    dispatch( change(formName, 'deleteClosing', true) );
    setTimeout(handleSubmit, 100);
  }, [handleSubmit, dispatch]);

  const handleClose = useCallback((event) => {
    dispatch( change(formName, 'deleteClosing', false) );
    setTimeout(handleSubmit, 100);
  }, [handleSubmit, dispatch]);
  
  const [anchorEl, setAnchorEl] = useState(null);
  const handleDeleteClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleDismiss = () => {
    setAnchorEl(null);
  };
  if(!closingId || !storeRecord)
  {
    dispatch( showError("Record not found") );
    return <Redirect to="/sale/closings" />
  }
  if(!closing._id) return null;
    return(
      <>
      <Box margin="auto" width="100%">
        <form>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box width={{ xs: "100%", width: "31%" }}>
            <Box width="160px" height="60px"  display="flex" justifyContent="center" fontSize="25px"  alignItems="center" style={ closing.status === closingStates.CLOSING_STATUS_OPEN ? { backgroundColor: "#2196f3", color: "#fff" } : { backgroundColor: "#6e6e6e", color: "#fff" } }>
              { closing.status === closingStates.CLOSING_STATUS_OPEN ? "OPEN" : "CLOSED" }
            </Box>
          </Box>
          <Box width={{ xs: "100%", width: "31%" }}>
            <Typography><b>Opening Time</b>: { moment(closing.startTime).format("DD MMM, YYYY") } &nbsp; &nbsp; { moment(closing.startTime).format("hh:mm A") }</Typography>
          </Box>
          <Box width={{ xs: "100%", width: "31%" }}>
            {
              closing.status === closingStates.CLOSING_STATUS_CLOSED ? 
              <Typography><b>Closing Time</b>: { moment(closing.endTime).format("DD MMM, YYYY") } &nbsp; &nbsp; { moment(closing.endTime).format("hh:mm A") }</Typography>
              : null
            }
          </Box>
        </Box>

        <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
          <Box width={{ xs: "100%", md: "25%" }} textAlign="center" border="2px solid #ececec" borderRight="none" height="80px" display="flex" alignItems="center" justifyContent="center" flexDirection="column">
            <Typography style={{ fontWeight: "bold", fontSize: 18 }}>Opening Cash</Typography>
            <Typography style={{ fontSize: 18 }}>{ closing.openingCash.toLocaleString() }</Typography>
          </Box>

          <Box width={{ xs: "100%", md: "25%" }} textAlign="center" border="2px solid #ececec" borderRight="none" height="80px" display="flex" alignItems="center" justifyContent="center" flexDirection="column">
            <Typography style={{ fontWeight: "bold", fontSize: 18, color: "green" }}>Total Inflow (+)</Typography>
            <Typography style={{ fontSize: 18 }}>{ closing.totalInflow.toLocaleString() }</Typography>
          </Box>

          <Box width={{ xs: "100%", md: "25%" }} textAlign="center" border="2px solid #ececec" borderRight="none" height="80px" display="flex" alignItems="center" justifyContent="center" flexDirection="column">
            <Typography style={{ fontWeight: "bold", fontSize: 18, color: "red" }}>Total Outflow (-)</Typography>
            <Typography style={{ fontSize: 18 }}>{ closing.totalOutflow.toLocaleString() }</Typography>
          </Box>

          <Box width={{ xs: "100%", md: "25%" }} textAlign="center" border="2px solid #ececec" height="80px" display="flex" alignItems="center" justifyContent="center" flexDirection="column">
            <Typography style={{ fontWeight: "bold", fontSize: 18 }}>Expected Cash</Typography>
            <Typography style={{ fontSize: 18 }}>{ closing.expectedCash.toLocaleString() }</Typography>
          </Box>
        </Box>

        <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
          
          <Box width={{ xs: "100%", md: "25%" }}>
            <Typography style={{ fontWeight: "bold", fontSize: 18, color: "green" }} >Inflow Details</Typography>
            <table style={{ width: "100%" }}>
              <tbody>
                <tr>
                  <th style={{ textAlign: 'left' }}>Cash Sales</th>
                  <td>{ closing.inflows.cashSales.toLocaleString() }</td>
                </tr>
                <tr>
                  <th style={{ textAlign: 'left' }}>Credit Payments</th>
                  <td>{ closing.inflows.customerCreditPayments.toLocaleString() }</td>
                </tr>
                <tr>
                  <th style={{ textAlign: 'left' }}>Other Income</th>
                  <td>{ closing.inflows.income.toLocaleString() }</td>
                </tr>
                <tr>
                  <th style={{ textAlign: 'left' }}>Cash from Bank</th>
                  <td>{ closing.inflows.cashFromBank.toLocaleString() }</td>
                </tr>
                <tr>
                  <th style={{ textAlign: 'left' }}>Other</th>
                  <td>{ closing.inflows.other.toLocaleString() }</td>
                </tr>
              </tbody>
            </table>
          </Box>

          <Box width={{ xs: "100%", md: "25%" }}>
            <Typography style={{ fontWeight: "bold", fontSize: 18, color: "red" }} >Outflow Details</Typography>
            <table style={{ width: "100%" }}>
              <tbody>
                <tr>
                  <th style={{ textAlign: 'left' }}>Cash Purchases</th>
                  <td>{ closing.outflows.cashPurchases.toLocaleString() }</td>
                </tr>
                <tr>
                  <th style={{ textAlign: 'left' }}>Supplier Payments</th>
                  <td>{ closing.outflows.supplierPayments.toLocaleString() }</td>
                </tr>
                <tr>
                  <th style={{ textAlign: 'left' }}>Expenses</th>
                  <td>{ closing.outflows.expenses.toLocaleString() }</td>
                </tr>
                <tr>
                  <th style={{ textAlign: 'left' }}>Cash to Bank</th>
                  <td>{ closing.outflows.cashToBank.toLocaleString() }</td>
                </tr>
                <tr>
                  <th style={{ textAlign: 'left' }}>Other</th>
                  <td>{ closing.outflows.other.toLocaleString() }</td>
                </tr>
              </tbody>
            </table>
          </Box>

        </Box>

        <Box display="flex" justifyContent="space-between" alignItems="center" my={3} mb={2}>
          <Box width={{ xs: "100%", md: "33%" }}>
            <Field
              component={TextInput}
              id="cashCounted"
              name="cashCounted"
              label="Cash Counted"
              placeholder="Cash counted..."
              fullWidth={true}
              variant="outlined"
              margin="dense"
              onKeyDown={allowOnlyNumber}
              showError={false}
              disabled={closing.status === closingStates.CLOSING_STATUS_CLOSED}
              InputProps={{
                  endAdornment:
                    <InputAdornment position="start">
                      <IconButton
                        onClick={() => setOpen(true) }
                        title="Count Cash Notes"
                        onMouseDown={(event) => event.preventDefault()}
                        disabled={closing.status === closingStates.CLOSING_STATUS_CLOSED}
                      >
                        { <FontAwesomeIcon icon={ faMoneyBill } size="xs" /> }
                      </IconButton>
                    </InputAdornment>
                  }
                }
            />

            <NoteCounter {...{open, setOpen, formName}} />
          </Box>
          <Box width={{ xs: "100%", md: "33%" }} pt={1} textAlign="center">
            <Typography>
              <b>Closing Cash</b>: &nbsp; { isNaN(cashCounted) ? 0 : Number(cashCounted).toLocaleString() }
            </Typography>
          </Box>

          <Box width={{ xs: "100%", md: "33%" }} pt={1} textAlign="center">
            <Typography>
              <b>Cash Difference</b>: &nbsp; { (+((isNaN(cashCounted) ? 0 : Number(cashCounted)) - closing.expectedCash).toFixed(2)).toLocaleString() }
            </Typography>
          </Box>

        </Box>

        <Box width={{ xs: '100%', md: '100%' }}>
          <Field
            component={TextInput}
            name="notes"
            label="Notes"
            placeholder="Notes..."
            type="text"
            fullWidth={true}
            variant="outlined"
            multiline
            rows={2}
            margin="dense"
            showError={false}
            disabled={closing.status === closingStates.CLOSING_STATUS_CLOSED}
          />
        </Box>

        {
          closing.status === closingStates.CLOSING_STATUS_CLOSED ? null :
          <Box textAlign="center">
            <Field
              component={CheckboxInput}
              name="printClosing"
              label="Print Closing"
              fullWidth={true}
              disabled={pristine || submitting || invalid || !dirty}
            />
          </Box>
        }

        <Box textAlign="center">
          {
            closing.status === closingStates.CLOSING_STATUS_CLOSED ? 
            <Button style={{ margin: "8px" }} variant="outlined" color="primary" title="Print Closing" startIcon={<FontAwesomeIcon icon={faPrint} size="xs" />} onClick={ () => printClosing(closing) } >
              Print
            </Button>
            :
            <>
              <Button style={{ margin: "0px 8px" }} disableElevation type="button" onClick={handleDeleteClick} startIcon={<FontAwesomeIcon icon={faTrash} />} variant="contained" color="primary" disabled={submitting || invalid } >
                Delete
              </Button>
              <Button style={{ margin: "0px 8px" }} disableElevation type="button" onClick={handleClose} startIcon={<FontAwesomeIcon icon={faCheck} />} variant="contained" color="primary" disabled={pristine || submitting || invalid || !dirty} >
                End Day
              </Button>
            </>
          }

          {  
            <FormHelperText className={classes.formError} error={true} style={{visibility: !submitting && error ? 'visible' : 'hidden' }}>
              <Typography component="span">{ error ? error : 'invalid request' }</Typography>
            </FormHelperText>  
          }
          
        </Box>

        <Popover 
          open={Boolean(anchorEl)}
          anchorEl={anchorEl}
          onClose={handleDismiss}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'center',
          }}
          transformOrigin={{
            vertical: "top",
            horizontal: "left",
          }}
          >
          <Box py={2} px={4} textAlign="center">
            <Typography gutterBottom>This closing will be deleted and previous closing will be opened. <br/> Do you want to delete this closing?</Typography>
            <Button startIcon={<FontAwesomeIcon icon={faTrash} />} disableElevation variant="contained" color="primary"  onClick={handleDelete}>
              Delete
            </Button>
          </Box>
        </Popover>
        </form>
      </Box>
      </>
    )
}

const validate = (values, props) => {
  const { dirty } = props;
  if(!dirty) return {};
  const errors = { };
  
  return errors;
}

const onSubmit = (formData, dispatch, { match, printClosing }) => {
    const payload = {...match.params, ...formData};
    dispatch(showProgressBar());
    if(payload.deleteClosing)

      return axios.post('/api/closings/delete', payload).then( ({ data }) => {
        dispatch(hideProgressBar());
        if(data.deletedClosing)
          dispatch( deleteClosing(match.params.storeId, data.deletedClosing._id) );
        if(data.openedClosing)
          dispatch( updateClosing( match.params.storeId, data.openedClosing._id, data.openedClosing) );
        if(data.lastEndOfDay)
          dispatch( lastEndOfDayUpdated(match.params.storeId, data.lastEndOfDay) );
        dispatch(showSuccess("Record deleted"));
      }).catch(err => {
        dispatch(hideProgressBar());
        throw new SubmissionError({
          _error: err.response && err.response.data.message ? err.response.data.message: err.message
        });
      });

    else
      //Close or delete
      return axios.post('/api/closings/close', payload).then( ({ data }) => {
        dispatch(hideProgressBar());
        if(data.openedRecord)
          dispatch( addNewClosing(match.params.storeId, data.openedRecord) );
        if(data.closedRecord)
          dispatch( updateClosing( match.params.storeId, data.closedRecord._id, data.closedRecord) );
        if(data.lastEndOfDay)
          dispatch( lastEndOfDayUpdated(match.params.storeId, data.lastEndOfDay) );
        if(formData.printClosing && data.closedRecord)
          printClosing(data.closedRecord);
        dispatch(showSuccess("Record closed"));
      }).catch(err => {
        dispatch(hideProgressBar());
        throw new SubmissionError({
          _error: err.response && err.response.data.message ? err.response.data.message: err.message
        });
      });
  };

const mapStateToProps = state => {
  const storeId = state.stores.selectedStoreId;
  return{
    storeId
  }
}

export default compose(
connect(mapStateToProps),
reduxForm({
  'form': formName,
  validate,
  onSubmit
})
)(ViewClosing);