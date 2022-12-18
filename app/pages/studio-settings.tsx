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
import confirm from '../lib/confirm';
import notify from '../lib/notify';
import { resizeImage } from '../lib/resizeImage';
import { Store } from '../lib/store';
import withAuth from '../lib/withAuth';

type Props = {
  store: Store;
  isMobile: boolean;
  firstGridItem: boolean;
  studioRequired: boolean;
  studioSlug: string;
};

function StudioSettings({ store, isMobile, firstGridItem, studioRequired, studioSlug }: Props) {
  const [newName, setNewName] = useState<string>(store.currentStudio.name);
  const [newAvatarUrl, setNewAvatarUrl] = useState<string>(store.currentStudio.avatarUrl);
  const [disabled, setDisabled] = useState<boolean>(false);
  const [createScheduleOpen, setCreateScheduleOpen] = useState<boolean>(false);
  const [updateAvailabilityOpen, setUpdateAvailabilityOpen] = useState<boolean>(false);
  const [inviteMemberOpen, setInviteMemberOpen] = useState<boolean>(false);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const { currentStudio } = store;

    if (!newName) {
      notify('Studio name is required');
      return;
    }

    NProgress.start();
    setDisabled(true);

    try {
      await currentStudio.updateTheme({ name: newName, avatarUrl: newAvatarUrl });

      notify('You successfully updated Studio name.');
    } catch (error) {
      notify(error);
    } finally {
      setDisabled(false);
      NProgress.done();
    }
  };

  const uploadFile = async () => {
    const { currentStudio } = store;

    const fileElement = document.getElementById('upload-file-studio-logo') as HTMLFormElement;
    const file = fileElement.files[0];

    if (file == null) {
      notify('No file selected for upload.');
      return;
    }

    const fileName = file.name;
    const fileType = file.type;

    NProgress.start();
    setDisabled(true);

    const bucket = process.env.NEXT_PUBLIC_BUCKET_FOR_STUDIO_LOGOS;
    const prefix = `${currentStudio.slug}`;

    console.log(bucket);

    try {
      const responseFromApiServerForUpload = await getSignedRequestForUploadApiMethod({
        fileName,
        fileType,
        prefix,
        bucket,
      });

      const resizedFile = await resizeImage(file, 128, 128);

      await uploadFileUsingSignedPutRequestApiMethod(
        resizedFile,
        responseFromApiServerForUpload.signedRequest,
        { 'Cache-Control': 'max-age=2592000' },
      );

      setNewAvatarUrl(responseFromApiServerForUpload.url);

      await currentStudio.updateTheme({
        name: newName,
        avatarUrl: newAvatarUrl,
      });

      notify('You successfully uploaded new Studio logo.');
    } catch (error) {
      notify(error);
    } finally {
      setDisabled(false);
      NProgress.done();
    }
  };

  const openCreateSchedule = async () => {
    const { currentStudio } = store;
    if (!currentStudio) {
      notify('You have not selected a Studio.');
      return;
    }

    setCreateScheduleOpen(true);
  };

  const handleCreateScheduleClose = () => {
    setCreateScheduleOpen(false);
  };

  const openUpdateAvailability = async () => {
    const { currentStudio } = store;
    if (!currentStudio) {
      notify('You have not selected a Studio.');
      return;
    }
    setUpdateAvailabilityOpen(true);
  };

  const handleUpdateAvailabilityClose = () => {
    setUpdateAvailabilityOpen(false);
  };

  const openInviteMember = async () => {
    const { currentStudio } = store;
    if (!currentStudio) {
      notify('You have not selected a Studio.');
      return;
    }

    const ifStudioTeacherMustBeCustomer = await currentStudio.checkIfStudioTeacherMustBeCustomer();

    if (ifStudioTeacherMustBeCustomer) {
      notify(
        'To add a third studio member, you have to become a paid customer.' +
          '<p />' +
          ' To become a paid customer,' +
          ' navigate to Billing page.',
      );
      return;
    }

    setInviteMemberOpen(true);
  };

  const handleInviteMemberClose = () => {
    setInviteMemberOpen(false);
  };

  const removeMember = (event) => {
    const { currentStudio } = store;

    if (!currentStudio) {
      notify('You have not selected a Studio.');
      return;
    }

    const userId = event.currentTarget.dataset.id;
    if (!userId) {
      notify('Select user.');
      return;
    }

    confirm({
      title: 'Are you sure?',
      message: '',
      onAnswer: async (answer) => {
        if (answer) {
          try {
            await currentStudio.removeMember(userId);
          } catch (error) {
            notify(error);
          }
        }
      },
    });
  };

  const { currentStudio, currentUser } = store;
  const isStudioTeacher =
    currentStudio && currentUser && currentUser._id === currentStudio.teacherId;

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

  if (!isStudioTeacher) {
    return (
      <Layout
        store={store}
        isMobile={isMobile}
        studioRequired={studioRequired}
        firstGridItem={firstGridItem}
      >
        <div style={{ padding: isMobile ? '0px' : '0px 30px' }}>
          <p>Only the Studio Teacher can access this page.</p>
          <p>Create your own studio to become a Studio Teacher.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      store={store}
      isMobile={isMobile}
      studioRequired={studioRequired}
      firstGridItem={firstGridItem}
    >
      <Head>
        <title>Studio Settings</title>
      </Head>
      <div style={{ padding: isMobile ? '0px' : '0px 30px', fontSize: '15px', height: '100%' }}>
        <h3>Your Studio Settings</h3>
        <p />
        <br />
        <form onSubmit={onSubmit}>
          <h4>Studio name</h4>
          <TextField
            value={newName}
            helperText="Studio name as seen by your students"
            onChange={(event) => {
              setNewName(event.target.value);
            }}
          />
          <p />
          <Button variant="contained" color="primary" type="submit" disabled={disabled}>
            Update username
          </Button>
        </form>
        <p />
        <br />
        <h4>Studio logo</h4>
        <Avatar
          src={newAvatarUrl}
          style={{
            display: 'inline-flex',
            verticalAlign: 'middle',
            marginRight: 20,
            width: 60,
            height: 60,
          }}
        />
        <label htmlFor="upload-file-studio-logo">
          <Button variant="contained" color="primary" component="span" disabled={disabled}>
            Update logo
          </Button>
        </label>
        <input
          accept="image/*"
          name="upload-file-studio-logo"
          id="upload-file-studio-logo"
          type="file"
          style={{ display: 'none' }}
          onChange={uploadFile}
        />
        <p />
        <br />
        <br />
        <p>
          <h4 style={{ marginRight: 20, display: 'inline' }}>Schedule</h4>
          <label htmlFor="create-schedule-studio">
            <Button
              onClick={openCreateSchedule}
              variant="contained"
              color="primary"
              component="span"
              disabled={disabled}
            >
              Create schedule
            </Button>
          </label>
          <label htmlFor="modify-schedule-studio">
            <Button
              onClick={openUpdateAvailability}
              variant="contained"
              color="primary"
              component="span"
              disabled={disabled}
            >
              Modify schedule
            </Button>
            </label>
        </p>
        <h4 style={{ marginRight: 20, display: 'inline' }}>
          Studio Members ( {Array.from(currentStudio.members.values()).length} / 20 )
        </h4>
        <Button
          onClick={openInviteMember}
          variant="contained"
          color="primary"
          style={{ float: 'right', marginTop: '-20px' }}
          disabled={disabled}
        >
          Invite member
        </Button>
        <p />
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Person</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Action</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {currentStudio.memberIds
                .map((userId) => currentStudio.members.get(userId))
                .map((m) => (
                  <TableRow key={m._id}>
                    <TableCell style={{ width: '300px' }}>
                      <Hidden mdDown>
                        <Avatar
                          role="presentation"
                          src={m.avatarUrl}
                          alt={(m.displayName || m.email)[0]}
                          key={m._id}
                          style={{
                            margin: '0px 5px',
                            display: 'inline-flex',
                            width: '30px',
                            height: '30px',
                            verticalAlign: 'middle',
                          }}
                        />
                      </Hidden>
                      {m.email}
                    </TableCell>
                    <TableCell>
                      {isStudioTeacher && m._id !== currentUser._id
                        ? 'Studio Member'
                        : 'Studio Teacher'}
                    </TableCell>
                    <TableCell>
                      {isStudioTeacher && m._id !== currentUser._id ? (
                        <DeleteOutlineIcon
                          color="action"
                          data-id={m._id}
                          onClick={removeMember}
                          style={{
                            marginLeft: '20px',
                            fontSize: '16px',
                            opacity: 0.6,
                            cursor: 'pointer',
                            verticalAlign: 'middle',
                          }}
                        />
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>

        <p />
        <br />

        {Array.from(currentStudio.invitations.values()).length > 0 ? (
          <React.Fragment>
            <h4>Invited users</h4>
            <p />
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Email</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {Array.from(currentStudio.invitations.values()).map((i) => (
                    <TableRow key={i._id}>
                      <TableCell style={{ width: '300px' }}>{i.email}</TableCell>
                      <TableCell>Sent</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </React.Fragment>
        ) : null}
        <p />
        <br />
        <InviteMember open={inviteMemberOpen} onClose={handleInviteMemberClose} store={store} />
        <CreateScheduleForm
          open={createScheduleOpen}
          onClose={handleCreateScheduleClose}
          store={store}
        />
        <UpdateAvailabilityForm
          open={openUpdateAvailability}
          onClose={handleUpdateAvailabilityClose}
          store={store}
        />
        <br />
      </div>
    </Layout>
  );
}

export default withAuth(inject('store')(observer(StudioSettings)));
