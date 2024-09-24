export function isProdEnv() {
  return process.env.NODE_ENV === 'prod';
}

export function isStagingEnv() {
  return process.env.NODE_ENV === 'stage';
}

export function isLocalEnv() {
  return !process.env.NODE_ENV;
}

export function sourceDotConfig() {
  if (isProdEnv()) {
    return '.env.prod';
  } else if (isStagingEnv()) {
    return '.env.stage';
  } else {
    return '.env.local';
  }
}
