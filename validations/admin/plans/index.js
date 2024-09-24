const { checkCreateCookPlanValidation } = require("./checkCreateCookPlanValidation");
const { checkCreateClientPlanValidation } = require("./checkCreateClientPlanValidation");
const { checkEditClientPlanValidation } = require("./checkEditClientPlanValidation");
const { checkEditCookPlanValidation } = require("./checkEditCookPlanValidation");
const { checkCreateEmployerPlanValidation } = require("./checkCreateEmployerPlanValidation");
const { checkEditEmployerPlanValidation } = require("./checkEditEmployerPlanValidation");
const { changeAdminPasswordValidation } = require("./changeAdminPasswordValidation");

module.exports = {
    checkCreateCookPlanValidation,
    checkCreateClientPlanValidation,
    checkEditCookPlanValidation,
    checkEditClientPlanValidation,
    checkCreateEmployerPlanValidation,
    checkEditEmployerPlanValidation,
    changeAdminPasswordValidation
}