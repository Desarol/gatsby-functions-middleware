import { GatsbyFunctionRequest, GatsbyFunctionResponse } from 'gatsby'
import flowRight from 'lodash/flowRight'

type GatsbyFunction = (req: GatsbyFunctionRequest, res: GatsbyFunctionResponse) => any;
type GatsbyFunctionMiddleware = (next: GatsbyFunction) => GatsbyFunction;

/**
 * Decorate your functions handler with middleware.
 * 
 * This function takes a list of middleware and
 * returns a functions handler with these middleware
 * applied to it.
 * 
 * In other words it combines all middleware into one.
 */
export const combineMiddleware = (...middleware: GatsbyFunctionMiddleware[]): GatsbyFunctionMiddleware => {
  return flowRight(...middleware)
}

type HttpMethod =
  | 'GET'
  | 'HEAD'
  | 'POST'
  | 'PUT'
  | 'DELETE'
  | 'CONNECT'
  | 'OPTIONS'
  | 'TRACE'
  | 'PATCH'

/**
 * Limits a function so that it can only be called with the specified HTTP methods.
 */
export const withHttpMethods = (methods: HttpMethod[]): GatsbyFunctionMiddleware => {
  return (next) => (req, res) => {
    if (!methods.includes(req.method as HttpMethod)) {
      return res.status(405).send('Method Not Allowed')
    }

    return next(req, res)
  }
}

/**
 * Limits a function so that it can only be called with specific content-types.
 */
export const withContentTypes = (contentTypes: string[]): GatsbyFunctionMiddleware => {
  return (next) => (req, res) => {
    if (!contentTypes.includes(req.headers?.['content-type']?.toLowerCase() ?? '')) {
      return res.status(415).send('Unsupported Media Type')
    }

    return next(req, res)
  }
}

type AuthorizerFunction = (authorizationHeaderValue: string) => Promise<boolean>;

/**
 * Accepts an authorizer function which will
 * attempt to parse the Authorization header value
 * and return an authorization result (true or false).
 * 
 * If parsing fails, the authorizer function may throw
 * an error to indicate that the parsing was unsuccessful.
 */
export const withAuthorization = (authorizer: AuthorizerFunction): GatsbyFunctionMiddleware => {
  return (next) => (req, res) => {
    const header = req.headers?.authorization

    if (!header) {
      return res.status(401).send('Unauthorized')
    }

    try {
      if (!authorizer(header)) {
        return res.status(403).send('Forbidden')
      }
    } catch (err) {
      return res.status(401).send('Unauthorized')
    }
    
    return next(req, res)
  }
}