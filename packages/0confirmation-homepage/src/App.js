import React from 'react';
import './App.css';
import MainInfo from './0cf_lp_fn-01.svg';
import EmailInfo from './0cf_lp_fn-02.svg';
import TelegramInfo from './0cf_lp_fn-03.svg';
import Qrcode from './qrcode.jpeg';

function App() {
  return (
    <div className="App">
      <title>0confirmation - decentralized signaling network for instant liquidity access</title>
      <header className="App-header">
        <div style={ { height: '100%' } }>
          <div><img src={MainInfo} className="App-logo" alt="logo" /></div>
          <div><img src={Qrcode} className="App-logo" alt="qrcode" /></div>
          <div><a href="mailto:info@0confirmation.com"><img src={EmailInfo} className="App-logo" alt="logo" /></a></div>
          <div><a href="https://t.me/zeroconfirmation"><img src={TelegramInfo} className="App-logo" alt="logo" /></a></div>
        </div>
      </header>
    </div>
  );
}

export default App;