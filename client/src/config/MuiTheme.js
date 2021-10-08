import { createMuiTheme, useMediaQuery  } from "@material-ui/core";
import { blue } from "@material-ui/core/colors";
import { useTheme } from '@material-ui/styles';

const theme = createMuiTheme({
  palette: {
    primary: blue  
  }
});

export const  useWidth = () => {
  const theme = useTheme();
  const keys = [...theme.breakpoints.keys].reverse();
  return (
    keys.reduce((output, key) => {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const matches = useMediaQuery(theme.breakpoints.up(key));
      return !output && matches ? key : output;
    }, null) || 'xs'
  );
}

export default theme;