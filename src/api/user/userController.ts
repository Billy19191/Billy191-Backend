import type { Request, RequestHandler, Response } from 'express'

import { userService } from '@/api/user/userService'
import { handleServiceResponse } from '@/common/utils/httpHandlers'
import dayjs from 'dayjs'
class UserController {
  public getUsers: RequestHandler = async (
    _req: Request,
    res: Response
  ): Promise<void> => {
    const serviceResponse = await userService.findAll()
    handleServiceResponse(serviceResponse, res)
  }

  public getUser: RequestHandler = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    const id = Number.parseInt(req.params.id as string, 10)
    const serviceResponse = await userService.findById(id)
    handleServiceResponse(serviceResponse, res)
  }

  public login: RequestHandler = async (
    _req: Request,
    res: Response
  ): Promise<void> => {
    const login = await userService.login(
      _req.body.username,
      _req.body.password
    )
    if (!login || login.statusCode !== 200) {
      console.error(login)
      res.status(401).send('Login failed')
      return
    }

    res.set('Access-Control-Allow-Origin', _req.headers.origin) //req.headers.origin
    res.set('Access-Control-Allow-Credentials', 'true')

    res.set(
      'Access-Control-Expose-Headers',
      'date, etag, access-control-allow-origin, access-control-allow-credentials'
    )

    const cookies = login.responseObject.cookies
    const domain = _req.hostname.includes('localhost')
      ? 'localhost'
      : '.billy191.live'

    cookies.forEach((cookie: any) => {
      res.cookie(cookie.name, cookie.value, {
        httpOnly: false,
        secure: true,
        sameSite: 'none',
        expires: new Date(Date.now() + 86400000),
        path: '/',
        // domain: '.billy191.live',
        domain: domain,
        // domain : process.env.NODE_ENV === 'production' ? '.billy191.live' : 'localhost',
      })
    })

    handleServiceResponse(login, res)
  }

  public getListOfAssignments: RequestHandler = async (
    _req: Request,
    res: Response
  ): Promise<void> => {
    const classId = Number.parseInt(_req.query.classId as string, 10)
    const studentId = Number.parseInt(_req.query.studentId as string, 10)
    const cookies = _req.headers.cookie as string
    const serviceResponse = await userService.getListOfAssignments(
      classId,
      studentId,
      cookies
    )
    handleServiceResponse(serviceResponse, res)
  }

  public getAllClassesInfo: RequestHandler = async (
    _req: Request,
    res: Response
  ): Promise<void> => {
    const cookies = _req.headers.cookie as string
    const serviceResponse = await userService.getAllClassesInfo(cookies)
    handleServiceResponse(serviceResponse, res)
  }
}

export const userController = new UserController()
