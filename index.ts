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

type CorsConfig = {
  /**
   * The Access-Control-Allow-Origin response header indicates whether the response can be shared with requesting code from the given origin.
   * 
   * See: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Allow-Origin
   */
  allowOrigin: string;

  /**
   * The Access-Control-Allow-Headers response header is used in response to a preflight request which includes the Access-Control-Request-Headers to indicate which HTTP headers can be used during the actual request. This header is required if the request has an Access-Control-Request-Headers header.
   * 
   * See: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Allow-Headers
   */
  allowHeaders: string;

  /**
   * The Access-Control-Allow-Methods response header specifies one or more methods allowed when accessing a resource in response to a preflight request.
   * 
   * See: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Allow-Methods
   */
  allowMethods: string;

  /**
   * The Access-Control-Allow-Credentials response header tells browsers whether to expose the response to the frontend JavaScript code when the request's credentials mode (Request.credentials) is include. 
   * 
   * See: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Allow-Credentials
   */
  allowCredentials: boolean;

  /**
   * The Access-Control-Max-Age response header indicates how long the results of a preflight request (that is the information contained in the Access-Control-Allow-Methods and Access-Control-Allow-Headers headers) can be cached.
   * 
   * See: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Max-Age
   */
  maxAge: number;
}

export const withCors = (corsConfig: CorsConfig): GatsbyFunctionMiddleware => {
  return (next) => (req, res) => {
    if (req.method?.toLowerCase() === 'options') {
      res
        .setHeader('Allow', corsConfig.allowMethods)
        .setHeader('Access-Control-Allow-Origin', corsConfig.allowOrigin)
        .setHeader('Access-Control-Allow-Headers', corsConfig.allowHeaders)
        .setHeader('Access-Control-Allow-Methods', corsConfig.allowMethods)
        .status(204)

      if (corsConfig.allowCredentials) {
        res.setHeader('Access-Control-Allow-Credentials', 'true')
      }

      res.setHeader('Access-Control-Max-Age', corsConfig.maxAge ?? 5)
      
      return res.send('')
    }

    return next(req, res)
  }
}