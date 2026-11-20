export function isDownloadPath(pathname) {
  return /^\/(?:download|Downloads)\/?$/.test(pathname);
}
