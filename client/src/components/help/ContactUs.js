import React from 'react';
import { Typography, Box, Link, useTheme } from '@material-ui/core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFacebook, faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import MessengerCustomerChat from 'react-messenger-customer-chat';

function ContactUs(props) {
  const theme = useTheme();
  return(
    <Box>
      <Typography gutterBottom>Please check the related help section first. If you have any query or suggestion, You can reach us through WhatsApp or Facebook </Typography>
      <Typography variant="h5" gutterBottom>
        <FontAwesomeIcon style={{ color: '#25D366' }} icon={faWhatsapp} /> { process.env.REACT_APP_CONTACT_US_NUMBER }
      </Typography>
      <Typography variant="h5" style={{ display: 'flex', alignItems: 'center' }}>
        <FontAwesomeIcon style={{ color: '#4267B2', marginRight: 4 }} icon={faFacebook} /> 
        <Link target="_blank" style={{fontSize: '16px'}} href={'https://facebook.com/'+ process.env.REACT_APP_FACEBOOK_PAGE_ID }>
          Facebook Page
        </Link>
      </Typography>
      <MessengerCustomerChat
        pageId={process.env.REACT_APP_FACEBOOK_PAGE_ID}
        appId={''}
        shouldShowDialog={true}
        themeColor={ theme.palette.primary.main }
      />
    </Box>
  )
}

export default ContactUs;