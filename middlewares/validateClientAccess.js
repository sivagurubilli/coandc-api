const { responseJson } = require("../utils/appUtils");

exports.validateClientAccess = async (req, res, next) => {
    try {
        const user = req.user;
        if (user.memberType !== 1) throw { statusCode: 403, responseCode: 0, msg: "Client access required.Access Denied" }
        next();
    }
    catch (e) {
        res.status(e.statusCode || 500).send(responseJson(0, e.responseCode || 0, [], e.msg || 'Session Timed Out.Try again', e))
    }
}