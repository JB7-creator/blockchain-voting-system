const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Voting Contract — Full Test Suite", function () {
  let Voting, voting;
  let admin, voter1, voter2, voter3, unregistered;

  beforeEach(async function () {
    [admin, voter1, voter2, voter3, unregistered] = await ethers.getSigners();
    Voting = await ethers.getContractFactory("Voting");
    voting = await Voting.deploy();
    await voting.waitForDeployment();
  });

  // ── DEPLOYMENT ─────────────────────────────────────────────────────────────
  describe("Deployment", function () {
    it("Sets the deployer as admin", async function () {
      expect(await voting.admin()).to.equal(admin.address);
    });

    it("Starts in setup phase (phase 0)", async function () {
      expect(await voting.getPhase()).to.equal(0n);
    });

    it("Election is not started or ended", async function () {
      expect(await voting.electionStarted()).to.equal(false);
      expect(await voting.electionEnded()).to.equal(false);
    });
  });

  // ── ELECTION INFO ──────────────────────────────────────────────────────────
  describe("Election Info", function () {
    it("Admin can set election info", async function () {
      await voting.setElectionInfo("MNUC Election 2025", "Student council vote");
      const info = await voting.electionInfo();
      expect(info.title).to.equal("MNUC Election 2025");
    });

    it("Non-admin cannot set election info", async function () {
      await expect(
        voting.connect(voter1).setElectionInfo("Fake", "Fake")
      ).to.be.revertedWith("Only admin allowed");
    });
  });

  // ── CANDIDATES ─────────────────────────────────────────────────────────────
  describe("Candidates", function () {
    it("Admin can add a candidate", async function () {
      await voting.addCandidate("Alice Wanjiru", "Progressive Party");
      expect(await voting.candidatesCount()).to.equal(1n);
    });

    it("Candidate data is stored correctly", async function () {
      await voting.addCandidate("Bob Kamau", "Unity Party");
      const [id, name, party, voteCount] = await voting.getCandidate(1);
      expect(name).to.equal("Bob Kamau");
      expect(party).to.equal("Unity Party");
      expect(voteCount).to.equal(0n);
    });

    it("Non-admin cannot add candidates", async function () {
      await expect(
        voting.connect(voter1).addCandidate("Fake", "Fake")
      ).to.be.revertedWith("Only admin allowed");
    });

    it("Candidate with empty name is rejected", async function () {
      await expect(voting.addCandidate("", "Party")).to.be.revertedWith(
        "Candidate name required"
      );
    });

    it("Cannot add candidates after election starts", async function () {
      await voting.addCandidate("Alice", "A");
      await voting.addCandidate("Bob", "B");
      await voting.startElection();
      await expect(voting.addCandidate("Charlie", "C")).to.be.revertedWith(
        "Cannot add candidates after election starts"
      );
    });

    it("getAllCandidates returns all candidates", async function () {
      await voting.addCandidate("Alice", "A");
      await voting.addCandidate("Bob", "B");
      const result = await voting.getAllCandidates();
      expect(result.names.length).to.equal(2);
      expect(result.names[0]).to.equal("Alice");
      expect(result.names[1]).to.equal("Bob");
    });
  });

  // ── VOTER REGISTRATION ─────────────────────────────────────────────────────
  describe("Voter Registration", function () {
    it("Admin can register a voter", async function () {
      await voting.registerVoter(voter1.address);
      expect(await voting.registeredVoters(voter1.address)).to.equal(true);
    });

    it("Cannot register the same voter twice", async function () {
      await voting.registerVoter(voter1.address);
      await expect(voting.registerVoter(voter1.address)).to.be.revertedWith(
        "Voter already registered"
      );
    });

    it("Cannot register zero address", async function () {
      await expect(
        voting.registerVoter(ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid address");
    });

    it("Batch registration works correctly", async function () {
      await voting.registerVotersBatch([
        voter1.address,
        voter2.address,
        voter3.address,
      ]);
      expect(await voting.registeredVoters(voter1.address)).to.equal(true);
      expect(await voting.registeredVoters(voter2.address)).to.equal(true);
      expect(await voting.registeredVoters(voter3.address)).to.equal(true);
    });

    it("Non-admin cannot register voters", async function () {
      await expect(
        voting.connect(voter1).registerVoter(voter2.address)
      ).to.be.revertedWith("Only admin allowed");
    });
  });

  // ── ELECTION LIFECYCLE ─────────────────────────────────────────────────────
  describe("Election Lifecycle", function () {
    beforeEach(async function () {
      await voting.addCandidate("Alice", "A");
      await voting.addCandidate("Bob", "B");
    });

    it("Admin can start election", async function () {
      await voting.startElection();
      expect(await voting.electionStarted()).to.equal(true);
      expect(await voting.getPhase()).to.equal(1n);
    });

    it("Cannot start election with fewer than 2 candidates", async function () {
      const v2 = await Voting.deploy();
      await v2.waitForDeployment();
      await v2.addCandidate("Solo", "A");
      await expect(v2.startElection()).to.be.revertedWith(
        "Need at least 2 candidates"
      );
    });

    it("Cannot start election twice", async function () {
      await voting.startElection();
      await expect(voting.startElection()).to.be.revertedWith(
        "Election already started"
      );
    });

    it("Admin can end election", async function () {
      await voting.startElection();
      await voting.endElection();
      expect(await voting.electionEnded()).to.equal(true);
      expect(await voting.getPhase()).to.equal(2n);
    });

    it("Cannot end election that hasn't started", async function () {
      await expect(voting.endElection()).to.be.revertedWith(
        "Election not started"
      );
    });

    it("Non-admin cannot start or end election", async function () {
      await expect(voting.connect(voter1).startElection()).to.be.revertedWith(
        "Only admin allowed"
      );
    });
  });

  // ── VOTING ─────────────────────────────────────────────────────────────────
  describe("Voting", function () {
    beforeEach(async function () {
      await voting.addCandidate("Alice", "A");
      await voting.addCandidate("Bob", "B");
      await voting.registerVoter(voter1.address);
      await voting.registerVoter(voter2.address);
      await voting.startElection();
    });

    it("Registered voter can vote", async function () {
      await voting.connect(voter1).vote(1);
      const [, , , voteCounts] = await voting.getAllCandidates();
      expect(voteCounts[0]).to.equal(1n);
    });

    it("totalVotes increments correctly", async function () {
      await voting.connect(voter1).vote(1);
      await voting.connect(voter2).vote(2);
      expect(await voting.totalVotes()).to.equal(2n);
    });

    it("Voter cannot vote twice", async function () {
      await voting.connect(voter1).vote(1);
      await expect(voting.connect(voter1).vote(1)).to.be.revertedWith(
        "You have already voted"
      );
    });

    it("Unregistered voter cannot vote", async function () {
      await expect(
        voting.connect(unregistered).vote(1)
      ).to.be.revertedWith("You are not a registered voter");
    });

    it("Invalid candidate ID is rejected", async function () {
      await expect(voting.connect(voter1).vote(99)).to.be.revertedWith(
        "Invalid candidate ID"
      );
    });

    it("Cannot vote after election ends", async function () {
      await voting.endElection();
      await expect(voting.connect(voter1).vote(1)).to.be.revertedWith(
        "Election has ended"
      );
    });

    it("Emits Voted event on successful vote", async function () {
      await expect(voting.connect(voter1).vote(1))
        .to.emit(voting, "Voted")
        .withArgs(voter1.address, 1n, (await ethers.provider.getBlock("latest")).timestamp + 1);
    });
  });

  // ── RESULTS ────────────────────────────────────────────────────────────────
  describe("Results & Winner", function () {
    beforeEach(async function () {
      await voting.addCandidate("Alice", "A");
      await voting.addCandidate("Bob", "B");
      await voting.registerVoter(voter1.address);
      await voting.registerVoter(voter2.address);
      await voting.registerVoter(voter3.address);
      await voting.startElection();
    });

    it("getWinner returns correct winner", async function () {
      await voting.connect(voter1).vote(1);
      await voting.connect(voter2).vote(1);
      await voting.connect(voter3).vote(2);
      const w = await voting.getWinner();
      expect(w.winnerName).to.equal("Alice");
      expect(w.winnerVotes).to.equal(2n);
      expect(w.isTie).to.equal(false);
    });

    it("getWinner detects a tie", async function () {
      await voting.connect(voter1).vote(1);
      await voting.connect(voter2).vote(2);
      const w = await voting.getWinner();
      expect(w.isTie).to.equal(true);
    });

    it("getVoterStatus returns correct info after voting", async function () {
      await voting.connect(voter1).vote(1);
      const status = await voting.getVoterStatus(voter1.address);
      expect(status.isRegistered).to.equal(true);
      expect(status.voted).to.equal(true);
      expect(status.candidateVotedFor).to.equal(1n);
    });
  });
});