/**
 * Cloudflare Worker for SPEC_SYSTEM
 * Provides API endpoints for agent orchestration and metrics collection
 */

import { WorkflowEngine } from './src/workflow-engine';
import { AgentOrchestrator } from './src/agent-orchestrator';
import { MetricsCollector } from './src/metrics-collector';
import { AuthService } from './src/auth-service';

// Durable Object exports
export { WorkflowEngine } from './src/durable-objects/workflow-engine';
export { AgentOrchestrator } from './src/durable-objects/agent-orchestrator';

export default {
  /**
   * Main fetch handler for all HTTP requests
   */
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    
    // CORS headers for all responses
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };
    
    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }
    
    try {
      // Authentication check for protected routes
      if (path.startsWith('/api/') && !path.startsWith('/api/health')) {
        const authResult = await AuthService.authenticate(request, env);
        if (!authResult.success) {
          return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        request.user = authResult.user;
      }
      
      // Route handling
      let response;
      
      if (path.startsWith('/api/workflows')) {
        response = await handleWorkflowRequests(request, env, ctx);
      } else if (path.startsWith('/api/agents')) {
        response = await handleAgentRequests(request, env, ctx);
      } else if (path.startsWith('/api/metrics')) {
        response = await handleMetricsRequests(request, env, ctx);
      } else if (path.startsWith('/api/health')) {
        response = await handleHealthCheck(request, env, ctx);
      } else if (path.startsWith('/cron/')) {
        response = await handleCronJob(request, env, ctx);
      } else {
        response = new Response('Not Found', { status: 404 });
      }
      
      // Add CORS headers to response
      const headers = new Headers(response.headers);
      Object.entries(corsHeaders).forEach(([key, value]) => {
        headers.set(key, value);
      });
      
      return new Response(response.body, {
        status: response.status,
        headers
      });
      
    } catch (error) {
      console.error('Worker error:', error);
      
      return new Response(JSON.stringify({
        error: 'Internal Server Error',
        message: error.message
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  },

  /**
   * Queue handler for processing agent tasks
   */
  async queue(batch, env) {
    console.log(`Processing ${batch.messages.length} queued messages`);
    
    for (const message of batch.messages) {
      try {
        await processAgentTask(message.body, env);
        message.ack();
      } catch (error) {
        console.error('Queue message processing failed:', error);
        message.retry();
      }
    }
  },

  /**
   * Scheduled handler for cron jobs
   */
  async scheduled(controller, env, ctx) {
    const cron = controller.cron;
    console.log(`Scheduled task triggered: ${cron}`);
    
    switch (cron) {
      case '0 * * * *': // Every hour
        ctx.waitUntil(collectMetrics(env));
        break;
        
      case '0 0 * * *': // Daily
        ctx.waitUntil(cleanupOldData(env));
        break;
        
      case '*/15 * * * *': // Every 15 minutes
        ctx.waitUntil(performHealthCheck(env));
        break;
    }
  }
};

/**
 * Handle workflow-related API requests
 */
async function handleWorkflowRequests(request, env, ctx) {
  const url = new URL(request.url);
  const segments = url.pathname.split('/').filter(Boolean);
  
  // GET /api/workflows - List all workflows
  if (request.method === 'GET' && segments.length === 2) {
    const workflows = await listWorkflows(env);
    return new Response(JSON.stringify(workflows), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  // POST /api/workflows/{name}/execute - Execute workflow
  if (request.method === 'POST' && segments.length === 4 && segments[3] === 'execute') {
    const workflowName = segments[2];
    const inputs = await request.json();
    
    const workflowEngine = env.WORKFLOW_ENGINE.get(env.WORKFLOW_ENGINE.idFromName('main'));
    const result = await workflowEngine.fetch(request.url, {
      method: 'POST',
      body: JSON.stringify({
        action: 'execute',
        workflow: workflowName,
        inputs
      })
    });
    
    return result;
  }
  
  // GET /api/workflows/{name}/status/{jobId} - Get job status
  if (request.method === 'GET' && segments.length === 5 && segments[3] === 'status') {
    const jobId = segments[4];
    
    const workflowEngine = env.WORKFLOW_ENGINE.get(env.WORKFLOW_ENGINE.idFromName('main'));
    const result = await workflowEngine.fetch(request.url, {
      method: 'GET',
      body: JSON.stringify({
        action: 'status',
        jobId
      })
    });
    
    return result;
  }
  
  return new Response('Not Found', { status: 404 });
}

/**
 * Handle agent-related API requests
 */
async function handleAgentRequests(request, env, ctx) {
  const url = new URL(request.url);
  const segments = url.pathname.split('/').filter(Boolean);
  
  // GET /api/agents - List all agents
  if (request.method === 'GET' && segments.length === 2) {
    const agents = await listAgents(env);
    return new Response(JSON.stringify(agents), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  // POST /api/agents/{name}/invoke - Invoke specific agent
  if (request.method === 'POST' && segments.length === 4 && segments[3] === 'invoke') {
    const agentName = segments[2];
    const taskData = await request.json();
    
    const orchestrator = env.AGENT_ORCHESTRATOR.get(env.AGENT_ORCHESTRATOR.idFromName('main'));
    const result = await orchestrator.fetch(request.url, {
      method: 'POST',
      body: JSON.stringify({
        action: 'invoke',
        agent: agentName,
        task: taskData
      })
    });
    
    return result;
  }
  
  // GET /api/agents/{name}/memory - Get agent memory
  if (request.method === 'GET' && segments.length === 4 && segments[3] === 'memory') {
    const agentName = segments[2];
    const memory = await env.AGENT_MEMORY.get(`memory:${agentName}`);
    
    return new Response(memory || '{}', {
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  return new Response('Not Found', { status: 404 });
}

/**
 * Handle metrics-related API requests
 */
async function handleMetricsRequests(request, env, ctx) {
  const url = new URL(request.url);
  const segments = url.pathname.split('/').filter(Boolean);
  
  // GET /api/metrics/dashboard - Get dashboard data
  if (request.method === 'GET' && segments.length === 3 && segments[2] === 'dashboard') {
    const dashboard = await generateDashboard(env);
    return new Response(JSON.stringify(dashboard), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  // GET /api/metrics/{type} - Get specific metrics
  if (request.method === 'GET' && segments.length === 3) {
    const metricType = segments[2];
    const metrics = await getMetrics(env, metricType);
    
    return new Response(JSON.stringify(metrics), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  // POST /api/metrics/collect - Manual metrics collection
  if (request.method === 'POST' && segments.length === 3 && segments[2] === 'collect') {
    ctx.waitUntil(collectMetrics(env));
    
    return new Response(JSON.stringify({ status: 'Collection started' }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  return new Response('Not Found', { status: 404 });
}

/**
 * Handle health check requests
 */
async function handleHealthCheck(request, env, ctx) {
  const healthData = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: env.ENVIRONMENT || 'development',
    checks: {
      kv: await checkKVHealth(env),
      durableObjects: await checkDurableObjectHealth(env),
      queues: await checkQueueHealth(env)
    }
  };
  
  const overallStatus = Object.values(healthData.checks).every(check => check.status === 'healthy') 
    ? 200 
    : 503;
  
  return new Response(JSON.stringify(healthData), {
    status: overallStatus,
    headers: { 'Content-Type': 'application/json' }
  });
}

/**
 * Handle cron job requests
 */
async function handleCronJob(request, env, ctx) {
  const url = new URL(request.url);
  const path = url.pathname;
  
  if (path === '/cron/collect-metrics') {
    ctx.waitUntil(collectMetrics(env));
    return new Response('Metrics collection started');
  }
  
  if (path === '/cron/cleanup-old-data') {
    ctx.waitUntil(cleanupOldData(env));
    return new Response('Data cleanup started');
  }
  
  if (path === '/cron/health-check') {
    ctx.waitUntil(performHealthCheck(env));
    return new Response('Health check performed');
  }
  
  return new Response('Unknown cron job', { status: 404 });
}

/**
 * Process agent task from queue
 */
async function processAgentTask(taskData, env) {
  console.log('Processing agent task:', taskData);
  
  const orchestrator = env.AGENT_ORCHESTRATOR.get(env.AGENT_ORCHESTRATOR.idFromName('main'));
  
  await orchestrator.fetch('http://internal/process-task', {
    method: 'POST',
    body: JSON.stringify(taskData)
  });
}

/**
 * Collect system metrics
 */
async function collectMetrics(env) {
  console.log('Collecting system metrics...');
  
  const metrics = {
    timestamp: new Date().toISOString(),
    activeWorkflows: await countActiveWorkflows(env),
    agentInvocations: await countAgentInvocations(env),
    systemHealth: await getSystemHealth(env)
  };
  
  // Store metrics in KV
  const metricsKey = `metrics:${Date.now()}`;
  await env.METRICS_STORE.put(metricsKey, JSON.stringify(metrics));
  
  // Send to analytics
  if (env.ANALYTICS) {
    env.ANALYTICS.writeDataPoint({
      blobs: [
        env.ENVIRONMENT || 'development',
        'metrics_collection'
      ],
      doubles: [
        metrics.activeWorkflows,
        metrics.agentInvocations
      ],
      indexes: [metricsKey]
    });
  }
  
  console.log('Metrics collection completed');
}

/**
 * Cleanup old data
 */
async function cleanupOldData(env) {
  console.log('Cleaning up old data...');
  
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 30); // Keep 30 days
  
  // Clean up old metrics
  const metricsKeys = await env.METRICS_STORE.list({ prefix: 'metrics:' });
  
  for (const key of metricsKeys.keys) {
    const timestamp = parseInt(key.name.split(':')[1]);
    if (timestamp < cutoffDate.getTime()) {
      await env.METRICS_STORE.delete(key.name);
    }
  }
  
  console.log('Data cleanup completed');
}

/**
 * Perform health check
 */
async function performHealthCheck(env) {
  console.log('Performing health check...');
  
  const health = {
    timestamp: new Date().toISOString(),
    kv: await checkKVHealth(env),
    durableObjects: await checkDurableObjectHealth(env),
    queues: await checkQueueHealth(env)
  };
  
  // Store health status
  await env.METRICS_STORE.put('health:latest', JSON.stringify(health));
  
  console.log('Health check completed:', health);
}

// Helper functions
async function listWorkflows(env) {
  // Implementation to list available workflows
  return {
    workflows: [
      'feature-lifecycle',
      'quality-gates', 
      'metrics-collection'
    ]
  };
}

async function listAgents(env) {
  // Implementation to list available agents
  return {
    agents: [
      'steering-architect',
      'feature-planner',
      'design-architect',
      'requirements-engineer',
      'implementation-specialist',
      'test-strategist',
      'quality-guardian',
      'documentation-curator',
      'metrics-analyst'
    ]
  };
}

async function generateDashboard(env) {
  const latest = await env.METRICS_STORE.get('metrics:latest');
  const health = await env.METRICS_STORE.get('health:latest');
  
  return {
    metrics: latest ? JSON.parse(latest) : {},
    health: health ? JSON.parse(health) : {},
    generated: new Date().toISOString()
  };
}

async function getMetrics(env, type) {
  const key = `metrics:${type}:latest`;
  const data = await env.METRICS_STORE.get(key);
  return data ? JSON.parse(data) : {};
}

async function checkKVHealth(env) {
  try {
    await env.METRICS_STORE.put('health_check', 'ok');
    await env.METRICS_STORE.get('health_check');
    return { status: 'healthy', latency: Date.now() };
  } catch (error) {
    return { status: 'unhealthy', error: error.message };
  }
}

async function checkDurableObjectHealth(env) {
  try {
    const orchestrator = env.AGENT_ORCHESTRATOR.get(env.AGENT_ORCHESTRATOR.idFromName('health'));
    const response = await orchestrator.fetch('http://internal/health');
    return { status: 'healthy', response: await response.text() };
  } catch (error) {
    return { status: 'unhealthy', error: error.message };
  }
}

async function checkQueueHealth(env) {
  try {
    // Queue health is implicit - if we can send a message, it's healthy
    await env.AGENT_TASK_QUEUE.send({ type: 'health_check', timestamp: Date.now() });
    return { status: 'healthy' };
  } catch (error) {
    return { status: 'unhealthy', error: error.message };
  }
}

async function countActiveWorkflows(env) {
  // Mock implementation - would query actual workflow state
  return Math.floor(Math.random() * 10);
}

async function countAgentInvocations(env) {
  // Mock implementation - would query actual agent metrics
  return Math.floor(Math.random() * 100);
}

async function getSystemHealth(env) {
  return {
    status: 'healthy',
    uptime: Date.now(),
    memory: 'optimal'
  };
}