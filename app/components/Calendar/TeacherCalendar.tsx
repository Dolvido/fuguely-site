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

import ChangeAvailabilityForm from './ChangeAvailabilityForm';

import { Store } from '../../lib/store';
import { Studio } from '../../lib/studio';
import { Schedule } from '../../lib/schedule';

import { toJS } from 'mobx';

type Props = {
  onChange: (item) => void;
  store: Store;
  studio: Studio;
  isMobile: boolean;

  schedule: Schedule;
  businessHours: any[];
  availability: any[];
};

type State = {
  availabilityFormOpen: boolean;
  scheduleId: string;
  businessHours: any[];
  availability: any[];
  selectedStart: any;
  selectedEnd: any;
  creatingBlankLesson: boolean;
  creatingBreak: boolean;
  calendarRef: React.RefObject<FullCalendar>;
};

class TeacherCalendar extends React.Component<Props, State> {
  constructor(props) {
    super(props);

    this.state = {
      availabilityFormOpen: false,
      creatingBlankLesson: false,
      creatingBreak: false,

      businessHours: this.props.businessHours,
      availability: this.props.availability,
      calendarRef: React.createRef(),
    };
  }

  render() {
    const { store, studio } = this.props;

    console.log(this.state.businessHours);

    return (
      <>
        {/* Add availability button */}
        <Button onClick={this.handleChangeAvailabilityButtonClick} variant="contained">
          Change Availability
        </Button>
        <Button onClick={this.handleBlankLessonClick}>Create Blank Lesson</Button>
        <Button onClick={this.handleBreakClick}>Create Break</Button>
        <FullCalendar
          plugins={[timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          weekends={true}
          editable={true}
          selectable={true}
          selectMirror={true}
          dayMaxEvents={true}
          businessHours={this.state.businessHours}
          events={[
            { title: 'event 1', date: '2021-07-01' },
            { title: 'event 2', date: '2021-07-02' },
          ]}
          slotMinTime={"08:00:00"}
          slotMaxTime={"22:00:00"}
          select={(info) => {
            const { creatingBlankLesson, creatingBreak } = this.state;

            if (creatingBlankLesson) {
              // Create a blank lesson event
              const newEvent = {
                title: '',
                start: info.start,
                end: info.end,
                editable: true,
              };
              this.calendarRef.current.getApi().addEvent(newEvent);
            } else if (creatingBreak) {
              // Create a break event
              const newEvent = {
                title: 'Break',
                start: info.start,
                end: info.end,
                editable: false,
                color: 'gray',
              };
              this.calendarRef.current.getApi().addEvent(newEvent);
            }
            

            

            this.handleTimeSelect(info.start, info.end);
          }}
        />
        { <ChangeAvailabilityForm
          isMobile={this.props.isMobile}
          store={this.props.store}
          availability={this.state.availability}
          open={this.state.availabilityFormOpen}
          onClose={this.handleAvailabilityFormClose}
          onChange={this.handleAvailabilityChange}
        /> }
      </>
    );
  }

  /* public method for change Availability button */
  public handleChangeAvailabilityButtonClick = () => {
    console.log(this.state);

    // TODO: add logic to change availability
    this.setState({ availabilityFormOpen: true });
  };

  handleBlankLessonClick = () => {
    this.setState({ creatingBlankLesson: true });
  };
  
  handleBreakClick = () => {
    this.setState({ creatingBreak: true });
  };

  /* public method for handling availability changes */
  public handleAvailabilityChange = (availability) => {
    console.log('handleAvailabilityChange', availability);

    const businessHours = [];
  
    const daysOfWeekMap = {
      Sunday: 0,
      Monday: 1,
      Tuesday: 2,
      Wednesday: 3,
      Thursday: 4,
      Friday: 5,
      Saturday: 6,
    };
    const avails = availability;

    for (const entry of avails) {
      console.log('for loop entry', entry);
      const dayOfWeek = daysOfWeekMap[entry.dayOfWeek];
      const startTime = entry.startTime;
      const endTime = entry.endTime;
  
      if (dayOfWeek !== undefined && startTime && endTime) {
        businessHours.push({
          daysOfWeek: [dayOfWeek],
          startTime: startTime,
          endTime: endTime,
          backgroundColor: '#00a65a',
        });
      }
    }
    this.state.businessHours = businessHours;
    return businessHours;
  
  };

  

  /* public method for closing availability form */
  public handleAvailabilityFormClose = () => {
    this.setState({ availabilityFormOpen: false });
    //console.log('handleAvailabilityFormClose', availability);
  };

  /* handleTimeSelect */
  public handleTimeSelect = (start, end) => {
    //const { availabilityType } = this.state;
    this.setState({ selectedStart: start, selectedEnd: end });
    console.log(this.state);
  };

}

export default observer(TeacherCalendar);
