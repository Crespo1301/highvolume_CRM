import { useEffect } from 'react'
import { Link } from 'react-router-dom'

const featureList = [
  {
    eyebrow: 'Lead Management',
    title: 'Keep Every Prospect In One Place',
    description:
      'Track active leads, callbacks, conversions, dead leads, and DNC records without bouncing between tools.',
  },
  {
    eyebrow: 'Daily Execution',
    title: 'Work Fast When Volume Is High',
    description:
      'Shortcuts, quick actions, and compact list views keep your calling blocks moving.',
  },
  {
    eyebrow: 'Pipeline Visibility',
    title: 'See Calls, Sales, And Follow-Ups Clearly',
    description:
      'The dashboard keeps performance, momentum, and next steps visible without burying what matters.',
  },
  {
    eyebrow: 'Free Tools',
    title: 'Built By Carlos Crespo For Real Outreach Work',
    description:
      'Use the CRM and supporting tools from CarlosCrespo.info to prospect, follow up, and stay organized.',
  },
]

const workflowSteps = [
  {
    step: '01',
    title: 'Import Or Add Leads',
    description:
      'Pull in leads from your lists, Google Places, or manual research and start working right away.',
  },
  {
    step: '02',
    title: 'Call, Email, And Log Activity',
    description:
      'Run outreach from one focused workspace, then update status, notes, and next steps as you go.',
  },
  {
    step: '03',
    title: 'Stay On Top Of Follow-Up',
    description:
      'Keep tabs on follow-ups, conversions, revenue, and daily output so nothing slips through the cracks.',
  },
]

export default function LandingPage() {
  useEffect(() => {
    document.title = 'HighVolume CRM | Free CRM Tools By Carlos Crespo'
  }, [])

  return (
    <div className="landing-page">
      <header className="landing-nav">
        <Link to="/" className="landing-brand">
          <span className="landing-brand__mark">
            <img src="/carloscrespo-mark.svg" alt="Carlos Crespo Brand Mark" />
          </span>
          <div className="landing-brand__copy">
            <h1>
              <span>HighVolume CRM</span>
            </h1>
            <p>Free CRM Tools By Carlos Crespo</p>
          </div>
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
            <span className="landing-kicker">CarlosCrespo.info</span>
            <span className="landing-eyebrow">Free Outreach CRM</span>
            <h2>Simple CRM Tools For Operators Who Need To Move Fast.</h2>
            <p>
              HighVolume CRM is a free tool by Carlos Crespo for managing leads, daily outreach,
              follow-ups, and revenue without bloated setup.
            </p>

            <div className="landing-hero__actions">
              <Link to="/app" className="landing-button landing-button--primary">
                Enter The App
              </Link>
              <Link to="/tutorial" className="landing-button landing-button--secondary">
                Full Tutorial
              </Link>
            </div>
          </div>

          <div className="landing-hero__meta">
            <div className="landing-hero__meta-copy">
              <span className="landing-eyebrow">Built To Support The Full Workflow</span>
              <p>
                This CRM is part of the free toolset Carlos Crespo shares through
                {' '}
                <a href="https://carloscrespo.info" target="_blank" rel="noopener noreferrer">
                  CarlosCrespo.info
                </a>
                {' '}
                for lead generation, outreach, and follow-up execution.
              </p>
            </div>
          </div>

          <div className="landing-inline-stats">
            <div className="landing-inline-stat">
              <span>Lead Tracking</span>
              <strong>Active, Follow-Up, Converted, Dead, And DNC Views</strong>
            </div>
            <div className="landing-inline-stat">
              <span>Daily Execution</span>
              <strong>Calls, Goals, And Quick Actions Kept Front And Center</strong>
            </div>
            <div className="landing-inline-stat">
              <span>Sales Visibility</span>
              <strong>Revenue, Quota, And Weekly Performance In The Same Dashboard</strong>
            </div>
          </div>
        </section>

        <section id="features" className="landing-section">
          <div className="landing-section__title">
            <span className="landing-eyebrow">Features</span>
            <h3>Everything You Need To Find, Work, And Track Leads.</h3>
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
            <h3>Run Your Outreach In Three Clear Steps.</h3>
            <p className="landing-muted">
              The workflow is built to help you get from imported lead to real follow-up without extra friction.
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
            <span className="landing-eyebrow">Start Free</span>
            <h3>Use The CRM, Learn The Workflow, And Make It Yours.</h3>
          </div>
          <div className="landing-hero__actions">
            <Link to="/tutorial" className="landing-button landing-button--secondary">
              Read The Tutorial
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
