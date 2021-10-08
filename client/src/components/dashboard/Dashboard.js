import React from 'react';
import { connect } from 'react-redux';
import { Redirect } from 'react-router-dom';


function Dashboard({ selectedStoreId }){
  if(!selectedStoreId) return <Redirect to="/stores" />
  return(
    <div>Got it</div>
  )
}

const mapStateToProps = (state) => {
  return {
    selectedStoreId: state.stores.selectedStoreId
  }
}

export default connect(mapStateToProps)(Dashboard);