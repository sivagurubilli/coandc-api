const { validateCookAccessToken } = require("./validateCookAccessToken");
const { validateEmployerAccessToken } = require("./validateEmployerAccessToken");
const { validateHouseCookAccess } = require("./validateHouseCookAccess");
const { validateChefAccess } = require("./validateChefAccess");
const { validateCateringAccess } = require("./validateCateringAccess");
const { validatePartyCookAccess } = require("./validatePartyCookAccess");
const { validateClientAccess } = require("./validateClientAccess");
const { validateEmployerAccess } = require("./validateEmployerAccess");
const { validateAccessToken } = require("./validateAccessToken");
const { validateCateringOrPartyCookAccess } = require("./validateCateringOrPartyCookAccess");
const { validateAdminOrSupportAccessToken } = require("./validateAdminOrSupportAccessToken");

module.exports = {
  validateAdminOrSupportAccessToken,
  validateCookAccessToken,
  validateEmployerAccessToken,
  validateHouseCookAccess,
  validateChefAccess,
  validateCateringAccess,
  validatePartyCookAccess,
  validateClientAccess,
  validateEmployerAccess,
  validateAccessToken,
  validateCateringOrPartyCookAccess
};