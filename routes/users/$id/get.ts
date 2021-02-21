/**
 * Get Users by Id
 *
 * GET /users/$id
 * @param req
 * @param res
 */

export default (req, res) => {
    res.json({params: req.params})
}
