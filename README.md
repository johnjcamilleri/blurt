# <img src="client/public/blurt-icon.svg" alt="logo" style="height: 1em; vertical-align: middle"> blurt

_A minimal audience response system — just blurt out your answer!_

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

- Responses are updated live in owner's view as participants type, sized according to frequency
- Minimal, projector-friendly UI (dark background, no borders, content at top)
- QR code for participants to scan
- Show/hide responses
- Pause/resume live updating
- Clear all responses
- Pick a random participant
- Modes
  - free-text (input field)
  - yes/no/maybe

### Intentionally missing features

- Pre-prepared content
- Users or registrations
- History or statistics
- Childish graphics or annoying animations

#### Keyboard shortcuts

The following keyboard shortcuts are available for controlling the owner view:

| Key(s)       | Action                                  |
|--------------|-----------------------------------------|
| `q`          | Toggle QR code visibility               |
| `h` or `s`   | Toggle hide/show responses              |
| `p` or `r`   | Pause or resume updates                 |
| `c`          | Clear all responses                     |
| `k`          | Pick a response                         |
| `l`          | Unpick a response                       |
| `0` or `o`   | Set mode to "off"                       |
| `1` or `t`   | Set mode to "text"                      |
| `2` or `y`   | Set mode to "yes-no-maybe"              |

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
docker run --rm --publish 3000:3000 blurt:latest
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

- CHANGELOG: move items from unreleased into new release
- Update version number in `package.json` (then run `npm i` to update `package-lock.json`)
- Commit to `dev` with commit message "Release x.y.z"
- Merge to `main`
- Trigger deployment

## Contributing

Use blurt as you wish!  
Bug reports, feature requests, and pull requests are welcome.
