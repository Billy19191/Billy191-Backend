import cors from 'cors'
import express, { type Express, Request, Response, NextFunction } from 'express'
import helmet from 'helmet'
import { pino } from 'pino'
import PQueue from 'p-queue'

import { openAPIRouter } from '@/api-docs/openAPIRouter'
import { healthCheckRouter } from '@/api/healthCheck/healthCheckRouter'
import { userRouter } from '@/api/user/userRouter'
import errorHandler from '@/common/middleware/errorHandler'
import rateLimiter from '@/common/middleware/rateLimiter'
import requestLogger from '@/common/middleware/requestLogger'
import { env } from '@/common/utils/envConfig'

const logger = pino({ name: "Billy's Server" })
const app: Express = express()

// Set the application to trust the reverse proxy
app.set('trust proxy', true)

// Middlewares
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(
  cors({
    origin: [
      env.CORS_ORIGIN,
      'http://localhost:3000',
      'https://*.billy191.live',
      'https://www.leb2.billy191.live',
      'https://leb2.billy191.live',
    ],
    credentials: true,
  })
)
app.use(helmet())
//To be enabled after testing and configuring the rate limiter
// app.use(rateLimiter)

// Request logging
app.use(requestLogger)

// Create a queue with a max concurrency of 10 requests at a time
const queue = new PQueue({ concurrency: 10 })

// Middleware to wrap requests inside the queue
const queueMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  await queue.add(() => new Promise((resolve) => setTimeout(resolve, 10)))
  next()
}

// Apply queue middleware to all routes
app.use(queueMiddleware)

// Routes
app.use('/health-check', healthCheckRouter)
app.use('/users', userRouter)

// Swagger UI
app.use(openAPIRouter)

// Error handlers
app.use(errorHandler())

export { app, logger }
