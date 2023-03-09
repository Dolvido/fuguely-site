import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Hidden from '@mui/material/Hidden';
import TextField from '@mui/material/TextField';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { inject, observer } from 'mobx-react';
import Head from 'next/head';
import NProgress from 'nprogress';

import * as React from 'react';
import { useState } from 'react';

import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';

import Layout from '../components/layout';
import InviteMember from '../components/studios/InviteMember';
import CreateScheduleForm from '../components/schedule/CreateScheduleForm';
import UpdateAvailabilityForm from '../components/schedule/AvailabilityForm';
import {
  getSignedRequestForUploadApiMethod,
  uploadFileUsingSignedPutRequestApiMethod,
} from '../lib/api/studio-member';
import TeacherCalendar from '../components/Calendar/TeacherCalendar';
import ChangeAvailabilityForm from './ChangeAvailabilityForm';


import confirm from '../lib/confirm';
import notify from '../lib/notify';
import { resizeImage } from '../lib/resizeImage';
import { Store } from '../lib/store';
import withAuth from '../lib/withAuth';

import { Schedule } from '../lib/schedule';

import { toJS } from 'mobx';

type Props = {
  store: Store;
  isMobile: boolean;
  firstGridItem: boolean;
  studioRequired: boolean;
  studioSlug: string;
};

function StudioSchedule({ store, isMobile, firstGridItem, studioRequired, studioSlug }: Props) {
  console.log('Schedule page: store', store);

  // get current context of studio and user
  const { currentStudio, currentUser } = store;
  const { schedule } = currentStudio;

  const isStudioTeacher =
    currentStudio && currentUser && currentUser._id === currentStudio.teacherId;

  // if no schedule is loaded, show message
  if (!schedule) {
    return (
      <Layout
        store={store}
        isMobile={isMobile}
        studioRequired={studioRequired}
        firstGridItem={firstGridItem}
      >
        <div style={{ padding: isMobile ? '0px' : '0px 30px' }}>
          <p>Schedule not loaded.</p>
          <p>
            Fetching schedule data... Please wait a moment and try again. If the problem persists, please contact us.
          </p>
        </div>
      </Layout>
    );
  }

  // if no studio is selected, show message
  if (!currentStudio || currentStudio.slug !== studioSlug) {
    return (
      <Layout
        store={store}
        isMobile={isMobile}
        studioRequired={studioRequired}
        firstGridItem={firstGridItem}
      >
        <div style={{ padding: isMobile ? '0px' : '0px 30px' }}>
          <p>You did not select any studio.</p>
          <p>
            To access this page, please select existing studio or create new studio if you have no
            studios.
          </p>
        </div>
      </Layout>
    );
  }

  // if user is not a teacher, show schedule without other students names, and without ability to edit
  if (!isStudioTeacher) {
    return (
      <Layout
        store={store}
        isMobile={isMobile}
        studioRequired={studioRequired}
        firstGridItem={firstGridItem}
      >
        <div style={{ padding: isMobile ? '0px' : '0px 30px' }}>
          <TeacherCalendar />
        </div>
      </Layout>
    );
  }

  // if user is a teacher, show schedule with other students names, and with ability to edit
  if (isStudioTeacher) {
    console.log('Schedule page: ', schedule);
    console.log('Schedule page: schedule.businessHours', schedule.businessHours);
    console.log('Schedule page: schedule.availability', toJS(schedule.availability));

    return (
      <Layout
        store={store}
        isMobile={isMobile}
        studioRequired={studioRequired}
        firstGridItem={firstGridItem}
      >
        <div style={{ padding: isMobile ? '0px' : '0px 30px' }}>
          <TeacherCalendar 
            store={store}
            schedule={schedule}
            businessHours={schedule.businessHours}
            availability={toJS(schedule.availability)}
            />
        </div>
      </Layout>
    );
  }
}

export default withAuth(inject('store')(observer(StudioSchedule)));
