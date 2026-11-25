import Link from "next/link";
import { CodeBlock } from "@/components/CodeBlock";
import { ContourSim } from "@/components/ContourSim";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";
import { fmt, RESULTS } from "@/lib/heat";

const GRADIENT_PY = `import numpy as np

# Heat source at the origin, robot at (3, 2)
T = lambda x, y: 100*np.exp(-(x**2 + 2*y**2)/10)
grad = lambda x, y: T(x, y)*np.array([-0.2*x, -0.4*y])

p = np.array([3.0, 2.0])
g = grad(*p)
u = -p / np.linalg.norm(p)      # straight to source
print(f"T(3,2) = {T(*p):.2f} C, grad T = {g.round(2)}")
print(f"max rate    = {np.linalg.norm(g):.2f} C/m")
print(f"rate to src = {g @ u:.2f} C/m")

# Follow the gradient (steepest ascent)
path = [p]
while T(*p) < 99:
    g = grad(*p)
    p = p + 0.05 * g / np.linalg.norm(g)
    path.append(p)
L = np.linalg.norm(np.diff(path, axis=0), axis=1).sum()
print(f"path: {L:.2f} m in {len(path)-1} steps")`;

const OUTPUT = `$ python gradient.py
T(3,2) = 18.27 C, grad T = [-10.96 -14.61]
max rate    = 18.27 C/m
rate to src = 17.23 C/m
path: 3.45 m in 69 steps`;

const TEAM = [
  ["Mohanad Hussein Ahmed", "2024020895"],
  ["Ahmed Ashraf", "2023000339"],
  ["Hossam Mohamed Abdel Moaez", "2024019039"],
  ["Hazem Anwar Zakaria", "2024036012"],
  ["Mostafa Ayman Elshahat", "2025015982"],
  ["Ahmed Adel Mohamed Abdullah", "2023000401"],
  ["Mohamed Nabil Mahmoud", "2024034854"],
  ["Mohamed Ezzat Mostafa Mohamed", "2024039102"],
  ["Mohamed Ahmed Mohamed Abdo", "2024031114"],
];

function SectionHeading({ n, title, id }: { n: string; title: string; id: string }) {
  return (
    <div className="mb-6 flex items-baseline gap-4">
      <span className="font-mono text-sm font-medium text-ember" aria-hidden>
        {n}
      </span>
      <h2 id={id} className="font-serif text-3xl text-forest sm:text-4xl">
        {title}
      </h2>
    </div>
  );
}

function Eq({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[12px] bg-card p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1.5 font-mono text-[15px] leading-relaxed text-ink sm:text-base">{children}</p>
    </div>
  );
}

export default function Home() {
  const facts = [
    ["Fastest rate", fmt(RESULTS.maxRate), "°C/m"],
    ["Straight at source", fmt(RESULTS.rateToSource ?? 0), "°C/m"],
    ["Gradient path", fmt(RESULTS.pathLength), "m"],
  ];

  return (
    <>
      <SiteHeader />
      <main id="main" className="flex-1">
        {/* Hero */}
        <section className="topo-lines bg-forest text-white" aria-labelledby="hero-title">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
            <p className="font-mono text-sm uppercase tracking-[0.18em] text-[#f0a774]">
              Gradient · directional derivative
            </p>
            <h1 id="hero-title" className="mt-4 max-w-3xl font-serif text-4xl leading-[1.05] sm:text-6xl">
              Following the Heat to Its Source
            </h1>
            <p className="mt-5 max-w-xl text-lg text-[#d6e3d9]">
              A rescue robot at <span className="font-mono">(3, 2)</span> m climbs the temperature as fast as it can.
            </p>
            <dl className="mt-10 grid max-w-3xl gap-3 sm:grid-cols-3">
              {facts.map(([label, value, unit]) => (
                <div key={label} className="rounded-[12px] border border-white/15 bg-white/[0.07] px-4 py-3">
                  <dt className="text-sm text-[#c4d6ca]">{label}</dt>
                  <dd className="mt-1 font-mono text-2xl font-medium">
                    {value} <span className="text-base text-[#c4d6ca]">{unit}</span>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* 01 Simulation */}
        <section id="simulation" aria-labelledby="sim-title" className="scroll-mt-4">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
            <SectionHeading n="01" title="Run the robot" id="sim-title" />
            <p className="mb-6 max-w-2xl text-muted">
              Contour map of T(x, y) over x ∈ [−1, 4], y ∈ [−1, 3] m. Each band is 10 °C. Press{" "}
              <strong className="text-ink">Run</strong> and the robot steps 0.05 m at a time along ∇T/|∇T| until
              T ≥ 99 °C. The dashed line is the straight route to the source, for comparison.
            </p>
            <ContourSim />
          </div>
        </section>

        {/* 02 Model */}
        <section id="model" aria-labelledby="model-title" className="scroll-mt-4 bg-white/50">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
            <SectionHeading n="02" title="The mathematical model" id="model-title" />
            <div className="grid gap-3 md:grid-cols-2">
              <Eq label="Temperature field (source at the origin)">T(x, y) = 100·e^(−(x² + 2y²)/10) °C</Eq>
              <Eq label="Gradient">∇T = T·(−x/5, −2y/5)</Eq>
              <Eq label="At the robot (3, 2)">
                T = 18.27 °C
                <br />
                ∇T = (−10.96, −14.61)
              </Eq>
              <Eq label="Fastest rate of increase">|∇T| = 18.27 °C/m</Eq>
              <Eq label="Heading straight at the source">
                u = −(3, 2)/√13
                <br />
                D<sub>u</sub>T = ∇T·u = 17.23 °C/m
              </Eq>
              <Eq label="Gradient path (step 0.05 m, stop at T ≥ 99 °C)">3.45 m in 69 steps</Eq>
            </div>
            <div className="mt-6 rounded-[12px] border-2 border-ember bg-[#fbeee5] p-5">
              <p className="text-sm font-semibold uppercase tracking-wide text-ember">Answer</p>
              <p className="mt-1 font-serif text-2xl text-ink sm:text-3xl">
                Move along ∇T: T rises <span className="font-mono text-ember">18.27 °C/m</span>.
              </p>
              <p className="mt-2 text-muted">
                Heading straight at the source gives only 17.23 °C/m, because u is not parallel to ∇T.
              </p>
            </div>
          </div>
        </section>

        {/* 03 Code */}
        <section id="code" aria-labelledby="code-title" className="scroll-mt-4">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
            <SectionHeading n="03" title="The software code" id="code-title" />
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
              <CodeBlock code={GRADIENT_PY} filename="gradient.py" />
              <div className="flex flex-col gap-6">
                <figure className="overflow-hidden rounded-[12px] border border-forest/20 bg-white">
                  <figcaption className="border-b border-forest/10 px-4 py-2.5 text-sm font-semibold text-muted">
                    Output
                  </figcaption>
                  <pre className="overflow-x-auto p-4 font-mono text-[13px] leading-relaxed text-ink sm:text-sm">
                    {OUTPUT}
                  </pre>
                </figure>
                <div className="rounded-[12px] bg-forest p-5 text-white">
                  <p className="text-sm font-semibold uppercase tracking-wide text-[#f0a774]">Conclusion</p>
                  <p className="mt-2 text-lg leading-relaxed">
                    Heading straight at the source is not the steepest way. The gradient path bends because heat
                    drops faster in y than in x.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 04 Team */}
        <section id="team" aria-labelledby="team-title" className="scroll-mt-4 bg-white/50">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
            <SectionHeading n="04" title="Team" id="team-title" />
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {TEAM.map(([name, id]) => (
                <li key={id} className="flex flex-col gap-2 rounded-[12px] bg-card p-4">
                  <span className="font-semibold leading-snug text-ink">{name}</span>
                  <span className="flex items-center justify-between gap-2">
                    <span className="font-mono text-sm text-muted">
                      <span className="sr-only">Student ID </span>
                      {id}
                    </span>
                    <span className="rounded-md bg-forest px-2 py-0.5 font-mono text-xs font-medium text-white">
                      MET
                    </span>
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-8 text-muted">
              Supervised by <strong className="font-semibold text-ink">Assoc. Prof. Dr. Mourad Semary</strong>
            </p>
            <p className="mt-6">
              <Link href="/explore" className="font-semibold text-ember underline underline-offset-4">
                See the temperature as a 3D hill →
              </Link>
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
