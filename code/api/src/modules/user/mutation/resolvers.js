// Imports
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import React from 'react'

// App Imports
import { NODE_ENV } from '../../../setup/config/env'
import serverConfig from '../../../setup/config/server'
import params from '../../../setup/config/params'
import { sendEmail } from '../../../setup/server/email'
import DemoUser from '../../demo-user/model'
import Organization from '../../organization/model'
import User from '../model'
import Invite from '../../email/templates/Invite'

// Create (Register)
export async function create(parentValue, { name, email, password }) {
  // Users exists with same email check
  const user = await User.findOne({ email })

  if (!user) {
    // User does not exists
    const passwordHashed = await bcrypt.hash(password, serverConfig.saltRounds)

    return await User.create({
      name,
      email,
      password: passwordHashed
    })
  } else {
    // User exists
    throw new Error(`The email ${ email } is already registered. Please try to login.`)
  }
}

// Create a demo user and login
export async function startNow(parentValue, {}, { auth }) {
  // Check if user is already logged in
  if(!auth.user) {
    throw new Error(`You are already logged in. Please go to your dashboard to continue.`)
  } else {
    try {
      let userDetails

      if(NODE_ENV === 'development') {
        // Use already created user instead of creating new every time
        userDetails = await User.findOne({email: 'user@hiresmart.app'})
      } else {
        // Create new Organization
        const organization = await Organization.create({
          name: 'Demo Organization'
        })

        // Create a new demo user
        const demoUser = await DemoUser.create({})

        // User does not exists
        const passwordHashed = await bcrypt.hash(demoUser._id + Math.random(), serverConfig.saltRounds)

        userDetails = await User.create({
          organizationId: organization._id,
          name: 'Demo User',
          email: `demo.user+${ demoUser._id }@${ params.site.domain }`,
          password: passwordHashed
        })
      }

      const token = {
        id: userDetails._id,
        organizationId: userDetails.organizationId,
        name: userDetails.name,
        email: userDetails.email,
        role: userDetails.role,
      }

      return {
        user: userDetails,
        token: jwt.sign(token, serverConfig.secret)
      }
    } catch(error) {
      throw new Error(`There was some error. Please try again.`)
    }
  }
}

// Create invite to organization
export async function inviteToOrganization(parentValue, { name, email }, { auth }) {
  if(auth.user && auth.user.id) {
    // Users exists with same email check
    const user = await User.findOne({ email })

    if (!user) {
      // User does not exists
      const passwordHashed = await bcrypt.hash(name + email + Math.random(), serverConfig.saltRounds)

      // Send invite email
      const organization = await Organization.findOne({ _id: auth.user.organizationId })

      sendEmail({
        from: auth.user,
        to: {
          name,
          email
        },
        subject: 'You have been invited!',
        template:
          <Invite
            invitedTo={name}
            invitedBy={auth.user.name}
            organizationName={organization.name}
          />
      })

      return await User.create({
        organizationId: auth.user.organizationId,
        name,
        email,
        password: passwordHashed
      })
    } else {
      // User exists
      throw new Error(`The email ${ email } is already registered. Please ask the user to login.`)
    }
  } else {
    throw new Error('Please login to view invite team mate to your organization.')
  }
}

// Delete
export async function remove(parentValue, { id }) {
  return await User.remove({ _id: id })
}
