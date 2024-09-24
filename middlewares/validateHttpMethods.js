
// Middleware to check the HTTP method
exports.isValidGetMethod = (req, res, next) => {
    try {
        if (req.method !== 'GET') throw { statusCode: 405, responsecode: 0, msg: 'method_not_found' }
        next();
    }
    catch (e) {
        res.status(e.statusCode || 500).send({ status: 0, message: e.msg })
    }
};

// Middleware to check the HTTP method
exports.isValidPostMethod = (req, res, next) => {
    try {
        if (req.method !== 'POST') throw { statusCode: 405, responsecode: 0, msg: 'method_not_found' }
        next();
    }
    catch (e) {
        res.status(e.statusCode || 500).send({ status: 0, message: e.msg })
    }
};

// Middleware to check the HTTP method
exports.isValidPutMethod = (req, res, next) => {
    try {
        if (req.method !== 'PUT') throw { statusCode: 405, responsecode: 0, msg: 'method_not_found' }
        next();
    }
    catch (e) {
        res.status(e.statusCode || 500).send({ status: 0, message: e.msg })
    }
};

// Middleware to check the HTTP method
exports.isValidDeleteMethod = (req, res, next) => {
    try {
        if (req.method !== 'DELETE') throw { statusCode: 405, responsecode: 0, msg: 'method_not_found' }
        next();
    }
    catch (e) {
        res.status(e.statusCode || 500).send({ status: 0, message: e.msg })
    }
};
