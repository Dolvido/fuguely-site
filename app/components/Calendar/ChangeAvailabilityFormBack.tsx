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

import notify from '../../lib/notify';

import { Store } from '../lib/store';
import { Studio } from '../lib/studio';

type Props = {
  isMobile: boolean;
  store: Store;
  open: boolean;
  onClose: () => void;
  businessHours: any[];
};

type State = {
  businessHours: any[];
  days: string[];
  startTimes: string[];
  endTimes: string[];

  disabled: boolean;
};

class ChangeAvailabilityForm extends React.Component<Props, State> {
  constructor(props) {
    super(props);


    this.state = {
      businessHours: props.businessHours,

      days: [],
      startTimes: [],
      endTimes: [],
      disabled: false,
    };

    console.log('ChangeAvailabilityForm: props', props);
    console.log('ChangeAvailabilityForm: state', this.state);
    console.log('ChangeAvailabilityForm: store', this.props.store);
  }
  public render() {
    const { open, isMobile, store } = this.props;

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
              <div>
                <Button
                  variant={
                    this.state.businessHours[0].daysOfWeek.includes(0) ? 'contained' : 'outlined'
                  }
                  onClick={() => this.toggleAvailabilityDay(0)}
                >
                  S
                </Button>
                <Button
                  variant={
                    this.state.businessHours[0].daysOfWeek.includes(1) ? 'contained' : 'outlined'
                  }
                  onClick={() => this.toggleAvailabilityDay(1)}
                >
                  M
                </Button>
                <Button
                  variant={
                    this.state.businessHours[0].daysOfWeek.includes(2) ? 'contained' : 'outlined'
                  }
                  onClick={() => this.toggleAvailabilityDay(2)}
                >
                  T
                </Button>
                <Button
                  variant={
                    this.state.businessHours[0].daysOfWeek.includes(3) ? 'contained' : 'outlined'
                  }
                  onClick={() => this.toggleAvailabilityDay(3)}
                >
                  W
                </Button>
                <Button
                  variant={
                    this.state.businessHours[0].daysOfWeek.includes(4) ? 'contained' : 'outlined'
                  }
                  onClick={() => this.toggleAvailabilityDay(4)}
                >
                  T
                </Button>
                <Button
                  variant={
                    this.state.businessHours[0].daysOfWeek.includes(5) ? 'contained' : 'outlined'
                  }
                  onClick={() => this.toggleAvailabilityDay(5)}
                >
                  F
                </Button>
                <Button
                  variant={
                    this.state.businessHours[0].daysOfWeek.includes(6) ? 'contained' : 'outlined'
                  }
                  onClick={() => this.toggleAvailabilityDay(6)}
                >
                  S
                </Button>
              </div>
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

  private toggleAvailabilityDay = (dayOfWeek: number) => {
    const updatedBusinessHours = this.state.businessHours.map((businessHour) => {
      if (businessHour.daysOfWeek.includes(dayOfWeek)) {
        return {
          ...businessHour,
          daysOfWeek: businessHour.daysOfWeek.filter((d) => d !== dayOfWeek),
        };
      } else {
        return {
          ...businessHour,
          daysOfWeek: [...businessHour.daysOfWeek, dayOfWeek],
        };
      }
    });

    const selectedDays = updatedBusinessHours.map((businessHour) =>
      businessHour.daysOfWeek.includes(dayOfWeek),
    );

    const availability = this.props.businessHours.find((hour) =>
      hour.daysOfWeek.includes(dayOfWeek),
    );

    const startTimes = selectedDays.map((isSelected) =>
      isSelected && availability ? availability.startTime : '',
    );

    const endTimes = selectedDays.map((isSelected) =>
      isSelected && availability ? availability.endTime : '',
    );

    this.setState({
      businessHours: updatedBusinessHours,
      days: selectedDays,
      startTimes,
      endTimes,
    });
  };

  private handleDayChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const dayOfWeek = parseInt(event.target.value);
    const selectedDay = this.state.businessHours.find((hour) =>
      hour.daysOfWeek.includes(dayOfWeek),
    );
    const startTime = selectedDay ? selectedDay.startTime : '';
    const endTime = selectedDay ? selectedDay.endTime : '';

    const updatedStartTimes = this.state.startTimes.map((time, index) =>
      this.state.days[index] ? startTime : time,
    );

    const updatedEndTimes = this.state.endTimes.map((time, index) =>
      this.state.days[index] ? endTime : time,
    );

    this.setState({
      startTimes: updatedStartTimes,
      endTimes: updatedEndTimes,
    });
  };

  public handleClose = () => {
    this.setState({
      days: [],
      startTimes: [],
      endTimes: [],
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
      notify('Studio have not selected');
      return;
    }

    const { days, startTimes, endTimes } = this.state;

    if (!days || days.length < 1) {
      notify('At least one day is required');
      return;
    }

    if (!startTimes || startTimes.length < 1) {
      notify('Start time is required');
      return;
    }

    if (!endTimes || endTimes.length < 1) {
      notify('End time is required');
      return;
    }

    this.setState({ disabled: true });
    NProgress.start();

    // console.log(notificationType);

    try {
      const availability = await currentStudio.changeAvailability({
        days,
        startTimes,
        endTimes,
      });

      //const post = await availability.addPost(content);

      const dev = process.env.NODE_ENV !== 'production';

      this.setState({ days: [], startTimes: [], endTimes: [] });

      notify('Your schedule has been modified successfully.');

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
