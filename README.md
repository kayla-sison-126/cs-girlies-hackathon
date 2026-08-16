**# Goat Together!**

**## CS Girlies Annual Hackathon 2026: Technology for Wellness**

**Track:** Wellness (Intermediate)

**Bonus Track Submission:** Best Use of AI

**Team:** Kayla Sison & Parineet Sond

**## About the Project**

When you want to study for a tough exam, sitting in a quiet library next to a friend makes you stay focused, even if you don't say a word to each other. Their mere presence holds you accountable.

We also looked at how obsessed people are with maintaining Snapchat streaks or TikTok trends and wondered: What if we directed that daily engagement toward building healthy habits with a friend?

Goat Together! is a gamified, dual-accountability mobile app. Instead of just self-reporting or checking a box, you and an accountability partner can set daily wellness goals with each other. To check off a goal, you take a photo proof that your friend has to review and approve. As you keep your streak going, you earn coins to care for and customize your shared virtual pet goat.

**## How We Hit the Judging Criteria**

**### 1. Wellness Impact**

* Social Accountability: Habit tracking often fails because doing it alone gets boring, and it’s easy to become unmotivated. Pairing up with a real friend drastically increases follow-through on physical, mental, and social wellness goals.
* Low-Stress Gamification: Instead of punishing missed days with high-stress mechanics, Goat Together! focuses on positive reinforcement through pet care and reward coins.

**### 2. Creativity & Innovation**

* Photo Proof Verification: Most habit apps rely on self-checking. We built a dual-verification flow where your partner actually reviews your proof photo before a goal is marked complete.
* Shared Pet Progression: Your daily streaks directly feed into the health and cosmetic customization of your shared pet, turning daily self-care into a team effort.

**### 3. Technical Craft & Execution**

* Full-Stack Architecture: Connected a dynamic Expo/React Native app to a Supabase backend to handle real-time database state, user authentication, pet stats, and proof photo uploads.
* Production-Ready Visual Polish: Built custom vector SVG curve components (react-native-svg) and dynamic UI cards so the design runs smoothly across screen sizes without layout shifts.

**### 4. Design & User Experience**

* Welcoming & Cozy Aesthetic: Hand-crafted vector graphics, a soft pastel palette (#D2E7F5, #A1C99B), custom typography (Itim), and warm UI elements designed from scratch to feel inviting rather than clinical.
* Intuitive Navigation: Simple hierarchy separating your daily pet view, pending approvals for your friend, and your own goal list.

**### 5. Community & Accessibility**

* Lowering the Barrier to Habits: Wellness routines can feel daunting. By turning daily habits into low-stakes micro-interactions with a friend, building healthy routines feels natural and social.

**## Tech Stack**

* Frontend: React Native, Expo (Router), TypeScript, react-native-svg
* Backend & Database: Supabase (Auth, Postgres DB, Storage)
* Design & Assets: Figma, Custom Illustration Assets

**## About the Team**

We (Parineet and Kayla) are both involved with Women in Computer Science (WiCS) at UIC, and we actually met through the WiCS Mentorship Program, where Kayla served as Parineet's mentor.

A year later, we teamed up for this hackathon: Kayla led the Frontend, UI/UX, and Graphic Design, while Parineet took charge of Backend Development and Database Management. Goat Together! is a direct product of our mentorship journey.

**## How to Run Locally**

**### Prerequisites**

Node.js (v18 or newer recommended)

Expo Go app on your iOS/Android phone, or an iOS Simulator / Android Emulator

**### Installation & Setup**

1. Clone the repository:

```bash
git clone https://github.com/your-username/goat-together.git
cd goat-together
```

2. Install dependencies:

```bash
npm install
```

3. Install required Expo packages:

```bash
npx expo install react-native-svg
```

4. Start the development server:

```bash
npx expo start
```

5. Run on a device:

Scan the QR code in your terminal using the Expo Go app (Android) or the native Camera app (iOS).

Press i to launch in the iOS Simulator or a to launch the Android Emulator.

Note: Make sure your .env file contains your Supabase URL and anon key if running against a local or development backend instance.

**## AI Usage Report (Best Use of AI Track)**

For this project, we leveraged AI by using it as an educational tool and workflow amplifier. AI helped us greatly to learn unfamiliar technologies and empower us to make a greater product before the deadline.

**### 1. Learning Expo & React Native Syntax**

Tools / Models Used: GitHub Copilot (Free Tier - GPT-4o base), Gemini Free Tier, Figma API + GitHub Copilot.

**Prompting Strategy & Techniques:**

For this project, we adapted Matt Pocock’s AI skills (/teach, /grill-with-docs, and /implement) to quickly understand technologies that are new to us, such as Expo/React Native. This was a game-changer for the hackathon experience: we were able to leverage new, unfamiliar tech in our project without having to spend too much time researching and reading documentation. The /teach tool was especially powerful: we could gamify our learning by having AI format the material in a set of lessons to complete, with quizzes at the end to check our knowledge. Overall it was a great way to develop AND learn, all while bearing the extra pressure of a hackathon deadline.

Example Prompt: "/teach - Explain to me how Expo Router handles dynamic parameters in app/friendship/[id]/index.tsx. Give me a succinct lesson plan that explains how to use this tool in our project."

**### 2. Figma-to-Code Context Bridge**

* Tools / Models Used: GitHub Copilot connected via Figma API.
* Workflow: Kayla connected Figma frame tokens to Copilot so it could assist in translating component layout constraints and color palettes directly into the style sheets in React Native.
* Prompting Strategy: Provided Figma designs and asked AI to kickstart UI development based on the design.
* Key Prompt Example: "Here is a screen in Figma that I designed: <link to screen>. Please modify the styles in my current document to better match the Figma design."

**### 3. Backend Schema & Query Learning**

* Tools / Models Used: Gemini Free Tier, GitHub Copilot
* Workflow: One thing we worked on was letting a friend submit photo proof for a goal, while the person who created the goal could approve or reject it.
* Prompting Strategy: Parineet gave AI our actual tables and RLS policies and asked it to explain what each user should be allowed to do. This helped us figure out why certain actions were being blocked and what we needed to change. We would then test the changes in Supabase ourselves.
* Key Prompt Example: "here are my goals and goal_proofs tables and current RLS policies. i want the person assigned to the goal to be able to submit a photo, but only the person who created the goal should be able to approve/reject it. can you look at my policies and tell me what is blocking this or what i need to change?"

**## Future Features**

* Group goals: let more than two friends work toward the same goal
* Reminders and notifications: remind friends when they have a goal to finish
* Pet levels: have your pet grow or evolve as you make more progress
* Calendar view: see completed and upcoming goals on a calendar
* Shop expansion: more items and ways to customize your pet/world
* AI goal suggestions: help users break bigger goals into smaller ones
* Public/private goals: choose which goals friends can see
* Cross-platform support: eventually make it available on web and other platforms
