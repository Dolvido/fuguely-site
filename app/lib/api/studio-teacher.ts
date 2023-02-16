import sendRequestAndGetResponse from './sendRequestAndGetResponse';

const BASE_PATH = '/api/v1/studio-teacher';

export const addStudioApiMethod = (data) =>
  sendRequestAndGetResponse(`${BASE_PATH}/studios/add`, {
    body: JSON.stringify(data),
  });

export const updateStudioApiMethod = (data) =>
  sendRequestAndGetResponse(`${BASE_PATH}/studios/update`, {
    body: JSON.stringify(data),
  });

export const getStudioInvitationsApiMethod = (studioId: string) =>
  sendRequestAndGetResponse(`${BASE_PATH}/studios/get-invitations-for-studio`, {
    method: 'GET',
    qs: { studioId },
  });

export const inviteMemberApiMethod = (data) =>
  sendRequestAndGetResponse(`${BASE_PATH}/studios/invite-member`, {
    body: JSON.stringify(data),
  });

export const removeMemberApiMethod = (data) =>
  sendRequestAndGetResponse(`${BASE_PATH}/studios/remove-member`, {
    body: JSON.stringify(data),
  });

export const fetchCheckoutSessionApiMethod = ({
  mode,
  studioId,
}: {
  mode: string;
  studioId: string;
}) =>
  sendRequestAndGetResponse(`${BASE_PATH}/stripe/fetch-checkout-session`, {
    body: JSON.stringify({ mode, studioId }),
  });

export const cancelSubscriptionApiMethod = ({ studioId }: { studioId: string }) =>
  sendRequestAndGetResponse(`${BASE_PATH}/cancel-subscription`, {
    body: JSON.stringify({ studioId }),
  });

export const getListOfInvoicesApiMethod = () =>
  sendRequestAndGetResponse(`${BASE_PATH}/get-list-of-invoices-for-customer`, {
    method: 'GET',
  });

/* API methods for schedule object */
export const createScheduleApiMethod = (data) =>
  sendRequestAndGetResponse(`${BASE_PATH}/schedule/create`, {
    body: JSON.stringify(data),
  });

export const updateScheduleMembersApiMethod = (data) =>
  sendRequestAndGetResponse(`${BASE_PATH}/schedule/update`, {
    body: JSON.stringify(data),
  });

export const updateAvailabilityApiMethod = (data) =>
  sendRequestAndGetResponse(`${BASE_PATH}/schedule/update-availability`, {
    body: JSON.stringify(data),
  });

/* API method for adding a new availability window to an existing schedule */
export const addAvailabilityWindowApiMethod = (data) =>
  sendRequestAndGetResponse(`${BASE_PATH}/schedule/add-availability-window`, {
    body: JSON.stringify(data),
  });
