# Treble Clef Trainer — Music Theory Games app

> A browser-based music theory game built for real classroom use. Students practice reading treble clef notes in a timed, competitive format — with a live leaderboard and in-progress Google Classroom integration.

**Live App → [treble-clef-trainer.lovable.app](https://treble-clef-trainer.lovable.app/)**

---

## Overview

Treble Clef Trainer started as a practical problem from my years as a music teacher: students needed more repetitions reading notes on the staff, but drilling flashcards alone doesn't hold attention. This app gamifies that practice — a 60-second round, a score, and a leaderboard to compete against classmates.

It's also a technical project that reflects where I'm headed. Building it meant making product decisions (what does a student actually need?), integrating OAuth 2.0 authentication, connecting the Google Classroom API, and deploying a full-stack app — skills that translate directly into the automation and AI integration work I now build professionally.

---

## Features

### 🎵 Treble Clef Trainer
- 60-second timed rounds — name as many notes as possible
- Notes span from two ledger lines below the staff to two above
- Live score tracking (correct answers / total attempts)
- Accuracy calculated per session

### 🏆 Leaderboard
- Global leaderboard ranked by correct answers, then accuracy
- Displays each player's personal best
- Requires sign-in to participate

### 🏫 Google Classroom Integration *(In Progress)*
- OAuth 2.0 authentication flow implemented
- Designed to sync enrolled Google Classroom courses
- Class-specific leaderboards so students compete within their own section
- **Status:** OAuth and API connection are set up; Classroom Sync feature is actively being tested and refined

---

## Why This Project Matters (Beyond Music)

This app demonstrates skills I apply directly in automation work:

- **OAuth 2.0 implementation** — the same auth pattern used in enterprise API integrations
- **REST API integration** — connecting to Google Classroom mirrors how I build n8n or Zapier workflows that pull data from third-party platforms
- **User-scoped data logic** — leaderboard filtering by class requires the same thinking as building deduplication or conditional routing in a workflow
- **Translating domain expertise into a working product** — I knew exactly what a music teacher needed because I was one; I built accordingly

---

## Project Status

| Feature | Status |
|---|---|
| Treble Clef game | ✅ Live |
| Global leaderboard | ✅ Live |
| User authentication | ✅ Live |
| Google Classroom OAuth | ⚙️ Implemented, testing in progress |
| Classroom Sync / class leaderboards | 🔄 In development |

---

## Background

Before moving into automation and AI integration, I spent several years as a music teacher. That experience shapes how I approach technical work: I understand the problem from the inside, I can communicate solutions clearly to non-technical stakeholders, and I build things that get adopted because they solve real needs. Clef is a direct product of that background — and a demonstration of what happens when domain expertise meets technical execution.

---

This project was built with [Lovable](https://lovable.dev).
