import "./App.css";
import React, { useState } from "react";
import { Wallet } from "./Client_Wallets";
import { issue_tx_mock } from "onebtc.sdk/lib/helpers";
const bitcoin = require("bitcoinjs-lib");
const utils = require("web3-utils");

const sleep = (sec) => new Promise((res) => setTimeout(res, sec * 1000));

const App = () => {
  const [hmyClient, setHmyClient] = useState();
  const [web3Client, setWeb3Client] = useState();
  const [metamaskAddress, setMetamask] = useState();
  const [oneWalletAddress, setOneWallet] = useState();

  const [amount, setAmount] = useState();
  const [error, setError] = useState();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState();
  const [balance, setBalance] = useState(0);

  const createIssue = async (hmyClient, address) => {
    setStatus("");
    setError("");
    setLoading(true);

    try {
      // let res = await hmyClient.methods.web3.eth.getBalance(address);

      // console.log("User balance: ", Number(res) / 1e18);
      const issueAmount = amount * 1e9;

      let res = await hmyClient.methods.requestIssue(
        issueAmount,
        "0xFbE0741bC1B52dD723A6bfA145E0a15803AC9581"
      );

      setStatus("Request Issue tx: " + res.status);
      console.log("Request Issue tx: " + res);

      // setBalance(Number(await hmyClient.methods.balanceOf(address)) / 1e18);

      ///////
      const IssueEvent = await hmyClient.methods.getIssueDetails(
        res.transactionHash
      );

      console.log("issueDetails: ", IssueEvent);

      setStatus("start execute issue ----");

      /////////////////////////////////////////////
      const issue_id = IssueEvent.issue_id;
      const btc_address = IssueEvent.btc_address;
      const btc_base58 = bitcoin.address.toBase58Check(
        Buffer.from(btc_address.slice(2), "hex"),
        0
      );
      const btcTx = issue_tx_mock(
        utils.toBN(issue_id),
        btc_base58,
        issueAmount
      );
      const btcBlockNumberMock = 1000;
      const btcTxIndexMock = 2;
      const heightAndIndex = (btcBlockNumberMock << 32) | btcTxIndexMock;
      const headerMock = Buffer.alloc(0);
      const proofMock = Buffer.alloc(0);

      await hmyClient.methods.executeIssue(
        address,
        issue_id,
        proofMock,
        btcTx.toBuffer(),
        heightAndIndex,
        headerMock
      );
      ////////////////////////////////////////////////////////////

      setStatus("Execute issue tx: ", res.status);

      // setBalance(Number(await hmyClient.methods.balanceOf(address)) / 1e18);
    } catch (e) {
      debugger;
      setError(e && e.message);
      console.error(e);
    }

    setLoading(false);
  };

  setInterval(async () => {
    if (web3Client && metamaskAddress) {
      // console.log(111, metamaskAddress);

      const balance = await web3Client.methods.balanceOf(metamaskAddress);

      setBalance(balance);
    }
  }, 4000);

  return (
    <div className="App">
      <Wallet
        onSetMetamask={setMetamask}
        onSetOneWallet={setOneWallet}
        onSetWeb3Client={setWeb3Client}
        onSetHmyClient={(v) => v && setHmyClient(v)}
      />
      <div>
        <div>Operation in progress: {loading.toString()}</div>
        {error && <div style={{ color: "red" }}>Error: {error}</div>}
        {!error && status && (
          <div style={{ color: "blue" }}>Status: {status}</div>
        )}
      </div>
      <div>
        Amount:{" "}
        <input
          value={amount}
          disabled={!web3Client}
          onChange={(evt) => setAmount(evt.target.value)}
        />
      </div>
      <button
        onClick={() => createIssue(web3Client, metamaskAddress)}
        disabled={!web3Client || !metamaskAddress}
      >
        Create Issue with Metamask
      </button>
      {/*<button*/}
      {/*  onClick={() => buyDomain(web3Client, metamaskAddress)}*/}
      {/*  disabled={!hmyClient || !metamaskAddress}*/}
      {/*>*/}
      {/*  Check and Buy Domain with Metamask*/}
      {/*</button>*/}
      {/*<div>Domain name: {domain}</div>*/}
      {/*<div>Domain price: {price}</div>*/}
      <div>Vault address: 0xFbE0741bC1B52dD723A6bfA145E0a15803AC9581</div>
      <div>1BTC balance: {balance / 1e9}</div>
    </div>
  );
};

export default App;
