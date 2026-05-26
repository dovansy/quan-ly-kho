import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { SmallUnit } from '../models';
import { sendSuccess, sendError } from '../utils/responseHelper';
import { ErrorCode } from '../utils/errorCodes';
import { getDatabaseErrorResponse } from '../utils/databaseError';

export class SmallUnitController {
  list = async (req: Request, res: Response): Promise<void> => {
    const { keyword, status } = req.query as Record<string, string>;
    const where: any = {};
    if (keyword) where[Op.or] = [
      { code: { [Op.like]: `%${keyword}%` } },
      { label: { [Op.like]: `%${keyword}%` } },
    ];
    if (status) where.status = status;

    const rows = await SmallUnit.findAll({ where, order: [['label', 'ASC']] });
    sendSuccess(res, rows.map(format));
  };

  options = async (_req: Request, res: Response): Promise<void> => {
    const rows = await SmallUnit.findAll({ where: { status: 'active' }, order: [['label', 'ASC']] });
    sendSuccess(res, rows.map(r => ({ label: r.label, value: r.id, code: r.code })));
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const { code, label, status } = req.body;
    if (!code || !label) { sendError(res, ErrorCode.REQUIRED, 'Vui lòng nhập mã và tên đơn vị', 400); return; }

    const exists = await SmallUnit.findOne({ where: { code } });
    if (exists) { sendError(res, ErrorCode.USERNAME_EXISTED, 'Mã đơn vị đã tồn tại', 400); return; }

    const created = await SmallUnit.create({ code, label, status: status || 'active' });
    sendSuccess(res, format(created), 'Tạo đơn vị lẻ thành công', 201);
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const row = await SmallUnit.findByPk(id);
    if (!row) { sendError(res, ErrorCode.NOT_FOUND, 'Không tìm thấy đơn vị', 404); return; }

    const { label, status } = req.body;
    await row.update({ label: label ?? row.label, status: status ?? row.status });
    sendSuccess(res, format(row), 'Cập nhật đơn vị lẻ thành công');
  };

  remove = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    try {
      const deleted = await SmallUnit.destroy({ where: { id } });
      if (!deleted) { sendError(res, ErrorCode.NOT_FOUND, 'Không tìm thấy đơn vị', 404); return; }
      sendSuccess(res, null, 'Xóa đơn vị lẻ thành công');
    } catch (err: any) {
      const mapped = getDatabaseErrorResponse(err, 'delete');
      if (mapped.httpStatus < 500) {
        sendError(res, mapped.code, mapped.message, mapped.httpStatus); return;
      }
      throw err;
    }
  };
}

function format(u: SmallUnit) {
  return {
    id: u.id, key: String(u.id),
    code: u.code, label: u.label,
    status: u.status,
    created_at: (u as any).created_at, updated_at: (u as any).updated_at,
  };
}
