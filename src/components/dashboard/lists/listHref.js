/** A dashboard list page's address, carrying the dashboard's project status along. */
export function withProjectStatus(route, projectStatus) {
  return projectStatus ? `${route}?projectStatus=${encodeURIComponent(projectStatus)}` : route;
}
