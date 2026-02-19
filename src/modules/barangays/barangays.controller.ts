import { Request, Response } from 'express';
import { barangaysService } from './barangays.service.js';
import type {
  BarangayQueryInput,
  BarangayParamsInput,
  CreateBarangayInput,
  UpdateBarangayInput,
} from './barangays.schema.js';

export class BarangaysController {
  async getAll(req: Request, res: Response) {
    const query = req.query as unknown as BarangayQueryInput;
    const result = await barangaysService.getAllBarangays(query);
    res.status(200).json(result);
  }

  async getById(req: Request, res: Response) {
    const params = req.params as unknown as BarangayParamsInput;
    const barangay = await barangaysService.getBarangayById(params.id);
    res.status(200).json(barangay);
  }

  async create(req: Request, res: Response) {
    const data = req.body as CreateBarangayInput;
    const barangay = await barangaysService.createBarangay(data);
    res.status(201).json(barangay);
  }

  async update(req: Request, res: Response) {
    const params = req.params as unknown as BarangayParamsInput;
    const data = req.body as UpdateBarangayInput;
    const barangay = await barangaysService.updateBarangay(params.id, data);
    res.status(200).json(barangay);
  }

  async remove(req: Request, res: Response) {
    const params = req.params as unknown as BarangayParamsInput;
    const result = await barangaysService.deleteBarangay(params.id);
    res.status(200).json(result);
  }
}

export const barangaysController = new BarangaysController();
