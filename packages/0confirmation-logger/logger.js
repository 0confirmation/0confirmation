"use strict";

const moment = require('moment');
const chalk = require("chalk");

class Logger {
  constructor(name) {
    this.name = name;
  }
  prefix(color) {
    return chalk.bold[color](
      "[" + this.name + "|" + moment(new Date()).format("HH:mm:ss")
    );
  }
  info(msg) {
    console.log(this.prefix("cyan") + " " + chalk.bold(msg));
    return msg;
  }
  error(msg) {
    console.error(this.prefix("red") + " " + chalk.bold(msg.stack || msg));
    return msg;
  }
}

const createLogger = (name) => new Logger(name);

module.exports = createLogger;
