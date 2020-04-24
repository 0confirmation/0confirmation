'use strict';

const Curvefi = require('@0confirmation/curvefi/build/Curvefi');
const CurveToken = require('@0confirmation/curvefi/build/CurveToken');
const fs = require('fs');
const path = require('path');

[ Curvefi, CurveToken ].forEach((v) => fs.writeFileSync(path.join(__dirname, '..', 'build', v.contractName + '.json'), JSON.stringify(v, null, 2)));
