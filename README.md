<div align="center">

# Cold Call CRM

**A keyboard-first customer relationship management system built for high-volume cold calling operations**

[![React](https://img.shields.io/badge/React-18.x-61DAFB?logo=react&logoColor=white)](https://reactjs.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

[Features](#features) • [Installation](#installation) • [Usage](#usage) • [Keyboard Shortcuts](#keyboard-shortcuts) • [Documentation](#documentation) • [Contributing](#contributing)

</div>

---

## Overview

Cold Call CRM is a specialized customer relationship management tool designed for sales teams conducting high-volume cold calling campaigns, particularly in the golf course advertising industry. Built with a keyboard-first approach, it enables sales representatives to manage 200+ daily calls while keeping one hand free for the phone.

### Why Cold Call CRM?

- **Speed-Optimized**: Every action accessible via right-hand keyboard shortcuts
- **Zero Learning Curve**: Intuitive numpad-based navigation mirrors phone dialpad
- **Offline-First**: All data stored locally—no internet required during calls
- **Team-Ready**: Export/import functionality for seamless territory handoffs

---

## Features

### Core Functionality

| Feature | Description |
|---------|-------------|
| **One-Touch Tallying** | Press `SPACE` to log calls instantly |
| **Daily Goal Tracking** | Visual progress ring with customizable targets |
| **Lead Management** | Full CRUD operations with priority levels |
| **Follow-up Scheduling** | Automated overdue alerts and reminders |

### Advanced Capabilities

- **Golf Course Tracking**: Manage multiple course assignments with contact details
- **Call History**: Per-lead interaction timeline with editable entries
- **Trash & Recovery**: Soft-delete with full restoration capability
- **Analytics Dashboard**: Daily, weekly, and monthly performance metrics
- **Bulk Operations**: CSV import/export for team collaboration

### Data Management

- **Individual Tab Export**: Share DNC or dead lead lists with team members
- **Full Backup**: JSON export of complete database
- **Import Flexibility**: Accepts CSV or JSON formats

---

## Installation

### Prerequisites

- Node.js 18.0 or higher
- npm 9.0+ or yarn 1.22+
- Modern browser (Chrome, Firefox, Safari, Edge)

### Quick Start

```bash
# Clone the repository
git clone https://github.com/Crespo1301/cold-call-crm.git
cd cold-call-crm

# Install dependencies
npm install

# Start development server
npm run dev
```

### Production Build

```bash
# Create optimized build
npm run build

# Preview production build
npm run preview
```

### Deployment

#### Vercel (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

#### Manual Deployment

1. Run `npm run build`
2. Deploy contents of `dist/` folder to any static hosting service

---

## Usage

### Getting Started

1. **Set Your Daily Goal**: Press `S` to open Settings and configure your target (default: 200 calls)

2. **Add a Golf Course** (Optional): Press `G` to manage courses, then add your assigned course

3. **Import Leads**: Press `I` to import leads from CSV, or press `+` to add manually

4. **Start Calling**: Navigate with arrow keys, press `SPACE` to tally each call

### Workflow Example

```
1. Press 3 → View leads list
2. Use ↑↓ → Navigate to lead
3. Press 5 → View lead details (phone number, notes)
4. Make your call
5. Press SPACE → Tally the call
6. Press → → Mark as dead (if no answer/not interested)
   OR Press ← → Mark as DNC (if requested)
   OR Set follow-up → If callback needed
7. Repeat
```

### Managing Follow-ups

Follow-ups appear automatically on your dashboard when due. Overdue items are highlighted in red.

To set a follow-up:
1. Press `5` or `Enter` on a lead to open details
2. Click a quick-set button (1d, 2d, 3d, 5d, 7d, 14d, 30d)
3. Or manually select a date

### Team Handoffs

When transitioning a territory to another team member:

1. Press `E` to open Export
2. Export relevant lists:
   - **DNC List**: Contacts who requested no calls
   - **Dead Leads**: Exhausted or unqualified leads
   - **Active Leads**: In-progress opportunities
   - **Golf Courses**: Territory information
3. Share CSV files with the new team member
4. They import using `I`

---

## Keyboard Shortcuts

### Navigation (Right-Hand Optimized)

| Key | Action | Key | Action |
|-----|--------|-----|--------|
| `1` | Dashboard | `7` | DNC List |
| `3` | Leads | `9` | Dead Leads |
| `↑` `↓` | Navigate List | `F` | Follow-ups |
| `C` | Call Log | `G` | Golf Courses |
| `T` | Trash | `A` | Analytics |

### Actions

| Key | Action |
|-----|--------|
| `SPACE` or `0` | Tally call (on selected lead or manual) |
| `5` or `Enter` | View/edit details |
| `←` or `4` | Move to DNC |
| `→` or `6` | Move to Dead |
| `Del` or `.` | Delete to Trash |
| `+` | Add new lead |
| `*` | Compose email |
| `-` | View emails |

### Data & System

| Key | Action |
|-----|--------|
| `I` | Import data |
| `E` | Export data |
| `S` | Settings |
| `/` or `?` | Help overlay |
| `Esc` | Close modal/cancel |

---

## Documentation

### Data Storage

All data persists in browser localStorage:

| Key | Contents |
|-----|----------|
| `crm_leads` | Active lead records |
| `crm_dnc` | Do Not Call list |
| `crm_dead` | Dead/exhausted leads |
| `crm_trash` | Recoverable deleted items |
| `crm_call_log` | Call history with timestamps |
| `crm_stats` | Daily call tallies |
| `crm_emails` | Email log |
| `crm_golf_courses` | Course assignments |
| `crm_settings` | User preferences |

### CSV Import Format

The importer accepts CSV files with the following headers (case-insensitive):

```csv
business name,contact,phone,email,address,website,industry,source,notes,priority
Acme Corp,John Smith,555-1234,john@acme.com,123 Main St,acme.com,Retail,Google,Hot lead,hot
```

**Required fields**: `business name` OR `phone` (minimum one)

### Lead Priority Levels

| Priority | Use Case |
|----------|----------|
| 🔥 Hot | High-interest prospects, prioritize callbacks |
| Normal | Standard leads |
| Low | Long-shot or lower-value prospects |

### Call Outcomes

When editing calls, available outcomes include:
- Completed
- Voicemail
- No Answer
- Callback
- Interested
- Not Interested

---

## Browser Support

| Browser | Version |
|---------|---------|
| Chrome | 90+ |
| Firefox | 88+ |
| Safari | 14+ |
| Edge | 90+ |

**Note**: localStorage must be enabled. Private/incognito mode may limit data persistence.

---

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## Privacy & Security

- **100% Client-Side**: No data leaves your browser
- **No Tracking**: Zero analytics or telemetry
- **No Account Required**: Start using immediately
- **Full Data Control**: Export or delete anytime

For complete details, see the in-app Privacy Policy.

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Author

**Carlos Crespo**

- Website: [carloscrespo.info](https://carloscrespo.info)
- GitHub: [@Crespo1301](https://github.com/Crespo1301)

---

## Acknowledgments

- Built with [React](https://reactjs.org/)
- Designed for the golf course advertising industry
- Inspired by real-world high-volume sales operations

---

<div align="center">

**[⬆ Back to Top](#cold-call-crm)**

Made with ☕ by Carlos Crespo

</div>