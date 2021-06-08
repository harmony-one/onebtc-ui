import { useCallback, useEffect, useState } from "react";
import detectEthereumProvider from "@metamask/detect-provider";
import { getHmyClient } from "onebtc.sdk";

export const Wallet = ({
  onSetMetamask,
  onSetOneWallet,
  onSetWeb3Client,
  onSetHmyClient,
}) => {
  const [metamaskAddress, setMetamask] = useState("");
  const [oneWalletAddress, setOneWallet] = useState("");
  const [hmyClient, setHmyClient] = useState();
  const [web3Client, setWeb3Client] = useState();

  useEffect(() => {
    onSetMetamask(metamaskAddress);
  }, [metamaskAddress]);

  useEffect(() => {
    onSetOneWallet(oneWalletAddress);
  }, [oneWalletAddress]);

  useEffect(() => {
    onSetWeb3Client(web3Client);
  }, [web3Client]);

  useEffect(() => {
    onSetHmyClient(hmyClient);
  }, [hmyClient]);

  // init HmyClient
  useEffect(() => {
    getHmyClient({
      sdk: "harmony",
      nodeURL: "https://api.s0.b.hmny.io",
      chainId: 2,
      ensAddress: "0x23ca23b6f2C40BF71fe4Da7C5d6396EE2C018e6A",
      gasLimit: 6721900,
    }).then(async (client) => {
      // client.setUseOneWallet(true);
      // setHmyClient(client);
    });
  }, []);

  // init Web3Client
  useEffect(() => {
    getHmyClient({
      sdk: "web3",
      nodeURL: "https://api.s0.b.hmny.io",
      chainId: 2,
      contractAddress: "0x45b24bE9F317054B4D5972E9d685f6e403772f6b",
      gasLimit: 6721900,
    }).then(async (client) => {
      client.setUseOneWallet(true);
      setWeb3Client(client);
    });
  }, []);

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

  return (
    <>
      {!web3Client && <div>Init one-names SDK...</div>}
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
          <button disabled={!web3Client} onClick={signInMetamask}>
            sign in Metamask
          </button>
        )}
      </div>
    </>
  );
};
