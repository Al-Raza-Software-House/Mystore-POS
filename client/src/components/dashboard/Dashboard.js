import { faCubes, faMoneyBillAlt, faShoppingBasket, faShoppingCart, faStoreSlash, faUsers } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Box, ButtonBase, makeStyles, Paper, Typography, useMediaQuery } from '@material-ui/core';
import React from 'react';
import { useEffect } from 'react';
import { connect } from 'react-redux';
import { Redirect } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { loadStats } from 'store/actions/dashboardActions';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const useStyles = makeStyles((theme) => ({
  quickLink:{
    backgroundColor: "#fff",
    width: 120,
    height: 120,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    color: "#2196f3",
    fontSize: 16,
  },
  stats:{
    backgroundColor: "#fff",
    width: 150,
    height: 150,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    color: "#2196f3",
    fontSize: 16,
    marginBottom: theme.spacing(2)
  }
}));
const quickLinks = [
  {
    to: "/stock/items/create",
    title: "New Item",
    icon: faCubes
  },
  {
    to: "/sale",
    title: "Sale & Return",
    icon: faShoppingCart
  },
  {
    to: "/sale/closings",
    title: "Day Close",
    icon: faStoreSlash
  },
  {
    to: "/purchase/grns/new",
    title: "New GRN",
    icon: faShoppingBasket
  },
  {
    to: "/parties/customers",
    title: "Customers",
    icon: faUsers
  },
  {
    to: "/accounts/transactions/new",
    title: "New TXN",
    icon: faMoneyBillAlt
  },
]

function Dashboard({ storeId, loadStats, stats }){
  const classes = useStyles();
  useEffect(() => {
    if(!storeId) return;
      loadStats(); 
  }, [loadStats, storeId])
  const isDesktop = useMediaQuery((theme) => theme.breakpoints.up('sm'), { noSsr: true });
  if(!storeId) return <Redirect to="/stores" />
  return(
    <Box px={3} pt={3}>
      {
         isDesktop ? 
          <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap">
            {
              quickLinks.map(record => (
                <ButtonBase component={Link} to={record.to} key={record.to}>
                  <Paper className={classes.quickLink} elevation={5}>
                    <Box textAlign="center" mb={2}>
                      <FontAwesomeIcon icon={record.icon} size="2x" />
                    </Box>
                    <span style={{ color: "#606060" }} >{record.title}</span>
                  </Paper>
                </ButtonBase>
              ))
            }
          </Box>
          : null
      }
      {
        !stats ? null :
        <>
          <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" mt={4}>
            <Box width={{ xs: "100%", md: "48%" }} display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap">
              <Box width="100%" pb={1}  borderBottom="3px solid #2196f3">
                <Typography align="center" variant="h5" style={{ color: "#606060" }}>Today</Typography>
              </Box>
              <Paper className={classes.stats} elevation={5}>
                <Box style={{ color: "#2196f3", fontWeight: 'bold', fontSize: 26 }} mb={3} >{ stats.sale.today.saleAmount.toLocaleString() }</Box>
                <span style={{ color: "#606060" }} >Sale</span>
              </Paper>

              <Paper className={classes.stats} elevation={5}>
                <Box style={{ color: "#2196f3", fontWeight: 'bold', fontSize: 26 }} mb={3} >{ stats.sale.today.receipts.toLocaleString() }</Box>
                <span style={{ color: "#606060" }} >Receipts</span>
              </Paper>

              <Paper className={classes.stats} elevation={5}>
                <Box style={{ color: "#2196f3", fontWeight: 'bold', fontSize: 26 }} mb={3} >{ stats.sale.today.grossProfit.toLocaleString() }</Box>
                <span style={{ color: "#606060" }} >Profit</span>
              </Paper>

            </Box>
            <Box width={{ xs: "100%", md: "48%" }} display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap">
              <Box width="100%" pb={1}  borderBottom="3px solid #2196f3">
                <Typography align="center" variant="h5" style={{ color: "#606060" }}>Yesterday</Typography>
              </Box>
              <Paper className={classes.stats} elevation={5}>
                <Box style={{ color: "#2196f3", fontWeight: 'bold', fontSize: 26 }} mb={3} >{ stats.sale.yesterday.saleAmount.toLocaleString() }</Box>
                <span style={{ color: "#606060" }} > Sale</span>
              </Paper>

              <Paper className={classes.stats} elevation={5}>
                <Box style={{ color: "#2196f3", fontWeight: 'bold', fontSize: 26 }} mb={3} >{ stats.sale.yesterday.receipts.toLocaleString() }</Box>
                <span style={{ color: "#606060" }} > Receipts</span>
              </Paper>

              <Paper className={classes.stats} elevation={5}>
                <Box style={{ color: "#2196f3", fontWeight: 'bold', fontSize: 26 }} mb={3} >{ stats.sale.yesterday.grossProfit.toLocaleString() }</Box>
                <span style={{ color: "#606060" }} > Profit</span>
              </Paper>
            </Box>
          </Box>

          <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" mt={4}>
            <ButtonBase component={Link} to="/stock/categories" >
              <Paper className={classes.stats} elevation={5}>
                <Box style={{ color: "#2196f3", fontWeight: 'bold', fontSize: 26 }} mb={3} >{ stats.totals.categories.toLocaleString() }</Box>
                <span style={{ color: "#606060" }} >Total Categories</span>
              </Paper>
            </ButtonBase>

            <ButtonBase component={Link} to="/stock" >
              <Paper className={classes.stats} elevation={5}>
                <Box style={{ color: "#2196f3", fontWeight: 'bold', fontSize: 26 }} mb={3} >{ stats.totals.items.toLocaleString() }</Box>
                <span style={{ color: "#606060" }} >Total Items</span>
              </Paper>
            </ButtonBase>
            
            <ButtonBase component={Link} to="/parties/customers" >
              <Paper className={classes.stats} elevation={5}>
                <Box style={{ color: "#2196f3", fontWeight: 'bold', fontSize: 26 }} mb={3} >{ stats.totals.customers.toLocaleString() }</Box>
                <span style={{ color: "#606060" }} >Total Customers</span>
              </Paper>
            </ButtonBase>

            <ButtonBase component={Link} to="/parties/suppliers" >
              <Paper className={classes.stats} elevation={5}>
                <Box style={{ color: "#2196f3", fontWeight: 'bold', fontSize: 26 }} mb={3} >{ stats.totals.suppliers.toLocaleString() }</Box>
                <span style={{ color: "#606060" }} >Total Suppliers</span>
              </Paper>
            </ButtonBase>

            <Paper className={classes.stats} elevation={5}>
              <Box style={{ color: "#2196f3", fontWeight: 'bold', fontSize: 26 }} mb={3} >{ stats.totals.payable.toLocaleString() }</Box>
              <span style={{ color: "#606060" }} >Net Payable</span>
            </Paper>

            <Paper className={classes.stats} elevation={5}>
              <Box style={{ color: "#2196f3", fontWeight: 'bold', fontSize: 26 }} mb={3} >{ stats.totals.receivable.toLocaleString() }</Box>
              <span style={{ color: "#606060" }} >Net Receivable</span>
            </Paper>
          </Box>

          <Paper style={{ width: "100%", padding: "8px 0px", marginTop: 24 }} >
            <Typography variant="h6" style={{ color: "#606060", textAlign: "center", width: "100%", marginBottom: "16px" }}> Daily Sales </Typography>
            <Box height="400px">
              <ResponsiveContainer width="100%" height="100%" style={{ backgroundColor: "#fff" }}>
                <LineChart
                  width={500}
                  height={300}
                  data={stats.dailySales}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="saleDate" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="totalSaleAmount" name="Sale" stroke="#8884d8" activeDot={{ r: 8 }} />
                  <Line type="monotone" dataKey="totalGrossProfit" name="Gross Profit" stroke="#2196f3" />
                  <Line type="monotone" dataKey="totalReceipts" name="Receipts" stroke="#82ca9d" />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
          <Box mt={1}></Box>
        </>
      }
      <Box mt={4}  >
        &nbsp;
      </Box>
    </Box>
  )
}

const mapStateToProps = (state) => {
  const storeId = state.stores.selectedStoreId;
  let stats = storeId && state.dashboard[storeId] && state.dashboard[storeId].stats ? state.dashboard[storeId].stats : null;
  return {
    storeId,
    stats
  }
}

export default connect(mapStateToProps, { loadStats })(Dashboard);