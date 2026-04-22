import { Link } from 'react-router-dom'

const featureList = [
  {
    eyebrow: 'Fast lead handling',
    title: 'Keep every prospect organized from first call to close',
    description:
      'Track active leads, callbacks, conversions, dead leads, and DNC records in one compact workspace.',
  },
  {
    eyebrow: 'Built for speed',
    title: 'Move through daily outreach without fighting the software',
    description:
      'Shortcuts, quick actions, and simple list views make the CRM feel fast when call volume is high.',
  },
  {
    eyebrow: 'Clear visibility',
    title: 'See calls, sales, quota, and follow ups at a glance',
    description:
      'The dashboard keeps performance, momentum, and next steps visible without cluttering the interface.',
  },
  {
    eyebrow: 'Practical workflow',
    title: 'Designed for operators who sell through activity',
    description:
      'Use it for prospecting, calling, note taking, follow ups, revenue tracking, and day-to-day execution.',
  },
]

const workflowSteps = [
  {
    step: '01',
    title: 'Bring in leads quickly',
    description:
      'Add businesses manually or import lead lists so you can start working instead of setting up a complicated system.',
  },
  {
    step: '02',
    title: 'Work the list with speed',
    description:
      'Call, log outcomes, move records, and set follow ups from the same focused interface.',
  },
  {
    step: '03',
    title: 'Track what is actually moving',
    description:
      'Watch calls, sales, conversions, and quotas so your daily output stays measurable.',
  },
]

export default function LandingPage() {
  return (
    <div className="landing-page">
      <header className="landing-nav">
        <Link to="/" className="landing-brand">
          <h1>
            <span>HighVolume CRM</span>
          </h1>
          <p>Keyboard-first CRM for high-volume outreach</p>
        </Link>

        <div className="landing-nav__actions">
          <a href="#features" className="landing-link">
            Features
          </a>
          <a href="#workflow" className="landing-link">
            Workflow
          </a>
          <Link to="/tutorial" className="landing-link">
            Tutorial
          </Link>
          <Link to="/app" className="landing-button landing-button--ghost">
            Open CRM
          </Link>
        </div>
      </header>

      <main className="landing-main">
        <section className="landing-hero landing-panel">
          <div className="landing-hero__copy">
            <span className="landing-kicker">All-in-one outreach workspace</span>
            <span className="landing-eyebrow">Built for real daily volume</span>
            <h2>Track leads, follow-ups, and sales activity from one fast CRM.</h2>
            <p>
              HighVolume CRM helps outreach-focused operators organize prospects, log communication,
              manage follow ups, and stay on top of daily performance without bloated setup.
            </p>

            <div className="landing-hero__actions">
              <Link to="/app" className="landing-button landing-button--primary">
                Enter the App
              </Link>
              <Link to="/tutorial" className="landing-button landing-button--secondary">
                Full Tutorial
              </Link>
            </div>
          </div>

          <div className="landing-inline-stats">
            <div className="landing-inline-stat">
              <span>Lead tracking</span>
              <strong>Active, follow-up, converted, dead, and DNC views</strong>
            </div>
            <div className="landing-inline-stat">
              <span>Daily execution</span>
              <strong>Calls, goals, and quick actions kept front and center</strong>
            </div>
            <div className="landing-inline-stat">
              <span>Sales visibility</span>
              <strong>Revenue, quota, and weekly performance in the same dashboard</strong>
            </div>
          </div>
        </section>

        <section id="features" className="landing-section">
          <div className="landing-section__title">
            <span className="landing-eyebrow">Features</span>
            <h3>Everything important stays visible, compact, and easy to act on.</h3>
          </div>

          <div className="landing-feature-grid landing-feature-grid--expanded">
            {featureList.map((feature) => (
              <article key={feature.title} className="landing-card">
                <span className="landing-card__eyebrow">{feature.eyebrow}</span>
                <h4>{feature.title}</h4>
                <p>{feature.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="workflow" className="landing-section">
          <div className="landing-section__title">
            <span className="landing-eyebrow">Workflow</span>
            <h3>A straightforward system for daily outreach work.</h3>
            <p className="landing-muted">
              The CRM is designed to support the actual rhythm of prospecting and follow-up, not slow it down.
            </p>
          </div>

          <div className="landing-workflow landing-workflow--three-up">
            {workflowSteps.map((step) => (
              <div key={step.step} className="landing-workflow__item">
                <span className="landing-workflow__step">{step.step}</span>
                <strong>{step.title}</strong>
                <p>{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="landing-cta">
          <div>
            <span className="landing-eyebrow">Ready to start</span>
            <h3>Open the CRM and start working your leads.</h3>
          </div>
          <div className="landing-hero__actions">
            <Link to="/tutorial" className="landing-button landing-button--secondary">
              Read the Tutorial
            </Link>
            <Link to="/app" className="landing-button landing-button--primary">
              Open HighVolume CRM
            </Link>
          </div>
        </section>
      </main>
    </div>
  )
}
