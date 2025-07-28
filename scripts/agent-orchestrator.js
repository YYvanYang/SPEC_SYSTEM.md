/**
 * Agent Orchestrator - Coordinates multi-agent workflows
 */

class AgentOrchestrator {
    constructor(config = {}) {
        this.agents = new Map();
        this.workflows = new Map();
        this.activeJobs = new Map();
        this.config = config;
    }

    /**
     * Register an agent with its capabilities and context
     */
    registerAgent(agentName, capabilities) {
        this.agents.set(agentName, {
            name: agentName,
            capabilities,
            status: 'idle',
            currentJob: null,
            context: new Map()
        });
    }

    /**
     * Load workflow definition from YAML
     */
    loadWorkflow(workflowName, workflowDef) {
        this.workflows.set(workflowName, workflowDef);
    }

    /**
     * Execute a workflow with intelligent agent routing
     */
    async executeWorkflow(workflowName, inputs = {}) {
        const workflow = this.workflows.get(workflowName);
        if (!workflow) {
            throw new Error(`Workflow '${workflowName}' not found`);
        }

        const jobId = this.generateJobId();
        const job = {
            id: jobId,
            workflow: workflowName,
            status: 'running',
            startTime: new Date(),
            phases: new Map(),
            context: new Map(Object.entries(inputs))
        };

        this.activeJobs.set(jobId, job);

        try {
            for (const [phaseName, phaseConfig] of Object.entries(workflow.phases)) {
                await this.executePhase(job, phaseName, phaseConfig);
            }

            job.status = 'completed';
            job.endTime = new Date();
            
            return {
                jobId,
                status: 'success',
                duration: job.endTime - job.startTime,
                outputs: Object.fromEntries(job.context)
            };

        } catch (error) {
            job.status = 'failed';
            job.error = error.message;
            throw error;
        }
    }

    /**
     * Execute a single phase with parallel agent execution
     */
    async executePhase(job, phaseName, phaseConfig) {
        console.log(`🚀 Starting phase: ${phaseName}`);
        
        const phaseResult = {
            name: phaseName,
            status: 'running',
            startTime: new Date(),
            agents: new Map()
        };

        job.phases.set(phaseName, phaseResult);

        // Execute quality gates before phase
        if (phaseConfig['quality-gates']) {
            await this.executeQualityGates(job, phaseConfig['quality-gates']);
        }

        // Group agents by dependencies
        const agentGroups = this.groupAgentsByDependencies(phaseConfig.agents);
        
        // Execute agent groups sequentially, agents within group in parallel
        for (const agentGroup of agentGroups) {
            const agentPromises = agentGroup.map(agentConfig => 
                this.executeAgent(job, agentConfig)
            );
            
            const results = await Promise.all(agentPromises);
            
            // Merge results into job context
            for (const result of results) {
                if (result.outputs) {
                    for (const [key, value] of Object.entries(result.outputs)) {
                        job.context.set(key, value);
                    }
                }
            }
        }

        phaseResult.status = 'completed';
        phaseResult.endTime = new Date();
        
        console.log(`✅ Completed phase: ${phaseName}`);
    }

    /**
     * Execute a single agent task
     */
    async executeAgent(job, agentConfig) {
        const agentName = agentConfig.name;
        const agent = this.agents.get(agentName);
        
        if (!agent) {
            throw new Error(`Agent '${agentName}' not registered`);
        }

        console.log(`🤖 Executing agent: ${agentName} -> ${agentConfig.task}`);

        const startTime = new Date();
        agent.status = 'busy';
        agent.currentJob = job.id;

        try {
            // Prepare agent context
            const agentContext = this.prepareAgentContext(job, agentConfig);
            
            // Execute agent task (this would integrate with Claude Code Task tool)
            const result = await this.callAgent(agentName, agentConfig.task, agentContext);
            
            agent.status = 'idle';
            agent.currentJob = null;
            
            const duration = new Date() - startTime;
            console.log(`✅ Agent ${agentName} completed in ${duration}ms`);
            
            return {
                agent: agentName,
                task: agentConfig.task,
                status: 'success',
                duration,
                outputs: result.outputs || {}
            };

        } catch (error) {
            agent.status = 'error';
            console.error(`❌ Agent ${agentName} failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Prepare context for agent execution
     */
    prepareAgentContext(job, agentConfig) {
        const context = {
            jobId: job.id,
            workflow: job.workflow,
            inputs: {},
            sharedContext: Object.fromEntries(job.context)
        };

        // Add specific inputs for this agent
        if (agentConfig.inputs) {
            for (const inputKey of agentConfig.inputs) {
                if (job.context.has(inputKey)) {
                    context.inputs[inputKey] = job.context.get(inputKey);
                }
            }
        }

        return context;
    }

    /**
     * Call agent using Claude Code Task tool
     */
    async callAgent(agentName, task, context) {
        // This would integrate with Claude Code's Task tool
        // For now, return mock response
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    outputs: {
                        [`${agentName}_result`]: `Completed ${task}`,
                        [`${agentName}_timestamp`]: new Date().toISOString()
                    }
                });
            }, Math.random() * 2000 + 1000); // Simulate work
        });
    }

    /**
     * Group agents by their dependencies for parallel execution
     */
    groupAgentsByDependencies(agents) {
        const groups = [];
        const processed = new Set();
        
        while (processed.size < agents.length) {
            const currentGroup = [];
            
            for (const agent of agents) {
                if (processed.has(agent.name)) continue;
                
                const dependencies = agent.depends_on || [];
                const canExecute = dependencies.every(dep => processed.has(dep));
                
                if (canExecute) {
                    currentGroup.push(agent);
                    processed.add(agent.name);
                }
            }
            
            if (currentGroup.length === 0) {
                throw new Error('Circular dependency detected in agents');
            }
            
            groups.push(currentGroup);
        }
        
        return groups;
    }

    /**
     * Execute quality gates
     */
    async executeQualityGates(job, gates) {
        for (const gate of gates) {
            console.log(`🔍 Checking quality gate: ${gate}`);
            // Implementation would check specific conditions
            // For now, assume all gates pass
        }
    }

    /**
     * Generate unique job ID
     */
    generateJobId() {
        return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Get job status
     */
    getJobStatus(jobId) {
        return this.activeJobs.get(jobId);
    }

    /**
     * List all active jobs
     */
    getActiveJobs() {
        return Array.from(this.activeJobs.values());
    }
}

module.exports = AgentOrchestrator;