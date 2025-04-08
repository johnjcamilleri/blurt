# <img src="client/icon.svg" alt="logo" style="height: 1em; vertical-align: middle"> blurt

An audience response system with minimal barrier to entry — just blurt out your answer.

See it live at [blurt.lol](https://blurt.lol)

## Running

### Build with Docker

```sh
docker build . --tag blurt:latest
```

### Run with Docker

```sh
docker run --rm --publish 3000:3000 blurt:latest
```

## Usage

- Visiting <blurt.lol> will show two options:
  - Create room (server chooses new name)
  - Join room (server checks if name exists before redirecting)
- Visiting <blurt.lol/room> will
  - Create `room` if it doesn't exist and make you the teacher
  - Join `room` as a student if it exists
- Teacher saves room secret as cookie
- A room has exactly one teacher
- A room is destroyed if is has no students or teachers

## Snippets

Fast-forward merge `dev` into `main` and push (from `dev`):

```sh
git fetch . dev:main && \
git push origin main
```

## TODO

- UI messages
- Clear in yes/no mode doesn't work reliably on mobile devices
