import { Request, Response } from 'express';
import { mediaService } from './media.service.js';
import type { JwtPayload } from '../../shared/utils/jwt.js';
import type {
  MediaParamsInput,
  ProjectMediaParamsInput,
} from './media.schema.js';

export class MediaController {
  async upload(req: Request, res: Response) {
    const files = req.files as Express.Multer.File[];
    const { projectId } = req.body as { projectId?: string };
    const requestingUser = req.user as JwtPayload;

    if (!projectId) {
      res.status(400).json({ error: 'projectId is required' });
      return;
    }

    const media = await mediaService.uploadMedia(files, projectId, requestingUser);
    res.status(201).json({ media });
  }

  async getByProject(req: Request, res: Response) {
    const params = req.params as unknown as ProjectMediaParamsInput;
    const media = await mediaService.getMediaByProject(params.projectId);
    res.status(200).json({ media });
  }

  async updateProjectMedia(req: Request, res: Response) {
    const params = req.params as unknown as ProjectMediaParamsInput;
    const files = req.files as Express.Multer.File[];
    const { deleteMediaIds } = req.body as { deleteMediaIds?: string | string[] };
    const requestingUser = req.user as JwtPayload;

    if (deleteMediaIds) {
      // Handle various formats (single string, array, or JSON stringified array)
      let idsToDelete: string[] = [];
      if (Array.isArray(deleteMediaIds)) {
        idsToDelete = deleteMediaIds;
      } else if (typeof deleteMediaIds === 'string') {
        if (deleteMediaIds.startsWith('[') && deleteMediaIds.endsWith(']')) {
          try {
            idsToDelete = JSON.parse(deleteMediaIds);
          } catch {
            idsToDelete = [deleteMediaIds];
          }
        } else {
          idsToDelete = [deleteMediaIds];
        }
      }

      for (const mediaId of idsToDelete) {
        await mediaService.deleteMedia(mediaId, requestingUser);
      }
    }

    if (files && files.length > 0) {
      await mediaService.uploadMedia(files, params.projectId, requestingUser);
    }

    // Return the updated list of all media for this project
    const allMedia = await mediaService.getMediaByProject(params.projectId);
    res.status(200).json({ media: allMedia });
  }

  async remove(req: Request, res: Response) {
    const params = req.params as unknown as MediaParamsInput;
    const requestingUser = req.user as JwtPayload;
    const result = await mediaService.deleteMedia(params.id, requestingUser);
    res.status(200).json(result);
  }

  async removeAll(req: Request, res: Response) {
    const params = req.params as unknown as ProjectMediaParamsInput;
    const requestingUser = req.user as JwtPayload;
    const result = await mediaService.deleteAllMediaByProject(params.projectId, requestingUser);
    res.status(200).json(result);
  }
}

export const mediaController = new MediaController();
