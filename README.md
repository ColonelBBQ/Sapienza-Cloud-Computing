# Meditdiary - Cloud Computing Project

## Project Overview
Meditdiary is a web application designed to help users build and maintain a meditation habit. It serves as a diary to log meditation sessions and includes features like a streak reward system and session scoring based on noise levels and user inputs.

Final Grade: 30/30

![image](https://github.com/user-attachments/assets/288da635-3897-4c1a-961e-fcc10a01dd3a)

## Problem Addressed
The application addresses the common challenge of maintaining a consistent meditation habit by providing users with tools to track their progress and receive feedback on their meditation sessions.

## Key Features
Streak Reward System: Users earn streaks for consecutive days of meditation. Missing a day resets the streak to zero.
Session Scoring: Sessions are scored based on ambient noise levels and user inputs, providing a feedback loop to improve meditation quality.

## Data Schema
The data model includes two main entities: Sessions and User, which are linked to track user activities and manage streaks efficiently. Ownership-based authorization rules ensure that users can only access their own data.

## New Session Manager
The New Session feature processes audio data in the browser using the WebAudio API to minimize server-side computation. It records session details, including noise levels, to provide feedback on the meditation environment.

## Scale-in/Scale-out Experiment
Experimental Design
The application’s scalability was tested using AWS Amplify's auto-scaling features. Load testing was performed using JMeter, simulating up to 1,000 concurrent users to observe the system's performance and auto-scaling behavior.

### Experimental Results
The testing revealed that the system effectively handled increased load, though some inefficiencies were noted during the scale-in phase, particularly in CPU usage and latency.

## Access and Usage
Live Website: [Meditdiary](https://main.d2uc62ra8hdgvk.amplifyapp.com/)

Test Credentials:
- User: testuser1@example.com
- Password: CLCProject98!
