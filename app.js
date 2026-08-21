const MIN_BNB = 5;
const MAX_BNB = 500;
const BONUS = 0.11;

const contractAddress =
  "0xA6Fa11F45da5166B252756bED01E3C2bb26A2708";

const bnbAmount = document.getElementById("bnbAmount");
const calculateBtn = document.getElementById("calculateBtn");
const result = document.getElementById("result");
const message = document.getElementById("message");

const atomResult = document.getElementById("atomResult");
const bonusResult = document.getElementById("bonusResult");
const totalResult = document.getElementById("totalResult");

calculateBtn.addEventListener("click", () => {
  const amount = Number(bnbAmount.value);

  message.textContent = "";

  if (!amount) {
    message.textContent = "Enter a BNB amount.";
    result.classList.add("hidden");
    return;
  }

  if (amount < MIN_BNB) {
    message.textContent = `Minimum participation is ${MIN_BNB} BNB.`;
    result.classList.add("hidden");
    return;
  }

  if (amount > MAX_BNB) {
    message.textContent = `Maximum participation is ${MAX_BNB} BNB.`;
    result.classList.add("hidden");
    return;
  }

  /*
    Replace this rate with the verified live ATOM/BNB
    calculation before using this as a production allocation system.
  */

  const estimatedAtom = amount * 1000;
  const bonusAtom = estimatedAtom * BONUS;
  const totalAtom = estimatedAtom + bonusAtom;

  atomResult.textContent =
    `${estimatedAtom.toLocaleString()} ATOM`;

  bonusResult.textContent =
    `+${bonusAtom.toLocaleString()} ATOM`;

  totalResult.textContent =
    `${totalAtom.toLocaleString()} ATOM`;

  result.classList.remove("hidden");
});


document.getElementById("copyContract")
  .addEventListener("click", async () => {
    await navigator.clipboard.writeText(contractAddress);

    const button = document.getElementById("copyContract");
    button.textContent = "Copied";

    setTimeout(() => {
      button.textContent = "Copy";
    }, 1500);
  });


document.getElementById("connectWallet")
  .addEventListener("click", async () => {

    if (!window.ethereum) {
      alert("Please install MetaMask or another compatible Web3 wallet.");
      return;
    }

    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts"
      });

      const walletButton =
        document.getElementById("connectWallet");

      const address = accounts[0];

      walletButton.textContent =
        `${address.slice(0, 6)}...${address.slice(-4)}`;

    } catch (error) {
      console.error(error);
    }
  });
