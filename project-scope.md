# AI-powered Ticket Management System

## Problem

We receive hundreads of support emails daily. Our agents manually read, classify, and respond to each ticket - which is slow and leads to impersonal, canned responses.

## Solution

Build a ticket management system that uses AI to automatically classify, respond to, and route support tickets - delivering fast, more personalized responses to students while freeing up agents for complex issues.

## Features

A system that recieves help tickets.

- Receive support emails and create tickets
- Auto-generate human friendly responses using a knowledgebase
- Ticket list with filtering and sorting
- Ticket detail view
- AI-powered ticket classification
- AI summaries
- AI-suggested replies
- User management (admin only)
- Dashboard to view and manage all tickets

## Ticket model

**Statuses:** `open`, `resolved`, `closed`

**Categories** (each ticket belongs to exactly one):
- General question
- Technical question
- Refund request

## Users & roles

- The system is deployed with a single **admin** account.
- The admin can create additional **agent** accounts.
- Only admins can manage users.
