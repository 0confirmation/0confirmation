"use strict";

import { makeEthersBase } from "ethers-base";

import ERC20 from "@0confirmation/sol/deployments/localhost/DAI";
ERC20.networks = {};

export default makeEthersBase(ERC20);
