import { Link } from 'react-router-dom'

const sections = [
  {
    id: 'overview',
    eyebrow: 'Overview',
    title: 'What HighVolume CRM is built to do',
    body: [
      'HighVolume CRM is a keyboard-first outreach workspace built for finding local businesses, organizing lead data, preparing outreach, and tracking follow-ups and sales.',
      'The app is designed for solo operators and small teams who need a lightweight system for daily lead generation and outreach, especially in local service markets.'
    ],
  },
  {
    id: 'imports',
    eyebrow: 'Lead Intake',
    title: 'How importing works',
    body: [
      'Use the Import modal to bring leads in from Google Places, Facebook-style pasted rows, CSV files, or JSON backups.',
      'Google Places imports are best for local business discovery by market and industry. Facebook intake is best when you find businesses manually and want to paste them in quickly.',
      'CSV and JSON imports are best for older lead lists, scraped lists, or exported datasets from other tools.'
    ],
    bullets: [
      'Google Places import fills business name, phone, address, website, rating, and market metadata',
      'Facebook intake accepts one lead per line or one JSON object per line',
      'CSV import recognizes richer fields like website status, city, region, source, and notes',
      'Recent import jobs show what was added and what was skipped'
    ]
  },
  {
    id: 'enrichment',
    eyebrow: 'Enrichment',
    title: 'What the enrichment feature actually does',
    body: [
      'Enrichment upgrades leads so they are easier to prioritize and work. It normalizes website status, recalculates priority score, fills missing location details when possible, and generates an outreach angle.',
      'This matters because the CRM uses those values to help you decide who is worth calling or emailing first.'
    ],
    bullets: [
      'Website status becomes one of: unknown, none, facebookOnly, outdated, or good',
      'Priority score increases when a business lacks a strong website or has clearer local targeting potential',
      'Outreach angle is generated so you have a fast talking point before you reach out',
      'Bulk enrichment is best for old leads that were imported before the new scoring system existed'
    ]
  },
  {
    id: 'outreach',
    eyebrow: 'Outreach Queue',
    title: 'How the outreach workflow should be used',
    body: [
      'The Outreach tab is your working queue for leads that are worth attention right now. It focuses on leads that are hot or normal priority and have at least one contact path like a phone number, email address, or Facebook page.',
      'Use it after import and enrichment, not before. The idea is to narrow the field to leads that are ready for action.'
    ],
    bullets: [
      'New means the lead has not been worked yet',
      'Audit Ready means you generated an audit and now have a better outreach angle',
      'Contacted means you have emailed or reached out already',
      'Follow Up means the lead needs another touch later',
      'Replied means there is actual engagement and it should be treated differently from cold outreach'
    ]
  },
  {
    id: 'audits',
    eyebrow: 'Audit System',
    title: 'How website audits work',
    body: [
      'Audits in this CRM are deterministic, not AI-dependent. They are based on the website status and current lead context, and they generate a summary plus talking points that you can use in calls and emails.',
      'The purpose is speed. Instead of doing a long manual review before every outreach attempt, you can generate a fast audit and work from the output.'
    ],
    bullets: [
      'Open a lead and click Audit',
      'The CRM stores the audit and adds it to Recent Audits',
      'The audit summary appears in the lead detail modal',
      'The talking points help you explain what feels weak in the current web presence'
    ]
  },
  {
    id: 'email',
    eyebrow: 'Email Composer',
    title: 'How the email workflow should be used',
    body: [
      'The email action now opens a draft composer for the selected lead. It pre-fills the recipient, subject, and body so you can review or edit the message before sending.',
      'It still does not send through Gmail automatically yet. The goal right now is to make outbound email faster while keeping a clean log of who you contacted.'
    ],
    bullets: [
      'Click the email action on a lead with an email address',
      'Edit the recipient, subject, or body if needed',
      'Use Open Mail App to launch your default email client with the draft filled in',
      'Use Log as Sent after you actually send the message so the Emails tab stays accurate',
      'Logging the email moves the lead into the contacted state'
    ]
  },
  {
    id: 'followups',
    eyebrow: 'Follow-ups',
    title: 'How follow-ups should be handled',
    body: [
      'Follow-ups are the consistency layer of the CRM. After a call or email, set a future date so the lead does not disappear into the list.',
      'The dashboard and Follow-ups tab surface due and overdue records so you can stay on top of your active opportunities.'
    ]
  },
  {
    id: 'analytics',
    eyebrow: 'Analytics',
    title: 'What the dashboard and analytics are telling you',
    body: [
      'The dashboard gives you live operating context: calls today, sales today, quota progress, follow-ups due, recent audits, and outreach-ready counts.',
      'The Analytics view is for trend review. It helps you measure whether your activity is turning into conversations, emails, audits, and revenue.'
    ],
    bullets: [
      'Dashboard is for daily execution',
      'Analytics is for reviewing performance over time',
      'Recent audits and email counts help connect outreach prep to real activity',
      'Quota and sales panels keep revenue goals visible while prospecting'
    ]
  },
  {
    id: 'shortcuts',
    eyebrow: 'Shortcuts',
    title: 'When to use keyboard shortcuts',
    body: [
      'The app is still fastest on desktop. If you are doing a real calling block, keyboard shortcuts are the quickest way to move through leads.',
      'If you are on mobile or tablet, the interface still works, but the intended power workflow is desktop-first.'
    ],
    bullets: [
      'Use 1, 3, O, F, C, G, A, and other keys to move between major views',
      'Use SPACE to tally manual calls quickly',
      'Use Enter to open the selected lead',
      'Use left and right actions for quick DNC and Dead moves when appropriate'
    ]
  },
]

export default function TutorialPage() {
  return (
    <div className="landing-page tutorial-page">
      <header className="landing-nav">
        <Link to="/" className="landing-brand">
          <h1>
            <span>HighVolume CRM</span>
          </h1>
          <p>The complete guide to using the CRM well</p>
        </Link>

        <div className="landing-nav__actions">
          <a href="#overview" className="landing-link">Overview</a>
          <a href="#imports" className="landing-link">Imports</a>
          <a href="#outreach" className="landing-link">Outreach</a>
          <Link to="/app" className="landing-button landing-button--ghost">Open CRM</Link>
        </div>
      </header>

      <main className="landing-main">
        <section className="landing-hero landing-panel tutorial-hero">
          <div className="landing-hero__copy">
            <span className="landing-kicker">Ultimate tutorial</span>
            <span className="landing-eyebrow">How to use every major part of the CRM</span>
            <h2>Understand the system before you work the queue.</h2>
            <p>
              This page explains the purpose of every major feature, how the workflow fits together,
              and how to actually use HighVolume CRM for daily lead generation, outreach, and follow-up.
            </p>

            <div className="landing-hero__actions">
              <Link to="/app" className="landing-button landing-button--primary">Open the App</Link>
              <a href="#overview" className="landing-button landing-button--secondary">Start Reading</a>
            </div>
          </div>
        </section>

        <section className="landing-section">
          <div className="landing-feature-grid tutorial-grid">
            {sections.map((section) => (
              <article key={section.id} id={section.id} className="landing-card tutorial-card">
                <span className="landing-card__eyebrow">{section.eyebrow}</span>
                <h3>{section.title}</h3>
                {section.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
                {section.bullets && (
                  <div className="tutorial-points">
                    {section.bullets.map((bullet) => (
                      <div key={bullet} className="tutorial-point">{bullet}</div>
                    ))}
                  </div>
                )}
              </article>
            ))}
          </div>
        </section>

        <section className="landing-cta">
          <div>
            <span className="landing-eyebrow">Next step</span>
            <h3>Open the CRM and use this guide as your reference while you work.</h3>
          </div>
          <Link to="/app" className="landing-button landing-button--primary">
            Open HighVolume CRM
          </Link>
        </section>
      </main>
    </div>
  )
}
