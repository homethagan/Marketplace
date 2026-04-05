export const getApiErrorMessage = (error, fallback = 'Something went wrong. Please try again.') => {
  const status = error?.response?.status
  const responseMessage = error?.response?.data?.error

  if (typeof responseMessage === 'string' && responseMessage.trim()) {
    return responseMessage.trim()
  }

  if (!error?.response) {
    return 'Unable to connect to the server. Please check your network and try again.'
  }

  if (status >= 500) {
    return 'The server is having trouble right now. Please try again in a moment.'
  }

  if (status === 401) {
    return 'Please log in to continue.'
  }

  if (status === 403) {
    return 'You do not have access to this action.'
  }

  if (status === 404) {
    return 'The requested resource could not be found.'
  }

  return fallback
}
