# KucoinApi

A TypeScript client for the Kucoin cryptocurrency exchange API, optimized for the Gainium application. This client provides access to essential spot and futures trading endpoints, account management, market data, and WebSocket feeds.

**Author:** Maksym Shamko (https://github.com/maksymshamko)  
**Organization:** Gainium (https://github.com/Gainium)

## Features

- Complete TypeScript typing for all API responses
- Support for both Spot and Futures markets
- Real-time data via WebSockets
- Comprehensive error handling
- Automatic retry mechanism for failed requests
- Support for key Kucoin API endpoints used by Gainium

## Installation

```bash
# Install from npm once published
npm install @gainium/kucoin-api
# or
yarn add @gainium/kucoin-api
```

## Usage

### Basic setup

```typescript
import KucoinApi from '@gainium/kucoin-api';

// Initialize client with API keys
const kucoin = new KucoinApi({
  key: 'YOUR_API_KEY',
  secret: 'YOUR_API_SECRET',
  passphrase: 'YOUR_API_PASSPHRASE'
});

// For public endpoints, you can initialize without keys
const publicKucoin = new KucoinApi();
```

### Account Information

```typescript
// Get account balances
const balances = await kucoin.getAccounts();
console.log(balances);

// Get futures account details
const futuresAccount = await kucoin.getFuturesAccounts();
console.log(futuresAccount);
```

### Trading

```typescript
// Place a limit order
const order = await kucoin.placeOrder({
  clientOid: 'unique-order-id',
  side: 'buy',
  symbol: 'BTC-USDT',
  type: 'limit',
  price: '30000',
  size: '0.001'
});

// Place a market order
const marketOrder = await kucoin.placeOrder({
  clientOid: 'unique-market-order-id',
  side: 'buy',
  symbol: 'BTC-USDT',
  type: 'market',
  funds: '30'  // Specify funds for quote currency amount
});

// Cancel an order
const cancelResult = await kucoin.cancelOrder({ id: 'order-id' });
```

### Market Data

```typescript
// Get ticker for a symbol
const ticker = await kucoin.getTicker('BTC-USDT');

// Get all tickers
const allTickers = await kucoin.getAllTickers();

// Get klines/candlestick data
const klines = await kucoin.getKlines({
  symbol: 'BTC-USDT',
  startAt: 1609459200,
  endAt: 1609545600,
  type: '1hour'
});
```

### WebSockets

```typescript
// Subscribe to ticker updates
const unsubscribe = await kucoin.ws().ticker(['BTC-USDT'], (ticker) => {
  console.log('Ticker update:', ticker);
});

// Subscribe to order updates
const orderUnsubscribe = await kucoin.ws().order((orderUpdate) => {
  console.log('Order update:', orderUpdate);
});

// Subscribe to account balance updates
const balanceUnsubscribe = await kucoin.ws().balance((balanceUpdate) => {
  console.log('Balance update:', balanceUpdate);
});

// Unsubscribe when no longer needed
unsubscribe();
orderUnsubscribe();
balanceUnsubscribe();
```

## API Documentation

### Implemented Endpoints

#### Account
- `getAccounts()` - Get account balances
- `getFuturesAccounts()` - Get futures account details
- `getApiKey()` - Get API key information
- `getAffiliateUserRebateInformation()` - Get affiliate rebate information

#### Orders
- `placeOrder()` - Place a spot order
- `placeFuturesOrder()` - Place a futures order
- `cancelOrder()` - Cancel a spot order
- `cancelOrderByClientId()` - Cancel a spot order by client ID
- `cancelFuturesOrderByOrderId()` - Cancel a futures order by order ID
- `cancelFuturesOrderByClientId()` - Cancel a futures order by client ID
- `getOrders()` - Get list of spot orders
- `getFuturesOrders()` - Get list of futures orders
- `getOrderById()` - Get a spot order by ID
- `getFuturesOrderById()` - Get a futures order by ID
- `getOrderByClientId()` - Get a spot order by client ID
- `getFuturesOrderByClientId()` - Get a futures order by client ID
- `listFills()` - Get list of order fills

#### Market Data
- `getSymbols()` - Get list of available spot symbols
- `getFuturesSymbols()` - Get list of available futures symbols
- `getTicker()` - Get ticker for a spot symbol
- `getFuturesTicker()` - Get ticker for a futures symbol
- `getAllTickers()` - Get all spot tickers
- `getFees()` - Get trading fees for symbols
- `getBaseFees()` - Get base fee rates
- `getKlines()` - Get spot candlestick data
- `getFuturesKlines()` - Get futures candlestick data
- `getFuturesPositions()` - Get all futures positions
- `getFuturesPositionBySymbol()` - Get position for a specific futures symbol

#### WebSockets
- `ws().ticker()` - Subscribe to spot ticker updates
- `ws().tickerAll()` - Subscribe to all spot tickers
- `ws().futuresTicker()` - Subscribe to futures ticker updates
- `ws().futuresPositions()` - Subscribe to futures position updates
- `ws().order()` - Subscribe to spot order updates
- `ws().futuresOrder()` - Subscribe to futures order updates
- `ws().balance()` - Subscribe to spot balance updates
- `ws().futuresBalance()` - Subscribe to futures balance updates
- `ws().klines()` - Subscribe to candlestick updates

For detailed parameter descriptions and return types, refer to the JSDoc comments in the source code.

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
