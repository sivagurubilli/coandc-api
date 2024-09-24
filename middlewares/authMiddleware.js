import jwt from 'jsonwebtoken';
import { User, Admin } from '../src/models/index.js';
import { checkFreeTrialAccess } from '../helpers/dates.js';
import AppUtils from '../utils/appUtils.js';
class AuthMiddleware {
  static issueAccessToken(userId) {
    const token = jwt.sign(
      { id: userId },
      process.env.ACCESS_TOKEN_SECRET_KEY,
      { expiresIn: process.env.ACCESS_TOKEN_EXPIRATION_TIME },
    );
    return token;
  }

  static issueRefreshToken(userId) {
    const token = jwt.sign(
      { id: userId },
      process.env.REFRESH_TOKEN_SECRET_KEY,
      { expiresIn: process.env.REFRESH_TOKEN_EXPIRATION_TIME },
    );
    return token;
  }

  static issueAuthTokens(userId) {
    const accessToken = AuthMiddleware.issueAccessToken(userId);
    const refreshToken = AuthMiddleware.issueRefreshToken(userId);
    return { accessToken, refreshToken };
  }

  static async validateUserAccessToken(req, res, next) {
    try {
      let decoded;
      let token = req.headers['access-token'];
      if (!token) throw { status: 400, message: 'Token missing in headers' };

      //JWT Verification
      jwt.verify(
        Array.isArray(token) ? token[0] : token,
        process.env.ACCESS_TOKEN_SECRET_KEY,
        (err, decodedData) => {
          if (err) {
            if (err.name === 'TokenExpiredError')
              throw { status: 401, message: 'Unauthorized user' };
            else throw { status: 400, message: 'Invalid token' };
          } else decoded = decodedData;
        },
      );
      //Finding the user in user's collections
      const user = await User.findOne({
        _id: decoded.id,
        isDeleted: false,
      });
      if (!user) throw { status: 400, message: 'Invalid token' };

      req.user = user;
      req.userId = user._id;
      next();
    } catch (error) {
      next(error);
    }
  }

  static async validateUserRefreshToken(req, res, next) {
    try {
      let decoded;
      let token = req.headers['refresh-token'];
      if (!token) throw { status: 400, message: 'Token missing in headers' };

      //JWT Verification
      jwt.verify(
        Array.isArray(token) ? token[0] : token,
        process.env.REFRESH_TOKEN_SECRET_KEY,
        (err, decodedData) => {
          if (err) {
            if (err.name === 'TokenExpiredError')
              throw { status: 401, message: 'Unauthorized user' };
            else throw { status: 400, message: 'Invalid token' };
          } else decoded = decodedData;
        },
      );
      //Finding the user in user's collections
      const user = await User.findOne({
        _id: decoded.id,
        isDeleted: false,
      });
      if (!user) throw { status: 400, message: 'Invalid token' };

      req.user = user;
      req.userId = user._id;
      next();
    } catch (error) {
      next(error);
    }
  }

  static async validateAdminAccessToken(req, res, next) {
    try {
      let decoded;
      let token = req.headers['access-token'];
      if (!token) throw { status: 400, message: 'Token missing in headers' };

      //JWT Verification
      jwt.verify(
        Array.isArray(token) ? token[0] : token,
        process.env.ACCESS_TOKEN_SECRET_KEY,
        (err, decodedData) => {
          if (err) {
            if (err.name === 'TokenExpiredError')
              throw { status: 401, message: 'Unauthorized user' };
            else throw { status: 400, message: 'Invalid token' };
          } else decoded = decodedData;
        },
      );
      //Finding the user in superadmin's collections
      let user = await Admin.findOne({
        _id: decoded.id
      });
      if (!user) throw { status: 400, message: 'Invalid token' };

      req.user = user;
      req.userId = user._id;
      next();
    } catch (error) {
      next(error);
    }
  }

  static async validateAdminRefreshToken(req, res, next) {
    try {
      let decoded;
      let token = req.headers['refresh-token'];
      if (!token) throw { status: 400, message: 'Token missing in headers' };

      //JWT Verification
      jwt.verify(
        Array.isArray(token) ? token[0] : token,
        process.env.REFRESH_TOKEN_SECRET_KEY,
        (err, decodedData) => {
          if (err) {
            if (err.name === 'TokenExpiredError')
              throw { status: 401, message: 'Unauthorized user' };
            else throw { status: 400, message: 'Invalid token' };
          } else decoded = decodedData;
        },
      );
      //Finding the user in superadmin's collections
      let user = await Admin.findOne({
        _id: decoded.id
      });
      if (!user) throw { status: 400, message: 'Invalid token' };

      req.user = user;
      req.userId = user._id;
      req.role=user.role;
      next();
    } catch (error) {
      next(error);
    }
  }

  static checkSubscriptionAccess(req, res, next) {
    try {
      const hasUserFreeTrialAccess = checkFreeTrialAccess(req.user.createdAt);
      const userSubscriptionStatus = req.user.subscriptionStatus;
      if (!hasUserFreeTrialAccess && userSubscriptionStatus == 0) throw { status: 402, message: "Your Trial period has completed. Please purchase plans to continue!" }
      next();
    }
    catch (error) {
      next(error)
    }
  }

  static validateAdminAccess(req, res, next) {
    try {

      if (!req.user.role !=='admin') throw { status: 403, message: "Access denied. Admin access required." }
      next();
    }
    catch (error) {
      next(error)
    }
  }

  static async checkUpgradePlanAccess(req, res, next) {
    try {
      const { latestPlanId, latestPlanPrice, planExpiresAt } = await AppUtils.getLatestPlanDetails(req.userId);
      req.latestPlanId = latestPlanId;
      req.latestPlanPrice = latestPlanPrice;
      req.planExpiresAt = planExpiresAt;
      return next();
    }
    catch (error) {
      next(error)
    }
  }
}
export default AuthMiddleware;
