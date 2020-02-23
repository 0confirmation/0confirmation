'use strict';

const path = require('path');
const child_process = require('child_process');

try {
  window.addEventListener;
} catch (e) {
  global.window = {};
}
const {
  CompilerImports,
  registry
} = require('./build/compiler-imports-browser');

try {
  window.addEventListener;
} catch (e) {
  delete global.window;
}

const yargs = require('yargs');
const plugin = new CompilerImports();
const resolve = (...args) => plugin.resolve(...args);

class Config {
  constructor() {
    this.data = {};
  }
  set(key, val) {
    this.data[key] = val;
  }
  get(key) {
    return this.data[key];
  }
}

class ExtractedRemixImportPlugin {
  constructor(solc) {
    this.plugin = new CompilerImports();
    this.registry = registry;
    this.config = new Config();
    this.solc = solc;
    this.registry.put({
      name: 'config',
      api: this.config
    });
    this.env = {};
    if (process.env.SOLC_IMPORT_PROCESS) {
      Object.keys(process.env).filter((v) => v.match(/^IMPORT_/)).forEach((v) => {
        const match = v.match(/(IMPORT_|.*?)/g);
        const key = match[1];
        this.put(key, process.env[v]);
      });
    }
  }
  async runProcess() {
    await this._resolve(yargs.argv._);
  }
  put(name, apiKey) {
    this.config.set(name, apiKey);
    this.env['IMPORT_' + name] = apiKey;
  }
  async _resolve(url, ...args) {
    try {
      let content = (await this.plugin.resolve(url, ...args)).content;
      const match = content.match(/pragma\s+solidity\s+/);
      const pragma = 'pragma solidity ^' + process.env.SOLC_VERSION.split('+')[0] + ';\n';
      if (!match) content = pragma + content;
      else content = content.replace(/pragma\s+solidity\s+.*?\n/g, pragma);
      process.stdout.write(content);
      process.exit(0);
    } catch (e) {
      console.error(e);
      process.exit(1);
    }
  }
  resolveSync(...args) {
    const proc = child_process.spawnSync('node', [ path.join(__dirname, 'import'), args[0] ], {
      env: Object.assign({}, process.env, this.env, {
        SOLC_IMPORT_PROCESS: 1,
        SOLC_VERSION: this.solc.version()
      })
    });
    const output = proc.stdout.toString('utf8');
    const stderr = proc.stderr.toString('utf8');
    console.log(output);
    console.log(stderr);
    return {
      contents: output
    };
  }
  get() {
    return {
      import: (...args) => this.resolveSync(...args)
    }
  }
}

module.exports = ExtractedRemixImportPlugin;
