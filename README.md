# Gatsby Functions Middleware

## What does this package do?
This package aims to tackle common requirements for Gatsby Functions like forcing a particular content-type header or HTTP method. It attempts to follow the HTTP spec where applicable.

## Why would I want to use it?
Because you want to get to writing your business logic and worry less about how to implement HTTP 400: Bad Request responses or CORS headers. 

## What are the alternatives?
If you're worried about adding another dependency to your bundle feel free to only copy the middleware that you need into your project where necessary. This package only aims to provide a standard way to handle these common requirements.

## Examples

```js
// /src/api/myGatsbyFunction.js

import { combineMiddleware, withCors, withHttpMethods } from 'gatsby-functions-middleware'

const handler = (req, res) => {
  res.status(200).send('Hello, world')
}

export default combineMiddleware(
  withCors({
    allowOrigin: '*',
    allowCredentials: true,
    allowHeaders: 'x-special-header',
    allowMethods: 'GET',
    maxAge: 0,
  }),
  withHttpMethods(['OPTIONS', 'GET']),
)(handler)
```

```js
// /src/api/myGatsbyFunction.js

import { combineMiddleware, withHttpMethods, withContentType } from 'gatsby-functions-middleware'

const handler = (req, res) => {
  res.status(200).send(req.body.foo)
}

export default combineMiddleware(
  withContentType('application/json'),
  withHttpMethods(['POST']),
)(handler)
```