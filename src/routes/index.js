import logger from '../../utils/logger/logger.js';
import express from 'express';
import UserRouter from './user.js';
import AdminRouter from './admin.js';

const router = express.Router();

//Version_V1_Api's
router.use('/v1/user', UserRouter);
router.use('/v1/admin', AdminRouter);


//Route not found error handler
router.use((req, res, next) => {
  const error = new Error('url_not_found');
  error.status = 404;
  next(error);
});

//Error handler middleware
router.use((err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  const data = err.data;
  logger.log(
    'error',
    `Method: ${req.method}, Url: ${req.originalUrl}, Message:${err.message}`,
    { label: 'APIREQUEST' },
  );
  res.status(status).send({ status: 0, message, data });
});

export default router;
