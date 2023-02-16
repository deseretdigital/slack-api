const tracer = require('./tracer');
const formats = require('dd-trace/ext/formats');
const util = require('util');
const DEFAULT_LEVEL = 4
const levels = ['error', 'warn', 'info', 'debug', 'log']
const level = levels.indexOf(process.env.LOG_LEVEL) > -1 ? levels.indexOf(process.env.LOG_LEVEL) : DEFAULT_LEVEL
module.exports = class Logger {
  constructor(deepLog = false) {
    this.deepLog = process.env.LOG_LEVEL === 'debug' || deepLog;
  }

  manuallyInjectLogToTracer(level, logInfo) {
    if(tracer) {
      const span = tracer.scope().active();
      const time = new Date().toISOString();
      const record = { time, level, message: logInfo };
      if(span) {
        tracer.inject(span.context(), formats.LOG, record);
      }
    }
  };

  shorthand(...args) {
    const [info, ...debug] = args;
    if (info) {
      this.info(info);
    }
    if (debug) {
      this.debug(...debug);
    }
  }

  log(...args) {
    if (this.shouldLog('log')) {
      this.manuallyInjectLogToTracer('log', args);
      this.abstractLog(...args)
    }
  }

  debug(...args) {
    if (this.shouldLog('debug')) {
      this.manuallyInjectLogToTracer('debug', args);
      this.abstractLog(...['DEBUG', ...args])
    }
  }

  info(...args) {
    if (this.shouldLog('info')) {
      this.manuallyInjectLogToTracer('info', args);
      this.abstractLog(...['INFO', ...args])
    }
  }

  warn(...args) {
    if (this.shouldLog('warn')) {
      this.manuallyInjectLogToTracer('warn', args);
      this.abstractLog(...['WARN', ...args])
    }
  }

  abstractLog(...args) {
    console.log(...args.map(arg => {
      if (
        typeof arg === "object" &&
        !!arg &&
        !Array.isArray(arg) &&
        Object.keys(arg).length > 0 &&
        this.deepLog
      ) {
        return util.inspect(arg, {showHidden: false, depth: null});
      } else {
        return arg;
      }
    }))
  }

  error(...args) {
    if (this.shouldLog('error')) {
      this.manuallyInjectLogToTracer('error', args);
      console.error(...['ERROR', ...args])
    }
  }

  shouldLog(func) {
    switch(level) {
      case 0:
        return func === 'error'
      case 1:
        return func === 'error' || func === 'warn'
      case 2:
        return func === 'error' || func === 'warn' || func === 'info'
      case 3:
        return func === 'error' || func === 'warn' || func === 'info' || func === 'debug'
      case 4:
        return true
    }
  }
}