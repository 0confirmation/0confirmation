import React from 'react';
import './App.css';
import MainInfo from './0cf_lp_fn-01.svg';
import EmailInfo from './0cf_lp_fn-02.svg';
import TelegramInfo from './0cf_lp_fn-03.svg';
import TelegramQR from './telegram-QR.svg';

function App() {
  return (
    <div className="App">
      <title>0confirmation - decentralized signaling network for instant liquidity access</title>
      <header className="App-header">
        <div style={ { height: '100%' } }>
          <div><img src={MainInfo} className="App-logo" alt="logo" /></div>
          <div><a href="mailto:info@0confirmation.com"><img src={EmailInfo} className="App-logo" alt="logo" /></a></div>
          <div><img src={TelegramQR} className="App-logo" alt="qrcode" /></div>
        </div>
      </header>
    </div>
  );
}

export default App;
