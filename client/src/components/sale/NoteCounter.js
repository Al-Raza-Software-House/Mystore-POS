import React, { useCallback, useMemo } from 'react';
import { Box, Dialog, DialogContent, DialogActions, Button, Typography, Table, TableBody, TableHead, TableRow, TableCell } from '@material-ui/core';
import { change, Field, getFormValues, reduxForm } from 'redux-form';
import TextInput from 'components/library/form/TextInput';
import { useSelector } from 'react-redux';
import { useDispatch } from 'react-redux';

const allowOnlyPostiveNumber = (e) => {
  let allowedKeys = [8, 9, 38, 40, 190, 37, 39, 46];
  if(!((e.keyCode > 95 && e.keyCode < 106)
    || (e.keyCode > 47 && e.keyCode < 58) 
    || allowedKeys.indexOf(e.keyCode) !== -1 )) {
      e.preventDefault();
      return false;
  }
}

const cellStyle = { textAlign: "center" };
const cashCounterFormName = "cashCounter";

function NoteCounter({ open, setOpen, formName }) {
  const values = useSelector(state => getFormValues(cashCounterFormName)(state));
  
  const { totalNotes, totalAmount } = useMemo(() => {
    let totals = { totalNotes: 0, totalAmount: 0 };
    if(!values) return totals;
    totals.totalNotes += isNaN(values.note5000) ? 0 : Number(values.note5000);
    totals.totalNotes += isNaN(values.note1000) ? 0 : Number(values.note1000);
    totals.totalNotes += isNaN(values.note500) ? 0 : Number(values.note500);
    totals.totalNotes += isNaN(values.note100) ? 0 : Number(values.note100);
    totals.totalNotes += isNaN(values.note50) ? 0 : Number(values.note50);
    totals.totalNotes += isNaN(values.note20) ? 0 : Number(values.note20);
    totals.totalNotes += isNaN(values.note10) ? 0 : Number(values.note10);

    totals.totalAmount += isNaN(values.note5000) ? 0 : Number(values.note5000) * 5000;
    totals.totalAmount += isNaN(values.note1000) ? 0 : Number(values.note1000) * 1000;
    totals.totalAmount += isNaN(values.note500) ? 0 : Number(values.note500) * 500;
    totals.totalAmount += isNaN(values.note100) ? 0 : Number(values.note100) * 100;
    totals.totalAmount += isNaN(values.note50) ? 0 : Number(values.note50) * 50;
    totals.totalAmount += isNaN(values.note20) ? 0 : Number(values.note20) * 20;
    totals.totalAmount += isNaN(values.note10) ? 0 : Number(values.note10) * 10;

    return totals;
  }, [values]);
  const dispatch = useDispatch();

  const saveTotal = useCallback(() => {
    setOpen(false);
    dispatch( change(formName, "cashCounted", totalAmount) )
  }, [dispatch, formName, totalAmount, setOpen]);

  const handleClose = () => setOpen(false);
  if(!values) return null;
  return(
    <Dialog  maxWidth="xs" fullWidth={true}  open={open} onClose={handleClose} aria-labelledby="form-dialog-title" onClick={(event) => { event.stopPropagation(); }}>
        <DialogContent>
          <Box display="flex" alignItems="center" justifyContent="center" >
            <Typography style={{ fontSize: 18, fontWeight: "bold" }}>Count Cash Notes</Typography>
          </Box>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell style={{ textAlign: "center", width: "33%" }}>Note</TableCell>
                <TableCell style={{ textAlign: "center", width: "33%" }}>No. of notes</TableCell>
                <TableCell style={{ textAlign: "center", width: "33%" }}>Amount</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>

              <TableRow>
                <TableCell style={cellStyle}>5000</TableCell>
                <TableCell>
                  <Field
                  component={TextInput}
                  name="note5000"
                  fullWidth={true}
                  variant="outlined"
                  margin="dense"

                  onKeyDown={allowOnlyPostiveNumber}
                  inputProps={{ type: "number", min: 0, style: { textAlign: "center" } }}
                  showError={false}
                  />
                </TableCell>
                <TableCell style={cellStyle}>{ (isNaN(values.note5000) ? 0 : Number(values.note5000) * 5000).toLocaleString() } </TableCell>
              </TableRow>

              <TableRow>
                <TableCell style={cellStyle}>1000</TableCell>
                <TableCell>
                  <Field
                  component={TextInput}
                  name="note1000"
                  fullWidth={true}
                  variant="outlined"
                  margin="dense"

                  onKeyDown={allowOnlyPostiveNumber}
                  inputProps={{ type: "number", min: 0, style: { textAlign: "center" } }}
                  showError={false}
                  />
                </TableCell>
                <TableCell style={cellStyle}>{ (isNaN(values.note1000) ? 0 : Number(values.note1000) * 1000).toLocaleString() } </TableCell>
              </TableRow>

              <TableRow>
                <TableCell style={cellStyle}>500</TableCell>
                <TableCell>
                  <Field
                  component={TextInput}
                  name="note500"
                  fullWidth={true}
                  variant="outlined"
                  margin="dense"

                  onKeyDown={allowOnlyPostiveNumber}
                  inputProps={{ type: "number", min: 0, style: { textAlign: "center" } }}
                  showError={false}
                  />
                </TableCell>
                <TableCell style={cellStyle}>{ (isNaN(values.note500) ? 0 : Number(values.note500) * 500).toLocaleString() } </TableCell>
              </TableRow>

              <TableRow>
                <TableCell style={cellStyle}>100</TableCell>
                <TableCell>
                  <Field
                  component={TextInput}
                  name="note100"
                  fullWidth={true}
                  variant="outlined"
                  margin="dense"

                  onKeyDown={allowOnlyPostiveNumber}
                  inputProps={{ type: "number", min: 0, style: { textAlign: "center" } }}
                  showError={false}
                  />
                </TableCell>
                <TableCell style={cellStyle}>{ (isNaN(values.note100) ? 0 : Number(values.note100) * 100).toLocaleString() } </TableCell>
              </TableRow>

              <TableRow>
                <TableCell style={cellStyle}>50</TableCell>
                <TableCell>
                  <Field
                  component={TextInput}
                  name="note50"
                  fullWidth={true}
                  variant="outlined"
                  margin="dense"

                  onKeyDown={allowOnlyPostiveNumber}
                  inputProps={{ type: "number", min: 0, style: { textAlign: "center" } }}
                  showError={false}
                  />
                </TableCell>
                <TableCell style={cellStyle}>{ (isNaN(values.note50) ? 0 : Number(values.note50) * 50).toLocaleString() } </TableCell>
              </TableRow>

              <TableRow>
                <TableCell style={cellStyle}>20</TableCell>
                <TableCell>
                  <Field
                  component={TextInput}
                  name="note20"
                  fullWidth={true}
                  variant="outlined"
                  margin="dense"

                  onKeyDown={allowOnlyPostiveNumber}
                  inputProps={{ type: "number", min: 0, style: { textAlign: "center" } }}
                  showError={false}
                  />
                </TableCell>
                <TableCell style={cellStyle}>{ (isNaN(values.note20) ? 0 : Number(values.note20) * 20).toLocaleString() } </TableCell>
              </TableRow>

              <TableRow>
                <TableCell style={cellStyle}>10</TableCell>
                <TableCell>
                  <Field
                  component={TextInput}
                  name="note10"
                  fullWidth={true}
                  variant="outlined"
                  margin="dense"

                  onKeyDown={allowOnlyPostiveNumber}
                  inputProps={{ type: "number", min: 0, style: { textAlign: "center" } }}
                  showError={false}
                  />
                </TableCell>
                <TableCell style={cellStyle}>{ (isNaN(values.note10) ? 0 : Number(values.note10) * 10).toLocaleString() } </TableCell>
              </TableRow>

            </TableBody>
            <TableHead>
              <TableRow>
                <TableCell style={{ textAlign: "center", width: "33%", fontSize: 16 }}>Total</TableCell>
                <TableCell style={{ textAlign: "center", width: "33%", fontSize: 16 }}>{ totalNotes.toLocaleString() }</TableCell>
                <TableCell style={{ textAlign: "center", width: "33%", fontSize: 16 }}>{ totalAmount.toLocaleString() }</TableCell>
              </TableRow>
            </TableHead>
          </Table>
        </DialogContent>
        <DialogActions style={{ justifyContent: 'center' }}>
          <Button disableElevation type="button" variant="contained" onClick={saveTotal} color="primary">
            Save
          </Button>
          <Button disableElevation type="button" variant="outlined" onClick={(event) => { event.stopPropagation(); handleClose(); }} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
  )
}

export default reduxForm({
  form: cashCounterFormName,
  initialValues: {
    note5000: 0,
    note1000: 0,
    note500: 0,
    note100: 0,
    note50: 0,
    note20: 0,
    note10: 0,
  }
})(NoteCounter);