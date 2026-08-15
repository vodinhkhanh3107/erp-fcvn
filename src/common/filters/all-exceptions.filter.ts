import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { AppLogger } from '../logger/app-logger.service';

/**
 * Bắt TOÀN BỘ lỗi (kể cả lỗi không lường trước, không phải HttpException)
 * và trả về đúng 1 format JSON thống nhất cho mọi API — tránh tình trạng
 * mỗi lỗi trả về 1 kiểu JSON khác nhau tùy nơi ném lỗi.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new AppLogger();

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const isHttpException = exception instanceof HttpException;
    const status = isHttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse = isHttpException ? exception.getResponse() : null;
    const message = isHttpException
      ? typeof exceptionResponse === 'string'
        ? exceptionResponse
        : (exceptionResponse as any)?.message || exception.message
      : 'Internal server error';

    const errorBody = {
      success: false,
      statusCode: status,
      path: request.url,
      method: request.method,
      timestamp: new Date().toISOString(),
      message,
    };

    // Lỗi hệ thống (5xx) log kèm stack trace đầy đủ; lỗi nghiệp vụ (4xx) chỉ log ngắn gọn
    if (status >= 500) {
      this.logger.error(JSON.stringify(errorBody), (exception as Error)?.stack, 'ExceptionFilter');
    } else {
      this.logger.warn(JSON.stringify(errorBody), 'ExceptionFilter');
    }

    response.status(status).json(errorBody);
  }
}
