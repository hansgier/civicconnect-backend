import { Request, Response } from 'express';
import { contactsService } from './contacts.service.js';
import type { JwtPayload } from '../../shared/utils/jwt.js';
import type {
  CreateContactInput,
  UpdateContactInput,
  ContactParamsInput,
  ListContactsQuery,
} from './contacts.schema.js';

export class ContactsController {
  async getAll(req: Request, res: Response) {
    const filters = req.query as unknown as ListContactsQuery;
    const result = await contactsService.getAllContacts(filters);
    res.status(200).json(result);
  }

  async getById(req: Request, res: Response) {
    const { id } = req.params as unknown as ContactParamsInput;
    const contact = await contactsService.getContactById(id);
    res.status(200).json(contact);
  }

  async create(req: Request, res: Response) {
    const data = req.body as CreateContactInput;
    const user = req.user as JwtPayload;
    const userId = user.id;
    const contact = await contactsService.createContact({
        ...data,
        createdById: userId,
    });
    res.status(201).json(contact);
  }

  async update(req: Request, res: Response) {
    const { id } = req.params as unknown as ContactParamsInput;
    const data = req.body as UpdateContactInput;
    const user = req.user as JwtPayload;
    const userId = user.id;
    const userRole = user.role;
    const contact = await contactsService.updateContact(id, data, userId, userRole);
    res.status(200).json(contact);
  }

  async remove(req: Request, res: Response) {
    const { id } = req.params as unknown as ContactParamsInput;
    const user = req.user as JwtPayload;
    const userId = user.id;
    const userRole = user.role;
    const result = await contactsService.deleteContact(id, userId, userRole);
    res.status(200).json(result);
  }
}

export const contactsController = new ContactsController();
