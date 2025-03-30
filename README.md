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

## TODO

- Clear responses when chagning mode
- Make yes-no-maybe buttons stateful
- Implement code mode
- Only send changes to teacher, not all messages
- Change visualisation of responses
- Add support for multiple rooms
