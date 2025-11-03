import {ExceptionFilter,Catch,ArgumentsHost,HttpException,HttpStatus} from '@nestjs/common';
import { Response } from 'express';
import { BaseResponse } from './base-response';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    
    catch(exception: any, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();

        // Détermination du code HTTP
        const status =
            exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

        // Extraction du message
        let message: any;
        if (exception instanceof HttpException) {
            const res = exception.getResponse();
            if (typeof res === 'string') {
                message = res;
            } else if (typeof res === 'object' && res !== null) {
                message = (res as any).message || res;
            } else {
                message = res;
            }
        } else if (typeof exception === 'string') {
            message = exception;
        } else {
            message = exception.message || 'Erreur interne du serveur';
        }

        // Format BaseResponse
        const baseResponse = new BaseResponse( status, typeof message === 'string' ? message : JSON.stringify(message));

        response.status(status).json(baseResponse);
    }
}
