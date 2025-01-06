import axios from 'axios'
import crypto from 'crypto'
import { env } from './envConfig'

const API_KEY = env.BINANCE_API_KEY
const API_SECRET = env.BINANCE_API_SECRET
const BASE_URL = 'https://api.binance.com'

interface QueryParams {
  timestamp: number
  recvWindow: number
  asset?: string
  needBtcValuation?: boolean
  signature?: string
}

async function fetchUserAssets(
  asset?: string,
  needBtcValuation = true,
  recvWindow = 5000
): Promise<void> {
  const timestamp = Date.now()
  const queryParams: QueryParams = { timestamp, recvWindow }

  if (asset) queryParams.asset = asset
  if (needBtcValuation) queryParams.needBtcValuation = true

  const queryString = new URLSearchParams(queryParams as any).toString()
  queryParams.signature = crypto
    .createHmac('sha256', API_SECRET)
    .update(queryString)
    .digest('hex')

  try {
    const response = await axios.post<any>(
      `${BASE_URL}/sapi/v3/asset/getUserAsset`,
      new URLSearchParams(queryParams as any).toString(),
      {
        headers: {
          'X-MBX-APIKEY': API_KEY,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    )
    console.log(`Billy191's spot assets:`, response.data)
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Error fetching user assets:', error.response?.data)
    } else {
      console.error('Error fetching user assets:', error)
    }
  }
}

// Example usage
fetchUserAssets('USDT', true)
