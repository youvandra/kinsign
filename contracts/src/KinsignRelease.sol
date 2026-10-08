// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title KinsignRelease
/// @notice Shared release record for Out-of-Channel Release. The bank's ledger
/// holds the money; this contract holds who may release a held transfer, the
/// timelocked trusted circle, and a hash chain of every decision. It runs on a
/// consortium chain shared by the bank, the operator and the regulator, so no
/// single party, the bank included, can skip the timelock or rewrite who
/// released what. Only hashes of decision records are stored, never personal data.
///
/// Invariants (see docs/security.md):
///  I1. A held transfer is released only by a circle member who was effective
///      when the hold opened and still is, never by the account holder, or by
///      the reviewer after the hold was escalated to review.
///  I2. A member added after enrolment becomes effective only 72h after the
///      proposal; any effective member can veto it before then. The holder's
///      own removals of members are timelocked too.
///  I4. No transition to Released happens by time passing alone.
///  I5. Every transition extends a per-hold hash chain that nobody can rewrite.
/// I3 (the interview can only raise risk) lives in the risk engine off chain.
contract KinsignRelease {
    // ------------------------------------------------------------------ types
    enum State {
        None,
        Held,
        Released,
        Blocked,
        Cancelled,
        Review
    }

    struct Member {
        uint64 effectiveAt; // 0 = never proposed
        uint64 removedAt; // 0 = not removed
    }

    struct Hold {
        address holder;
        uint64 openedAt;
        State state;
        address decidedBy;
        bytes32 transferDigest; // binds payee, amount and transfer id
        bytes32 chain; // hash chain of decision records
    }

    // -------------------------------------------------------------- constants
    uint64 public constant TIMELOCK = 72 hours;

    // ------------------------------------------------------------------ state
    address public immutable operator; // the bank's risk engine
    address public immutable reviewer; // branch or call-back desk
    uint64 public immutable responseWindow; // before a hold may go to review

    mapping(address => uint64) public enrolledAt;
    mapping(address => mapping(address => Member)) public circle;
    mapping(bytes32 => Hold) public holds;

    // ----------------------------------------------------------------- events
    event Enrolled(address indexed holder, address[] members);
    event MemberProposed(address indexed holder, address indexed member, uint64 effectiveAt);
    event MemberVetoed(address indexed holder, address indexed member, address by);
    event MemberRemoved(address indexed holder, address indexed member, address by, uint64 removedAt);
    event Decision(bytes32 indexed holdId, State state, address indexed by, bytes32 recordHash, bytes32 chain);

    // ----------------------------------------------------------------- errors
    error NotOperator();
    error NotReviewer();
    error NotHolder();
    error NotMember();
    error NotEnrolled();
    error AlreadyEnrolled();
    error SelfMember();
    error AlreadyMember();
    error BadState();
    error HoldExists();
    error DigestMismatch();
    error WindowOpen();

    constructor(address operator_, address reviewer_, uint64 responseWindow_) {
        operator = operator_;
        reviewer = reviewer_;
        responseWindow = responseWindow_;
    }

    modifier onlyOperator() {
        if (msg.sender != operator) revert NotOperator();
        _;
    }

    // ---------------------------------------------------------------- circle

    /// @notice Enrolment happens at onboarding, outside any call, so the first
    /// circle is effective at once. Every later addition waits for the timelock.
    function enroll(address holder, address[] calldata members) external onlyOperator {
        if (enrolledAt[holder] != 0) revert AlreadyEnrolled();
        enrolledAt[holder] = uint64(block.timestamp);
        for (uint256 i; i < members.length; ++i) {
            address m = members[i];
            if (m == holder) revert SelfMember();
            circle[holder][m] = Member(uint64(block.timestamp), 0);
        }
        emit Enrolled(holder, members);
    }

    function proposeMember(address member) external {
        address holder = msg.sender;
        if (enrolledAt[holder] == 0) revert NotEnrolled();
        if (member == holder) revert SelfMember();
        Member storage m = circle[holder][member];
        if (m.effectiveAt != 0 && m.removedAt == 0) revert AlreadyMember();
        uint64 at = uint64(block.timestamp) + TIMELOCK;
        circle[holder][member] = Member(at, 0);
        emit MemberProposed(holder, member, at);
    }

    /// @notice Any effective member can veto a pending addition.
    function vetoMember(address holder, address member) external {
        if (!isMember(holder, msg.sender, uint64(block.timestamp))) revert NotMember();
        Member storage m = circle[holder][member];
        if (m.effectiveAt <= block.timestamp || m.removedAt != 0) revert BadState();
        m.removedAt = uint64(block.timestamp);
        emit MemberVetoed(holder, member, msg.sender);
    }

    /// @notice A member removing another member takes effect at once. The
    /// holder's own removals wait for the timelock, so a coached holder cannot
    /// strip the circle during a call.
    function removeMember(address holder, address member) external {
        Member storage m = circle[holder][member];
        if (m.effectiveAt == 0 || m.removedAt != 0) revert BadState();
        uint64 at;
        if (msg.sender == holder) {
            at = uint64(block.timestamp) + TIMELOCK;
        } else if (isMember(holder, msg.sender, uint64(block.timestamp)) && msg.sender != member) {
            at = uint64(block.timestamp);
        } else {
            revert NotMember();
        }
        m.removedAt = at;
        emit MemberRemoved(holder, member, msg.sender, at);
    }

    function isMember(address holder, address who, uint64 t) public view returns (bool) {
        Member memory m = circle[holder][who];
        return m.effectiveAt != 0 && m.effectiveAt <= t && (m.removedAt == 0 || m.removedAt > t);
    }

    // ----------------------------------------------------------------- holds

    function openHold(bytes32 holdId, address holder, bytes32 transferDigest, bytes32 recordHash)
        external
        onlyOperator
    {
        if (enrolledAt[holder] == 0) revert NotEnrolled();
        Hold storage h = holds[holdId];
        if (h.state != State.None) revert HoldExists();
        h.holder = holder;
        h.openedAt = uint64(block.timestamp);
        h.transferDigest = transferDigest;
        _move(holdId, h, State.Held, recordHash);
    }

    /// @notice I1: only a member effective when the hold opened, and still
    /// effective now, can release. The holder is never a member of their own circle.
    function release(bytes32 holdId, bytes32 transferDigest, bytes32 recordHash) external {
        Hold storage h = holds[holdId];
        if (h.state != State.Held) revert BadState();
        _requireCircle(h);
        if (transferDigest != h.transferDigest) revert DigestMismatch();
        _move(holdId, h, State.Released, recordHash);
    }

    function blockHold(bytes32 holdId, bytes32 recordHash) external {
        Hold storage h = holds[holdId];
        if (h.state != State.Held && h.state != State.Review) revert BadState();
        _requireCircle(h);
        _move(holdId, h, State.Blocked, recordHash);
    }

    /// @notice Cancelling moves money in the safe direction, so the holder may
    /// always do it.
    function cancel(bytes32 holdId, bytes32 recordHash) external {
        Hold storage h = holds[holdId];
        if (msg.sender != h.holder) revert NotHolder();
        if (h.state != State.Held && h.state != State.Review) revert BadState();
        _move(holdId, h, State.Cancelled, recordHash);
    }

    /// @notice No member decided in time: the hold goes to human review. It
    /// never releases on its own (I4).
    function escalate(bytes32 holdId, bytes32 recordHash) external onlyOperator {
        Hold storage h = holds[holdId];
        if (h.state != State.Held) revert BadState();
        if (block.timestamp < h.openedAt + responseWindow) revert WindowOpen();
        _move(holdId, h, State.Review, recordHash);
    }

    function reviewDecide(bytes32 holdId, bool approve, bytes32 transferDigest, bytes32 recordHash) external {
        if (msg.sender != reviewer) revert NotReviewer();
        Hold storage h = holds[holdId];
        if (h.state != State.Review) revert BadState();
        if (approve) {
            if (transferDigest != h.transferDigest) revert DigestMismatch();
            _move(holdId, h, State.Released, recordHash);
        } else {
            _move(holdId, h, State.Blocked, recordHash);
        }
    }

    /// @notice Adds a record (interview, debrief, explanation sent) to a live
    /// hold's chain without changing its state.
    function attest(bytes32 holdId, bytes32 recordHash) external onlyOperator {
        Hold storage h = holds[holdId];
        if (h.state != State.Held && h.state != State.Review) revert BadState();
        h.chain = keccak256(abi.encode(h.chain, recordHash));
        emit Decision(holdId, h.state, msg.sender, recordHash, h.chain);
    }

    // -------------------------------------------------------------- internal

    function _requireCircle(Hold storage h) internal view {
        if (
            msg.sender == h.holder || !isMember(h.holder, msg.sender, h.openedAt)
                || !isMember(h.holder, msg.sender, uint64(block.timestamp))
        ) revert NotMember();
    }

    function _move(bytes32 holdId, Hold storage h, State to, bytes32 recordHash) internal {
        h.state = to;
        if (to != State.Held && to != State.Review) h.decidedBy = msg.sender;
        h.chain = keccak256(abi.encode(h.chain, recordHash));
        emit Decision(holdId, to, msg.sender, recordHash, h.chain);
    }
}
