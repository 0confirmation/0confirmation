import React from 'react';
import './App.css';
import MainInfo from './0cf_lp_fn-01.svg';
import EmailInfo from './0cf_lp_fn-02.svg';
import TelegramInfo from './0cf_lp_fn-03.svg';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <div><img src={MainInfo} className="App-logo" alt="logo" /></div>
        <div><a href="mailto:info@0confirmation.com"><img src={EmailInfo} className="App-logo" alt="logo" /></a></div>
        <div><img src={TelegramInfo} className="App-logo" alt="logo" /></div>
      </header>
    </div>
  );
}

export default App;
