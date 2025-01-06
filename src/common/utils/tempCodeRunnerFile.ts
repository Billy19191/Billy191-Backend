import axios from 'axios'
import cryptoLib from 'crypto'

const API_KEY =
  'ScSM22Mbp8YYcmVng72KG3OG28YeXC6qBSZsoadQsN1JDfOS1QXK6ePG1iOTt7Gt'
const API_SECRET =
  'EFUU4b2ly8YHfM8NdUInvtnGjMXliIJ9AUFijc9MFQxRyF2lkrTtngI6Id9EBSL7'
const BASE_URL = 'https://api.binance.com'

async function fetchUserAssets(
  asset?: string,
  needBtcValuation = true,
  recvWindow = 5000
) {
  const timestamp = Date.now()
  // Construct query parameters
  const queryParams: Record<string, any> = {
    timestamp,
    recvWindow,
  }

  if (asset) {
    queryParams.asset = asset
  }
  if (needBtcValuation) {
    queryParams.needBtcValuation = true
  }

  // Create the signature
  const queryString = new URLSearchParams(queryParams).toString()

  console.log('queryString', queryString)
  const signature = cryptoLib
    .createHmac('sha256', API_SECRET)
    .update(queryString)
    .digest('hex')

  // Append the signature to the query parameters
  queryParams.signature = signature

  try {
    // Use URLSearchParams to properly encode the body

    const query = new URLSearchParams(queryParams).toString()
    console.log('query: ', query)
    const response = await axios.post(
      `${BASE_URL}/sapi/v3/asset/getUserAsset`,
      query,
      {
        headers: {
          'X-MBX-APIKEY': API_KEY,
          'Content-Type': 'application/json',
        },
      }
    )

    // Print the user assets
    console.log(response.status, response.data)
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
