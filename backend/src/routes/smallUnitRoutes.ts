import { Router } from 'express';
import { authMiddleware, authorize } from '../middleware/authMiddleware';
import { SmallUnitController } from '../controllers/smallUnitController';
import { validate } from '../middleware/validationMiddleware';
import { createSmallUnitSchema, updateSmallUnitSchema } from '../validators';

export function SmallUnitRoutes(): Router {
  const router = Router();
  const c = new SmallUnitController();
  router.use(authMiddleware, authorize('super_admin', 'admin'));

  /**
   * @swagger
   * tags:
   *   - name: SmallUnits
   *     description: Lookup đơn vị lẻ (hộp, gói, túi, lọ, viên...)
   */
  router.get('/options', c.options);
  router.get('/', c.list);
  router.post('/', validate(createSmallUnitSchema), c.create);
  router.put('/:id', validate(updateSmallUnitSchema), c.update);
  router.delete('/:id', c.remove);

  return router;
}
