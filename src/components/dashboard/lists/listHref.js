export function withProjectStatus(route, projectStatus) {
  return projectStatus ? `${route}?projectStatus=${encodeURIComponent(projectStatus)}` : route;
}
