import React, { useEffect, useState } from 'react';
import './App.css';
import * as nearAPI from "near-api-js";

interface RGB {
  r: number;
  g: number;
  b: number
}

interface UserInfo {
  name: string;
  amount: string;
  rgb: RGB
}

const { connect, keyStores, WalletConnection, Contract, utils } = nearAPI;
const myKeyStore = new keyStores.BrowserLocalStorageKeyStore();

const EXAMPLE_CONTRACT = 'frontend-test-1.badconfig.testnet';

const connectionConfig = {
  networkId: "testnet",
  keyStore: myKeyStore,
  nodeUrl: "https://rpc.testnet.near.org",
  walletUrl: "https://wallet.testnet.near.org",
  helperUrl: "https://helper.testnet.near.org",
  explorerUrl: "https://explorer.testnet.near.org",
};


function App() {
  const [connection, setConnection] = useState<nearAPI.WalletConnection>();
  const [userInfo, setUserInfo] = useState<UserInfo>();
  const [contract, setContract] = useState<nearAPI.Contract>();
  const [newRgb, setNewRgb] = useState<RGB>({r: 255, g: 255, b: 255});
  const [isLoading, setIsLoading] = useState(false);

  const connectToNear = async() => {
    const nearConnection = await connect(connectionConfig);
  
    const walletConnection = new WalletConnection(nearConnection, 'my-connection');
    
    setConnection(walletConnection);
    const name = walletConnection.getAccountId();
    const account = await walletConnection.account()
    const info = await account.getAccountBalance()
    const isLoggedIn = !!name;

    if (isLoggedIn) {
      const newContract = new Contract(
        account,
        EXAMPLE_CONTRACT,
        {
          viewMethods: ["get"],
          changeMethods: ["set"],
        }
      );
      setContract(newContract)
      //@ts-ignore
      const response = await newContract.get();
      const rgb = {r: response[0], g: response[1], b: response[2]};
      setUserInfo({
        name,
        amount: info.available,
        rgb
      });
      setNewRgb(rgb);
    }
  }

  const signUp = () => {
    if (!connection)  return;
    connection.requestSignIn({ contractId: EXAMPLE_CONTRACT });
  }

  const logOut = () => {
    if (connection) {
      connection.signOut();
      setUserInfo(undefined);
      setContract(undefined);
    }
  }

  const nearFormat = (amount: string) => {
    return utils.format.formatNearAmount(amount);
  }

  const onChangeColor = (position: keyof RGB, e: React.ChangeEvent<HTMLInputElement>) => {
    setNewRgb((prevState) => ({
      ...prevState,
      [position]: Number(e.target.value)
    }));
  }

  const submit = async() => {
    if (!contract) return;
    try {
      setIsLoading(true);
      //@ts-ignore
      await contract.set(newRgb)
    }
    finally {
      setIsLoading(false);
      setUserInfo((prevState) => prevState ? ({
        ...prevState,
        rgb: newRgb
      }) : undefined);
    }
  }

  useEffect(() => {
    connectToNear();
  }, [])

  return (
    <div className="main">
      {userInfo ? (
          <div className="auth" style={{color: `rgb(${userInfo.rgb.r}, ${userInfo.rgb.g}, ${userInfo.rgb.b})`}}>
            <div>{userInfo.name}</div>
            <div>{nearFormat(userInfo.amount)} NEAR</div>
            <div>R: <input onChange={(e) => onChangeColor('r', e) } type="number" min="0" max="255" value={newRgb.r}/></div>
            <div>G: <input onChange={(e) => onChangeColor('g', e) } type="number" min="0" max="255" value={newRgb.g}/></div>
            <div>B: <input onChange={(e) => onChangeColor('b', e) } type="number" min="0" max="255" value={newRgb.b}/></div>
            <button onClick={isLoading ? undefined : submit}>{isLoading ? 'loading' : 'submit'}</button>
            <button onClick={logOut}>LOG OUT</button>
          </div>
        ) : (
          <button onClick={signUp}>SIGN IN</button>
        )
      }
    </div>
  );
}

export default App;
