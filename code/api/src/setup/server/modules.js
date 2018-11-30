// App Imports
import user from '../../modules/user'
import organization from '../../modules/organization'
import project from '../../modules/project'
import activity from '../../modules/activity'
import candidate from '../../modules/candidate'

// Modules
export default {
  ...user,
  ...organization,
  ...project,
  ...activity,
  ...candidate,
}