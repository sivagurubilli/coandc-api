// Middleware to check the HTTP methods
class ValidateHttpMethods {
  static isValidGetMethod(req, res, next) {
    try {
      if (req.method !== 'GET')
        throw { status: 405, message: 'method_not_found' };
      return next();
    } catch (error) {
      return next(error);
    }
  }

  static isValidPostMethod(req, res, next) {
    try {
      if (req.method !== 'POST')
        throw { status: 405, message: 'method_not_found' };
      return next();
    } catch (error) {
      return next(error);
    }
  }

  static isValidPutMethod(req, res, next) {
    try {
      if (req.method !== 'PUT') throw { status: 405, message: 'method_not_found' };
      return next();
    } catch (error) {
      return next(error);
    }
  }

  static isValidDeleteMethod(req, res, next) {
    try {
      if (req.method !== 'DELETE')
        throw { status: 405, message: 'method_not_found' };
      return next();
    } catch (error) {
      return next(error);
    }
  }

  static isValidPatchMethod(req, res, next) {
    try {
      if (req.method !== 'PATCH') throw { status: 405, message: 'method_not_found' };
      return next();
    } catch (error) {
      return next(error);
    }
  }
}

export default ValidateHttpMethods;
