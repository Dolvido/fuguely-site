import sendRequestAndGetResponse from './sendRequestAndGetResponse';

const BASE_PATH = '/api/v1/public';

export const getUserApiMethod = (request) =>
  sendRequestAndGetResponse(`${BASE_PATH}/get-user`, {
    request,
    method: 'GET',
  });

export const getUserBySlugApiMethod = (slug) =>
  sendRequestAndGetResponse(`${BASE_PATH}/get-user-by-slug`, {
    body: JSON.stringify({ slug }),
  });

export const emailLoginLinkApiMethod = ({ email }: { email: string }) =>
  sendRequestAndGetResponse('/auth/email-login-link', {
    body: JSON.stringify({ user: email }),
  });
