import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

interface ErrorResponseBody {
  errorCode: string;
  message: string;
  errors?: string[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function resolveMessage(response: unknown, fallback: string): string {
  if (typeof response === 'string') {
    return response;
  }

  if (isRecord(response)) {
    const message = response.message;

    if (typeof message === 'string') {
      return message;
    }

    if (Array.isArray(message)) {
      const messages = message.filter((item): item is string => typeof item === 'string');

      if (messages.length > 0) {
        return messages.join(', ');
      }
    }
  }

  return fallback;
}

function resolveErrors(response: unknown): string[] | undefined {
  if (!isRecord(response)) {
    return undefined;
  }

  const message = response.message;
  if (!Array.isArray(message)) {
    return undefined;
  }

  const messages = message.filter((item): item is string => typeof item === 'string');
  return messages.length > 0 ? messages : undefined;
}

function resolveErrorCode(status: number, response: unknown): string {
  if (isRecord(response) && typeof response.errorCode === 'string') {
    return response.errorCode;
  }

  if (status === HttpStatus.BAD_REQUEST) {
    return 'REQ_400';
  }

  return `HTTP_${status}`;
}

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const defaultStatus = HttpStatus.INTERNAL_SERVER_ERROR;
    const defaultMessage = 'Internal server error';
    const defaultCode = 'SYS_500';

    let status = defaultStatus;
    let message = defaultMessage;
    let errorCode = defaultCode;
    let errors: string[] | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const payload = exception.getResponse();
      message = resolveMessage(payload, defaultMessage);
      errorCode = resolveErrorCode(status, payload);
      errors = resolveErrors(payload);
    }

    const body: ErrorResponseBody & {
      statusCode: number;
      path: string;
      timestamp: string;
    } = {
      statusCode: status,
      errorCode,
      message,
      path: request.url,
      timestamp: new Date().toISOString(),
    };

    if (errors) {
      body.errors = errors;
    }

    response.status(status).json(body);
  }
}
