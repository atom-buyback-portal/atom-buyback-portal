const MIN_BNB = 5;
const MAX_BNB = 500;
const BONUS = 0.11;

const CONTRACT_ADDRESS =
  "0xA6Fa11F45da5166B252756bED01E3C2bb26A2708";

const BSC_RPC =
  "https://bsc-rpc.publicnode.com";

const COINGECKO_URL =
  "https://api.coingecko.com/api/v3/simple/price" +
  "?ids=cosmos,binancecoin" +
  "&vs_currencies=usd" +
  "&include_24hr_change=true";

const TRANSFER_TOPIC =
  "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a6df523b3ef";

let atomPrice = 0;
let bnbPrice = 0;
let tokenDecimals = 18;
let lastBlock = null;

const $ = (id) => document.getElementById(id);

const bnbAmount = $("bnbAmount");
const calculateBtn = $("calculateBtn");
const result = $("result");
const message = $("message");

const atomResult = $("atomResult");
const bonusResult = $("bonusResult");
const totalResult = $("totalResult");

const atomPriceEl = $("atomPrice");
const bnbPriceEl = $("bnbPrice");
const atomChangeEl = $("atomChange");
const bnbChangeEl = $("bnbChange");
const atomBnbRateEl = $("atomBnbRate");


// ------------------------------------
// THEME
// ------------------------------------

const savedTheme = localStorage.getItem("atom-theme");

if (savedTheme === "light") {
  document.body.classList.add("light");
  $("themeToggle").textContent = "☀";
}

$("themeToggle").addEventListener("click", () => {
  document.body.classList.toggle("light");

  const isLight =
    document.body.classList.contains("light");

  localStorage.setItem(
    "atom-theme",
    isLight ? "light" : "dark"
  );

  $("themeToggle").textContent =
    isLight ? "☀" : "☾";
});


// ------------------------------------
// LIVE MARKET PRICES
// ------------------------------------

async function loadPrices() {
  try {
    const response = await fetch(COINGECKO_URL, {
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error("Price request failed");
    }

    const data = await response.json();

    atomPrice = Number(data.cosmos?.usd || 0);
    bnbPrice = Number(data.binancecoin?.usd || 0);

    const atomChange =
      Number(data.cosmos?.usd_24h_change || 0);

    const bnbChange =
      Number(data.binancecoin?.usd_24h_change || 0);

    atomPriceEl.textContent =
      formatUsd(atomPrice);

    bnbPriceEl.textContent =
      formatUsd(bnbPrice);

    atomChangeEl.textContent =
      `${atomChange >= 0 ? "+" : ""}${atomChange.toFixed(2)}% 24h`;

    bnbChangeEl.textContent =
      `${bnbChange >= 0 ? "+" : ""}${bnbChange.toFixed(2)}% 24h`;

    atomChangeEl.className =
      atomChange >= 0 ? "positive" : "negative";

    bnbChangeEl.className =
      bnbChange >= 0 ? "positive" : "negative";

    if (atomPrice > 0 && bnbPrice > 0) {
      const rate = bnbPrice / atomPrice;

      atomBnbRateEl.textContent =
        `${rate.toLocaleString(undefined, {
          maximumFractionDigits: 4
        })} ATOM / BNB`;
    }

  } catch (error) {
    console.error("Price error:", error);

    atomPriceEl.textContent = "Unavailable";
    bnbPriceEl.textContent = "Unavailable";
    atomBnbRateEl.textContent = "Unavailable";
  }
}

function formatUsd(value) {
  if (!value) return "$—";

  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value < 1 ? 4 : 2
  });
}


// ------------------------------------
// CALCULATOR
// ------------------------------------

calculateBtn.addEventListener("click", () => {
  const amount = Number(bnbAmount.value);

  message.textContent = "";

  if (!amount || amount <= 0) {
    message.textContent =
      "Enter a valid BNB amount.";

    result.classList.add("hidden");
    return;
  }

  if (amount < MIN_BNB) {
    message.textContent =
      `Minimum participation is ${MIN_BNB} BNB.`;

    result.classList.add("hidden");
    return;
  }

  if (amount > MAX_BNB) {
    message.textContent =
      `Maximum participation is ${MAX_BNB} BNB.`;

    result.classList.add("hidden");
    return;
  }

  if (!bnbPrice || !atomPrice) {
    message.textContent =
      "Current market prices are unavailable. Please try again shortly.";

    result.classList.add("hidden");
    return;
  }

  /*
   * Estimated allocation:
   *
   * BNB value in USD / ATOM price in USD
   *
   * Then apply the portal's 11% bonus.
   */

  const estimatedAtom =
    (amount * bnbPrice) / atomPrice;

  const bonusAtom =
    estimatedAtom * BONUS;

  const totalAtom =
    estimatedAtom + bonusAtom;

  atomResult.textContent =
    `${formatNumber(estimatedAtom)} ATOM`;

  bonusResult.textContent =
    `+${formatNumber(bonusAtom)} ATOM`;

  totalResult.textContent =
    `${formatNumber(totalAtom)} ATOM`;

  result.classList.remove("hidden");
});


// ------------------------------------
// COPY CONTRACT
// ------------------------------------

$("copyContract").addEventListener(
  "click",
  async () => {

    try {
      await navigator.clipboard.writeText(
        CONTRACT_ADDRESS
      );

      const button = $("copyContract");

      button.textContent = "Copied ✓";

      setTimeout(() => {
        button.textContent = "Copy";
      }, 1600);

    } catch (error) {
      console.error(error);
    }
  }
);


// ------------------------------------
// WALLET CONNECTION
// ------------------------------------

$("connectWallet").addEventListener(
  "click",
  async () => {

    if (!window.ethereum) {
      alert(
        "Please install MetaMask or another compatible Web3 wallet."
      );
      return;
    }

    try {

      const accounts =
        await window.ethereum.request({
          method: "eth_requestAccounts"
        });

      if (!accounts.length) return;

      const address = accounts[0];

      $("connectWallet").textContent =
        `${address.slice(0, 6)}...${address.slice(-4)}`;

    } catch (error) {
      console.error("Wallet connection:", error);
    }
  }
);


// ------------------------------------
// BSC RPC
// ------------------------------------

async function rpc(method, params = []) {

  const response = await fetch(
    BSC_RPC,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: Date.now(),
        method,
        params
      })
    }
  );

  if (!response.ok) {
    throw new Error(
      `RPC HTTP error ${response.status}`
    );
  }

  const data = await response.json();

  if (data.error) {
    throw new Error(data.error.message);
  }

  return data.result;
}


// ------------------------------------
// TOKEN DECIMALS
// ------------------------------------

async function loadTokenDecimals() {

  try {

    const result =
      await rpc("eth_call", [
        {
          to: CONTRACT_ADDRESS,
          data: "0x313ce567"
        },
        "latest"
      ]);

    if (result) {
      tokenDecimals =
        parseInt(result, 16);
    }

  } catch (error) {

    console.warn(
      "Could not read token decimals. Using 18.",
      error
    );

    tokenDecimals = 18;
  }
}


// ------------------------------------
// REAL ON-CHAIN TRANSFERS
// ------------------------------------

async function loadTransactions() {

  const history =
    $("history");

  try {

    const latestHex =
      await rpc("eth_blockNumber");

    const latestBlock =
      parseInt(latestHex, 16);

    /*
     * Search the recent block range.
     * Keep the range relatively small so the public RPC
     * is not overloaded.
     */

    const fromBlock =
      Math.max(0, latestBlock - 3000);

    const logs =
      await rpc("eth_getLogs", [
        {
          address: CONTRACT_ADDRESS,
          fromBlock: `0x${fromBlock.toString(16)}`,
          toBlock: `0x${latestBlock.toString(16)}`,
          topics: [TRANSFER_TOPIC]
        }
      ]);

    const transfers =
      logs
        .filter((log) => log.topics?.length >= 3)
        .slice(-8)
        .reverse();

    if (!transfers.length) {

      history.innerHTML = `
        <div class="empty-history">
          <div class="empty-icon">◌</div>
          <strong>No recent transfers detected</strong>
          <span>
            New on-chain ATOM transfers will appear here
            when detected.
          </span>
        </div>
      `;

      lastBlock = latestBlock;
      return;
    }

    const rows = [];

    for (const log of transfers) {

      const from =
        "0x" + log.topics[1].slice(-40);

      const to =
        "0x" + log.topics[2].slice(-40);

      const rawAmount =
        BigInt(log.data);

      const amount =
        Number(
          rawAmount /
          (10n ** BigInt(tokenDecimals))
        ) +
        Number(
          rawAmount %
          (10n ** BigInt(tokenDecimals))
        ) /
        Number(
          10n ** BigInt(tokenDecimals)
        );

      const timestamp =
        await getBlockTimestamp(log.blockNumber);

      rows.push({
        hash: log.transactionHash,
        from,
        to,
        amount,
        timestamp
      });
    }

    history.innerHTML =
      rows.map(renderTransaction).join("");

    lastBlock = latestBlock;

  } catch (error) {

    console.error(
      "Transaction loading error:",
      error
    );

    history.innerHTML = `
      <div class="empty-history">
        <div class="empty-icon">!</div>
        <strong>On-chain activity temporarily unavailable</strong>
        <span>
          The portal could not read the BNB Smart Chain
          activity feed right now.
        </span>
      </div>
    `;
  }
}


// ------------------------------------
// BLOCK TIMESTAMP
// ------------------------------------

const blockCache = new Map();

async function getBlockTimestamp(blockNumber) {

  if (blockCache.has(blockNumber)) {
    return blockCache.get(blockNumber);
  }

  try {

    const block =
      await rpc(
        "eth_getBlockByNumber",
        [blockNumber, false]
      );

    const timestamp =
      parseInt(block.timestamp, 16) * 1000;

    blockCache.set(
      blockNumber,
      timestamp
    );

    return timestamp;

  } catch {
    return Date.now();
  }
}


// ------------------------------------
// TRANSACTION CARD
// ------------------------------------

function renderTransaction(tx) {

  const shortHash =
    `${tx.hash.slice(0, 8)}...${tx.hash.slice(-6)}`;

  const shortFrom =
    `${tx.from.slice(0, 6)}...${tx.from.slice(-4)}`;

  const shortTo =
    `${tx.to.slice(0, 6)}...${tx.to.slice(-4)}`;

  return `
    <a
      class="transaction"
      href="https://bscscan.com/tx/${tx.hash}"
      target="_blank"
      rel="noopener"
    >

      <div class="transaction-icon">
        ↗
      </div>

      <div class="transaction-main">

        <strong>
          ${formatNumber(tx.amount)} ATOM
        </strong>

        <span>
          ${shortFrom} → ${shortTo}
        </span>

      </div>

      <div class="transaction-meta">

        <span class="confirmed">
          <i></i> Confirmed
        </span>

        <small>
          ${relativeTime(tx.timestamp)}
        </small>

      </div>

      <div class="transaction-hash">
        ${shortHash}
      </div>

    </a>
  `;
}


// ------------------------------------
// HELPERS
// ------------------------------------

function formatNumber(value) {

  return Number(value).toLocaleString(
    "en-US",
    {
      maximumFractionDigits: 4
    }
  );
}

function relativeTime(timestamp) {

  const seconds =
    Math.floor(
      (Date.now() - timestamp) / 1000
    );

  if (seconds < 60) {
    return "Just now";
  }

  const minutes =
    Math.floor(seconds / 60);

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours =
    Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days =
    Math.floor(hours / 24);

  return `${days}d ago`;
}


// ------------------------------------
// START
// ------------------------------------

async function initializePortal() {

  await loadPrices();

  await loadTokenDecimals();

  await loadTransactions();

  /*
   * Refresh market prices every 30 seconds.
   */
  setInterval(
    loadPrices,
    30000
  );

  /*
   * Refresh blockchain activity every 20 seconds.
   */
  setInterval(
    loadTransactions,
    20000
  );
}

initializePortal();
 
   
  
    
