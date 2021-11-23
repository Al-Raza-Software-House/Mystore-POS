import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faPencilAlt, faTrash } from '@fortawesome/free-solid-svg-icons';
import { Box, Button, TableContainer, Table, TableBody, TableCell, TableHead, TableRow, IconButton, Popover, Typography } from '@material-ui/core';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { deleteCategory } from '../../../store/actions/categoryActions';
import { categoryTypes } from '../../../utils/constants';

function Categories({ storeId, categories, deleteCategory }) {
  return(
    <>
    {
      categories.length === 0 ?
      <Box width="100%" justifyContent="center" flexDirection="column" alignItems="center" height="50vh" display="flex" mb={2}>
        <Typography gutterBottom>Categories are used to organize your items into different sections</Typography>
        <Button startIcon={ <FontAwesomeIcon icon={faPlus} /> } variant="contained" color="primary" disableElevation component={Link} to="/stock/categories/create" >Create New Category</Button>
      </Box>
      :
      <>
      <Box width="100%" justifyContent="flex-end" display="flex" mb={2}>
        <Button startIcon={ <FontAwesomeIcon icon={faPlus} /> } variant="contained" color="primary" disableElevation component={Link} to="/stock/categories/create" >New Category</Button>
      </Box>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell align="center">Type</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {
              categories.map(item => <Category {...{item, storeId, deleteCategory}} key={item._id}  /> )
            }
          </TableBody>
        </Table>
      </TableContainer>
      </>
    }
    </>
  )
}

const categoryTypesMap = {
  [categoryTypes.CATEGORY_TYPE_STANDARD] : "Standard",
  [categoryTypes.CATEGORY_TYPE_VARIANT] : "Variant",
}

function Category({ item, storeId, deleteCategory }){
  const [anchorEl, setAnchorEl] = useState(null);
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };
  const open = Boolean(anchorEl);
  const id = open ? 'simple-popover' : undefined;
  return(
    <>
    <TableRow hover>
      <TableCell>{item.name}</TableCell>
      <TableCell align="center">
        { categoryTypesMap[item.type] }
      </TableCell>
      
      <TableCell align="right">
        {
          item.type === categoryTypes.CATEGORY_TYPE_VARIANT && 
          <Box display="inline-block" mb={{ xs: 1 , md: 0 }}>
            <Button variant="outlined" style={{ marginRight: '10px' }} color="primary" component={Link} to={ '/stock/categories/variants/' + storeId + '/' + item._id }>
              Variants
            </Button>
          </Box>
        }
        <Box display="inline-block" mb={{ xs: 1 , md: 0 }}>
          <Button variant="outlined" color="primary" component={Link} to={ '/stock/categories/properties/' + storeId + '/' + item._id }>
            Properties
          </Button>
        </Box>
        <IconButton component={Link} to={ '/stock/categories/edit/' + storeId + '/' + item._id }  title="Edit Category">
          <FontAwesomeIcon icon={faPencilAlt} size="xs" />
        </IconButton>
        <IconButton onClick={(event) => handleClick(event) } title="Delete Category">
          <FontAwesomeIcon icon={faTrash} size="xs" />
        </IconButton>
      </TableCell>
    </TableRow>
    <Popover 
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        >
        <Box py={2} px={4} textAlign="center">
          <Typography gutterBottom>Do you want to delete <b>{item.name}</b> category from store?</Typography>
          <Button disableElevation variant="contained" color="primary"  onClick={() => deleteCategory(storeId, item._id)}>
            Delete Category
          </Button>
        </Box>
      </Popover>
  </>
  )
}

const mapStateToProps = state => {
  const storeId = state.stores.selectedStoreId;
  return {
    categories: state.categories[storeId] ? state.categories[storeId] : [],
    storeId
  }
}


export default connect(mapStateToProps, { deleteCategory })(Categories);