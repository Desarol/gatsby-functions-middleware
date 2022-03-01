# Gatsby Functions Middleware

## What does this package do?
This package aims to tackle common requirements for Gatsby Functions like forcing a particular content-type header or HTTP method. It attempts to follow the HTTP spec where applicable.

## Why would I want to use it?
Because you want to get to writing your business logic and worry less about how to implement HTTP 400: Bad Request responses or CORS headers. 

## What are the alternatives?
If you're worried about adding another dependency to your bundle feel free to only copy the middleware that you need into your project where necessary. This package only aims to provide a standard way to handle these common requirements.