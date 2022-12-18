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
import { Store } from '../../lib/store';
import MemberChooser from '../common/MemberChooser';
import PostEditor from '../posts/PostEditor';

type Props = {
  isMobile: boolean;
  store: Store;
  open: boolean;
  onClose: () => void;
};

type State = {
  days: [];
  timeRanges: [];
  disabled: boolean;
};

/* the create schedule form will present the user with a pop up interface
 * to configure their schedule for the first time. They will be able to select the days of the week that
 * they plan to teach, along with the time ranges that they plan to teach for each day.*/
class CreateScheduleForm extends React.Component<Props, State> {
  constructor(props) {
    super(props);

    this.state = {
      days: [],
      timeRanges: [],
      disabled: false,
    };
  }
  public render() {
    const { open, isMobile, store } = this.props;
    const { currentStudio, currentUser } = store;

    const membersMinusCreator = Array.from(currentStudio.members.values()).filter(
      (user) => user._id !== currentUser._id,
    );

    return (
      <React.Fragment>
        {open ? (
          <Head>
            <title>New Schedule</title>
          </Head>
        ) : null}
        <Dialog
          open={open}
          onClose={this.handleClose}
          aria-labelledby="form-dialog-title"
          fullScreen={true}
        >
          <DialogTitle id="form-dialog-title">Set up your Schedule</DialogTitle>
          <DialogContent>
            <br />
            <form style={{ width: '100%', height: '60% ' }} onSubmit={this.onSubmit}>
              <p />
              <br />
              <Button
                variant="contained"
                color="primary"
                onClick={this.onSubmit}
                disabled={this.state.disabled}
              >
                Create
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={this.handleClose}
                disabled={this.state.disabled}
              >
                Cancel
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </React.Fragment>
    );
  }

  public handleClose = () => {
    this.setState({
      days: [],
      timeRanges: [],
      disabled: false,
    });

    this.props.onClose();
  };

  private onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const { store } = this.props;
    const { currentStudio, currentUser } = store;

    if (!currentStudio) {
      return;
    }

    const { days, timeRanges } = this.state;

    this.setState({ disabled: true });
    NProgress.start();

    try {
      const schedule = await currentStudio.createSchedule({
        days,
        timeRanges,
      });

      this.setState({ days: [], timeRanges: [], disabled: false });

      notify('Schedule created successfully!');

      Router.push(`/studios/${currentStudio.slug}/schedule`);
    } catch (error) {
      notify(error);
      console.log(error);
    } finally {
      this.setState({ disabled: false });
      NProgress.done();
      this.props.onClose();
    }
  };
}

export default observer(CreateScheduleForm);
