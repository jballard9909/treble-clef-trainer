# Melody Masters

Create a web app that allows students to play music theory games, keep track of their high scores, and compare their scores against their classmates. Students should be able to login with their Google accounts and the app should be integrated with Google Classroom so that teachers can create "classes" so students can compare scores with classmates. 

The treble clef note identification game should display a treble clef with a single whole note on one of the lines (as low/high as two ledger lines below/above the treble clef). Players should be able to choose from any of the twelve notes of the chromatic scale (C - B). If the selected answer is wrong, the words "Wrong answer. Try again!" should appear in red text in the middle of the screen. Players have one minute to answer as many questions as possible. At the end of the minute, a pop-up window displays the player's score as "number of correct answers/total number of questions attempted". The player's all-time high score should also be displayed under the current game's score. If the current game's score is the new high score, there should be a special "New high score!" message displayed along with the score pop-up.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://treble-clef-trainer.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/434b5815-93b6-43ef-b89b-c11cbfbf5660).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
