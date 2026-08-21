const MIN_BNB = 5;
const MAX_BNB = 500;
const BONUS = 0.11;

const CONTRACT =
  "0xA6Fa11F45da5166B252756bED01E3C2bb26A2708";

const BSC_RPC =
  "https://bsc-rpc.publicnode.com";

const COINGECKO =
  "https://api.coingecko.com/api/v3/simple/price" +
  "?ids=cosmos,binancecoin" +
  "&vs_currencies=usd" +
  "&include_24hr_change=true";

const TRANSFER_TOPIC =
  "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a6df523b3ef";

let atomPrice = 0;
let bnbPrice = 0;
let decimals = 18;

const $ = id =>
  document.getElementById(id);


/* =========================
   THEME
========================= */

const savedTheme =
  localStorage.getItem("atom-theme");

if (savedTheme === "light") {
  document.body.classList.add("light");
  $("themeToggle").textContent = "☀";
}

$("themeToggle").addEventListener(
  "click",
  () => {

    document.body.classList.toggle("light");

    const light =
      document.body.classList.contains("light");

    localStorage.setItem(
      "atom-theme",
      light ? "light" : "dark"
    );

    $("themeToggle").textContent =
      light ? "☀" : "☾";
  }
);


/* =========================
   MARKET PRICES
========================= */

async function loadPrices() {

  try {

    const response =
      await fetch(
        COINGECKO,
        { cache: "no-store" }
      );

    if (!response.ok) {
      throw new Error("Price request failed");
    }

    const data =
      await response.json();

    atomPrice =
      Number(
        data.cosmos?.usd || 0
      );

    bnbPrice =
      Number(
        data.binancecoin?.usd || 0
      );

    const atomChange =
      Number(
        data.cosmos?.usd_24h_change || 0
      );

    const bnbChange =
      Number(
        data.binancecoin?.usd_24h_change || 0
      );

    $("atomPrice").textContent =
      usd(atomPrice);

    $("bnbPrice").textContent =
      usd(bnbPrice);

    setChange(
      $("atomChange"),
      atomChange
    );

    setChange(
      $("bnbChange"),
      bnbChange
    );

    if (atomPrice && bnbPrice) {

      const rate =
        bnbPrice / atomPrice;

      const formatted =
        rate.toLocaleString(
          "en-US",
          {
            maximumFractionDigits: 4
          }
        );

      $("atomBnbRate").textContent =
        `${formatted} ATOM`;

      $("calculatorRate").textContent =
        `${formatted} ATOM`;
    }

  } catch (error) {

    console.error(
      "Price loading error:",
      error
    );

    $("atomPrice").textContent =
      "Unavailable";

    $("bnbPrice").textContent =
      "Unavailable";

    $("atomBnbRate").textContent =
      "Unavailable";

    $("calculatorRate").textContent =
      "Unavailable";
  }
}


function setChange(element, value) {

  if (!Number.isFinite(value)) {
    element.textContent = "—";
    return;
  }

  element.textContent =
    `${value >= 0 ? "+" : ""}${value.toFixed(2)}% 24h`;

  element.classList.toggle(
    "positive",
    value >= 0
  );

  element.classList.toggle(
    "negative",
    value < 0
  );
}


function usd(value) {

  if (!value) {
    return "$—";
  }

  return value.toLocaleString(
    "en-US",
    {
      style: "currency",
      currency: "USD",
      maximumFractionDigits:
        value < 1 ? 4 : 2
    }
  );
}


/* =========================
   CALCULATOR
========================= */

$("calculateBtn").addEventListener(
  "click",
  () => {

    const amount =
      Number(
        $("bnbAmount").value
      );

    const result =
      $("result");

    const message =
      $("message");

    message.textContent = "";

    if (!amount) {

      message.textContent =
        "Enter a BNB amount.";

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

    const estimated =
      (amount * bnbPrice) /
      atomPrice;

    const bonus =
      estimated * BONUS;

    const total =
      estimated + bonus;

    $("atomResult").textContent =
      `${formatNumber(estimated)} ATOM`;

    $("bonusResult").textContent =
      `+${formatNumber(bonus)} ATOM`;

    $("totalResult").textContent =
      `${formatNumber(total)} ATOM`;

    result.classList.remove("hidden");
  }
);


/* =========================
   COPY CONTRACT
========================= */

$("copyContract").addEventListener(
  "click",
  async () => {

    try {

      await navigator.clipboard.writeText(
        CONTRACT
      );

      const button =
        $("copyContract");

      button.textContent =
        "Copied ✓";

      setTimeout(
        () => {
          button.textContent =
            "Copy";
        },
        1600
      );

    } catch (error) {

      console.error(
        "Copy error:",
        error
      );
    }
  }
);


/* =========================
   WALLET
========================= */

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
          method:
            "eth_requestAccounts"
        });

      if (!accounts.length) {
        return;
      }

      const address =
        accounts[0];

      $("connectWallet").textContent =
        `${address.slice(0,6)}...${address.slice(-4)}`;

    } catch (error) {

      console.error(
        "Wallet error:",
        error
      );
    }
  }
);


/* =========================
   RPC
========================= */

async function rpc(
  method,
  params = []
) {

  const response =
    await fetch(
      BSC_RPC,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json"
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
      `RPC error ${response.status}`
    );
  }

  const data =
    await response.json();

  if (data.error) {
    throw new Error(
      data.error.message
    );
  }

  return data.result;
}


/* =========================
   TOKEN DECIMALS
========================= */

async function loadDecimals() {

  try {

    const result =
      await rpc(
        "eth_call",
        [
          {
            to: CONTRACT,
            data: "0x313ce567"
          },
          "latest"
        ]
      );

    if (result) {
      decimals =
        parseInt(
          result,
          16
        );
    }

  } catch (error) {

    console.warn(
      "Token decimals unavailable:",
      error
    );

    decimals = 18;
  }
}


/* =========================
   REAL ON-CHAIN ACTIVITY
========================= */

async function loadTransactions() {

  const history =
    $("history");

  try {

    const latestHex =
      await rpc(
        "eth_blockNumber"
      );

    const latest =
      parseInt(
        latestHex,
        16
      );

    /*
      Read recent Transfer events
      emitted by the supplied token
      contract.
    */

    const from =
      Math.max(
        0,
        latest - 2500
      );

    const logs =
      await rpc(
        "eth_getLogs",
        [
          {
            address: CONTRACT,

            fromBlock:
              `0x${from.toString(16)}`,

            toBlock:
              `0x${latest.toString(16)}`,

            topics: [
              TRANSFER_TOPIC
            ]
          }
        ]
      );

    const transfers =
      logs
        .filter(
          log =>
            log.topics &&
            log.topics.length >= 3
        )
        .slice(-8)
        .reverse();

    if (!transfers.length) {

      history.innerHTML = `
        <div class="empty-history">
          <div class="empty-icon">◌</div>

          <strong>
            No recent transfers detected
          </strong>

          <span>
            Confirmed ATOM transfers will
            appear here automatically.
          </span>
        </div>
      `;

      return;
    }

    const rows = [];

    for (const log of transfers) {

      const fromAddress =
        "0x" +
        log.topics[1].slice(-40);

      const toAddress =
        "0x" +
        log.topics[2].slice(-40);

      const raw =
        BigInt(log.data);

      const divisor =
        10n ** BigInt(decimals);

      const whole =
        raw / divisor;

      const fraction =
        raw % divisor;

      const amount =
        Number(whole) +
        Number(fraction) /
        Number(divisor);

      const timestamp =
        await getTimestamp(
          log.blockNumber
        );

      rows.push({
        hash:
          log.transactionHash,

        from:
          fromAddress,

        to:
          toAddress,

        amount,

        timestamp
      });
    }

    /*
      Render oldest first so the newest
      item enters naturally at the bottom
      of the transition.
    */

    history.innerHTML =
      rows
        .reverse()
        .map(
          renderTransaction
        )
        .join("");

    /*
      Put the newest item back at the top.
    */

    history.innerHTML =
      rows
        .reverse()
        .map(
          renderTransaction
        )
        .join("");

  } catch (error) {

    console.error(
      "Transaction error:",
      error
    );

    history.innerHTML = `
      <div class="empty-history">
        <div class="empty-icon">!</div>

        <strong>
          Activity temporarily unavailable
        </strong>

        <span>
          The blockchain activity feed
          could not be refreshed.
        </span>
      </div>
    `;
  }
}


/* =========================
   BLOCK TIMESTAMP
========================= */

const blockCache =
  new Map();

async function getTimestamp(
  blockNumber
) {

  if (
    blockCache.has(
      blockNumber
    )
  ) {
    return blockCache.get(
      blockNumber
    );
  }

  try {

    const block =
      await rpc(
        "eth_getBlockByNumber",
        [
          blockNumber,
          false
        ]
      );

    const timestamp =
      parseInt(
        block.timestamp,
        16
      ) * 1000;

    blockCache.set(
      blockNumber,
      timestamp
    );

    return timestamp;

  } catch {

    return Date.now();
  }
}


/* =========================
   TRANSACTION ROW
========================= */

function renderTransaction(tx) {

  const shortHash =
    `${tx.hash.slice(0,8)}...${tx.hash.slice(-6)}`;

  const shortFrom =
    `${tx.from.slice(0,6)}...${tx.from.slice(-4)}`;

  const shortTo =
    `${tx.to.slice(0,6)}...${tx.to.slice(-4)}`;

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
          <i></i>
          Confirmed
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


/* =========================
   HELPERS
========================= */

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
    Math.max(
      0,
      Math.floor(
        (Date.now() - timestamp) / 1000
      )
    );

  if (seconds < 60) {
    return "Just now";
  }

  const minutes =
    Math.floor(
      seconds / 60
    );

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours =
    Math.floor(
      minutes / 60
    );

  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days =
    Math.floor(
      hours / 24
    );

  return `${days}d ago`;
}


/* =========================
   INITIALIZE
========================= */

async function initialize() {

  await loadPrices();

  await loadDecimals();

  await loadTransactions();

  /*
    Market prices:
    refresh every 30 seconds.
  */

  setInterval(
    loadPrices,
    30000
  );

  /*
    Blockchain activity:
    refresh every 20 seconds.
  */

  setInterval(
    loadTransactions,
    20000
  );
}


initialize();
 
   
  
    
