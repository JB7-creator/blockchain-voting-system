// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title DeVote — Blockchain Voting System
/// @author Bildad Technologies / MNUC CS Team
/// @notice Tamper-proof, transparent on-chain election system

contract Voting {

    // ─── STRUCTS ────────────────────────────────────────────────────────────────

    struct Candidate {
        uint id;
        string name;
        string party;
        uint voteCount;
    }

    struct ElectionInfo {
        string title;
        string description;
        uint startTime;
        uint endTime;
    }

    // ─── STATE ───────────────────────────────────────────────────────────────────

    address public admin;
    ElectionInfo public electionInfo;

    bool public electionStarted;
    bool public electionEnded;

    uint public candidatesCount;
    uint public totalVotes;

    mapping(uint => Candidate) public candidates;
    mapping(address => bool) public hasVoted;
    mapping(address => bool) public registeredVoters;
    mapping(address => uint) public voterChoice;

    // ─── EVENTS ──────────────────────────────────────────────────────────────────

    event CandidateAdded(uint indexed candidateId, string name, string party);
    event ElectionStarted(string title, uint timestamp);
    event ElectionEnded(uint timestamp, uint totalVotes);
    event VoterRegistered(address indexed voter);
    event Voted(address indexed voter, uint indexed candidateId, uint timestamp);

    // ─── CONSTRUCTOR ─────────────────────────────────────────────────────────────

    constructor() {
        admin = msg.sender;
    }

    // ─── MODIFIERS ───────────────────────────────────────────────────────────────

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin allowed");
        _;
    }

    modifier electionActive() {
        require(electionStarted, "Election not started");
        require(!electionEnded, "Election has ended");
        _;
    }

    modifier onlyRegistered() {
        require(registeredVoters[msg.sender], "You are not a registered voter");
        _;
    }

    // ─── ADMIN FUNCTIONS ─────────────────────────────────────────────────────────

    /// @notice Set election title and description before starting
    function setElectionInfo(
        string memory _title,
        string memory _description
    ) public onlyAdmin {
        require(!electionStarted, "Cannot change info after election starts");
        electionInfo.title = _title;
        electionInfo.description = _description;
    }

    /// @notice Register a voter address (admin only)
    function registerVoter(address _voter) public onlyAdmin {
        require(_voter != address(0), "Invalid address");
        require(!registeredVoters[_voter], "Voter already registered");
        registeredVoters[_voter] = true;
        emit VoterRegistered(_voter);
    }

    /// @notice Register multiple voters in one transaction (gas efficient)
    function registerVotersBatch(address[] memory _voters) public onlyAdmin {
        for (uint i = 0; i < _voters.length; i++) {
            if (_voters[i] != address(0) && !registeredVoters[_voters[i]]) {
                registeredVoters[_voters[i]] = true;
                emit VoterRegistered(_voters[i]);
            }
        }
    }

    /// @notice Add a candidate (admin only, before election starts)
    function addCandidate(
        string memory _name,
        string memory _party
    ) public onlyAdmin {
        require(!electionStarted, "Cannot add candidates after election starts");
        require(bytes(_name).length > 0, "Candidate name required");

        candidatesCount++;
        candidates[candidatesCount] = Candidate({
            id: candidatesCount,
            name: _name,
            party: _party,
            voteCount: 0
        });

        emit CandidateAdded(candidatesCount, _name, _party);
    }

    /// @notice Start the election (admin only)
    function startElection() public onlyAdmin {
        require(!electionStarted, "Election already started");
        require(candidatesCount >= 2, "Need at least 2 candidates");

        electionStarted = true;
        electionInfo.startTime = block.timestamp;

        emit ElectionStarted(electionInfo.title, block.timestamp);
    }

    /// @notice End the election (admin only)
    function endElection() public onlyAdmin {
        require(electionStarted, "Election not started");
        require(!electionEnded, "Election already ended");

        electionEnded = true;
        electionInfo.endTime = block.timestamp;

        emit ElectionEnded(block.timestamp, totalVotes);
    }

    // ─── VOTER FUNCTIONS ─────────────────────────────────────────────────────────

    /// @notice Cast a vote for a candidate
    function vote(uint _candidateId) public electionActive onlyRegistered {
        require(!hasVoted[msg.sender], "You have already voted");
        require(
            _candidateId > 0 && _candidateId <= candidatesCount,
            "Invalid candidate ID"
        );

        candidates[_candidateId].voteCount++;
        hasVoted[msg.sender] = true;
        voterChoice[msg.sender] = _candidateId;
        totalVotes++;

        emit Voted(msg.sender, _candidateId, block.timestamp);
    }

    // ─── VIEW FUNCTIONS ──────────────────────────────────────────────────────────

    /// @notice Get a single candidate's full info
    function getCandidate(uint _id)
        public
        view
        returns (
            uint id,
            string memory name,
            string memory party,
            uint voteCount
        )
    {
        require(_id > 0 && _id <= candidatesCount, "Invalid candidate ID");
        Candidate memory c = candidates[_id];
        return (c.id, c.name, c.party, c.voteCount);
    }

    /// @notice Get all candidates in one call (for frontend chart)
    function getAllCandidates()
        public
        view
        returns (
            uint[] memory ids,
            string[] memory names,
            string[] memory parties,
            uint[] memory voteCounts
        )
    {
        ids       = new uint[](candidatesCount);
        names     = new string[](candidatesCount);
        parties   = new string[](candidatesCount);
        voteCounts = new uint[](candidatesCount);

        for (uint i = 1; i <= candidatesCount; i++) {
            ids[i - 1]        = candidates[i].id;
            names[i - 1]      = candidates[i].name;
            parties[i - 1]    = candidates[i].party;
            voteCounts[i - 1] = candidates[i].voteCount;
        }
    }

    /// @notice Get the current winner (leading candidate during/after election)
    function getWinner()
        public
        view
        returns (
            uint winnerId,
            string memory winnerName,
            string memory winnerParty,
            uint winnerVotes,
            bool isTie
        )
    {
        require(candidatesCount > 0, "No candidates");

        uint highestVotes = 0;
        uint winnerCount = 0;

        for (uint i = 1; i <= candidatesCount; i++) {
            if (candidates[i].voteCount > highestVotes) {
                highestVotes = candidates[i].voteCount;
                winnerId = i;
                winnerCount = 1;
            } else if (candidates[i].voteCount == highestVotes && highestVotes > 0) {
                winnerCount++;
            }
        }

        isTie = winnerCount > 1;
        winnerName  = candidates[winnerId].name;
        winnerParty = candidates[winnerId].party;
        winnerVotes = highestVotes;
    }

    /// @notice Check voter status
    function getVoterStatus(address _voter)
        public
        view
        returns (
            bool isRegistered,
            bool voted,
            uint candidateVotedFor
        )
    {
        isRegistered     = registeredVoters[_voter];
        voted            = hasVoted[_voter];
        candidateVotedFor = voterChoice[_voter];
    }

    /// @notice Get election phase: 0=setup, 1=active, 2=ended
    function getPhase() public view returns (uint phase) {
        if (!electionStarted) return 0;
        if (electionStarted && !electionEnded) return 1;
        return 2;
    }
}
