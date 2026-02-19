import { Request, Response } from 'express';
import { fundingSourcesService } from './funding-sources.service.js';
import type { CreateFundingSourceInput, UpdateFundingSourceInput } from './funding-sources.schema.js';

export const fundingSourcesController = {
  async getAll(_req: Request, res: Response) {
    const fundingSources = await fundingSourcesService.getAllFundingSources();
    res.status(200).json(fundingSources);
  },

  async getById(req: Request, res: Response) {
    const fundingSource = await fundingSourcesService.getFundingSourceById(req.params.id as string);
    res.status(200).json(fundingSource);
  },

  async create(req: Request, res: Response) {
    const fundingSource = await fundingSourcesService.createFundingSource(req.body as CreateFundingSourceInput);
    res.status(201).json(fundingSource);
  },

  async update(req: Request, res: Response) {
    const fundingSource = await fundingSourcesService.updateFundingSource(req.params.id as string, req.body as UpdateFundingSourceInput);
    res.status(200).json(fundingSource);
  },

  async remove(req: Request, res: Response) {
    await fundingSourcesService.deleteFundingSource(req.params.id as string);
    res.status(200).json({ message: 'Funding source deleted successfully' });
  },
};
