var express = require('express');
var multer = require('multer');
var router = express.Router();
const cookRoutes = require("./cookRoutes");
const commonRoutes = require("./commonRoutes");
const employerRoutes = require("./employerRoutes");
const adminRoutes = require("./adminRoutes");
const dropdownRoutes = require("./dropdownRoutes");
const supportRoutes = require("./supportRoutes");
const scriptRoutes = require("./scriptRoutes");

router.use('/v1/cook', cookRoutes);
router.use('/v1/employer', employerRoutes);
router.use('/v1/admin', adminRoutes);
router.use('/v1/common', commonRoutes);
router.use('/v1/dropdown', dropdownRoutes);
router.use('/v1/support', supportRoutes);
router.use('/v1/scripts', scriptRoutes);


//For Url_not_found cases
router.use('*', (req, res) => {
    res.status(404).send({
        status: 0,
        message: 'url_not_found'
    })
})

module.exports = router;