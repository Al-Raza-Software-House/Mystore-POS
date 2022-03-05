import React, { useEffect } from 'react';
import { Typography, Box, Link, useTheme } from '@material-ui/core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFacebook, faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import MessengerCustomerChat from 'react-messenger-customer-chat';
import ReactGA from "react-ga4";

function ContactUs(props) {
  const theme = useTheme();
  useEffect(() => {
    ReactGA.send({ hitType: "pageview", page: "/help/contactus", 'title' : "Contact Us" });
  }, []);
  return(
    <Box>
      <Typography gutterBottom>Please check the related help section first. If you have any query or suggestion, You can reach us through WhatsApp or Facebook </Typography>
      <Typography variant="h5" gutterBottom style={{ display: 'flex', alignItems: 'center' }}>
        <FontAwesomeIcon style={{ color: '#25D366', marginRight: 6 }} icon={faWhatsapp} /> 
        <Link target="_blank" style={{fontSize: '16px'}} href={'https://api.whatsapp.com/send?phone='+ process.env.REACT_APP_CONTACT_US_NUMBER.replace('+', '') }>
          { process.env.REACT_APP_CONTACT_US_NUMBER }
        </Link>
      </Typography>
      <Typography variant="h5" style={{ display: 'flex', alignItems: 'center' }} gutterBottom>
        <FontAwesomeIcon style={{ color: '#4267B2', marginRight: 4 }} icon={faFacebook} /> 
        <Link target="_blank" style={{fontSize: '16px'}} href={'https://facebook.com/'+ process.env.REACT_APP_FACEBOOK_PAGE_ID }>
          Facebook Page
        </Link>
      </Typography>
      <Typography>
        Subscribe our <Link target="_blank" style={{fontSize: '16px'}} href="https://www.youtube.com/channel/UCLtXC68HtYR7DvOWXM14-7A"> YouTube channel </Link>
      </Typography>
      <Box mt={5}>
        { process.env.REACT_APP_NAME } is the product of <b>Cloud Crafts (Pvt) Ltd.</b>  &nbsp; &nbsp; Registration No: <b>0189502</b>
      </Box>
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