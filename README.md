# Fix It Wand

Fix It Wand is an IOT device and web app that transforms spoken descriptions of maintenance issues into professional work order emails with.

## Overview

The Fix It Wand system consists of:

1. **Physical Wand Device** - A handheld microphone with a button that users press and hold to record their description of an issue
2. **Web Application** - A dashboard for managing and sending generated work orders

## How It Works

1. **Record a Problem** - Press and hold the button on the Fix It Wand while describing the issue that needs to be fixed
2. **AI-Powered Generation** - The system automatically transcribes your audio and generates a professional work order email
3. **Review & Send** - Log into the web dashboard to review, edit, and send the work order to maintenance staff

## Features

- **Voice-to-Email Conversion** - Transform spoken descriptions into well-formatted work order emails
- **Image Support** - Attach images to provide visual context for the reported issue
- **Custom Recipients** - Send work orders to yourself or any email address
- **Work Order Management** - Track the status of your work orders (unsent, pending, completed)
- **Secure Authentication** - Simple and secure login with magic links sent to your email

## Dashboard Features

- **Work Order List** - View all your generated work orders in one place
- **Status Tracking** - Track whether work orders are unsent, pending, or completed
- **Email Customization** - Edit the subject and body of generated emails before sending
- **Multiple Sending Options** - Send to yourself with one click or specify a custom email address

## Getting Started

1. **Create an Account** - Sign up with your email address
2. **Set Up Your Wand** - Follow the instructions to connect your Fix It Wand device
3. **Record Your First Work Order** - Press and hold the button on your wand and describe the issue
4. **Send Your Work Order** - Log into the dashboard to review and send your work order

## For Developers

### Project Structure

- `/backend` - Deno-based API server
- `/frontend` - React web application
- `/pi` - Raspberry Pi code for the physical wand device
- `/shared` - Shared types and utilities

