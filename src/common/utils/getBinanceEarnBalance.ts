import axios from 'axios'
import { env } from './envConfig'
import dayjs from 'dayjs'
import { encryptHmac } from './encryptHmac'

const API_KEY = env.BINANCE_API_KEY
const API_SECRET = env.BINANCE_API_SECRET
const BASE_URL = env.BINANCE_API_BASE_URL

interface QueryUserSubscriptionRecordParams {
  timestamp: number
  asset?: string
  productId?: string
  current?: number
  size?: number
  recvWindow?: number
  signature?: string
}

async function fetchUserSubscriptionRecord(
  timestamp: number,
  asset?: string,
  productId?: string,
  current?: number,
  size?: number,
  recvWindow: number = 5000,
  startTime?: number,
  endTime?: number
): Promise<void> {
  const queryParams: QueryUserSubscriptionRecordParams = { timestamp }

  Object.assign(queryParams, {
    ...(asset && { asset }),
    ...(productId && { productId }),
    ...(current && { current }),
    ...(size && { size }),
    ...(recvWindow && { recvWindow }),
    startTime,
    endTime,
  })

  const queryString = new URLSearchParams(queryParams as any).toString()

  const signatureString = encryptHmac(queryString, API_SECRET)

  queryParams.signature = signatureString

  const queryStringWithSignature = new URLSearchParams(
    queryParams as any
  ).toString()

  try {
    const response = await axios.get<any>(
      `${BASE_URL}/sapi/v1/simple-earn/flexible/history/subscriptionRecord`,
      {
        params: queryParams,
        headers: {
          'X-MBX-APIKEY': API_KEY,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    )
    const data = response.data.rows.map((item: any) => ({
      ...item,
      timeInDate: dayjs(item.time).format('YYYY-MM-DD HH:mm:ss'),
    }))

    console.log(`Billy191's Earnings:`, data)
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Error fetching user assets:', error.response?.data)
    } else {
      console.error('Error fetching user assets:', error)
    }
  }
}

async function fetchUserRewardsHistory(
  timestamp: number,
  productId?: string,
  asset?: string,
  startTime?: number,
  endTime?: number,
  type?: 'Bonus' | 'REALTIME' | 'REWARDS' | 'ALL'
): Promise<void> {
  const queryParams: QueryUserSubscriptionRecordParams = { timestamp }

  Object.assign(queryParams, {
    ...(asset && { asset }),
    ...(productId && { productId }),
    ...(type && { type }),
    startTime,
    endTime,
  })

  const queryString = new URLSearchParams(queryParams as any).toString()

  const signatureString = encryptHmac(queryString, API_SECRET)

  queryParams.signature = signatureString

  const queryStringWithSignature = new URLSearchParams(
    queryParams as any
  ).toString()

  try {
    const response = await axios.get<any>(
      `${BASE_URL}/sapi/v1/simple-earn/flexible/history/rewardsRecord`,
      {
        params: queryParams,
        headers: {
          'X-MBX-APIKEY': API_KEY,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    )
    const data = response.data.rows.map((item: any) => ({
      ...item,
      timeInDate: dayjs(item.time).format('YYYY-MM-DD HH:mm:ss'),
    }))

    console.log(`Billy191's Earning Rewards:`, data)
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Error fetching user assets:', error.response?.data)
    } else {
      console.error('Error fetching user assets:', error)
    }
  }
}

//////////////// USAGE //////////////////
const startTime = dayjs('2024-12-27').valueOf()
const endTime = dayjs(startTime).add(10, 'day').valueOf()
const timestamp = dayjs().valueOf()

fetchUserSubscriptionRecord(
  timestamp,
  'USDT',
  undefined,
  undefined,
  undefined,
  5000,
  startTime,
  endTime
)
fetchUserRewardsHistory(timestamp, undefined, 'USDT', startTime, endTime, 'ALL')
