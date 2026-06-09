const getPayload = (token: string) => {
  return JSON.parse(atob(token.split('.')[1]));
}

export const checkExpired = (token: string | null) => {
  if (token === null) {
    return true;
  }
  const payload = getPayload(token);
  const now = new Date();
  return payload.exp <= now.getTime() / 1000;
}