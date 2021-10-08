import React, { useState, useEffect } from 'react';
import { Accordion, AccordionSummary, Typography, makeStyles, AccordionDetails } from "@material-ui/core";
import grey from '@material-ui/core/colors/grey';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown } from '@fortawesome/free-solid-svg-icons';

const useStyles = makeStyles(theme => ({
  heading: {
    fontSize: theme.typography.pxToRem(15),
    fontWeight: theme.typography.fontWeightBold
  },
  summary: {
    borderBottom: '1px solid',
    borderBottomColor: grey[400],
    backgroundColor: grey[100]
  },
  summaryContent: {
    margin: "10px 0px !important"
  }
}))

const Panel = ({id, heading, children, expanded }) => {
  const classes = useStyles();
  const [isExpanded, setIsExpanded] = useState(expanded);
  useEffect(() => {
    setIsExpanded(expanded);
  }, [expanded])
  return (
  <Accordion expanded={isExpanded}>
    <AccordionSummary
      className={classes.summary}
      style={{ minHeight: '40px' }}
      classes={{
        content: classes.summaryContent
      }}
      expandIcon={<FontAwesomeIcon icon={faChevronDown} />}
      aria-controls={ id + "-content"}
      id={id+"-header"}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <Typography className={classes.heading}>{heading}</Typography>
    </AccordionSummary>
    <AccordionDetails >
      { children }
    </AccordionDetails>
  </Accordion> 
  );
}
 
export default Panel;