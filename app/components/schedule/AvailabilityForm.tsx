import React from 'react';

import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';

import { observer } from 'mobx-react';

import Head from 'next/head';
import Router from 'next/router';
import NProgress from 'nprogress';

import notify from '../../lib/notify';
import { Store } from '../../lib/store';
import { Button, Dialog, DialogContent, DialogTitle, IconButton } from '@mui/material';

type Props = {
  isMobile: boolean;
  store: Store;
  open: boolean;
  onClose: () => void;
};

type State = {
  availability: [{ dayOfWeek: ''; startTime: ''; endTime: '' }];
  disabled: boolean;
};

// create list of days of the week
const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// create a list of time options (in 30 minute increments)
const timeOptions = [];
for (let i = 0; i < 24; i++) {
  timeOptions.push(`${i}:00`);
  timeOptions.push(`${i}:30`);
}

/* the create schedule form will present the user with a pop up interface
 * that allows a teacher to input the day of the week, start time, and end time for each availability
 * window that they wish to create. */
class AvailabilityForm extends React.Component<Props, State> {
  constructor(props) {
    super(props);

    this.state = {
      availability: [{ dayOfWeek: '', startTime: '', endTime: '' }],
      disabled: false,
    };
  }
  public render() {
    const { open, isMobile, store } = this.props;
    const { currentStudio, currentUser } = store;

    //const availability = currentStudio?.schedule?.availability || [];

    return (
      <form>
        {this.state.availability.map((window, index) => (
          <div key={index}>
            <label>
              Day of the week:
              <select
                value={window.dayOfWeek}
                onChange={(event) => this.onChange(event, index, 'dayOfWeek')}
              >
                <option value="">--Select--</option>
                <option value="Sunday">Sunday</option>
                <option value="Monday">Monday</option>
                <option value="Tuesday">Tuesday</option>
                <option value="Wednesday">Wednesday</option>
                <option value="Thursday">Thursday</option>
                <option value="Friday">Friday</option>
                <option value="Saturday">Saturday</option>
              </select>
            </label>
            <br />
            <label>
              Start time:
              <select
                value={window.startTime}
                onChange={(event) => this.onChange(event, index, 'startTime')}
              >
                <option value="">--Select--</option>
                <option value="0:00">0:00</option>
                <option value="0:30">0:30</option>
                <option value="1:00">1:00</option>
                <option value="1:30">1:30</option>
                <option value="2:00">2:00</option>
                <option value="2:30">2:30</option>
                <option value="3:00">3:00</option>
                <option value="3:30">3:30</option>
                <option value="4:00">4:00</option>
                <option value="4:30">4:30</option>
                <option value="5:00">5:00</option>
                <option value="5:30">5:30</option>
                <option value="6:00">6:00</option>
                <option value="6:30">6:30</option>
                <option value="7:00">7:00</option>
                <option value="7:30">7:30</option>
                <option value="8:00">8:00</option>
                <option value="8:30">8:30</option>
                <option value="9:00">9:00</option>
                <option value="9:30">9:30</option>
                <option value="10:00">10:00</option>
                <option value="10:30">10:30</option>
                <option value="11:00">11:00</option>
                <option value="11:30">11:30</option>
                <option value="12:00">12:00</option>
              </select>
            </label>
            <br />
            <label>
              End time:
              <select
                value={window.endTime}
                onChange={(event) => this.onChange(event, index, 'endTime')}
              >
                <option value="">--Select--</option>
                <option value="">--Select--</option>
                <option value="0:00">0:00</option>
                <option value="0:30">0:30</option>
                <option value="1:00">1:00</option>
                <option value="1:30">1:30</option>
                <option value="2:00">2:00</option>
                <option value="2:30">2:30</option>
                <option value="3:00">3:00</option>
                <option value="3:30">3:30</option>
                <option value="4:00">4:00</option>
                <option value="4:30">4:30</option>
                <option value="5:00">5:00</option>
                <option value="5:30">5:30</option>
                <option value="6:00">6:00</option>
                <option value="6:30">6:30</option>
                <option value="7:00">7:00</option>
                <option value="7:30">7:30</option>
                <option value="8:00">8:00</option>
                <option value="8:30">8:30</option>
                <option value="9:00">9:00</option>
                <option value="9:30">9:30</option>
                <option value="10:00">10:00</option>
                <option value="10:30">10:30</option>
                <option value="11:00">11:00</option>
                <option value="11:30">11:30</option>
                <option value="12:00">12:00</option>
              </select>
            </label>
            <Button
              variant="contained"
              color="primary"
              onClick={this.onSubmit}
              disabled={this.state.disabled}
            >
              Add Availability
            </Button>
            <br />
          </div>
        ))}
      </form>
    );
  }

  onChange = (event, index, field) => {
    const value = event.target.value;
    this.setState((prevState) => {
      const newAvailability = [...prevState.availability];
      newAvailability[index][field] = value;
      return { availability: newAvailability };
    });
  };

  private onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    console.log('submitting availability');
    event.preventDefault();

    const { store } = this.props;
    const { currentStudio, currentUser } = store;

    if (!currentStudio || !currentUser) {
      return;
    }

    const { availability } = this.state;

    console.log(availability);

    this.setState({ disabled: true });
    NProgress.start();

    try {
      const schedule = await currentStudio.addAvailabilityWindow({
        availability,
      });

      this.setState({ disabled: false });

      notify('Schedule updated successfully');
    } catch (error) {
      notify(error.message);
      console.log(error);
    } finally {
      this.setState({
        availability: [{ dayOfWeek: '', startTime: '', endTime: '' }],
        disabled: false,
      });
      NProgress.done();
      this.props.onClose();
    }
  };
}

export default observer(AvailabilityForm);
