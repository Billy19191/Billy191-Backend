import { ethers } from 'ethers'
import {
  UiPoolDataProvider,
  UiIncentiveDataProvider,
  ChainId,
} from '@aave/contract-helpers'
import * as markets from '@bgd-labs/aave-address-book'
import fs from 'fs'
import dayjs from 'dayjs'
import { formatUserSummary } from '@aave/math-utils'
import { formatReserves, formatReservesAndIncentives } from '@aave/math-utils'
// ES5 Alternative imports
//  const {
//    ChainId,
//    UiIncentiveDataProvider,
//    UiPoolDataProvider,
//  } = require('@aave/contract-helpers');
//  const markets = require('@bgd-labs/aave-address-book');
//  const ethers = require('ethers');

// Sample RPC address for querying ETH mainnet
const provider = new ethers.providers.JsonRpcProvider(
  'https://op-pokt.nodies.app'
)

// User address to fetch data for, insert address here
const currentAccount = '0x6FdfD0Dee3e2aa16bA6c70B1398E640735D5C065'

// View contract used to fetch all reserves data (including market base currency data), and user reserves
// Using Aave V3 Eth Mainnet address for demo
const poolDataProviderContract = new UiPoolDataProvider({
  uiPoolDataProviderAddress: markets.AaveV3Optimism.UI_POOL_DATA_PROVIDER,
  provider,
  chainId: ChainId.optimism,
})

// View contract used to fetch all reserve incentives (APRs), and user incentives
// Using Aave V3 Eth Mainnet address for demo
const incentiveDataProviderContract = new UiIncentiveDataProvider({
  uiIncentiveDataProviderAddress:
    markets.AaveV3Optimism.UI_INCENTIVE_DATA_PROVIDER,
  provider,
  chainId: ChainId.optimism,
})

async function fetchContractData() {
  // Object containing array of pool reserves and market base currency data
  // { reservesArray, baseCurrencyData }
  const reserves = await poolDataProviderContract.getReservesHumanized({
    lendingPoolAddressProvider: markets.AaveV3Optimism.POOL_ADDRESSES_PROVIDER,
  })

  // Object containing array or users aave positions and active eMode category
  // { userReserves, userEmodeCategoryId }
  const userReserves = await poolDataProviderContract.getUserReservesHumanized({
    lendingPoolAddressProvider: markets.AaveV3Optimism.POOL_ADDRESSES_PROVIDER,
    user: currentAccount,
  })

  // Array of incentive tokens with price feed and emission APR
  const reserveIncentives =
    await incentiveDataProviderContract.getReservesIncentivesDataHumanized({
      lendingPoolAddressProvider:
        markets.AaveV3Optimism.POOL_ADDRESSES_PROVIDER,
    })

  // Dictionary of claimable user incentives
  const userIncentives =
    await incentiveDataProviderContract.getUserReservesIncentivesDataHumanized({
      lendingPoolAddressProvider:
        markets.AaveV3Optimism.POOL_ADDRESSES_PROVIDER,
      user: currentAccount,
    })

  const reservesArray = reserves.reservesData
  const baseCurrencyData = reserves.baseCurrencyData
  const userReservesArray = userReserves.userReserves

  const currentTimestamp = dayjs().subtract(10, 'days').unix()

  // const formattedPoolReserves = formatReserves({
  //   reserves: reservesArray,
  //   currentTimestamp,
  //   marketReferenceCurrencyDecimals:
  //     baseCurrencyData.marketReferenceCurrencyDecimals,
  //   marketReferencePriceInUsd:
  //     baseCurrencyData.marketReferenceCurrencyPriceInUsd,
  // })

  const formattedReserves = formatReservesAndIncentives({
    reserves: reservesArray,
    currentTimestamp,
    marketReferenceCurrencyDecimals:
      baseCurrencyData.marketReferenceCurrencyDecimals,
    marketReferencePriceInUsd:
      baseCurrencyData.marketReferenceCurrencyPriceInUsd,
    reserveIncentives,
  })
  /*
- @param `currentTimestamp` Current UNIX timestamp in seconds, Math.floor(Date.now() / 1000)
- @param `marketReferencePriceInUsd` Input from [Fetching Protocol Data](#fetching-protocol-data), `reserves.baseCurrencyData.marketReferencePriceInUsd`
- @param `marketReferenceCurrencyDecimals` Input from [Fetching Protocol Data](#fetching-protocol-data), `reserves.baseCurrencyData.marketReferenceCurrencyDecimals`
- @param `userReserves` Input from [Fetching Protocol Data](#fetching-protocol-data), combination of `userReserves.userReserves` and `reserves.reservesArray`
- @param `userEmodeCategoryId` Input from [Fetching Protocol Data](#fetching-protocol-data), `userReserves.userEmodeCategoryId`
*/
  const userSummary = formatUserSummary({
    currentTimestamp,
    marketReferencePriceInUsd:
      baseCurrencyData.marketReferenceCurrencyPriceInUsd,
    marketReferenceCurrencyDecimals:
      baseCurrencyData.marketReferenceCurrencyDecimals,
    userReserves: userReservesArray,
    formattedReserves,
    userEmodeCategoryId: userReserves.userEmodeCategoryId,
  })

  console.log({
    reserves,
    userReserves,
    reserveIncentives,
    userIncentives,
    userSummary,
  })
  fs.writeFileSync(
    'aave-data.json',
    JSON.stringify({
      reserves,
      userReserves,
      reserveIncentives,
      userIncentives,
      userSummary,
    })
  )
}

fetchContractData()
