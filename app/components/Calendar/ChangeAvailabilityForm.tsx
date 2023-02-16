import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import { observer } from 'mobx-react';
import Head from 'next/head';
import Router from 'next/router';
import NProgress from 'nprogress';
import React from 'react';

import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';

import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import type {} from '@mui/x-date-pickers/themeAugmentation';
import moment from 'moment';

import notify from '../../lib/notify';

import { Store } from '../lib/store';
import { Studio } from '../lib/studio';

type Props = {
  isMobile: boolean;
  store: Store;
  open: boolean;
  onClose: () => void;
  availability: any[];
  //businessHours: any[];
  onChange: (dayOfWeek: number, start: string, end: string) => void;
};

type State = {
  availability: any[];
  selectedDayOfWeek: string;

  disabled: boolean;
};

class ChangeAvailabilityForm extends React.Component<Props, State> {
  constructor(props) {
    super(props);

    this.state = {
      availability: props.availability,
      selectedDayOfWeek: '',

      disabled: false,
    };

    console.log('ChangeAvailabilityForm: props', props);
    console.log('ChangeAvailabilityForm: state', this.state);
    console.log('ChangeAvailabilityForm: state.availability', this.state.availability);
  }
  public render() {
    const { open, isMobile, store } = this.props;

    const allDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const { availability } = this.state;
    const addedDays = availability.map((row) => row.dayOfWeek);
    const availableDays = allDays.filter((day) => !addedDays.includes(day));
    const defaultDay = availableDays[0];

    const sortedAvailability = this.state.availability.sort((a, b) => a.dayOfWeek - b.dayOfWeek);

    return (
      <React.Fragment>
        {open ? (
          <Head>
            <title>Modify Your Available Times</title>
            <meta name="description" content="Modify Your Schedule" />
          </Head>
        ) : null}
        <Dialog
          onClose={this.handleClose}
          aria-labelledby="simple-dialog-title"
          open={open}
          fullScreen={true}
        >
          <DialogTitle id="simple-dialog-title">Modify Your Schedule</DialogTitle>
          <DialogContent>
            <br />
            <form style={{ width: '100%', height: '60%' }} onSubmit={this.onSubmit}>
              <p />
              <br />
              <TableContainer component={Paper}>
                <Table sx={{ minWidth: 650 }} aria-label="simple table">
                  <TableHead>
                    <TableRow>
                      <TableCell>Day</TableCell>
                      <TableCell align="right">Start Time</TableCell>
                      <TableCell align="right">End Time</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sortedAvailability.map((row) => (
                      <TableRow
                        key={`${row.dayOfWeek}-${row.startTime}-${row.endTime}`}
                        sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                      >
                        <TableCell component="th" scope="row">
                          {row.dayOfWeek}
                        </TableCell>
                        <TableCell align="right">
                          <LocalizationProvider dateAdapter={AdapterMoment}>
                            <TimePicker
                              label="start time"
                              value={moment(row.startTime, 'HH:mm')}
                              onChange={(newValue) => {
                                this.onChangeStartTime(row.dayOfWeek, newValue);
                              }}
                              renderInput={(params) => <TextField {...params} />}
                            />
                          </LocalizationProvider>
                        </TableCell>
                        <TableCell align="right">
                          <LocalizationProvider dateAdapter={AdapterMoment}>
                            <TimePicker
                              label="end time"
                              value={moment(row.endTime, 'HH:mm')}
                              onChange={(newValue) => {
                                this.onChangeEndTime(row.dayOfWeek, newValue);
                              }}
                              renderInput={(params) => <TextField {...params} />}
                            />
                          </LocalizationProvider>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <p />
              <br />
              <Select
                labelId="demo-simple-select-outlined-label"
                id="demo-simple-select-outlined"
                value={this.state.selectedDayOfWeek ?? defaultDay}
                onChange={this.handleDayOfWeekChange}
                label="Day of Week"
                style={{ minWidth: 100 }}
              >
                {availableDays.map((dayOfWeek) => (
                  <MenuItem key={dayOfWeek} value={dayOfWeek}>
                    {dayOfWeek}
                  </MenuItem>
                ))}
              </Select>
              <Button variant="contained" onClick={this.handleAddDay}>
                Add
              </Button>
              <p />
              <br />
              <div>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={this.state.disabled}
                >
                  Modify Schedule
                </Button>
                {isMobile ? <p /> : null}
                <Button
                  variant="outlined"
                  onClick={this.handleClose}
                  disabled={this.state.disabled}
                  style={{ marginLeft: isMobile ? '0px' : '20px' }}
                >
                  Cancel
                </Button>{' '}
              </div>
              <p />
              <br />
            </form>
          </DialogContent>
        </Dialog>
      </React.Fragment>
    );
  }

  private handleDayOfWeekChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    const selectedDayOfWeek = event.target.value as string;
    this.setState({ selectedDayOfWeek });
    console.log('handleDayOfWeekChange: selectedDayOfWeek', selectedDayOfWeek);
  };

  private handleAddDay = () => {
    const { selectedDayOfWeek } = this.state;
    const newDayOfWeek = selectedDayOfWeek;

    if (!newDayOfWeek) {
      return;
    }

    const { availability } = this.state;
    const newRow = {
      dayOfWeek: newDayOfWeek,
      startTime: '',
      endTime: '',
    };
    const newAvailability = [...availability, newRow];

    // sort the newAvailability array by the dayOfWeek
    newAvailability.sort((a, b) => {
      const daysOfWeek = [
        'Sunday',
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
      ];
      return daysOfWeek.indexOf(a.dayOfWeek) - daysOfWeek.indexOf(b.dayOfWeek);
    });

    this.setState({
      availability: newAvailability,
      selectedDayOfWeek: '',
    });

    console.log('newAvailability', newAvailability);
  };

  private getTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const date = new Date();
    date.setHours(Number(hours));
    date.setMinutes(Number(minutes));
    const formattedHours = date.getHours().toString().padStart(2, '0');
    const formattedMinutes = date.getMinutes().toString().padStart(2, '0');
    const formattedTime = `${formattedHours}:${formattedMinutes}`;
    return formattedTime;
  };

  private onChangeStartTime = (dayOfWeek: string, start: moment.Moment) => {
    const formattedStartTime = start.format('HH:mm');
    const { availability } = this.state;

    const updatedAvailability = availability.map((hour) => {
      if (hour.dayOfWeek === dayOfWeek) {
        return {
          ...hour,
          startTime: formattedStartTime,
        };
      } else {
        return hour;
      }
    });

    this.setState({ availability: updatedAvailability });
    console.log('onChangeStartTime', updatedAvailability);
  };

  private onChangeEndTime = (dayOfWeek: string, end: moment.Moment) => {
    const formattedEndTime = end.format('HH:mm');
    const { availability } = this.state;

    const updatedAvailability = availability.map((hour) => {
      if (hour.dayOfWeek === dayOfWeek) {
        if (formattedEndTime < hour.startTime) {
          notify('End time must be after the start time!');
          return hour;
        }
        return {
          ...hour,
          endTime: formattedEndTime,
        };
      } else {
        return hour;
      }
    });

    this.setState({ availability: updatedAvailability });
    console.log('onChangeEndTime', updatedAvailability);
  };

  public handleClose = () => {
    this.setState({
      availability: [],
      disabled: false,
    });
    this.props.onClose();
  };

  private onContentChanged = (content: string) => {
    console.log('onContentChanged', content);
    this.setState({ content });
  };

  private onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const { store } = this.props;
    const { currentStudio } = store;

    if (!currentStudio) {
      notify('Studio not selected');
      return;
    }

    const { availability } = this.state;

    // Check for invalid start/end time combinations
    const invalidTimes = availability.filter((row) => {
      const start = moment(row.startTime, 'HH:mm');
      const end = moment(row.endTime, 'HH:mm');
      return start.isAfter(end);
    });

    if (invalidTimes.length > 0) {
      notify('End time cannot be before start time');
      return;
    }

    this.setState({ disabled: true });
    NProgress.start();

    // console.log(notificationType);

    try {
      const result = await currentStudio.updateAvailability(availability);
      notify('Your schedule has been modified successfully.');

      const dev = process.env.NODE_ENV !== 'production';

      /*Router.push(
        `/discussion?studioSlug=${currentStudio.slug}&discussionSlug=${discussion.slug}`,
        `/studios/${currentStudio.slug}/discussions/${discussion.slug}`,
      );*/
    } catch (error) {
      console.log(error);
      notify(error);
    } finally {
      this.setState({ disabled: false });
      NProgress.done();
      this.props.onClose();
    }
  };
}

export default observer(ChangeAvailabilityForm);
