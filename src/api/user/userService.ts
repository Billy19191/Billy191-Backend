import { StatusCodes } from 'http-status-codes'

import type { User } from '@/api/user/userModel'
import { UserRepository } from '@/api/user/userRepository'
import { ServiceResponse } from '@/common/models/serviceResponse'
import { logger } from '@/server'
import axios from 'axios'
import { ax } from 'vitest/dist/chunks/reporters.D7Jzd9GS'
import { CookieJar } from 'tough-cookie'
import { wrapper } from 'axios-cookiejar-support'
import { JSDOM } from 'jsdom'

export class UserService {
  private userRepository: UserRepository

  constructor(repository: UserRepository = new UserRepository()) {
    this.userRepository = repository
  }

  // Retrieves all users from the database
  async findAll(): Promise<ServiceResponse<User[] | null>> {
    try {
      const users = await this.userRepository.findAllAsync()
      if (!users || users.length === 0) {
        return ServiceResponse.failure(
          'No Users found',
          null,
          StatusCodes.NOT_FOUND
        )
      }
      return ServiceResponse.success<User[]>('Users found', users)
    } catch (ex) {
      const errorMessage = `Error finding all users: $${(ex as Error).message}`
      logger.error(errorMessage)
      return ServiceResponse.failure(
        'An error occurred while retrieving users.',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR
      )
    }
  }

  // Retrieves a single user by their ID
  async findById(id: number): Promise<ServiceResponse<User | null>> {
    try {
      const user = await this.userRepository.findByIdAsync(id)
      if (!user) {
        return ServiceResponse.failure(
          'User not found',
          null,
          StatusCodes.NOT_FOUND
        )
      }
      return ServiceResponse.success<User>('User found', user)
    } catch (ex) {
      const errorMessage = `Error finding user with id ${id}:, ${
        (ex as Error).message
      }`
      logger.error(errorMessage)
      return ServiceResponse.failure(
        'An error occurred while finding user.',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR
      )
    }
  }

  async login(
    userName: string,
    passWord: string
  ): Promise<ServiceResponse<any>> {
    try {
      const jar = new CookieJar()
      const client = wrapper(
        axios.create({
          jar,
          withCredentials: true,
          maxRedirects: 5,
        })
      )
      // console.log(
      //   'Logging in with username:',
      //   userName,
      //   'and password',
      //   passWord
      // )
      const loginData = await client.post(
        'https://leb2-mcs-api-production.leb2.org/public/login/v1/login',
        {
          username: userName,
          password: passWord,
        }
      )

      const loginResponse = loginData.data
      const jwtToken = loginResponse.token

      // Second request: Use the token to get the session
      const sessionResponse = await client.get(
        `https://app.leb2.org/login?token=${jwtToken}`
      )

      // Get cookies from the jar for the domain
      const cookies = await jar.getCookies('https://app.leb2.org')
      // console.log('Cookies received:', cookies)

      // const sessionCookie = cookies.find(
      //   (cookie) => cookie.key === 'leb2_session'
      // )
      // const ssoTokenCookie = cookies.find(
      //   (cookie) => cookie.key === 'leb2_sso_token'
      // )
      // const userIdCookie = cookies.find((cookie) => cookie.key === 'user_id')

      return ServiceResponse.success('Login successful', {
        token: jwtToken,
        cookies: cookies.map((c) => ({ name: c.key, value: c.value })),
        sessionData: sessionResponse.data,
      })
    } catch (ex) {
      const errorMessage = `Error logging in: ${(ex as Error).message}`
      logger.error(errorMessage)
      return ServiceResponse.failure(
        'An error occurred during login.',
        undefined,
        StatusCodes.INTERNAL_SERVER_ERROR
      )
    }
  }

  async getListOfAssignments(
    classId: number,
    studentId: number,
    cookies: string
  ): Promise<ServiceResponse<any>> {
    try {
      const jar = new CookieJar()
      const client = wrapper(
        axios.create({
          jar,
          withCredentials: true,
          maxRedirects: 5,
        })
      )

      const assignments = await client.get(
        `https://app.leb2.org/api/get/assessment-activities/student?class_id=${classId}&student_id=${studentId}&filter_groups[0][filters][0][key]=class_id&filter_groups[0][filters][0][value]=${classId}&sort[]=sequence&sort[]=id&select[]=activities:id,user_id,class_id,adv_starred,group_type,type,peer_assessment,is_allow_repeat,title,description,start_date,due_date,edit_group_mode,created_at&select[]=user:id,firstname_en,lastname_en,firstname_th,lastname_th&includes[]=user:sideload&includes[]=fileactivities:ids&includes[]=questions:ids`,

        {
          headers: {
            Cookie: cookies,
          },
        }
      )
      // const assignmentsData = assignments.data
      // console.log('Assignments:', assignmentsData)
      // console.log(assignments.data, classId)
      return ServiceResponse.success(
        'Assignments found',
        assignments.data,
        StatusCodes.OK
      )
    } catch (ex) {
      const errorMessage = `Error getting assignments: ${(ex as Error).message}`
      logger.error(errorMessage)
      return ServiceResponse.failure(
        'An error occurred while getting assignments.',
        undefined,
        StatusCodes.INTERNAL_SERVER_ERROR
      )
    }
  }

  async getAllClassesInfo(cookies: string): Promise<ServiceResponse<any>> {
    try {
      const classes = await axios.get('https://app.leb2.org/class', {
        headers: {
          Cookie: cookies,
        },
      })
      const htmlSite = classes.data
      const dom = new JSDOM(htmlSite)
      const document = dom.window.document
      const classCards = document.querySelectorAll('.class-card')
      const classTextElements = document.querySelectorAll(
        '#font-color-main-card p'
      )
      const classesInfo: {
        id: string
        title: string | null
        description: string | null
      }[] = []

      classCards.forEach((card: Element, index: number) => {
        const cardName = card.getAttribute('name')
        const classId = cardName?.split('-')[1]
        if (!classId) return

        const classTitle =
          classTextElements[index * 2]?.textContent.replace(' ', '') || null
        const classDescription =
          classTextElements[index * 2 + 1]?.textContent || null

        classesInfo.push({
          id: classId,
          title: classTitle,
          description: classDescription,
        })
      })

      return ServiceResponse.success(
        'Classes found',
        classesInfo,
        StatusCodes.OK
      )
    } catch (ex) {
      const errorMessage = `Error getting classes: ${(ex as Error).message}`
      logger.error(errorMessage)
      return ServiceResponse.failure(
        'An error occurred while getting classes.',
        undefined,
        StatusCodes.INTERNAL_SERVER_ERROR
      )
    }
  }
}

export const userService = new UserService()
