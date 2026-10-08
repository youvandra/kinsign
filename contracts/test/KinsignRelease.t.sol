// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {KinsignRelease} from "../src/KinsignRelease.sol";

contract KinsignReleaseTest is Test {
    KinsignRelease r;
    address operator = makeAddr("operator");
    address reviewer = makeAddr("reviewer");
    address mum = makeAddr("mum");
    address son = makeAddr("son");
    address daughter = makeAddr("daughter");
    address colleague = makeAddr("scammer-colleague");

    bytes32 constant HOLD = keccak256("hold-1");
    bytes32 constant DIGEST = keccak256("payee:kepolisian|amount:50000000|tx:1");
    bytes32 constant REC = keccak256("record");

    function setUp() public {
        vm.warp(1_000_000);
        r = new KinsignRelease(operator, reviewer, 30 minutes);
        address[] memory c = new address[](2);
        c[0] = son;
        c[1] = daughter;
        vm.prank(operator);
        r.enroll(mum, c);
    }

    function _open() internal {
        vm.prank(operator);
        r.openHold(HOLD, mum, DIGEST, REC);
    }

    function _state() internal view returns (KinsignRelease.State s) {
        (, , s, , , ) = r.holds(HOLD);
    }

    // ---------------------------------------------------------------- I1

    function test_holderCannotRelease() public {
        _open();
        vm.prank(mum);
        vm.expectRevert(KinsignRelease.NotMember.selector);
        r.release(HOLD, DIGEST, REC);
    }

    function test_memberReleases() public {
        _open();
        vm.prank(son);
        r.release(HOLD, DIGEST, REC);
        assertEq(uint8(_state()), uint8(KinsignRelease.State.Released));
    }

    function test_operatorCannotRelease() public {
        _open();
        vm.prank(operator);
        vm.expectRevert(KinsignRelease.NotMember.selector);
        r.release(HOLD, DIGEST, REC);
    }

    function test_approvalBoundToTransfer() public {
        _open();
        vm.prank(son);
        vm.expectRevert(KinsignRelease.DigestMismatch.selector);
        r.release(HOLD, keccak256("payee:other|amount:50000000|tx:1"), REC);
    }

    function test_holderCannotEnrolSelf() public {
        address[] memory c = new address[](1);
        c[0] = daughter;
        vm.prank(operator);
        vm.expectRevert(KinsignRelease.SelfMember.selector);
        r.enroll(daughter, c);
        vm.prank(mum);
        vm.expectRevert(KinsignRelease.SelfMember.selector);
        r.proposeMember(mum);
    }

    // ---------------------------------------------------------------- I2

    function test_newMemberWaitsForTimelock() public {
        vm.prank(mum);
        r.proposeMember(colleague);
        _open();
        vm.warp(block.timestamp + 71 hours);
        vm.prank(colleague);
        vm.expectRevert(KinsignRelease.NotMember.selector);
        r.release(HOLD, DIGEST, REC);
    }

    function test_memberAddedAfterHoldCannotReleaseIt() public {
        vm.prank(mum);
        r.proposeMember(colleague);
        _open();
        vm.warp(block.timestamp + 73 hours);
        assertTrue(r.isMember(mum, colleague, uint64(block.timestamp)));
        vm.prank(colleague);
        vm.expectRevert(KinsignRelease.NotMember.selector);
        r.release(HOLD, DIGEST, REC);
    }

    /// The stated residual risk: an addition nobody vetoes for 72 hours becomes
    /// a member and can release holds opened after that.
    function test_unvetoedAdditionBecomesMember() public {
        vm.prank(mum);
        r.proposeMember(colleague);
        vm.warp(block.timestamp + 72 hours);
        _open();
        vm.prank(colleague);
        r.release(HOLD, DIGEST, REC);
        assertEq(uint8(_state()), uint8(KinsignRelease.State.Released));
    }

    function test_vetoStopsAddition() public {
        vm.prank(mum);
        r.proposeMember(colleague);
        vm.prank(son);
        r.vetoMember(mum, colleague);
        vm.warp(block.timestamp + 100 hours);
        assertFalse(r.isMember(mum, colleague, uint64(block.timestamp)));
    }

    function test_proposalCannotBeRestartedWhilePending() public {
        vm.prank(mum);
        r.proposeMember(colleague);
        vm.prank(mum);
        vm.expectRevert(KinsignRelease.AlreadyMember.selector);
        r.proposeMember(colleague);
    }

    function test_holderRemovalIsTimelocked() public {
        vm.prank(mum);
        r.removeMember(mum, son);
        _open();
        vm.prank(son);
        r.release(HOLD, DIGEST, REC); // still effective during the timelock
        assertEq(uint8(_state()), uint8(KinsignRelease.State.Released));
    }

    function test_memberRemovalIsImmediate() public {
        vm.prank(daughter);
        r.removeMember(mum, son);
        _open();
        vm.prank(son);
        vm.expectRevert(KinsignRelease.NotMember.selector);
        r.release(HOLD, DIGEST, REC);
    }

    function test_removedAfterHoldCannotRelease() public {
        _open();
        vm.prank(daughter);
        r.removeMember(mum, son);
        vm.prank(son);
        vm.expectRevert(KinsignRelease.NotMember.selector);
        r.release(HOLD, DIGEST, REC);
    }

    // ---------------------------------------------------------------- I4

    function test_timeAloneNeverReleases() public {
        _open();
        vm.warp(block.timestamp + 365 days);
        assertEq(uint8(_state()), uint8(KinsignRelease.State.Held));
    }

    function test_escalateOnlyAfterWindow() public {
        _open();
        vm.prank(operator);
        vm.expectRevert(KinsignRelease.WindowOpen.selector);
        r.escalate(HOLD, REC);
        vm.warp(block.timestamp + 31 minutes);
        vm.prank(operator);
        r.escalate(HOLD, REC);
        assertEq(uint8(_state()), uint8(KinsignRelease.State.Review));
        // review is not a release; members can no longer release, only block
        vm.prank(son);
        vm.expectRevert(KinsignRelease.BadState.selector);
        r.release(HOLD, DIGEST, REC);
    }

    function test_reviewerDecides() public {
        _open();
        vm.warp(block.timestamp + 31 minutes);
        vm.prank(operator);
        r.escalate(HOLD, REC);
        vm.prank(operator);
        vm.expectRevert(KinsignRelease.NotReviewer.selector);
        r.reviewDecide(HOLD, true, DIGEST, REC);
        vm.prank(reviewer);
        r.reviewDecide(HOLD, true, DIGEST, REC);
        assertEq(uint8(_state()), uint8(KinsignRelease.State.Released));
    }

    function test_reviewerCannotSkipReview() public {
        _open();
        vm.prank(reviewer);
        vm.expectRevert(KinsignRelease.BadState.selector);
        r.reviewDecide(HOLD, true, DIGEST, REC);
    }

    // ------------------------------------------------------------ holder

    function test_holderCanAlwaysCancel() public {
        _open();
        vm.prank(mum);
        r.cancel(HOLD, REC);
        assertEq(uint8(_state()), uint8(KinsignRelease.State.Cancelled));
    }

    function test_terminalStatesAreFinal() public {
        _open();
        vm.prank(son);
        r.blockHold(HOLD, REC);
        vm.prank(daughter);
        vm.expectRevert(KinsignRelease.BadState.selector);
        r.release(HOLD, DIGEST, REC);
        vm.prank(mum);
        vm.expectRevert(KinsignRelease.BadState.selector);
        r.cancel(HOLD, REC);
    }

    // ---------------------------------------------------------------- I5

    function test_chainCoversEveryRecord() public {
        _open();
        vm.prank(operator);
        r.attest(HOLD, keccak256("interview"));
        vm.prank(son);
        r.release(HOLD, DIGEST, keccak256("release"));
        bytes32 c = keccak256(abi.encode(bytes32(0), REC));
        c = keccak256(abi.encode(c, keccak256("interview")));
        c = keccak256(abi.encode(c, keccak256("release")));
        (, , , , , bytes32 chain) = r.holds(HOLD);
        assertEq(chain, c);
    }

    function test_holdIdsAreSingleUse() public {
        _open();
        vm.prank(operator);
        vm.expectRevert(KinsignRelease.HoldExists.selector);
        r.openHold(HOLD, mum, DIGEST, REC);
    }
}

/// @notice A coached holder who does whatever the caller says, a scammer's
/// accomplice the holder keeps proposing, and an operator opening holds. The
/// honest members never act. Whatever sequence the fuzzer finds, the holder
/// never releases, and the accomplice only ever releases a hold opened after
/// a full timelock that the circle was alerted to and did not veto.
contract CoercionHandler is Test {
    KinsignRelease public r;
    address public operator;
    address public holder;
    address public accomplice;
    address public honest;

    bytes32[] public ids;
    uint256 nonce;
    uint64 public firstProposal; // 0 until the holder first proposes the accomplice
    bool public holderReleased;
    bool public earlyAccompliceRelease;

    constructor(KinsignRelease r_, address op, address h, address acc, address hon) {
        r = r_;
        operator = op;
        holder = h;
        accomplice = acc;
        honest = hon;
    }

    function open() external {
        bytes32 id = keccak256(abi.encode("hold", nonce++));
        vm.prank(operator);
        r.openHold(id, holder, keccak256(abi.encode(id)), bytes32(0));
        ids.push(id);
    }

    function holderProposesAccomplice() external {
        vm.prank(holder);
        try r.proposeMember(accomplice) {
            if (firstProposal == 0) firstProposal = uint64(block.timestamp);
        } catch {}
    }

    function holderRemovesHonest() external {
        vm.prank(holder);
        try r.removeMember(holder, honest) {} catch {}
    }

    function holderTriesRelease(uint256 i) external {
        if (ids.length == 0) return;
        bytes32 id = ids[i % ids.length];
        vm.prank(holder);
        try r.release(id, keccak256(abi.encode(id)), bytes32(0)) {
            holderReleased = true;
        } catch {}
    }

    function accompliceTriesRelease(uint256 i) external {
        if (ids.length == 0) return;
        bytes32 id = ids[i % ids.length];
        vm.prank(accomplice);
        try r.release(id, keccak256(abi.encode(id)), bytes32(0)) {
            (, uint64 openedAt, , , , ) = r.holds(id);
            if (firstProposal == 0 || openedAt < firstProposal + r.TIMELOCK()) earlyAccompliceRelease = true;
        } catch {}
    }

    function accompliceTriesBlockAndRemove(uint256 i) external {
        vm.prank(accomplice);
        try r.removeMember(holder, honest) {} catch {}
        if (ids.length == 0) return;
        vm.prank(accomplice);
        try r.blockHold(ids[i % ids.length], bytes32(0)) {} catch {}
    }

    function wait(uint256 secs) external {
        vm.warp(block.timestamp + bound(secs, 1 minutes, 40 hours));
    }
}

contract KinsignReleaseInvariant is Test {
    KinsignRelease r;
    CoercionHandler h;

    function setUp() public {
        vm.warp(1_000_000);
        address operator = makeAddr("operator");
        address holder = makeAddr("holder");
        address honest = makeAddr("honest");
        r = new KinsignRelease(operator, makeAddr("reviewer"), 30 minutes);
        address[] memory c = new address[](1);
        c[0] = honest;
        vm.prank(operator);
        r.enroll(holder, c);
        h = new CoercionHandler(r, operator, holder, makeAddr("accomplice"), honest);
        targetContract(address(h));
    }

    function invariant_holderNeverReleases() public view {
        assertFalse(h.holderReleased());
    }

    function invariant_accompliceOnlyAfterFullTimelock() public view {
        assertFalse(h.earlyAccompliceRelease());
    }
}
