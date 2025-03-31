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

## Snippets

Fast-forward merge `dev` into `main` and push (from `dev`):

```sh
git fetch . dev:main
git push origin main
```

## TODO

- Clear responses when chagning mode
- Make yes-no-maybe buttons stateful
- Implement code mode
- Change visualisation of responses
- Add support for multiple rooms
