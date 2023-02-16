import React from 'react';

// Basic MUI components
import Button from '@mui/material/Button';

import { observer } from 'mobx-react';

// MUI components for the calendar
import FullCalendar from '@fullcalendar/react'; // must go before plugins
import dayGridPlugin from '@fullcalendar/daygrid'; // a plugin!
import timeGridPlugin from '@fullcalendar/timegrid'; // a plugin!
import interactionPlugin from '@fullcalendar/interaction'; // needed for dayClick
import { select, unselect } from '@fullcalendar/core';
import { PropaneSharp } from '@mui/icons-material';
import { StartActionOptions } from '@mui/material/ButtonBase/TouchRipple';

import moment from 'moment';

import { Store } from '../lib/store';

type Props = {
  onChange: (item) => void;
  selectedTimeslotIds?: string[];
  timeslots: any[];
  label?: string;
  helperText?: string;
  store: Store;
};

type State = {
  events: any;
  calendarWeekends: boolean;
  calendarEvents: any;
  availabilityType: string;
  selectedStart: any;
  selectedEnd: any;
  availableTimes: any[];
  unavailableTimes: any[];
};

class TeacherCalendar extends React.Component<Props, State> {
  constructor(props) {
    super(props);

    this.state = {
      events: [],
      calendarWeekends: true,
      calendarEvents: [], // initial event data
      availabilityType: 'add',
      selectedStart: null,
      selectedEnd: null,
      availableTimes: [
        // define available times
        {
          groupId: 'availableTimes',
          daysOfWeek: [1, 2, 3, 4, 5], // available on weekdays
          startTime: '09:00', // start at 9:00 AM
          endTime: '17:00', // end at 5:00 PM
          display: 'inverse-background',
          backgroundColor: '#00b8d4',
        },
      ],
      unavailableTimes: [
        // define unavailable times
        {
          groupId: 'unavailableTimes',
          daysOfWeek: [6, 0], // unavailable on weekends
          startTime: '00:00', // start at midnight
          endTime: '00:00', // end at midnight
          display: 'inverse-background',
          backgroundColor: '#ff1744',
        },
      ],
    };
  }
  render() {
    return (
      <>
        {/* Add availability button */}
        <Button onClick={this.handleAddAvailabilityButtonClick} variant="contained">
          Add Availability
        </Button>
        {/* Remove availability button */}
        <Button onClick={this.handleRemoveAvailabilityButtonClick} variant="contained">
          Remove Availability
        </Button>
        <FullCalendar
          plugins={[timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          weekends={true}
          editable={true}
          selectable={true}
          selectMirror={true}
          dayMaxEvents={true}
          events={[...this.state.availableTimes, ...this.state.unavailableTimes]}
          select={(info) => {
            this.handleTimeSelect(info.start, info.end);
          }}
        />
      </>
    );
  }

  /* private method for Add Availability button */
  private handleAddAvailabilityButtonClick = () => {
    console.log(this.state);

    const { selectedStart, selectedEnd } = this.state;

    // convert to moment objects
    const startMoment = moment(selectedStart);
    const endMoment = moment(selectedEnd);

    let start, end;

    // swap start and end if start is after end
    if (startMoment.isBefore(endMoment)) {
      start = startMoment;
      end = endMoment;
    } else {
      console.log('start is before end, swapping');
      start = endMoment;
      end = startMoment;
    }

    // find the day of the week
    //const dayOfWeek = start.day();

    // add new event object to the availableTimes array
    this.setState({
      availableTimes: [
        ...this.state.availableTimes,
        {
          groupId: 'inverse-availableTimes',
          start: start.format(),
          end: end.format(),
          display: 'background',
          backgroundColor: '#00b8d4',
        },
      ],
    });
    // change state values to prevent being able to change the window after making a change
    this.setState({ selectedStart: null, selectedEnd: null });

    console.log(this.state);
  };

  /* private method for Remove Availability button */
  private handleRemoveAvailabilityButtonClick = () => {
    console.log(this.state);

    const { selectedStart, selectedEnd } = this.state;

    // convert to moment objects
    const startMoment = moment(selectedStart);
    const endMoment = moment(selectedEnd);

    let start = startMoment;
    let end = endMoment;

    // swap start and end if start is after end
    if (end.isBefore(start)) {
      console.log('start is before end, swapping');
      start = endMoment;
      end = startMoment;
    }

    // find the day of the week
    const dayOfWeek = start.day();

    console.log('remove', dayOfWeek, start.format('HH:mm'), end.format('HH:mm'));

    this.setState({
      unavailableTimes: [
        ...this.state.unavailableTimes,
        {
          groupId: 'inverse-unavailableTimes',
          start: start.format(),
          end: end.format(),
          display: 'background',
          backgroundColor: '#ff1744',
          
        },
      ],
    });
    /*
    this.setState({
      businessHours: this.state.businessHours.filter(
        (businessHour) =>
          businessHour.daysOfWeek[0] !== dayOfWeek ||
          businessHour.startTime !== start.format('HH:mm') ||
          businessHour.endTime !== end.format('HH:mm') ||
          businessHour.backgroundColor !== '#ff1744',
      ),
    });*/

    // change state values to prevent being able to change the window after making a change
    this.setState({ selectedStart: null, selectedEnd: null });
  };

  /* handleTimeSelect */
  public handleTimeSelect = (start, end) => {
    //const { availabilityType } = this.state;
    this.setState({ selectedStart: start, selectedEnd: end });
    console.log(this.state);
  };
}

export default observer(TeacherCalendar);
