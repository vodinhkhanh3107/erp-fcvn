import { ConsoleLogger, Injectable, Scope } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Logger dùng chung toàn hệ thống — kế thừa ConsoleLogger có sẵn của Nest
 * (giữ nguyên format log đẹp mặc định) và ghi thêm 1 bản ra file logs/app.log
 * để xem lại log cũ, không cần cài thêm thư viện ngoài (winston, pino...).
 */
@Injectable({ scope: Scope.TRANSIENT })
export class AppLogger extends ConsoleLogger {
  private readonly logFilePath = path.join(process.cwd(), 'logs', 'app.log');

  constructor() {
    super();
    const logDir = path.dirname(this.logFilePath);
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
  }

  private writeToFile(level: string, message: string, context?: string) {
    const line = `[${new Date().toISOString()}] [${level}]${context ? ` [${context}]` : ''} ${message}\n`;
    fs.appendFile(this.logFilePath, line, () => {}); 
  }

  log(message: string, context?: string) {
    super.log(message, context);
    this.writeToFile('LOG', message, context);
  }

  error(message: string, trace?: string, context?: string) {
    super.error(message, trace, context);
    this.writeToFile('ERROR', `${message}${trace ? ` — ${trace}` : ''}`, context);
  }

  warn(message: string, context?: string) {
    super.warn(message, context);
    this.writeToFile('WARN', message, context);
  }
}
