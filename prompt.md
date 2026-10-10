# Build My Personal Life Dashboard — "Nizam"

Act as a senior full-stack developer, product designer, UX engineer, and PWA specialist.

Build a complete, working, mobile-first personal productivity web app called **Nizam** (نظام). This is a private life dashboard for one person. Its purpose is to reduce decision fatigue, make daily routines visible, track habits, and help me follow a consistent one-year life plan.

This must be a functional application, not a static mockup or a landing page.

## 1. My Context

I am a university student living in a dormitory. I primarily use an Android phone (Samsung Galaxy A55) and do not currently have a laptop.

My main goals are:

* Build sustainable routines and personal discipline.
* Complete university responsibilities.
* Learn practical AI tools, web development, and website building.
* Develop a real portfolio project and eventually explore income opportunities.
* Obtain my driving license.
* Maintain my gym routine and reading habit.
* Preserve time for relationships, friends, and rest.
* Evaluate major career, university entrance exam, and migration decisions at planned review points rather than constantly overthinking them.

Do not pressure me to optimize every hour. Consistency, usability, and sustainability matter more than productivity for its own sake.

## 2. Technical Requirements

Build the app as an installable Progressive Web App (PWA).

* Use a lightweight, reliable implementation suitable for mobile devices.
* Prefer a simple frontend architecture that can be deployed as a static website.
* Use HTML, CSS, and JavaScript or a lightweight framework if it materially improves the result.
* Include a valid web app manifest, appropriate app icons, and a service worker.
* Use HTTPS-compatible hosting and provide straightforward deployment instructions.
* Cache the application shell and essential assets so the main dashboard can work offline after the first successful load.
* Store daily checklists, task completion history, weekly reviews, settings, and editable routines persistently on the device using appropriate browser storage.
* No mandatory login, paid API, backend, external database, or subscription.
* Do not require a laptop to use the finished application.
* Avoid unnecessary dependencies, heavy animations, and external resources that break the offline experience.

Prefer a local-first architecture. Clearly explain that locally stored information belongs to this browser and device and is not automatically synchronized to other devices.

## 3. Language and Visual Design

The entire interface must be in natural Persian (Farsi).

* Set the document language to Persian and the layout direction to RTL.
* Use the Persian calendar (Jalali) for displaying dates, with correct date handling.
* Use the device's local time and date, with editable schedule settings.
* Use a calm, minimal, modern design inspired by high-quality personal productivity apps.
* Use readable typography, generous spacing, clean cards, subtle borders, and restrained colors.
* Support light mode and dark mode.
* Make every screen genuinely usable on a narrow Android phone.
* Use accessible contrast, large touch targets, and clear visual feedback.
* Avoid excessive gamification, distracting animations, motivational quotes, and clutter.

The app should feel like my personal operating system, not a generic corporate task manager.

## 4. Main Dashboard — "Today"

This is the default screen and the most important part of the app.

When I open the app, I should immediately see:

1. Today's Persian date and day of the week.
2. A short, calm greeting.
3. A clear daily progress indicator.
4. Today's schedule, displayed as a simple timeline.
5. My daily checklist with tappable checkboxes.
6. My three main priorities.
7. My next scheduled activity.
8. A small summary of my weekly progress.

The first screen must show useful information without requiring me to navigate through multiple menus.

Allow me to complete tasks with one tap. Save completion immediately and preserve the state after closing or reopening the app.

Include sensible visual distinctions between completed, pending, and optional tasks. Do not punish me for unfinished tasks.

## 5. My Default Daily Schedule

Use the following schedule as editable defaults, not rigid rules.

### Regular university day

* 07:30 — Wake up and get ready.
* 08:00–14:00 — University and lunch.
* 14:00–15:30 — Rest, recovery, and personal tasks.
* 15:30–16:00 — Read a physical or digital book.
* 16:00–17:00 — AI learning or practical website development.
* 17:00–19:00 — University tasks, driving-license administration, or other essential errands.
* 19:00–21:00 — Dinner, social life, relationship time, or leisure.
* 21:00–22:00 — Flexible time for unfinished essential work or relaxation.
* 22:00–23:30 — Wind-down routine and preparation for tomorrow.
* 23:30 — Target bedtime.

University hours are expected to remain similar until approximately December 2026, but the schedule must be editable.

Do not assume that every day contains university classes. Let me configure university days and mark exceptions.

### Gym days

My current gym days are Sunday, Tuesday, and Thursday.

* 14:00–15:30 — Lunch and recovery.
* 15:30–16:15 — Short learning session or review.
* 16:15–17:30 — Snack, preparation, and travel.
* 18:00–20:00 — Gym, including my usual shower and post-workout routine.
* 20:00–22:00 — Dinner, recovery, and personal time.
* 22:00–23:30 — Wind-down and sleep preparation.

Gym days must automatically use this lighter learning schedule.

The schedule must not force me to complete missed tasks late at night.

### Weekly structure

Use the Iranian week, starting on Saturday.

* Saturday: AI learning and website development.
* Sunday: Short learning session and gym.
* Monday: AI practice and project work.
* Tuesday: Short learning session and gym.
* Wednesday: AI learning, practical project work, and review.
* Thursday: Gym and a lighter evening.
* Friday: Rest, reading, leisure, and a 20-minute weekly review.

Allow every day and activity to be edited.

## 6. Daily Checklist and Smart Reset

Create a dedicated checklist for each calendar day.

Default categories:

* University and essential responsibilities.
* AI learning or practical project work.
* Driving-license progress, when relevant.
* Gym or planned recovery.
* Reading.
* Basic personal care and meals.
* Preparing tomorrow's priorities.

Requirements:

* Every checkbox must work.
* Completion must save instantly.
* Daily tasks should appear automatically on the appropriate new day.
* Never erase historical completion records when a new day starts.
* Archive daily completion states so I can inspect previous days and review my consistency.
* Prevent accidental duplicate entries.
* Allow tasks to be edited, added, deleted, reordered, or temporarily disabled.
* Distinguish recurring routine items from one-time tasks.
* Permit me to skip a task without falsely marking it complete.

Include a reset action only where necessary, with confirmation before destructive changes.

## 7. Three-Priority System

Every day, allow me to identify at most three important priorities.

For example:

* One essential university task.
* One AI learning or project task.
* One personal or administrative task.

Display these priorities prominently on the Today screen.

Make adding, editing, completing, and removing priorities simple.

Do not automatically fill every available hour. The system should protect flexibility and free time.

## 8. Weekly Review

Build a dedicated weekly-review screen.

My default weekly targets are:

* Four focused AI learning sessions.
* Three gym sessions.
* Four reading sessions.
* Two 20-minute driving-license follow-up sessions until I register.
* One weekly review.
* Completion of essential university responsibilities.

These are initial targets, not rigid performance requirements.

The weekly review should show:

* Planned versus completed sessions.
* Daily checklist completion.
* Reading consistency.
* Gym consistency.
* AI learning consistency.
* Progress on the driving license.
* Tasks repeatedly postponed.
* One practical adjustment for the next week.

Include three short reflection questions:

1. What worked well this week?
2. What disrupted my routine?
3. What is the one change I will make next week?

Do not use streaks, guilt-based messages, negative scores, or aggressive reminders. Explain progress neutrally.

Keep historical reviews accessible.

## 9. My One-Year Roadmap

Create a simple roadmap running from October 2026 to October 2027, with editable phases.

### Phase 1: Stabilization — Months 1–3

* Establish a sustainable sleep and wake routine.
* Maintain university attendance and gym sessions.
* Learn AI fundamentals and the basics of web development.
* Register for driving lessons and track the required steps.
* Establish weekly reviews.
* Build consistency rather than chase ambitious outcomes.

### Phase 2: Skill Development — Months 4–6

* Build a small, working website or tool.
* Create a first portfolio project.
* Progress through the driving-license process.
* Review university and employment obligations.

### Phase 3: Practical Experiments — Months 7–9

* Improve the strongest project.
* Explore real customer needs and potential freelance opportunities.
* Evaluate progress using evidence rather than assumptions.

### Phase 4: Evaluation — Months 10–12

* Review skills, completed projects, and any actual income.
* Evaluate career, university entrance exam, and migration options using current facts.
* Decide what to continue, change, or stop.
* Create the next annual plan.

These phases are planning goals, not guarantees. Keep them editable and avoid making unsupported predictions about employment or income.

## 10. Learning and Project Tracker

Create a lightweight section to track AI learning and website development.

Each learning session should support:

* Topic or task.
* Planned duration.
* Actual completion.
* A short note about what I learned.
* The next concrete action.

The learning sequence should begin with:

1. Understanding practical AI tools and their uses.
2. Basic HTML and CSS.
3. Building simple responsive websites.
4. Using GitHub and browser-based development tools from a phone.
5. Building a small functional project.

Include an editable project card for StudyMind, my idea for an AI-powered personalized reading and learning companion.

Do not add dozens of courses or force me to choose between multiple learning paths every day. My immediate goal is to build a sustainable learning habit and complete one useful project.

## 11. Driving-License Tracker

Build a simple checklist and progress tracker with editable stages:

* Research local driving schools.
* Compare prices, schedules, documents, and requirements.
* Select a suitable school.
* Register.
* Attend theory lessons.
* Attend practical lessons.
* Track required examinations.
* Record the final outcome.

Allow me to store appointment dates, costs, notes, and the next action.

Do not invent official requirements or estimate completion dates. Make the tracker adaptable to the regulations and procedures that apply to my actual location.

Before registration, include two weekly 20-minute follow-up sessions. After registration, let me replace these with scheduled lessons.

## 12. Sleep and Recovery

Use 07:30 as the default wake-up target and 23:30 as the target bedtime.

Display a gentle evening wind-down checklist.

Allow settings to change these times.

Prioritize sufficient sleep and recovery. Do not suggest sacrificing sleep to compensate for unfinished tasks.

## 13. Persistence, Privacy, and Backup

This app is intended for personal use.

Implement:

* Persistent local storage.
* Automatic save after every change.
* Historical daily and weekly data.
* Export of all user data to a downloadable JSON backup.
* Import and restoration of a valid backup.
* Clear confirmation before deleting data.
* A visible privacy explanation.

Provide a simple way to back up data regularly.

Do not silently claim that information is stored in the cloud or synchronized across devices.

## 14. Installation and Offline Support

Make the application installable on Android through the browser's supported PWA installation flow.

Include:

* A manifest with an appropriate app name, theme color, and icons.
* A service worker that caches essential files.
* A functioning offline dashboard after initial installation and successful caching.
* Clear connection status if useful.
* A brief, user-friendly installation guide inside the application.

If browser permissions or platform support limit any feature, explain the limitation instead of pretending it works.

Notifications are optional and must never be required for the core functionality.

## 15. Final Deliverables

Build the actual working project.

Deliver:

1. The complete source code.
2. A working Today dashboard.
3. Functional daily and weekly checklists.
4. Persistent storage and historical records.
5. The editable weekly schedule.
6. The one-year roadmap.
7. The driving-license and learning trackers.
8. PWA installation and offline support.
9. A responsive Persian RTL interface.
10. Step-by-step instructions for testing, deploying, installing on Android, and backing up my data.

Test the main interactions, date changes, data persistence, daily resets, and mobile layout.

If you cannot deploy the website directly, provide the complete project and the simplest possible deployment instructions that I can follow using my phone.

Do not stop after generating a mockup. Implement the functionality, verify it as far as your environment permits, and clearly disclose anything that remains incomplete.

The guiding principle is:

**"Reduce unnecessary decisions. Make the next action obvious. Preserve flexibility. Build consistency without turning life into punishment."**


