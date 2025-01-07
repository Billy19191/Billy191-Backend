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
  recvWindow?: number
): Promise<void> {
  const queryParams: QueryUserSubscriptionRecordParams = { timestamp }

  const startTime = dayjs('2024-12-27').valueOf()
  const endTime = dayjs(startTime).add(10, 'day').valueOf()

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

const timestamp = dayjs().valueOf()
fetchUserSubscriptionRecord(timestamp, 'USDT')
