import { Router } from 'express';
import { authMiddleware, authorize } from '../middleware/authMiddleware';
import { SalesReportController } from '../controllers/salesReportController';

export function SalesReportRoutes(): Router {
  const router = Router();
  const controller = new SalesReportController();

  router.use(authMiddleware, authorize('super_admin', 'admin'));
  router.get('/', controller.list);
  router.get('/brokers', controller.brokers);

  return router;
}
