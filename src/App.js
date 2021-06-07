import "./App.css";
import { getHmyClient } from "onebtc.sdk";
import React, { useEffect, useState, useCallback } from "react";
import detectEthereumProvider from "@metamask/detect-provider";

const sleep = (sec) => new Promise((res) => setTimeout(res, sec * 1000));

const App = () => {
  const [hmyClient, setHmyClient] = useState();
  const [web3Client, setWeb3Client] = useState();
  const [metamaskAddress, setMetamask] = useState();
  const [oneWalletAddress, setOneWallet] = useState();

  const [domain, setDomain] = useState();
  const [owner, setOwner] = useState();
  const [address, setAddress] = useState();
  const [price, setPrice] = useState();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  const signInMetamask = useCallback(() => {
    detectEthereumProvider().then((provider) => {
      try {
        // @ts-ignore
        if (provider !== window.ethereum) {
          console.error("Do you have multiple wallets installed?");
        }

        if (!provider) {
          alert("Metamask not found");
        }

        provider.on("accountsChanged", (accounts) => setMetamask(accounts[0]));

        provider.on("disconnect", () => {
          setMetamask("");
        });

        provider
          .request({ method: "eth_requestAccounts" })
          .then(async (accounts) => {
            setMetamask(accounts[0]);
          });
      } catch (e) {
        console.error(e);
      }
    });
  }, []);

  const signInHarmony = useCallback(() => {
    try {
      // @ts-ignore
      setTimeout(() => {
        // @ts-ignore
        window.onewallet
          .getAccount()
          .then(({ address }) => setOneWallet(address));
      }, 3000);
    } catch (e) {
      console.error(e);
    }
  }, []);

  // init HmyClient
  useEffect(() => {
    getHmyClient({
      sdk: "harmony",
      nodeURL: "https://api.s0.b.hmny.io",
      chainId: 2,
      ensAddress: "0x23ca23b6f2C40BF71fe4Da7C5d6396EE2C018e6A",
      gasLimit: 6721900,
    }).then(async (client) => {
      client.setUseOneWallet(true);
      setHmyClient(client);
    });
  }, []);

  // init Web3Client
  useEffect(() => {
    getHmyClient({
      sdk: "web3",
      nodeURL: "https://api.s0.b.hmny.io",
      chainId: 2,
      ensAddress: "0x23ca23b6f2C40BF71fe4Da7C5d6396EE2C018e6A",
      gasLimit: 6721900,
    }).then(async (client) => {
      client.setUseOneWallet(true);
      setWeb3Client(client);
    });
  }, []);

  const buyDomain = async (client, ownerAddress) => {
    setLoading(true);
    setError("");
    setStatus("");

    const domainName = domain ? domain.replace(".one", "") : "";

    try {
      const owner = ownerAddress;
      const myAddress = ownerAddress;
      const duration = 365 * 24 * 3600; // 1year
      const domain = domainName;
      const secret =
        "0xe6bcec774acd54b71bd49ca5570f4bae074e7d983cad8a3162b480219adecdea";

      setOwner(await client.methods.ens.name(domain + ".one").getOwner());
      setAddress(await client.methods.ens.name(domain + ".one").getAddress());

      const rentPrice = await client.methods.rentPrice(domain, duration);

      setPrice(rentPrice / 1e18);

      setStatus("1 - rentPrice: " + rentPrice / 1e18);

      console.log(domain, owner, duration, secret, myAddress);

      const commitment = await client.methods.makeCommitment(
        domain,
        owner,
        duration,
        secret,
        myAddress
      );

      setStatus("2 - commit: " + commitment);

      await client.methods.commit(commitment);

      setStatus("3 - sleep 15 sec");

      await sleep(15);

      setStatus("4 - register");

      const res = await client.methods.register(
        domain,
        owner,
        duration,
        secret,
        myAddress
      );

      setStatus("5 - register result: " + res.status);

      setOwner(await client.methods.ens.name(domain + ".one").getOwner());
      setAddress(await client.methods.ens.name(domain + ".one").getAddress());
    } catch (e) {
      console.error(e);
      setError(e && e.message);
    }

    setLoading(false);
  };

  return (
    <div className="App">
      {!hmyClient && <div>Init one-names SDK...</div>}
      <div>
        {oneWalletAddress ? (
          <div>OneWallet address: {oneWalletAddress}</div>
        ) : (
          <button disabled={!hmyClient} onClick={signInHarmony}>
            sign in OneWallet
          </button>
        )}
      </div>
      <div>
        {metamaskAddress ? (
          <div>Metamask address: {metamaskAddress}</div>
        ) : (
          <button disabled={!hmyClient} onClick={signInMetamask}>
            sign in Metamask
          </button>
        )}
      </div>
      <div>
        <div>Operation in progress: {loading.toString()}</div>
        {error && <div style={{ color: "red" }}>Error: {error}</div>}
        {!error && status && (
          <div style={{ color: "blue" }}>Status: {status}</div>
        )}
      </div>
      <div>
        Domain:{" "}
        <input
          value={domain}
          disabled={!hmyClient}
          onChange={(evt) => setDomain(evt.target.value)}
        />
      </div>
      <button
        onClick={() => buyDomain(hmyClient, oneWalletAddress)}
        disabled={!hmyClient || !oneWalletAddress}
      >
        Check and Buy Domain with OneWallet
      </button>
      <button
        onClick={() => buyDomain(web3Client, metamaskAddress)}
        disabled={!hmyClient || !metamaskAddress}
      >
        Check and Buy Domain with Metamask
      </button>
      <div>Domain name: {domain}</div>
      <div>Domain price: {price}</div>
      <div>Domain owner: {owner}</div>
      <div>Domain address: {address}</div>
    </div>
  );
};

export default App;
