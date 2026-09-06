# Testing

## Badge rendering

There are a number of situations we want to test:

1. Single response
    ```
    npm run sim -- --mode text --clients 1
    ```
2. Few responses, uniform
    ```
    npm run sim -- --mode text --clients 3 --responses 10 --skew 1
    ```
3. Few responses, skewed
    ```
    npm run sim -- --mode text --clients 300 --responses 3 --skew 10
    ```
3. Many unique responses
    ```
    npm run sim -- --mode text --clients 200 --responses 300 --skew 1
    ```
4. Many clients, fewer responses, uniform
    ```
    npm run sim -- --mode text --clients 200 --responses 50 --skew 1
    ```
5. Many clients, fewer responses, skewed
    ```
    npm run sim -- --mode text --clients 200 --responses 50 --skew 3
    ```

```
npm run sim -- --mode text --clients 1 ; \
npm run sim -- --mode text --clients 3 --responses 10 --skew 1 ; \
npm run sim -- --mode text --clients 300 --responses 3 --skew 10 ; \
npm run sim -- --mode text --clients 200 --responses 300 --skew 1 ; \
npm run sim -- --mode text --clients 200 --responses 50 --skew 1 ; \
npm run sim -- --mode text --clients 200 --responses 50 --skew 3
```
