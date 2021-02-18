import React from 'react';
import './App.css';
import Home from './components/home';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom'
import 'bootstrap/dist/css/bootstrap.min.css';

function App() {
  return (
    
    <div className="App">
      <Router>
      <Switch>
          <Route exact path='/' component={Home} />
      </Switch>
    </Router>
    </div>
  );
}

export default App;
