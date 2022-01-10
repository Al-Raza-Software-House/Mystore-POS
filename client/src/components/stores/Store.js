import React from 'react';
import { connect } from 'react-redux';
import { selectStore } from '../../store/actions/storeActions';
import { makeStyles, Card, CardActions, CardContent, Button, Typography } from '@material-ui/core';
import { useHistory } from 'react-router-dom';
import DeleteStore from './DeleteStore';
import { userTypes } from '../../utils/constants';
import { isSalesperson } from 'utils';

const useStyles = makeStyles({
  root: {
    minWidth: 275,
    margin: '8px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between'
  },
  content: {
    display: 'inline-block',
    margin: '0 2px',
    transform: 'scale(0.8)',
  },
  title: {
    fontSize: 14,
  },
  pos: {
    marginBottom: 12,
  },
});

function Store({ uid, store, selectStore }) {
  const classes = useStyles();
  const history = useHistory();
  const isOwner = store.users.find(item => item.userId === uid && item.userRole === userTypes.USER_ROLE_OWNER);
  const role = store.users.find(item => item.userId === uid);
  const handleActionBtnClick = () => {
    selectStore(store._id, role.userRole);
    if(isSalesperson(role.userRole))
      history.push('/sale');
    else
      history.push('/dashboard');
  }
  return (
    <Card className={classes.root} variant="outlined">
      <CardContent>
        <Typography variant="h5" component="h2"> {store.name} </Typography>
        <Typography color="textSecondary"> {store.phone1} </Typography>
        <Typography className={classes.pos} color="textSecondary"> {store.city} </Typography>
        <Typography variant="body2" component="p"> {store.address} </Typography>
      </CardContent>
      <CardActions style={{ justifyContent: 'space-between' }}>
        <Button disableElevation size="small" color="primary" onClick={handleActionBtnClick}>SELECT STORE</Button>
        { isOwner && <DeleteStore id={store._id} name={store.name} /> }
      </CardActions>
    </Card>
  );
}

const mapStateToProps = state => ({
  uid: state.auth.uid
})

export default connect(mapStateToProps, { selectStore })(Store);