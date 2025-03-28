# blurt

An audience response system with minimal barrier to entry — just blurt out your answer.

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

- Add linting
- Change visualisation of responses
- Add support for multiple rooms
