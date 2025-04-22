# <img src="client/public/blurt-icon.svg" alt="logo" style="height: 1em; vertical-align: middle"> blurt

_An audience response system with minimal barrier to entry — just blurt out your answer._

See it live at [blurt.lol](https://blurt.lol)

## Usage

- Visiting `/` will show two options:
  - Create room and make you teacher (server chooses new room name)
  - Join room as student (server checks if room exists)
- Visiting `/room` will:
  - Create `room` if it doesn't exist and make you the teacher
  - Join `room` as a student if it exists
- Teacher client saves room secret as cookie
- A room has exactly one teacher, zero or more students
- A room is destroyed if it has no students or teachers

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

### Deploy

Fast-forward merge `dev` into `main` and push (from `dev`):

```sh
git fetch . dev:main
git push origin main
```

Commits to `main` are deployed via webhook.

### Release

- CHANGELOG: move items from unreleased into new release
- Update version number in `package.json`
- Commit to `dev` with commit message "Release x.y.z"
- Merge to `main`

## Contributing

Use blurt as you wish!  
Bug reports, feature requests, and pull requests are welcome.
