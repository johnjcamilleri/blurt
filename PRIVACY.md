# Privacy Policy

## Cookies

- When creating a room as an owner, a cookie is used to give you exclusive ownership.
  It contains the room name and a random secret, like this:

  ```plain
  Set-Cookie raspberry=jycx2ecka6k; Path=/
  ```

- Cookies are also used to display user interface messages, like this:

  ```plain
  Set-Cookie room=raspberry; Path=/
  Set-Cookie message=Room%20'raspberry'%20created; Path=/
  ```

- When accessing a room as a participant, no cookies are used.

## Server logs

All actions and user input is logged on the server.
Clients are identified by randomly generated web socket IDs, but no personally identifiable information is stored (not even IP address or browser info):

```plain
2025-09-04 07:53:24  [raspberry] create room
2025-09-04 07:53:24  [raspberry] m2Tp7efuokNjgaTsAAAB teacher connect
2025-09-04 07:53:24  [raspberry] m2Tp7efuokNjgaTsAAAB get responses
2025-09-04 07:56:10  [raspberry] n7j9rR117RqVoA8LAAAD student connect
2025-09-04 07:56:10  [raspberry] n7j9rR117RqVoA8LAAAD respond: he
2025-09-04 07:56:11  [raspberry] n7j9rR117RqVoA8LAAAD respond: hel
2025-09-04 07:56:11  [raspberry] n7j9rR117RqVoA8LAAAD respond: hello
```
