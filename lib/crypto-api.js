export async function getCryptoPrice(coinId) {
  try {
    const normalizedId = coinId.toLowerCase().trim().replace(/\s+/g, '-');
    console.log(`Fetching price for: ${normalizedId}`);
    
    // Using simple price endpoint
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${normalizedId}&vs_currencies=usd&include_24hr_change=true`;
    
    const response = await fetch(url, {
        headers: {
            'Accept': 'application/json'
        },
        next: { revalidate: 60 } // Next.js cache for 60s
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data[normalizedId]) {
      const price = data[normalizedId].usd;
      const change = data[normalizedId].usd_24h_change;
      
      return `Current price of ${coinId} is $${price.toLocaleString()} USD. The 24h change is ${change ? change.toFixed(2) : 'N/A'}%.`;
    } else {
      return `Sorry, I couldn't find precise price data for "${coinId}". It might be an invalid ID or not listed recently.`;
    }
  } catch (error) {
    console.error('CoinGecko API Error:', error);
    return `Error fetching market data for ${coinId}. The free API might be rate-limited.`;
  }
}
