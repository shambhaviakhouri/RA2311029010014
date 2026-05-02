const fs = require('fs');
const path = require('path');

const logDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const logFile = path.join(logDir, `app-${new Date().toISOString().split('T')[0]}.log`);

class LoggingMiddleware {
  static log(level, message, data = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      data
    };
    
    const logString = `[${timestamp}] [${level}] ${message} ${Object.keys(data).length > 0 ? JSON.stringify(data) : ''}`;
    
    fs.appendFileSync(logFile, logString + '\n');
  }

  static info(message, data = {}) {
    this.log('INFO', message, data);
  }

  static error(message, data = {}) {
    this.log('ERROR', message, data);
  }

  static warn(message, data = {}) {
    this.log('WARN', message, data);
  }

  static debug(message, data = {}) {
    this.log('DEBUG', message, data);
  }

  static middleware() {
    return (req, res, next) => {
      const start = Date.now();
      
      res.on('finish', () => {
        const duration = Date.now() - start;
        this.info('HTTP Request', {
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          duration: `${duration}ms`
        });
      });
      
      next();
    };
  }
}

module.exports = LoggingMiddleware;
