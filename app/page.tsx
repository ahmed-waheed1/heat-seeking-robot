import Link from "next/link";
import { CodeBlock } from "@/components/CodeBlock";
import { RaceCard } from "@/components/RaceCard";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";

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

function Chapter({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  const id = `chapter-${n}`;
  return (
    <section aria-labelledby={id} className="border-t border-line pt-12">
      <p className="font-mono text-sm font-medium text-coral">Chapter {n}</p>
      <h2 id={id} className="mt-2 font-serif text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
        {title}
      </h2>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function Eq({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="py-4">
      <p className="text-[15px] text-muted">{label}</p>
      <p className="mt-1 font-mono text-[17px] leading-relaxed sm:text-lg">{children}</p>
    </div>
  );
}

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="flex-1">
        <div className="mx-auto max-w-[720px] px-4 pt-14 pb-10 sm:px-6 sm:pt-20">
          <p className="font-mono text-sm font-medium uppercase tracking-[0.18em] text-coral">
            Gradient · directional derivative
          </p>
          <h1 className="mt-4 font-serif text-5xl font-bold leading-[1.02] tracking-tight sm:text-7xl">
            Two Robots, One Fire
          </h1>
          <p className="mt-6 text-xl leading-relaxed text-muted">
            Both start at <span className="font-mono text-ink">(3, 2)</span> m and move at the same speed. One heads
            straight at the heat source; the other always follows ∇T. Which one feels the heat rise faster?
          </p>
        </div>

        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <RaceCard />
        </div>

        <div className="mx-auto flex max-w-[720px] flex-col gap-16 px-4 py-20 sm:px-6">
          <Chapter n={1} title="The problem">
            <p>
              A heat source sits at the origin of a room, and the temperature is{" "}
              <span className="font-mono">T(x, y) = 100·e^(−(x² + 2y²)/10) °C</span>. A rescue robot at (3, 2) m
              wants to climb the temperature as fast as possible. Which way should it move, how fast does T rise, and
              what path does it follow?
            </p>
          </Chapter>

          <Chapter n={2} title="The mathematical model">
            <div className="divide-y divide-line border-y border-line">
              <Eq label="Gradient of the temperature">∇T = T·(−x/5, −2y/5)</Eq>
              <Eq label="At the robot (3, 2)">T = 18.27 °C, ∇T = (−10.96, −14.61)</Eq>
              <Eq label="Fastest rise">along ∇T, at rate |∇T| = 18.27 °C/m</Eq>
              <Eq label="Straight at the source">
                u = −(3, 2)/√13 → D<sub>u</sub>T = ∇T · u = 17.23 °C/m
              </Eq>
            </div>
            <p className="mt-8 inline-flex flex-wrap items-center gap-x-2 rounded-full bg-coral px-6 py-3 text-white">
              <span className="font-semibold">Answer:</span>
              <span>
                move along ∇T: T rises <span className="font-mono font-medium">18.27 °C/m</span>
              </span>
            </p>
          </Chapter>

          <Chapter n={3} title="The software code">
            <p className="mb-6">
              The same calculation in Python with NumPy: evaluate T and ∇T at (3, 2), compare the two rates, then
              follow the gradient in 0.05 m steps until T reaches 99 °C.
            </p>
            <CodeBlock code={GRADIENT_PY} filename="gradient.py" />
            <figure className="mt-4 overflow-hidden rounded-2xl border border-line bg-sand">
              <figcaption className="px-5 pt-3 text-sm font-semibold text-muted">Output</figcaption>
              <pre className="overflow-x-auto px-5 pt-2 pb-4 font-mono text-[13px] leading-relaxed sm:text-sm">{OUTPUT}</pre>
            </figure>
            <p className="mt-8 border-l-[3px] border-coral pl-5 font-serif text-2xl font-semibold leading-snug">
              Conclusion: heading straight at the source is not the steepest way. The gradient path bends because heat
              drops faster in y than in x.
            </p>
          </Chapter>

          <Chapter n={4} title="The team">
            <ul className="divide-y divide-line border-y border-line">
              {TEAM.map(([name, id]) => (
                <li key={id} className="flex flex-col py-3 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
                  <span className="font-semibold">{name}</span>
                  <span className="font-mono text-[15px] text-muted">
                    <span className="sr-only">Student ID </span>
                    {id} · MET
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-muted">
              Supervised by <span className="font-semibold text-ink">Assoc. Prof. Dr. Mourad Semary</span>
            </p>
          </Chapter>

          <div>
            <Link
              href="/explore"
              className="inline-block rounded-full bg-ink px-7 py-3.5 font-semibold text-white transition hover:bg-[#33424f]"
            >
              Watch the race in 3D →
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
