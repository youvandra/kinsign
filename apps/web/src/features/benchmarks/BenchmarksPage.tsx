import { FlaskConical } from 'lucide-react'
import { useState } from 'react'
import { Reveal } from '@/components/motion'
import { ArrowLink, Segmented } from '@/components/ui'
import Container from '@/components/site/Container'
import { useTitle } from '@/lib/hooks'
import BarChart from './components/BarChart'
import Metric from './components/Metric'
import Panel from './components/Panel'
import { byTypology, defenceName, KINSIGN_KEY, POPULATION, SCENARIOS, SOURCE_LABELS, type OperatorSetting, type ScoreSource } from './data'
import { count, millions, pct, yuan } from './format'

const SOURCES: ScoreSource[] = ['rule', 'bankLearned', 'federated']

function ScenarioPanel() {
  const [anvil, fisco] = SCENARIOS
  const totalCases = SCENARIOS.reduce((n, s) => n + s.summary.cases, 0)
  const totalPassed = SCENARIOS.reduce((n, s) => n + s.summary.passed, 0)
  const attempted = SCENARIOS.reduce((n, s) => n + s.summary.scam.valueAttempted, 0)
  const lost = SCENARIOS.reduce((n, s) => n + s.summary.scam.valueLost, 0)
  const refused = SCENARIOS.reduce((n, s) => n + s.summary.scam.refusedOnChain, 0)
  const typologies = byTypology(anvil!.cases)
  return (
    <Panel
      id="scenarios"
      eyebrow="Scenario corpus"
      title="Scripted scam calls, run as real transactions."
      lead="Every case deploys against a fresh contract and plays the call to the end: the victim tries to release, the circle decides, the bank settles. A scam passes only if nothing reached the payee."
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          value={`${totalPassed}/${totalCases}`}
          label="Cases pass, on a local anvil and on a four-node FISCO BCOS chain."
          source="bench/results/scenarios-*.json"
        />
        <Metric value={yuan(lost)} accent label={`Reached a scammer, out of ${yuan(attempted)} attempted.`} source="summary.scam.valueLost" />
        <Metric
          value={count(refused)}
          label="Release attempts from outside the circle, by the coached customer or a newly added accomplice. Each one refused on chain with NotMember."
          source="summary.scam.refusedOnChain"
        />
        <Metric
          value={count(SCENARIOS.reduce((n, s) => n + s.summary.transactions, 0))}
          label="Transactions sent across both chains, refusals included."
          source="summary.transactions"
        />
      </div>
      <Reveal className="mt-4 overflow-hidden rounded-3xl bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-6 py-4">
          <p className="text-[15px] font-medium">Scam cases by typology · {anvil!.label}</p>
          <p className="text-[13px] text-gray-500">
            {fisco!.label}: {fisco!.summary.passed}/{fisco!.summary.cases} pass
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[14px]">
            <thead className="bg-ground2 text-gray-600">
              <tr>
                <th className="px-6 py-3 font-medium">Typology</th>
                <th className="px-6 py-3 font-medium">Cases</th>
                <th className="px-6 py-3 font-medium">Pass</th>
                <th className="px-6 py-3 font-medium">Attempted</th>
                <th className="px-6 py-3 font-medium">Reached payee</th>
              </tr>
            </thead>
            <tbody>
              {typologies.map((r) => (
                <tr key={r.typology} className="border-t border-gray-100">
                  <td className="px-6 py-3 font-medium capitalize">{r.typology}</td>
                  <td className="px-6 py-3 tabular-nums">{r.cases}</td>
                  <td className="px-6 py-3 tabular-nums">
                    {r.passed}/{r.cases}
                  </td>
                  <td className="px-6 py-3 tabular-nums">{yuan(r.attempted)}</td>
                  <td className="px-6 py-3 font-medium tabular-nums text-ok">{yuan(r.lost)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Reveal>
    </Panel>
  )
}

function PopulationPanel({ setting }: { setting: OperatorSetting }) {
  const pop = POPULATION[setting]
  const entries = Object.entries(pop.main)
  const k = pop.main[KINSIGN_KEY]!
  return (
    <Panel
      id="population"
      eyebrow="Population model"
      title="One million customers, one year, in money."
      lead={
        <>
          A money-weighted model where the victim is coached through every prompt. Each defence runs on the same seeded draws. Most parameters are assumptions,
          swept in <code className="rounded bg-white px-1 font-mono text-[13px]">bench/src/population/params.ts</code>.
        </>
      }
    >
      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Reveal className="rounded-3xl bg-white p-6 sm:p-8">
          <p className="text-[15px] font-medium">Loss rate by defence</p>
          <p className="mb-6 mt-1 text-[13px] text-gray-500">Share of attempted scam value that reached scammers. Lower is better.</p>
          <BarChart
            max={1}
            bars={entries.map(([key, m]) => {
              const { code, name } = defenceName(key)
              return { key, label: name, sub: code, value: m.LR, display: pct(m.LR), highlight: key === KINSIGN_KEY }
            })}
          />
        </Reveal>
        <div className="grid gap-4">
          <Metric
            value={millions(k.preventedLoss)}
            accent
            label="Yuan of scam value kept per year, per million customers."
            source={`population-${setting}.json · preventedLoss`}
          />
          <Metric
            value={millions(k.netBenefit)}
            label="Net benefit per year, after the cost of every legitimate payment held."
            source={`population-${setting}.json · netBenefit`}
          />
          <Metric value={pct(k.FHR, 2)} label="Of legitimate transfers held for the circle." source={`population-${setting}.json · FHR`} />
        </div>
      </div>
    </Panel>
  )
}

function FederationPanel({ setting }: { setting: OperatorSetting }) {
  const fed = POPULATION[setting].federated
  const friction = SOURCES.map((s) => fed.matched[s].frictionCost)
  const cut = 1 - fed.matched.federated.frictionCost / fed.matched.bankLearned.frictionCost
  return (
    <Panel
      id="federation"
      eyebrow="Federated score"
      title="Fewer legitimate payments held, at the same protection."
      lead="Bank and operator train hetero SecureBoost with FATE after private set intersection. The comparison holds the loss rate fixed and measures the friction each score causes."
    >
      <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
        <div className="grid gap-4">
          <Metric
            value={`−${pct(cut, 0)}`}
            accent
            label="Friction from the federated score against the bank-only model, at matched loss."
            source={`population-${setting}.json · federated.matched`}
          />
          <Metric
            value={fed.auc.federated.toFixed(3)}
            label={`AUC of the federated model, against ${fed.auc.bankLearned.toFixed(3)} for the bank alone.`}
            source="federated.auc"
          />
        </div>
        <Reveal className="rounded-3xl bg-white p-6 sm:p-8">
          <p className="text-[15px] font-medium">Friction cost at matched loss</p>
          <p className="mb-6 mt-1 text-[13px] text-gray-500">Yuan per year: customers’ time and abandoned payments caused by holds.</p>
          <BarChart
            bars={SOURCES.map((s, i) => ({
              key: s,
              label: SOURCE_LABELS[s],
              value: friction[i]!,
              display: millions(friction[i]!),
              highlight: s === 'federated',
            }))}
          />
        </Reveal>
      </div>
    </Panel>
  )
}

export default function BenchmarksPage() {
  useTitle('Benchmarks · Kinsign')
  const [setting, setSetting] = useState<OperatorSetting>('base')
  return (
    <main className="bg-ground pt-28">
      <Container>
        <header className="max-w-[860px] py-10 sm:py-16">
          <span className="inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-1.5 text-[13px] font-medium shadow-card">
            <FlaskConical size={14} className="text-accent" /> Benchmarks
          </span>
          <h1 className="mt-6 text-balance text-[clamp(2.4rem,6vw,4.6rem)] font-medium leading-[1] tracking-[-0.045em]">
            Measured in transactions and in money.
          </h1>
          <p className="mt-6 max-w-[60ch] text-[17px] leading-[1.65] text-gray-600">
            Every figure on this page is read from a committed file in <code className="rounded bg-white px-1.5 font-mono text-[14px]">bench/results/</code>,
            produced by scripts anyone can rerun.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <ArrowLink text="How to reproduce" to="/docs/guides/benchmarks" variant="dark" />
            <div className="flex items-center gap-3 text-[13px] text-gray-600">
              Operator signals
              <Segmented
                value={setting}
                onChange={setSetting}
                options={[
                  { v: 'base', label: 'Realistic' },
                  { v: 'hard', label: 'Weak' },
                ]}
              />
            </div>
          </div>
        </header>
        <ScenarioPanel />
        <PopulationPanel setting={setting} />
        <FederationPanel setting={setting} />
      </Container>
    </main>
  )
}
