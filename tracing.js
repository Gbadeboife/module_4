// Jaeger tracing initialization for Node.js/Express
const { initTracer } = require('jaeger-client');

const config = {
  serviceName: process.env.JAEGER_SERVICE_NAME || 'ticketing-app',
  reporter: {
    logSpans: true,
    agentHost: process.env.JAEGER_AGENT_HOST || 'localhost',
    agentPort: parseInt(process.env.JAEGER_AGENT_PORT, 10) || 6831,
  },
  sampler: {
    type: 'const',
    param: 1,
  },
};

const options = {
  logger: {
    info: function logInfo(msg) {
      console.log('JAEGER INFO', msg);
    },
    error: function logError(msg) {
      console.error('JAEGER ERROR', msg);
    },
  },
};

const tracer = initTracer(config, options);

module.exports = tracer;
