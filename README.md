# <img src="client/public/blurt-icon.svg" alt="logo" style="height: 1em; vertical-align: middle"> blurt

_A minimal audience response tool — just blurt out your answer!_

See it live at [blurt.lol](https://blurt.lol)

## Quick start

1. Go to <https://blurt.lol>
2. Enter a room name of your choice, or leave blank, and click "create".
3. Show QR code (<kbd>q</kbd>) to get participants to join.
4. Mode is initially off (<kbd>0</kbd>), i.e. participants can't respond.
5. Ask a question out loud, then choose a mode to allow responses:
    - <kbd>t</kbd> for text
    - <kbd>n</kbd> for number
    - <kbd>y</kbd> for yes/no/maybe
    - <kbd>m</kbd> or <kbd>2</kbd>—<kbd>5</kbd> for multiple choice
6. Optionally pick a random respondent with <kbd>p</kbd> or by clicking a response.
7. Clear responses (<kbd>c</kbd>) or change mode back to off (<kbd>0</kbd>), then repeat.

See below for more [features](#features) and [keyboard shortcuts](#keyboard-shortcuts).

## About

### Creating rooms

- A room has exactly one **owner**, and zero or more **participants**.
- Room ownership is saved as a random secret in a cookie.
- A room is destroyed if it has no participants or owner.
- Visiting `/` shows two options:
  - Create a room with a specified name (or let the server choose one) and make you the owner.
  - Join a named room as participant (if it exists).
- Visiting `/create` creates a room with a randomly chosen name and makes you the owner.
- Visiting `/create/:room` creates `room` (if it doesn't exist) and makes you the owner.
- Visiting `/:room` checks if `room` exists and joins it:
  - as the owner if you have the room secret.
  - as a participant otherwise.

### Features

- Instantly create rooms with zero setup
- Responses updated live in owner view as participants type, sized according to frequency
- Minimal, projector-friendly UI (dark by default, no borders, content at top)
- Zen mode (hides controls completely)
- QR code for participants to scan
- Show/hide responses
- Pause/resume live updating
- Clear all responses
- Pick a random participant, optionally with a certain response
- Modes
  - free text
  - numeric (responses sorted by value)
  - yes/no/maybe
  - multiple choice (letters A–D)

### Intentionally missing features

- Pre-prepared content
- Users or registrations
- History or statistics
- Childish graphics or annoying animations

### Keyboard shortcuts

#### Controlling owner view

| Key(s)                       | Action                     |
|------------------------------|----------------------------|
| <kbd>q</kbd>                 | Toggle QR code visibility  |
| <kbd>h</kbd>                 | Hide responses             |
| <kbd>s</kbd>                 | Show responses             |
| <kbd>l</kbd>                 | Light theme                |
| <kbd>d</kbd>                 | Dark theme                 |
| <kbd>z</kbd>                 | Toggle Zen mode            |
| <kbd>/</kbd>                 | Toggle response counts     |
| <kbd>space</kbd>             | Pause/resume updates       |
| <kbd>p</kbd>                 | Pick participant           |
| <kbd>u</kbd>                 | Unpick all participants    |

#### Controlling mode and responses

| Key(s)                       | Action                     |
|------------------------------|----------------------------|
| <kbd>c</kbd>                 | Clear all responses        |
| <kbd>0</kbd> or <kbd>o</kbd> | Set mode to "off"          |
| <kbd>t</kbd>                 | Set mode to "text"         |
| <kbd>n</kbd>                 | Set mode to "number"       |
| <kbd>y</kbd>                 | Set mode to "yes/no/maybe" |
| <kbd>2</kbd>                 | Set mode to "multiple choice" with 2 options |
| <kbd>3</kbd>                 | Set mode to "multiple choice" with 3 options |
| <kbd>4</kbd> or <kbd>m</kbd> | Set mode to "multiple choice" with 4 options |
| <kbd>5</kbd>                 | Set mode to "multiple choice" with 5 options |

## Development

### Build & run locally

```sh
npm run build
npm run build:client
npm run start
```

### Build & run with Docker

```sh
docker build . --tag blurt:latest
docker run --rm --publish 3001:3000 blurt:latest
```

### Run in dev mode

```sh
npm run dev
npm run dev:client
```

### Update `main` branch

Fast-forward merge `dev` into `main` and push (from `dev`):

```sh
git fetch . dev:main
git push origin main
```

### Release

1. CHANGELOG: move items from unreleased into new release
2. Update version number in `package.json` (then run `npm i` to update `package-lock.json`)
3. Commit to `dev` with commit message "Release x.y.z"
4. Merge to `main`
5. Trigger deployment

## Contributing

Use blurt as you wish!  
Bug reports, feature requests, and pull requests are welcome.

## Credits

blurt is conceived, built and maintained by [John J. Camilleri](https://www.chalmers.se/en/persons/cajohn/) at Chalmers University of Technology.
