// src/types/express.d.ts
import { User } from '@prisma/client';

declare global {
    namespace Express {
        interface Request {
            user?: User;  // adapte le type selon ta définition User ou any
        }
    }
}
