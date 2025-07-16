# <img src="client/public/blurt-icon.svg" alt="logo" style="height: 1em; vertical-align: middle"> blurt

_A minimal audience response tool — just blurt out your answer!_

See it live at [blurt.lol](https://blurt.lol)

## About

### Usage

- Visiting `/` will show two options:
  - Create room and make you the owner (server chooses new room name)
  - Join room as participant (server checks if room exists)
- Visiting `/room` will:
  - Create `room` if it doesn't exist and make you the owner
  - Join `room` as a participant if it exists
- Owner client saves room secret as cookie
- A room has exactly one owner, zero or more participants
- A room is destroyed if it has no participants or owner

### Features

- Responses updated live in owner view as participants type, sized according to frequency
- Minimal, projector-friendly UI (dark background, no borders, content at top)
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

### Intentionally missing features

- Pre-prepared content
- Users or registrations
- History or statistics
- Childish graphics or annoying animations

#### Keyboard shortcuts

The following keyboard shortcuts are available for controlling the owner view:

| Key(s)                       | Action                     |
|------------------------------|----------------------------|
| <kbd>q</kbd>                 | Toggle QR code visibility  |
| <kbd>h</kbd> or <kbd>s</kbd> | Hide/show responses        |
| <kbd>z</kbd>                 | Toggle Zen mode            |
| <kbd>/</kbd>                 | Toggle response counts     |
| <kbd>space</kbd>             | Pause/resume updates       |
| <kbd>c</kbd>                 | Clear all responses        |
| <kbd>p</kbd>                 | Pick participant           |
| <kbd>u</kbd>                 | Unpick all participants    |
| <kbd>0</kbd> or <kbd>o</kbd> | Set mode to "off"          |
| <kbd>1</kbd> or <kbd>t</kbd> | Set mode to "text"         |
| <kbd>2</kbd> or <kbd>n</kbd> | Set mode to "number"       |
| <kbd>3</kbd> or <kbd>y</kbd> | Set mode to "yes-no-maybe" |

## Running

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

## Development

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
