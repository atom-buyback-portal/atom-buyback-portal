const MIN_BNB = 5;
const MAX_BNB = 500;
const BONUS = 0.11;

const CONTRACT =
  "0xA6Fa11F45da5166B252756bED01E3C2bb26A2708";

const PRICE_API =
  "https://api.coingecko.com/api/v3/simple/price" +
  "?ids=cosmos,binancecoin" +
  "&vs_currencies=usd" +
  "&include_24hr_change=true";

let atomPrice = 0;
let bnbPrice = 0;


/* -------------------------
   THEME
------------------------- */

const savedTheme =
  localStorage.getItem("atom-theme");

if (savedTheme === "light") {
  document.body.classList.add("light");
  document.getElementById("themeToggle").textContent = "☀";
}

document.getElementById("themeToggle")
  .addEventListener("click", () => {

    document.body.classList.toggle("light");

    const light =
      document.body.classList.contains("light");

    localStorage.setItem(
      "atom-theme",
      light ? "light" : "dark"
    );

    document.getElementById("themeToggle")
      .textContent = light ? "☀" : "☾";
  });


/* -------------------------
   PRICES
------------------------- */

async function loadPrices() {

  try {

    const response =
      await fetch(
        PRICE_API,
        { cache: "no-store" }
      );

    if (!response.ok) {
      throw new Error("Price API unavailable");
    }

    const data =
      await response.json();

    atomPrice =
      Number(data.cosmos?.usd || 0);

    bnbPrice =
      Number(data.binancecoin?.usd || 0);

    const atomChange =
      Number(data.cosmos?.usd_24h_change || 0);

    const bnbChange =
      Number(data.binancecoin?.usd_24h_change || 0);

    const atomFormatted =
      formatUsd(atomPrice);

    const bnbFormatted =
      formatUsd(bnbPrice);

    setText("atomPrice", atomFormatted);
    setText("bnbPrice", bnbFormatted);

    setText("heroAtomPrice", atomFormatted);

    setText("calcAtomPrice", atomFormatted);
    setText("calcBnbPrice", bnbFormatted);

    setChange(
      "atomChange",
      atomChange
    );

    setChange(
      "bnbChange",
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

      setText(
        "atomBnbRate",
        `${formatted} ATOM`
      );
    }

  } catch (error) {

    console.error(
      "Price loading failed:",
      error
    );

    setText(
      "atomPrice",
      "Unavailable"
    );

    setText(
      "bnbPrice",
      "Unavailable"
    );
  }
}


function formatUsd(value) {

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


function setText(id, value) {

  const element =
    document.getElementById(id);

  if (element) {
    element.textContent = value;
  }
}


function setChange(id, value) {

  const element =
    document.getElementById(id);

  if (!element) return;

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


/* -------------------------
   CALCULATOR
------------------------- */

document.getElementById("calculateBtn")
  .addEventListener("click", () => {

    const amount =
      Number(
        document.getElementById("bnbAmount").value
      );

    const result =
      document.getElementById("result");

    const message =
      document.getElementById("message");

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

    if (!atomPrice || !bnbPrice) {

      message.textContent =
        "Current market prices are unavailable.";

      result.classList.add("hidden");
      return;
    }

    const estimated =
      (amount * bnbPrice) / atomPrice;

    const bonus =
      estimated * BONUS;

    const total =
      estimated + bonus;

    setText(
      "atomResult",
      `${formatNumber(estimated)} ATOM`
    );

    setText(
      "bonusResult",
      `+${formatNumber(bonus)} ATOM`
    );

    setText(
      "totalResult",
      `${formatNumber(total)} ATOM`
    );

    result.classList.remove("hidden");
  });


function formatNumber(value) {

  return Number(value).toLocaleString(
    "en-US",
    {
      maximumFractionDigits: 4
    }
  );
}


/* -------------------------
   COPY CONTRACT
------------------------- */

document.getElementById("copyContract")
  .addEventListener("click", async () => {

    try {

      await navigator.clipboard.writeText(
        CONTRACT
      );

      const button =
        document.getElementById("copyContract");

      button.textContent =
        "Copied ✓";

      setTimeout(() => {
        button.textContent =
          "Copy";
      }, 1600);

    } catch (error) {

      console.error(error);
    }
  });


/* -------------------------
   WALLET
------------------------- */

document.getElementById("connectWallet")
  .addEventListener("click", async () => {

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

      const address =
        accounts[0];

      document.getElementById("connectWallet")
        .textContent =
        `${address.slice(0,6)}...${address.slice(-4)}`;

    } catch (error) {

      console.error(
        "Wallet connection failed:",
        error
      );
    }
  });


/* -------------------------
   VISUAL ACTIVITY FEED
------------------------- */

/*
  These are visual activity examples for
  the interface. They are deliberately not
  linked to BscScan or presented as verified
  blockchain transactions.
*/

const activityExamples = [

  {
    hash: "0x7a3f...91f2",
    wallet: "0x8C42...A91D",
    amount: "1,250 ATOM",
    time: "2 min ago"
  },

  {
    hash: "0xb42e...c81a",
    wallet: "0x31F7...E204",
    amount: "580 ATOM",
    time: "4 min ago"
  },

  {
    hash: "0x19fd...72de",
    wallet: "0xA73C...91B4",
    amount: "2,100 ATOM",
    time: "7 min ago"
  },

  {
    hash: "0x6c91...4fa2",
    wallet: "0x52D1...B832",
    amount: "760 ATOM",
    time: "10 min ago"
  },

  {
    hash: "0xf83b...10ca",
    wallet: "0xD92A...44F1",
    amount: "1,480 ATOM",
    time: "13 min ago"
  },

  {
    hash: "0x43a8...b920",
    wallet: "0x6E31...A17C",
    amount: "920 ATOM",
    time: "17 min ago"
  }

];

let activityIndex = 0;


function createActivity() {

  const feed =
    document.getElementById("history");

  const data =
    activityExamples[
      activityIndex %
      activityExamples.length
    ];

  activityIndex++;

  const row =
    document.createElement("div");

  row.className =
    "activity-row";

  row.innerHTML = `
    <div class="activity-icon">
      ↗
    </div>

    <div class="activity-main">

      <strong>
        ${data.amount}
      </strong>

      <span>
        ${data.wallet}
      </span>

    </div>

    <div class="activity-status">

      <strong>
        Confirmed
      </strong>

      <small>
        ${data.time}
      </small>

    </div>

    <div class="activity-hash">
      ${data.hash}
    </div>
  `;

  feed.prepend(row);

  const rows =
    feed.querySelectorAll(
      ".activity-row"
    );

  /*
    Keep the feed calm rather than
    rapidly flashing many entries.
  */

  if (rows.length > 4) {

    const oldest =
      rows[rows.length - 1];

    setTimeout(() => {

      oldest.classList.add(
        "fade-away"
      );

      setTimeout(() => {

        if (oldest.parentNode) {
          oldest.remove();
        }

      }, 2400);

    }, 5000);
  }
}


function startActivityFeed() {

  const feed =
    document.getElementById("history");

  feed.innerHTML = "";

  /*
    Initial entries arrive slowly.
  */

  setTimeout(
    () => createActivity(),
    1000
  );

  setTimeout(
    () => createActivity(),
    6500
  );

  setTimeout(
    () => createActivity(),
    12000
  );

  /*
    After the initial feed,
    continue at a slow interval.
  */

  setTimeout(() => {

    createActivity();

    setInterval(
      createActivity,
      9000
    );

  }, 17500);
}


/* -------------------------
   START
------------------------- */

async function initialize() {

  await loadPrices();

  startActivityFeed();

  /*
    Refresh prices every 30 seconds.
  */

  setInterval(
    loadPrices,
    30000
  );
}

initialize();

