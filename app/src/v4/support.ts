// Donation details. Inside 24h is free; people who want to can support it.
// Fill these in before launch — empty values show "coming soon" instead of a link.
export const SUPPORT = {
  paypalUrl: '', // e.g. https://www.paypal.com/donate/?hosted_button_id=...
  crypto: [
    { coin: 'Solana (SOL)', address: '9GBjH2j66drD89RXGFroxrWN1PFbt7aSUwxYNnDJJtP7' },
    // { coin: 'Bitcoin (BTC)', address: '' },
    // { coin: 'Ethereum (ETH)', address: '' },
  ] as { coin: string; address: string }[],
};
