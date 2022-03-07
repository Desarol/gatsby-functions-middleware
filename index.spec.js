import { jest } from '@jest/globals'
import { combineMiddleware, withHttpMethods, withContentTypes, withAuthorization, withCors } from './index'

const createRequest = (method, headers) => {
  return {
    method,
    headers
  }
}

const createResponse = () => {
  return {
    status: jest.fn(function () { return this }),
    send: jest.fn(function () { return this }),
    json: jest.fn(function () { return this }),
    setHeader: jest.fn(function () { return this }),
  }
}

describe('combineMiddleware', () => {

  it('should apply middleware', () => {
    const middleware = [(next) => (req, res) => {
      req['name'] = 'world'

      return next(req, res)
    }]
    const handler = jest.fn((req, res) => {
      res.status(200).send(`Hello, ${req.name}!`)
    })

    const req = createRequest()
    const res = createResponse()
    combineMiddleware(...middleware)(handler)(req, res)

    expect(handler).toBeCalled()
    expect(res.status).toBeCalledWith(200)
    expect(res.send).toBeCalledWith('Hello, world!')
  })

})

describe('withHttpMethods', () => {

  it('should prevent requests with unallowed methods', () => {
    const middleware = [withHttpMethods(['GET'])]
    const handler = jest.fn()

    const req = createRequest('POST')
    const res = createResponse()
    combineMiddleware(...middleware)(handler)(req, res)

    expect(handler).not.toBeCalled()
    expect(res.status).toBeCalledWith(405)
    expect(res.send).toBeCalledWith('Method Not Allowed')
  })

  it('should allow requests with accepted methods', () => {
    const middleware = [withHttpMethods(['GET'])]
    const handler = jest.fn()

    const req = createRequest('GET')
    const res = createResponse()
    combineMiddleware(...middleware)(handler)(req, res)

    expect(handler).toBeCalled()
  })
  
})

describe('withContentTypes', () => {

  it('should prevent unsupported media types', () => {
    const middleware = [withContentTypes(['application/json'])]
    const handler = jest.fn()

    const req = createRequest('POST', { 'content-type': 'application/xml' })
    const res = createResponse()
    combineMiddleware(...middleware)(handler)(req, res)

    expect(handler).not.toBeCalled()
    expect(res.status).toBeCalledWith(415)
    expect(res.send).toBeCalledWith('Unsupported Media Type')
  })

  it('should allow supported media types', () => {
    const middleware = [withContentTypes(['application/json'])]
    const handler = jest.fn()

    const req = createRequest('POST', { 'content-type': 'application/json' })
    const res = createResponse()
    combineMiddleware(...middleware)(handler)(req, res)

    expect(handler).toBeCalled()
  })
  
})


describe('withAuthorization', () => {

  it('should prevent unauthorized requests', () => {
    const middleware = [withAuthorization((_) => false)]
    const handler = jest.fn()

    const req = createRequest()
    const res = createResponse()
    combineMiddleware(...middleware)(handler)(req, res)

    expect(handler).not.toBeCalled()
    expect(res.status).toBeCalledWith(401)
    expect(res.send).toBeCalledWith('Unauthorized')
  })

  it('should prevent requests which fail authorization parsing', () => {
    const middleware = [withAuthorization((_) => {
      throw new Error('Cannot parse header')
    })]
    const handler = jest.fn()

    const req = createRequest('GET', { authorization: 'Bearer invalid' })
    const res = createResponse()
    combineMiddleware(...middleware)(handler)(req, res)

    expect(handler).not.toBeCalled()
    expect(res.status).toBeCalledWith(401)
    expect(res.send).toBeCalledWith('Unauthorized')
  })
  
  it('should allow authorized requests', () => {
    const middleware = [withAuthorization((_) => true)]
    const handler = jest.fn()

    const req = createRequest('GET', { authorization: 'Bearer valid' })
    const res = createResponse()
    combineMiddleware(...middleware)(handler)(req, res)

    expect(handler).toBeCalled()
  })
  
})

describe('withCors', () => {

  it('should respond to OPTIONS requests', () => {
    const middleware = [withCors({
      allowOrigin: '*',
      allowCredentials: true,
      allowHeaders: 'x-special-header',
      allowMethods: 'GET',
      maxAge: 0,
    })]
    const handler = jest.fn()

    const req = createRequest('OPTIONS')
    const res = createResponse()
    combineMiddleware(...middleware)(handler)(req, res)

    expect(res.status).toBeCalledWith(204)
    expect(res.setHeader.mock.calls).toEqual(
      expect.arrayContaining([
        ['Access-Control-Allow-Origin', '*'],
        ['Access-Control-Allow-Methods', 'GET'],
        ['Access-Control-Allow-Headers', 'x-special-header'],
        ['Access-Control-Allow-Credentials', 'true'],
        ['Access-Control-Max-Age', 0],
      ])
    )
    expect(res.send).toBeCalled()
  })


  it('should forward all other requests', () => {
    const middleware = [withCors({
      allowOrigin: '*',
      allowCredentials: true,
      allowHeaders: 'x-special-header',
      allowMethods: 'GET',
      maxAge: 0,
    })]
    const handler = jest.fn(
      (_, res) => (
        res.status(200).send()
      )
    )

    const req = createRequest('GET')
    const res = createResponse()
    combineMiddleware(...middleware)(handler)(req, res)

    expect(res.status).toBeCalledWith(200)
    expect(res.send).toBeCalled()
  })

})