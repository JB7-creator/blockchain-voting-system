import { useCallback, useEffect, useMemo, useState } from "react";
import { ethers } from "ethers";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bot,
  CheckCircle2,
  Crown,
  Fingerprint,
  Landmark,
  LockKeyhole,
  MapPinned,
  Network,
  Play,
  Plus,
  RadioTower,
  RefreshCw,
  ShieldCheck,
  Square,
  UserPlus,
  Users,
  Vote,
  Wallet,
} from "lucide-react";
import AppLayout from "./layouts/AppLayout";
import Badge from "./components/ui/Badge";
import Button from "./components/ui/Button";
import Card from "./components/ui/Card";
import Modal from "./components/ui/Modal";
import Toast, { ToastProvider } from "./components/ui/Toast";
import { cn, shortenAddress } from "./lib/utils";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const CONTRACT_ADDRESS =
  process.env.REACT_APP_CONTRACT_ADDRESS || "0xYOUR_CONTRACT_ADDRESS_HERE";

const CONTRACT_ABI = [
  "function admin() view returns (address)",
  "function electionStarted() view returns (bool)",
  "function electionEnded() view returns (bool)",
  "function candidatesCount() view returns (uint256)",
  "function totalVotes() view returns (uint256)",
  "function electionInfo() view returns (string title, string description, uint256 startTime, uint256 endTime)",
  "function hasVoted(address) view returns (bool)",
  "function registeredVoters(address) view returns (bool)",
  "function setElectionInfo(string _title, string _description)",
  "function addCandidate(string _name, string _party)",
  "function registerVoter(address _voter)",
  "function registerVotersBatch(address[] _voters)",
  "function startElection()",
  "function endElection()",
  "function vote(uint256 _candidateId)",
  "function getAllCandidates() view returns (uint256[] ids, string[] names, string[] parties, uint256[] voteCounts)",
  "function getWinner() view returns (uint256 winnerId, string winnerName, string winnerParty, uint256 winnerVotes, bool isTie)",
  "function getVoterStatus(address _voter) view returns (bool isRegistered, bool voted, uint256 candidateVotedFor)",
  "function getPhase() view returns (uint256 phase)",
  "event Voted(address indexed voter, uint256 indexed candidateId, uint256 timestamp)",
  "event ElectionStarted(string title, uint256 timestamp)",
  "event ElectionEnded(uint256 timestamp, uint256 totalVotes)",
  "event VoterRegistered(address indexed voter)",
];

const phaseMeta = {
  0: {
    label: "Election setup",
    tone: "amber",
    description: "Candidate registry and voter verification are being prepared.",
  },
  1: {
    label: "Voting live",
    tone: "green",
    description: "Eligible voters can cast a single on-chain ballot.",
  },
  2: {
    label: "Results sealed",
    tone: "red",
    description: "Voting is closed and the ledger result is finalized.",
  },
};

const inputClass =
  "w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition placeholder:text-devote-faint focus:border-devote-green/60 focus:ring-2 focus:ring-devote-green/20";

const pageMotion = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: 0.35, ease: "easeOut" },
};

function formatNumber(value) {
  return new Intl.NumberFormat("en-KE").format(value);
}

function PageTransition({ children, id }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div key={id} {...pageMotion}>
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

function SectionHeader({ action, eyebrow, subtitle, title }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow ? (
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-devote-green">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl">
          {title}
        </h2>
        {subtitle ? (
          <p className="mt-2 max-w-2xl text-sm leading-6 text-devote-muted sm:text-base">
            {subtitle}
          </p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

function StatCard({ caption, delay, icon: Icon, label, tone = "green", value }) {
  const toneClass = {
    green: "bg-devote-green/10 text-devote-green shadow-glow",
    indigo: "bg-devote-indigo/10 text-indigo-200 shadow-indigoGlow",
    blue: "bg-devote-blue/10 text-devote-blue",
    amber: "bg-devote-amber/10 text-devote-amber",
  }[tone];

  return (
    <Card delay={delay} hover>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-devote-muted">{label}</p>
          <p className="mt-3 text-3xl font-black tracking-tight text-white">{value}</p>
          <p className="mt-2 text-xs leading-5 text-devote-faint">{caption}</p>
        </div>
        <div className={cn("grid h-12 w-12 place-items-center rounded-2xl", toneClass)}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
      </div>
    </Card>
  );
}

function HeroSection({ account, loading, onConnectWallet, phase, totalVotes }) {
  const meta = phaseMeta[phase] || phaseMeta[0];

  return (
    <section className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr] lg:items-stretch">
      <motion.div
        className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-glass backdrop-blur-xl sm:p-8 lg:p-10"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: "easeOut" }}
      >
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-devote-green/20 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-48 w-48 rounded-full bg-devote-indigo/20 blur-3xl" />

        <div className="relative">
          <div className="flex flex-wrap gap-3">
            <Badge variant={meta.tone}>{meta.label}</Badge>
            <Badge variant="indigo">AI audit ready</Badge>
          </div>

          <h1 className="mt-8 max-w-4xl text-4xl font-black leading-[1.04] tracking-tight text-white sm:text-5xl lg:text-6xl">
            Kenya's 2027 vote, secured by an intelligent public ledger.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-devote-muted sm:text-lg">
            DeVote combines Ethereum-grade ballot immutability, wallet-based
            voter verification, and AI-assisted anomaly monitoring for transparent
            national election operations.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button
              icon={account ? ShieldCheck : Wallet}
              isLoading={loading}
              onClick={onConnectWallet}
              size="lg"
            >
              {account ? "Wallet connected" : "Connect secure wallet"}
            </Button>
            <Button variant="secondary" size="lg" icon={RadioTower}>
              View live tally
            </Button>
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            {[
              ["Ledger status", meta.label],
              ["Votes cast", formatNumber(totalVotes)],
              ["Contract", ethers.isAddress(CONTRACT_ADDRESS) ? shortenAddress(CONTRACT_ADDRESS) : "Not configured"],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-2xl border border-white/10 bg-black/20 p-4 backdrop-blur"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-devote-faint">
                  {label}
                </p>
                <p className="mt-2 text-sm font-black text-white">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      <KenyaMapPlaceholder />
    </section>
  );
}

function KenyaMapPlaceholder() {
  const regions = [
    { name: "Nairobi", className: "left-[55%] top-[60%]" },
    { name: "Mombasa", className: "left-[72%] top-[78%]" },
    { name: "Kisumu", className: "left-[29%] top-[56%]" },
    { name: "Eldoret", className: "left-[39%] top-[35%]" },
  ];

  return (
    <Card className="relative min-h-[420px] overflow-hidden p-0" delay={0.12}>
      <div className="absolute inset-0 bg-kenya-scan opacity-80" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:34px_34px]" />
      <div className="relative flex h-full min-h-[420px] flex-col justify-between p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-devote-green">
              Kenya map layer
            </p>
            <h3 className="mt-2 text-2xl font-black text-white">County signal monitor</h3>
            <p className="mt-2 max-w-sm text-sm leading-6 text-devote-muted">
              Placeholder for county-level turnout, incident flags, and result
              verification once the election data pipeline is connected.
            </p>
          </div>
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-devote-indigo/20 text-indigo-200">
            <MapPinned className="h-6 w-6" aria-hidden="true" />
          </div>
        </div>

        <div className="relative mx-auto mt-8 aspect-[0.78] h-64 w-52 sm:h-72 sm:w-56">
          <div className="absolute inset-x-[22%] inset-y-[4%] rounded-[42%_58%_48%_52%/34%_41%_59%_66%] border border-devote-green/40 bg-devote-green/10 shadow-glow" />
          <div className="absolute left-[18%] top-[20%] h-[58%] w-[64%] rotate-[-9deg] rounded-[44%_56%_51%_49%/28%_41%_59%_72%] border border-white/20 bg-white/[0.04]" />
          {regions.map((region) => (
            <div key={region.name} className={cn("absolute", region.className)}>
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-devote-green opacity-60" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-devote-green shadow-glow" />
              </span>
              <span className="mt-2 block -translate-x-1/2 whitespace-nowrap rounded-full border border-white/10 bg-black/40 px-2 py-1 text-[10px] font-bold text-white backdrop-blur">
                {region.name}
              </span>
            </div>
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {["47 counties", "IEBC sync ready", "AI risk scan"].map((item) => (
            <div
              key={item}
              className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-center text-xs font-bold text-devote-muted"
            >
              {item}
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

function DashboardView({ account, candidates, loading, onConnectWallet, phase, totalVotes }) {
  const activeElections = phase === 1 ? 1 : 0;

  return (
    <div className="space-y-8">
      <HeroSection
        account={account}
        loading={loading}
        onConnectWallet={onConnectWallet}
        phase={phase}
        totalVotes={totalVotes}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          caption="Awaiting official national voter-roll sync before production launch."
          delay={0}
          icon={Users}
          label="Total voters"
          tone="green"
          value="Roll pending"
        />
        <StatCard
          caption="Live count from the deployed Voting contract."
          delay={0.08}
          icon={Vote}
          label="Votes cast"
          tone="indigo"
          value={formatNumber(totalVotes)}
        />
        <StatCard
          caption={`${candidates.length} candidates currently loaded from chain state.`}
          delay={0.16}
          icon={Activity}
          label="Active elections"
          tone="blue"
          value={activeElections}
        />
      </div>

      <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <Card hover>
          <div className="flex items-start gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-devote-green/10 text-devote-green">
              <Bot className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white">AI integrity brief</h3>
              <p className="mt-2 text-sm leading-6 text-devote-muted">
                DeVote is prepared for duplicate-vote checks, suspicious turnout
                velocity alerts, and transparent post-election audit trails.
              </p>
            </div>
          </div>
          <div className="mt-6 space-y-3">
            {[
              ["Wallet uniqueness", "One registered wallet can submit one ballot."],
              ["Immutable tally", "Vote totals are read directly from the smart contract."],
              ["Public verification", "Observers can compare UI results against chain state."],
            ].map(([title, body]) => (
              <div
                key={title}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
              >
                <p className="font-bold text-white">{title}</p>
                <p className="mt-1 text-sm text-devote-muted">{body}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <SectionHeader
            eyebrow="Operational readiness"
            title="Election control status"
            subtitle={phaseMeta[phase]?.description}
          />
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {[
              { label: "Smart contract", value: ethers.isAddress(CONTRACT_ADDRESS) ? "Configured" : "Needs address", icon: Network },
              { label: "Wallet gate", value: account ? "Connected" : "Disconnected", icon: Fingerprint },
              { label: "Ballot lock", value: "One vote only", icon: LockKeyhole },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
              >
                <item.icon className="h-5 w-5 text-devote-green" aria-hidden="true" />
                <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-devote-faint">
                  {item.label}
                </p>
                <p className="mt-2 font-black text-white">{item.value}</p>
              </div>
            ))}
          </div>
        </Card>
      </section>
    </div>
  );
}

function VoteView({
  candidates,
  loading,
  onSelectCandidate,
  onVote,
  phase,
  selectedCandidate,
  voterStatus,
}) {
  const canVote = phase === 1 && voterStatus.isRegistered && !voterStatus.voted;
  const votedCandidate = candidates.find(
    (candidate) => candidate.id === voterStatus.candidateVotedFor
  );

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Secure ballot"
        title="Cast your verified vote"
        subtitle="Choose one candidate. DeVote records a single immutable ballot for your registered wallet."
      />

      {phase === 0 ? (
        <Card>
          <EmptyState
            icon={AlertTriangle}
            title="Election setup is still in progress"
            body="The administrator must add candidates, register voters, and open the election before ballots can be cast."
          />
        </Card>
      ) : null}

      {phase === 2 ? (
        <Card>
          <EmptyState
            icon={Square}
            title="Voting is closed"
            body="The election has ended. Open the results page to review the final on-chain tally."
          />
        </Card>
      ) : null}

      {phase === 1 && !voterStatus.isRegistered ? (
        <Card className="border-devote-amber/30 bg-devote-amber/10">
          <div className="flex gap-4">
            <AlertTriangle className="h-6 w-6 shrink-0 text-devote-amber" aria-hidden="true" />
            <div>
              <h3 className="font-black text-white">Wallet not registered</h3>
              <p className="mt-1 text-sm leading-6 text-devote-muted">
                Ask an election administrator to register your wallet address before
                you can submit a ballot.
              </p>
            </div>
          </div>
        </Card>
      ) : null}

      {phase === 1 && voterStatus.voted ? (
        <Card className="border-devote-green/30 bg-devote-green/10">
          <div className="flex gap-4">
            <CheckCircle2 className="h-6 w-6 shrink-0 text-devote-green" aria-hidden="true" />
            <div>
              <h3 className="font-black text-white">Your vote is recorded</h3>
              <p className="mt-1 text-sm leading-6 text-devote-muted">
                Ballot choice: {votedCandidate?.name || "Recorded candidate"}.
                The contract prevents duplicate voting from this wallet.
              </p>
            </div>
          </div>
        </Card>
      ) : null}

      {canVote ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {candidates.map((candidate, index) => (
            <motion.button
              key={candidate.id}
              className={cn(
                "glass-card group rounded-2xl p-5 text-left transition duration-200 hover:border-devote-green/45",
                selectedCandidate === candidate.id && "border-devote-green/70 shadow-glow"
              )}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              onClick={() => onSelectCandidate(candidate.id)}
              type="button"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-devote-green/10 text-xl font-black text-devote-green">
                  {candidate.name.slice(0, 1).toUpperCase()}
                </div>
                {selectedCandidate === candidate.id ? (
                  <Badge variant="green">Selected</Badge>
                ) : null}
              </div>
              <h3 className="mt-6 text-xl font-black text-white">{candidate.name}</h3>
              <p className="mt-2 text-sm text-devote-muted">
                {candidate.party || "Independent candidate"}
              </p>
              <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4 text-sm">
                <span className="text-devote-faint">Candidate ID</span>
                <span className="font-bold text-white">#{candidate.id}</span>
              </div>
            </motion.button>
          ))}
        </div>
      ) : null}

      {canVote ? (
        <div className="flex justify-end">
          <Button
            disabled={!selectedCandidate}
            icon={Vote}
            isLoading={loading}
            onClick={onVote}
            size="lg"
          >
            Submit vote on-chain
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function ResultsView({ candidates, phase, totalVotes, winner }) {
  const sortedCandidates = useMemo(
    () => [...candidates].sort((a, b) => b.voteCount - a.voteCount),
    [candidates]
  );

  const chartData = {
    labels: sortedCandidates.map((candidate) => candidate.name),
    datasets: [
      {
        label: "Votes",
        data: sortedCandidates.map((candidate) => candidate.voteCount),
        backgroundColor: sortedCandidates.map((_, index) =>
          index % 2 === 0 ? "rgba(0,255,136,0.78)" : "rgba(99,102,241,0.78)"
        ),
        borderColor: sortedCandidates.map((_, index) =>
          index % 2 === 0 ? "#00ff88" : "#6366f1"
        ),
        borderWidth: 1,
        borderRadius: 14,
        borderSkipped: false,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#11131b",
        borderColor: "rgba(255,255,255,0.1)",
        borderWidth: 1,
        titleColor: "#ffffff",
        bodyColor: "#9ca3af",
        padding: 12,
      },
    },
    scales: {
      x: {
        ticks: { color: "#9ca3af" },
        grid: { color: "rgba(255,255,255,0.06)" },
      },
      y: {
        beginAtZero: true,
        ticks: { color: "#9ca3af", precision: 0 },
        grid: { color: "rgba(255,255,255,0.06)" },
      },
    },
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Transparent tally"
        title="Live election results"
        subtitle="Every number below is designed to reflect contract state, not a private database."
      />

      {candidates.length === 0 ? (
        <Card>
          <EmptyState
            icon={BarChart3}
            title="No candidates are loaded yet"
            body="Deploy the contract, add candidates, and refresh the app to activate the results dashboard."
          />
        </Card>
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
            <Card className={phase === 2 ? "border-devote-green/30" : ""}>
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-devote-green/10 text-devote-green">
                  <Crown className="h-6 w-6" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-devote-faint">
                    {phase === 2 ? "Final result" : "Current leader"}
                  </p>
                  <h3 className="mt-1 text-2xl font-black text-white">
                    {winner?.isTie ? "Tie detected" : winner?.name || "Awaiting votes"}
                  </h3>
                </div>
              </div>
              {winner && !winner.isTie ? (
                <div className="mt-6 space-y-4">
                  <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <span className="text-sm text-devote-muted">Party</span>
                    <span className="font-bold text-white">
                      {winner.party || "Independent"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <span className="text-sm text-devote-muted">Votes</span>
                    <span className="font-bold text-devote-green">{winner.votes}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <span className="text-sm text-devote-muted">Share</span>
                    <span className="font-bold text-white">
                      {totalVotes > 0
                        ? `${((winner.votes / totalVotes) * 100).toFixed(1)}%`
                        : "0%"}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="mt-6 text-sm leading-6 text-devote-muted">
                  Votes will identify a leading candidate as soon as the first
                  verified ballot is confirmed on-chain.
                </p>
              )}
            </Card>

            <Card>
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-black text-white">Live vote distribution</h3>
                  <p className="mt-1 text-sm text-devote-muted">
                    Total confirmed votes: {formatNumber(totalVotes)}
                  </p>
                </div>
                <Badge variant="green">On-chain</Badge>
              </div>
              <div className="h-[320px]">
                <Bar data={chartData} options={chartOptions} />
              </div>
            </Card>
          </div>

          <Card>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left">
                <thead>
                  <tr className="border-b border-white/10 text-xs font-bold uppercase tracking-[0.16em] text-devote-faint">
                    <th className="px-4 py-4">Candidate</th>
                    <th className="px-4 py-4">Party</th>
                    <th className="px-4 py-4">Votes</th>
                    <th className="px-4 py-4">Share</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedCandidates.map((candidate) => (
                    <tr key={candidate.id} className="border-b border-white/5 last:border-0">
                      <td className="px-4 py-4 font-bold text-white">{candidate.name}</td>
                      <td className="px-4 py-4 text-devote-muted">
                        {candidate.party || "Independent"}
                      </td>
                      <td className="px-4 py-4 font-black text-devote-green">
                        {candidate.voteCount}
                      </td>
                      <td className="px-4 py-4 text-devote-muted">
                        {totalVotes > 0
                          ? `${((candidate.voteCount / totalVotes) * 100).toFixed(1)}%`
                          : "0%"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

function AdminView({
  batchVoters,
  candidates,
  electionDesc,
  electionTitle,
  loading,
  newCandidate,
  onAddCandidate,
  onBatchRegister,
  onEndElection,
  onRegisterVoter,
  onSetBatchVoters,
  onSetElectionDesc,
  onSetElectionTitle,
  onSetNewCandidate,
  onSetVoterToRegister,
  onStartElection,
  onUpdateInfo,
  phase,
  voterToRegister,
}) {
  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Administrator"
        title="Election control panel"
        subtitle="Configure election metadata, candidates, voter registration, and lifecycle controls from the connected admin wallet."
      />

      <div className="grid gap-4 xl:grid-cols-2">
        {phase === 0 ? (
          <Card>
            <h3 className="text-xl font-black text-white">Election information</h3>
            <div className="mt-5 space-y-4">
              <input
                className={inputClass}
                onChange={(event) => onSetElectionTitle(event.target.value)}
                placeholder="Kenya General Election 2027"
                value={electionTitle}
              />
              <textarea
                className={cn(inputClass, "min-h-28 resize-y")}
                onChange={(event) => onSetElectionDesc(event.target.value)}
                placeholder="Describe the election scope, ballot type, and public audit process."
                value={electionDesc}
              />
              <Button
                disabled={loading}
                icon={RefreshCw}
                isLoading={loading}
                onClick={onUpdateInfo}
                variant="secondary"
              >
                Save election info
              </Button>
            </div>
          </Card>
        ) : null}

        {phase === 0 ? (
          <Card>
            <h3 className="text-xl font-black text-white">Add candidate</h3>
            <div className="mt-5 space-y-4">
              <input
                className={inputClass}
                onChange={(event) =>
                  onSetNewCandidate({ ...newCandidate, name: event.target.value })
                }
                placeholder="Candidate full name"
                value={newCandidate.name}
              />
              <input
                className={inputClass}
                onChange={(event) =>
                  onSetNewCandidate({ ...newCandidate, party: event.target.value })
                }
                placeholder="Party or affiliation"
                value={newCandidate.party}
              />
              <Button
                disabled={loading}
                icon={Plus}
                isLoading={loading}
                onClick={onAddCandidate}
                variant="secondary"
              >
                Add candidate
              </Button>
            </div>
          </Card>
        ) : null}

        <Card>
          <h3 className="text-xl font-black text-white">Register voter</h3>
          <div className="mt-5 space-y-4">
            <input
              className={inputClass}
              onChange={(event) => onSetVoterToRegister(event.target.value)}
              placeholder="0x... voter wallet address"
              value={voterToRegister}
            />
            <Button
              disabled={loading}
              icon={UserPlus}
              isLoading={loading}
              onClick={onRegisterVoter}
              variant="secondary"
            >
              Register wallet
            </Button>
          </div>
        </Card>

        <Card>
          <h3 className="text-xl font-black text-white">Batch registration</h3>
          <div className="mt-5 space-y-4">
            <textarea
              className={cn(inputClass, "min-h-32 resize-y")}
              onChange={(event) => onSetBatchVoters(event.target.value)}
              placeholder={"0xAddressOne\n0xAddressTwo\n0xAddressThree"}
              value={batchVoters}
            />
            <Button
              disabled={loading}
              icon={Users}
              isLoading={loading}
              onClick={onBatchRegister}
              variant="secondary"
            >
              Register batch
            </Button>
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-xl font-black text-white">Election lifecycle</h3>
            <p className="mt-2 text-sm leading-6 text-devote-muted">
              Start only after candidates and voter registration have been reviewed.
              Ending the election seals final results.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              disabled={loading || phase !== 0 || candidates.length < 2}
              icon={Play}
              isLoading={loading}
              onClick={onStartElection}
            >
              Start election
            </Button>
            <Button
              disabled={loading || phase !== 1}
              icon={Square}
              isLoading={loading}
              onClick={onEndElection}
              variant="danger"
            >
              End election
            </Button>
          </div>
        </div>
        {phase === 0 && candidates.length < 2 ? (
          <p className="mt-4 text-sm text-devote-amber">
            Add at least two candidates before opening the ballot.
          </p>
        ) : null}
      </Card>

      {candidates.length > 0 ? (
        <Card>
          <h3 className="text-xl font-black text-white">
            Registered candidates ({candidates.length})
          </h3>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {candidates.map((candidate) => (
              <div
                key={candidate.id}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
              >
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-devote-faint">
                  Candidate #{candidate.id}
                </p>
                <p className="mt-2 font-black text-white">{candidate.name}</p>
                <p className="mt-1 text-sm text-devote-muted">
                  {candidate.party || "Independent"}
                </p>
              </div>
            ))}
          </div>
        </Card>
      ) : null}
    </div>
  );
}

function EmptyState({ body, icon: Icon, title }) {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center py-12 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-2xl bg-white/[0.05] text-devote-green">
        <Icon className="h-8 w-8" aria-hidden="true" />
      </div>
      <h3 className="mt-6 text-xl font-black text-white">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-devote-muted">{body}</p>
    </div>
  );
}

function AppContent() {
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [phase, setPhase] = useState(0);
  const [candidates, setCandidates] = useState([]);
  const [electionInfo, setElectionInfo] = useState({ title: "", description: "" });
  const [totalVotes, setTotalVotes] = useState(0);
  const [voterStatus, setVoterStatus] = useState({
    isRegistered: false,
    voted: false,
    candidateVotedFor: 0,
  });
  const [winner, setWinner] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [toast, setToast] = useState({
    open: false,
    title: "",
    description: "",
    type: "info",
  });

  const [newCandidate, setNewCandidate] = useState({ name: "", party: "" });
  const [voterToRegister, setVoterToRegister] = useState("");
  const [batchVoters, setBatchVoters] = useState("");
  const [electionTitle, setElectionTitle] = useState("");
  const [electionDesc, setElectionDesc] = useState("");
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [voteModalOpen, setVoteModalOpen] = useState(false);

  const showToast = useCallback((title, description, type = "info") => {
    setToast({ open: true, title, description, type });
  }, []);

  const loadData = useCallback(async () => {
    if (!contract || !account) return;

    try {
      const [_phase, _totalVotes, info, _voterStatus] = await Promise.all([
        contract.getPhase(),
        contract.totalVotes(),
        contract.electionInfo(),
        contract.getVoterStatus(account),
      ]);

      setPhase(Number(_phase));
      setTotalVotes(Number(_totalVotes));
      setElectionInfo({ title: info.title, description: info.description });
      setElectionTitle((current) => current || info.title);
      setElectionDesc((current) => current || info.description);
      setVoterStatus({
        isRegistered: _voterStatus.isRegistered,
        voted: _voterStatus.voted,
        candidateVotedFor: Number(_voterStatus.candidateVotedFor),
      });

      const count = await contract.candidatesCount();
      if (Number(count) > 0) {
        const result = await contract.getAllCandidates();
        setCandidates(
          result.ids.map((id, index) => ({
            id: Number(id),
            name: result.names[index],
            party: result.parties[index],
            voteCount: Number(result.voteCounts[index]),
          }))
        );
      } else {
        setCandidates([]);
      }

      if (Number(_phase) >= 1 && Number(_totalVotes) > 0) {
        const nextWinner = await contract.getWinner();
        setWinner({
          id: Number(nextWinner.winnerId),
          name: nextWinner.winnerName,
          party: nextWinner.winnerParty,
          votes: Number(nextWinner.winnerVotes),
          isTie: nextWinner.isTie,
        });
      } else {
        setWinner(null);
      }
    } catch (error) {
      console.error("Load error:", error);
      showToast(
        "Unable to read contract",
        error.reason || error.message || "Check network and contract deployment.",
        "error"
      );
    }
  }, [account, contract, showToast]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, [loadData]);

  useEffect(() => {
    if (!window.ethereum) return undefined;
    const handleAccountsChanged = () => {
      setAccount("");
      setContract(null);
      setIsAdmin(false);
      setActiveTab("dashboard");
    };
    window.ethereum.on("accountsChanged", handleAccountsChanged);
    return () => window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
  }, []);

  const connectWallet = async () => {
    if (!ethers.isAddress(CONTRACT_ADDRESS)) {
      showToast(
        "Contract address required",
        "Deploy Voting.sol and set REACT_APP_CONTRACT_ADDRESS before connecting a wallet.",
        "error"
      );
      return;
    }

    if (!window.ethereum) {
      showToast(
        "MetaMask not detected",
        "Install MetaMask or open DeVote in a browser with an Ethereum wallet.",
        "error"
      );
      return;
    }

    try {
      setLoading(true);
      const nextProvider = new ethers.BrowserProvider(window.ethereum);
      await nextProvider.send("eth_requestAccounts", []);
      const nextSigner = await nextProvider.getSigner();
      const nextAccount = await nextSigner.getAddress();
      const nextContract = new ethers.Contract(
        CONTRACT_ADDRESS,
        CONTRACT_ABI,
        nextSigner
      );
      const adminAddress = await nextContract.admin();

      setContract(nextContract);
      setAccount(nextAccount);
      setIsAdmin(nextAccount.toLowerCase() === adminAddress.toLowerCase());
      showToast("Wallet connected", `${shortenAddress(nextAccount)} is linked to DeVote.`, "success");
    } catch (error) {
      console.error(error);
      showToast(
        "Wallet connection failed",
        error.reason || error.message || "Approve the connection request and try again.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const sendTx = async (fn, successMessage) => {
    if (!contract) {
      showToast("Wallet required", "Connect an admin or voter wallet first.", "error");
      return;
    }

    setLoading(true);
    showToast("Transaction submitted", "Confirm the request in your wallet.", "pending");
    try {
      const tx = await fn();
      showToast("Confirming transaction", "Waiting for blockchain confirmation.", "pending");
      await tx.wait();
      showToast("Transaction confirmed", successMessage, "success");
      await loadData();
    } catch (error) {
      console.error(error);
      showToast(
        "Transaction failed",
        error.reason || error.message || "The wallet rejected or reverted the transaction.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSetInfo = () => {
    if (!electionTitle.trim()) {
      showToast("Title required", "Add an election title before saving.", "error");
      return;
    }
    sendTx(
      () => contract.setElectionInfo(electionTitle.trim(), electionDesc.trim()),
      "Election information was updated."
    );
  };

  const handleAddCandidate = () => {
    if (!newCandidate.name.trim()) {
      showToast("Candidate name required", "Add a full candidate name.", "error");
      return;
    }
    sendTx(
      () => contract.addCandidate(newCandidate.name.trim(), newCandidate.party.trim()),
      `${newCandidate.name.trim()} was added to the ballot.`
    ).then(() => setNewCandidate({ name: "", party: "" }));
  };

  const handleRegisterVoter = () => {
    if (!ethers.isAddress(voterToRegister)) {
      showToast("Invalid address", "Enter a valid Ethereum wallet address.", "error");
      return;
    }
    sendTx(
      () => contract.registerVoter(voterToRegister),
      "The voter wallet was registered."
    ).then(() => setVoterToRegister(""));
  };

  const handleBatchRegister = () => {
    const addresses = batchVoters
      .split("\n")
      .map((address) => address.trim())
      .filter(Boolean);
    const invalid = addresses.filter((address) => !ethers.isAddress(address));

    if (addresses.length === 0) {
      showToast("No addresses found", "Paste one voter wallet address per line.", "error");
      return;
    }

    if (invalid.length > 0) {
      showToast("Invalid batch", `Invalid addresses: ${invalid.join(", ")}`, "error");
      return;
    }

    sendTx(
      () => contract.registerVotersBatch(addresses),
      `${addresses.length} voter wallets were registered.`
    ).then(() => setBatchVoters(""));
  };

  const handleStartElection = () =>
    sendTx(() => contract.startElection(), "The election is now open for voting.");

  const handleEndElection = () =>
    sendTx(() => contract.endElection(), "The election has been closed.");

  const handleVoteRequest = () => {
    if (!selectedCandidate) {
      showToast("Select a candidate", "Choose one candidate before submitting.", "error");
      return;
    }
    setVoteModalOpen(true);
  };

  const handleVoteConfirm = () => {
    setVoteModalOpen(false);
    sendTx(() => contract.vote(selectedCandidate), "Your ballot was recorded on-chain.");
  };

  const selectedCandidateData = candidates.find(
    (candidate) => candidate.id === selectedCandidate
  );

  const renderActivePage = () => {
    if (activeTab === "vote") {
      return (
        <VoteView
          candidates={candidates}
          loading={loading}
          onSelectCandidate={setSelectedCandidate}
          onVote={handleVoteRequest}
          phase={phase}
          selectedCandidate={selectedCandidate}
          voterStatus={voterStatus}
        />
      );
    }

    if (activeTab === "results") {
      return (
        <ResultsView
          candidates={candidates}
          phase={phase}
          totalVotes={totalVotes}
          winner={winner}
        />
      );
    }

    if (activeTab === "admin" && isAdmin) {
      return (
        <AdminView
          batchVoters={batchVoters}
          candidates={candidates}
          electionDesc={electionDesc}
          electionTitle={electionTitle}
          loading={loading}
          newCandidate={newCandidate}
          onAddCandidate={handleAddCandidate}
          onBatchRegister={handleBatchRegister}
          onEndElection={handleEndElection}
          onRegisterVoter={handleRegisterVoter}
          onSetElectionDesc={setElectionDesc}
          onSetElectionTitle={setElectionTitle}
          onSetNewCandidate={setNewCandidate}
          onSetBatchVoters={setBatchVoters}
          onSetVoterToRegister={setVoterToRegister}
          onStartElection={handleStartElection}
          onUpdateInfo={handleSetInfo}
          phase={phase}
          voterToRegister={voterToRegister}
        />
      );
    }

    return (
      <DashboardView
        account={account}
        candidates={candidates}
        loading={loading}
        onConnectWallet={connectWallet}
        phase={phase}
        totalVotes={totalVotes}
      />
    );
  };

  return (
    <>
      <AppLayout
        account={account}
        activeTab={activeTab}
        isAdmin={isAdmin}
        loading={loading}
        onConnectWallet={connectWallet}
        onTabChange={setActiveTab}
        phase={phase}
      >
        {electionInfo.title ? (
          <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 text-sm text-devote-muted backdrop-blur-xl">
            <span className="font-bold text-white">{electionInfo.title}</span>
            {electionInfo.description ? ` - ${electionInfo.description}` : null}
          </div>
        ) : null}
        <PageTransition id={activeTab}>{renderActivePage()}</PageTransition>
      </AppLayout>

      <Modal
        description="This action sends a blockchain transaction from your wallet. After confirmation, your ballot cannot be changed."
        onOpenChange={setVoteModalOpen}
        open={voteModalOpen}
        title="Confirm your vote"
      >
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          <p className="text-sm text-devote-muted">Selected candidate</p>
          <p className="mt-2 text-xl font-black text-white">
            {selectedCandidateData?.name || "No candidate selected"}
          </p>
          <p className="mt-1 text-sm text-devote-muted">
            {selectedCandidateData?.party || "Independent candidate"}
          </p>
        </div>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button onClick={() => setVoteModalOpen(false)} variant="secondary">
            Review choice
          </Button>
          <Button icon={Vote} isLoading={loading} onClick={handleVoteConfirm}>
            Confirm ballot
          </Button>
        </div>
      </Modal>

      <Toast
        description={toast.description}
        onOpenChange={(open) => setToast((current) => ({ ...current, open }))}
        open={toast.open}
        title={toast.title}
        type={toast.type}
      />
    </>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}
