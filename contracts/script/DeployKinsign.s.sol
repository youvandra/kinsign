// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {KinsignRelease} from "../src/KinsignRelease.sol";

/// Deploys the Kinsign release record onto the local FISCO BCOS chain, enrols one
/// holder with one circle member, and writes deployments/kinsign-local.json.
contract DeployKinsign is Script {
    function run() external {
        uint256 bankKey = vm.envUint("AGENT_KEY"); // operator: the bank's risk engine
        address reviewer = vm.addr(vm.envUint("OWNER2_KEY"));
        address holder = vm.addr(vm.envUint("OWNER1_KEY"));
        address son = vm.addr(vm.envUint("FINANCE_KEY"));

        vm.startBroadcast(bankKey);
        KinsignRelease r = new KinsignRelease(vm.addr(bankKey), reviewer, 30 minutes);
        address[] memory circle = new address[](1);
        circle[0] = son;
        r.enroll(holder, circle);
        vm.stopBroadcast();

        string memory obj = "kinsign";
        vm.serializeAddress(obj, "release", address(r));
        vm.serializeAddress(obj, "operator", vm.addr(bankKey));
        vm.serializeAddress(obj, "reviewer", reviewer);
        vm.serializeAddress(obj, "holder", holder);
        string memory json = vm.serializeAddress(obj, "member", son);
        vm.writeJson(json, "./deployments/kinsign-local.json");
        console.log("KinsignRelease", address(r));
    }
}
