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

  businessHours: any[];
  availability: any[];
};

type State = {
  availabilityFormOpen: boolean;
  scheduleId: string;

  events: any;
  calendarWeekends: boolean;
  calendarEvents: any;
  availabilityType: string;
  selectedStart: any;
  selectedEnd: any;
  businessHours: any[];
  availability: any[];
};

class TeacherCalendar extends React.Component<Props, State> {
  constructor(props) {
    super(props);

    this.state = {
      availabilityFormOpen: false,

      businessHours: this.props.businessHours,
      availability: this.props.availability,
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
          select={(info) => {
            this.handleTimeSelect(info.start, info.end);
          }}
        />
        { <ChangeAvailabilityForm
          isMobile={this.props.isMobile}
          store={this.props.store}
          availability={this.state.availability}
          open={this.state.availabilityFormOpen}
          onClose={this.handleAvailabilityFormClose}
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

  /* public method for closing availability form */
  public handleAvailabilityFormClose = () => {
    this.setState({ availabilityFormOpen: false });
  };

  /* handleTimeSelect */
  public handleTimeSelect = (start, end) => {
    //const { availabilityType } = this.state;
    this.setState({ selectedStart: start, selectedEnd: end });
    console.log(this.state);
  };
}

export default observer(TeacherCalendar);
