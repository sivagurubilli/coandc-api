const { responseJson } = require("../utils/appUtils");

exports.validateChefAccess = async (req, res, next) => {
    try {
        const user = req.user;
        if (user.cookType !== 2 || user.memberType !== 1) throw { statusCode: 403, responseCode: 4, msg: "Chef access required.Access Denied" }
        next();
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Session Timed Out.Try again', e))
    }
}