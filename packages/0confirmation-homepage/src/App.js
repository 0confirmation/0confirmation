import React from 'react';
import './App.css';
import MainInfo from './0cf_lp_fn-01.svg';
import EmailInfo from './0cf_lp_fn-02.svg';
import TelegramInfo from './0cf_lp_fn-03.svg';

function App() {
  return (
    <div className="App">
      <title>0confirmation - decentralized signaling network for instant liquidity access</title>
      <header className="App-header">
        <div><img src={MainInfo} className="App-logo" alt="logo" /></div>
        <div><a href="mailto:info@0confirmation.com"><img src={EmailInfo} className="App-logo" alt="logo" /></a></div>
        <div><a href="t.me/zeroconfirmation"><img src={TelegramInfo} className="App-logo" alt="logo" /></a></div>
      </header>
    </div>
  );
}

export default App;
