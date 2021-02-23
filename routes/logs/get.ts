/**
 * Example on using middleware together with request handler
 *
 */

const logOriginalUrl = (req, res, next) => {
    console.log('Request URL:', req.originalUrl)
    next()
}

const logMethod = (req, res, next) => {
    console.log('Request Type:', req.method)
    next()
}

const logStuff = [logOriginalUrl, logMethod]

export default [logStuff, (req, res, next) => {
    res.send('User info')
}]