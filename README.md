# CodeForge: Custom Contest & Analytics Platform

## Project Title
**CodeForge: Custom Contest Platform with Codeforces Integration**

_CodeForge_ is a web application that enables competitive programmers to host and participate in custom contests while leveraging data from Codeforces. The platform offers a comprehensive set of features for contest creation, team participation, performance tracking, and personalized problem recommendations.

## Features Implemented
- **User Login & Verification:**  
  Users log in using their Codeforces username. A unique challenge is issued—users must submit a compilation error within 120 seconds to verify ownership.

- **Announcements & Comments:**  
  Post announcements and comments that are displayed on the home page.

- **Friend System & Profile Analytics:**  
  Search for any Codeforces profile, add them to your friend list, and compare past performances. The profile page includes a detailed analytics dashboard showcasing contest history and performance metrics.

- **Custom Contest Creation:**  
  Create custom contests by setting the contest name, start time, and duration. Administrators can add problems manually (via URL) or choose random problems based on a specified rating. A unique contest code is generated for inviting friends.

- **Contest Participation:**  
  Join contests either individually or as a team (up to 3 members per team). If you participate as part of a team, your individual entry is hidden from the leaderboard.

- **ICPC-Style Leaderboard:**  
  View contest standings with an interactive leaderboard that follows ICPC scoring (solved problems and penalty time), complete with a Codeforces-like interface.

- **Problem Recommendations:**  
  Receive personalized problem recommendations based on weak topics identified from your past performance.

## Hosted Links
- **Deployed Website:** [https://code-forge-one.vercel.app/](https://code-forge-one.vercel.app/)  

- **Demo Video:**  
  [![Watch the Demo Video](https://img.youtube.com/vi/ZTGF20PSrrc/maxresdefault.jpg)](https://youtu.be/ZTGF20PSrrc)

## Technologies Used
- **Frontend:** React, React-Bootstrap
- **Backend:** Node.js, Express
- **Database:** MongoDB, Mongoose
- **APIs:** Codeforces API
