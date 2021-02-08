'use strict';

module.exports = {
  webpack: (config, env) => {
    const rule = config.module.rules[1].oneOf.find((v) => v.test.toString().match('png'));
    rule.options.esModule = false;
    return config;
  }
};
