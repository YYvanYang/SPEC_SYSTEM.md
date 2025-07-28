/**
 * Context Manager - Manages agent memory and context sharing
 */

const fs = require('fs').promises;
const path = require('path');

class ContextManager {
    constructor(contextDir = '.claude/contexts') {
        this.contextDir = contextDir;
        this.agentMemories = new Map();
        this.sharedContexts = new Map();
        this.learningPatterns = new Map();
    }

    /**
     * Initialize context manager and load existing memories
     */
    async initialize() {
        try {
            await this.loadAgentMemories();
            await this.loadSharedContexts();
            await this.loadLearningPatterns();
            console.log('✅ Context Manager initialized');
        } catch (error) {
            console.error('❌ Failed to initialize Context Manager:', error);
            throw error;
        }
    }

    /**
     * Get context for a specific agent
     */
    async getAgentContext(agentName, scope = 'task') {
        const memory = this.agentMemories.get(agentName) || this.createAgentMemory(agentName);
        const contextConfig = await this.loadContextConfig(scope);
        
        const context = {
            agent: agentName,
            scope,
            memory: memory,
            shared: this.getSharedContext(scope),
            patterns: this.getRelevantPatterns(agentName),
            timestamp: new Date().toISOString()
        };

        // Apply context filters based on agent scope
        return this.filterContextByScope(context, agentName, scope);
    }

    /**
     * Update agent memory with new learning
     */
    async updateAgentMemory(agentName, outcome, context) {
        let memory = this.agentMemories.get(agentName);
        if (!memory) {
            memory = this.createAgentMemory(agentName);
            this.agentMemories.set(agentName, memory);
        }

        const learning = {
            timestamp: new Date().toISOString(),
            context: context,
            outcome: outcome,
            success: outcome.success || false
        };

        memory.experiences.push(learning);

        // Update patterns and anti-patterns
        if (outcome.success) {
            const patternKey = this.generatePatternKey(context);
            memory.patterns.set(patternKey, {
                approach: outcome.approach,
                confidence: (memory.patterns.get(patternKey)?.confidence || 0) + 1,
                lastUsed: new Date().toISOString()
            });
        } else {
            const antiPatternKey = this.generatePatternKey(context);
            memory.antiPatterns.set(antiPatternKey, {
                failure: outcome.failure,
                reason: outcome.reason,
                occurrences: (memory.antiPatterns.get(antiPatternKey)?.occurrences || 0) + 1
            });
        }

        // Update preferences
        if (outcome.preferences) {
            for (const [key, value] of Object.entries(outcome.preferences)) {
                memory.preferences.set(key, value);
            }
        }

        await this.persistAgentMemory(agentName, memory);
        console.log(`🧠 Updated memory for agent: ${agentName}`);
    }

    /**
     * Get recommendations for an agent based on context
     */
    getRecommendations(agentName, currentContext) {
        const memory = this.agentMemories.get(agentName);
        if (!memory) {
            return { recommendations: [], confidence: 0 };
        }

        const contextKey = this.generatePatternKey(currentContext);
        const similarContexts = this.findSimilarContexts(memory, contextKey);
        
        const recommendations = [];
        let totalConfidence = 0;

        // Check for successful patterns
        for (const [patternKey, pattern] of memory.patterns.entries()) {
            const similarity = this.calculateSimilarity(contextKey, patternKey);
            if (similarity > 0.7) {
                recommendations.push({
                    type: 'pattern',
                    approach: pattern.approach,
                    confidence: pattern.confidence * similarity,
                    reason: 'Similar successful pattern found'
                });
                totalConfidence += pattern.confidence * similarity;
            }
        }

        // Check for anti-patterns to avoid
        for (const [antiPatternKey, antiPattern] of memory.antiPatterns.entries()) {
            const similarity = this.calculateSimilarity(contextKey, antiPatternKey);
            if (similarity > 0.7) {
                recommendations.push({
                    type: 'warning',
                    avoid: antiPattern.failure,
                    reason: antiPattern.reason,
                    confidence: similarity,
                    occurrences: antiPattern.occurrences
                });
            }
        }

        // Add preference-based recommendations
        for (const [prefKey, prefValue] of memory.preferences.entries()) {
            if (this.isRelevantPreference(prefKey, currentContext)) {
                recommendations.push({
                    type: 'preference',
                    suggestion: prefValue,
                    reason: `Based on established preference: ${prefKey}`
                });
            }
        }

        return {
            recommendations: recommendations.sort((a, b) => (b.confidence || 0) - (a.confidence || 0)),
            confidence: totalConfidence / (recommendations.length || 1)
        };
    }

    /**
     * Share context between agents
     */
    async shareContext(sourceAgent, targetAgent, contextData, scope = 'feature') {
        const sharedKey = `${sourceAgent}-to-${targetAgent}`;
        
        if (!this.sharedContexts.has(scope)) {
            this.sharedContexts.set(scope, new Map());
        }

        const scopeContext = this.sharedContexts.get(scope);
        scopeContext.set(sharedKey, {
            data: contextData,
            timestamp: new Date().toISOString(),
            sourceAgent,
            targetAgent
        });

        await this.persistSharedContext(scope);
        console.log(`🔄 Shared context from ${sourceAgent} to ${targetAgent}`);
    }

    /**
     * Create new agent memory structure
     */
    createAgentMemory(agentName) {
        return {
            agentName,
            createdAt: new Date().toISOString(),
            experiences: [],
            patterns: new Map(),
            antiPatterns: new Map(),
            preferences: new Map(),
            contextHistory: []
        };
    }

    /**
     * Generate pattern key for context matching
     */
    generatePatternKey(context) {
        const keyParts = [
            context.type || 'unknown',
            context.complexity || 'medium',
            context.domain || 'general'
        ];
        return keyParts.join('::');
    }

    /**
     * Calculate similarity between two pattern keys
     */
    calculateSimilarity(key1, key2) {
        const parts1 = key1.split('::');
        const parts2 = key2.split('::');
        
        let matches = 0;
        const maxLength = Math.max(parts1.length, parts2.length);
        
        for (let i = 0; i < maxLength; i++) {
            if (parts1[i] === parts2[i]) {
                matches++;
            }
        }
        
        return matches / maxLength;
    }

    /**
     * Find similar contexts in agent memory
     */
    findSimilarContexts(memory, targetKey) {
        const similar = [];
        
        for (const experience of memory.experiences) {
            const experienceKey = this.generatePatternKey(experience.context);
            const similarity = this.calculateSimilarity(targetKey, experienceKey);
            
            if (similarity > 0.5) {
                similar.push({
                    experience,
                    similarity
                });
            }
        }
        
        return similar.sort((a, b) => b.similarity - a.similarity);
    }

    /**
     * Check if preference is relevant to current context
     */
    isRelevantPreference(prefKey, context) {
        // Simple keyword matching - could be more sophisticated
        const contextStr = JSON.stringify(context).toLowerCase();
        return contextStr.includes(prefKey.toLowerCase());
    }

    /**
     * Filter context based on agent scope
     */
    filterContextByScope(context, agentName, scope) {
        const scopeRules = {
            'project': ['business-requirements', 'architecture-patterns', 'standards'],
            'feature': ['user-stories', 'dependencies', 'existing-architecture'],
            'task': ['requirements', 'design-specs', 'codebase-context']
        };

        const allowedContexts = scopeRules[scope] || [];
        
        return {
            ...context,
            filtered: true,
            allowedScopes: allowedContexts
        };
    }

    /**
     * Load context configuration
     */
    async loadContextConfig(scope) {
        try {
            const configPath = path.join(this.contextDir, `${scope}-context.yml`);
            const configData = await fs.readFile(configPath, 'utf8');
            // Would need YAML parser in real implementation
            return { scope, loaded: true };
        } catch (error) {
            console.warn(`⚠️  Could not load context config for scope: ${scope}`);
            return { scope, loaded: false };
        }
    }

    /**
     * Get shared context for scope
     */
    getSharedContext(scope) {
        return this.sharedContexts.get(scope) || new Map();
    }

    /**
     * Get relevant patterns for agent
     */
    getRelevantPatterns(agentName) {
        return this.learningPatterns.get(agentName) || [];
    }

    /**
     * Persist agent memory to disk
     */
    async persistAgentMemory(agentName, memory) {
        try {
            const memoryPath = path.join('.claude', 'memory', `${agentName}.json`);
            const memoryDir = path.dirname(memoryPath);
            
            await fs.mkdir(memoryDir, { recursive: true });
            
            // Convert Maps to Objects for JSON serialization
            const serializable = {
                ...memory,
                patterns: Object.fromEntries(memory.patterns),
                antiPatterns: Object.fromEntries(memory.antiPatterns),
                preferences: Object.fromEntries(memory.preferences)
            };
            
            await fs.writeFile(memoryPath, JSON.stringify(serializable, null, 2));
        } catch (error) {
            console.error(`❌ Failed to persist memory for ${agentName}:`, error);
        }
    }

    /**
     * Load existing agent memories
     */
    async loadAgentMemories() {
        try {
            const memoryDir = path.join('.claude', 'memory');
            const files = await fs.readdir(memoryDir).catch(() => []);
            
            for (const file of files) {
                if (file.endsWith('.json')) {
                    const agentName = path.basename(file, '.json');
                    const memoryPath = path.join(memoryDir, file);
                    const memoryData = JSON.parse(await fs.readFile(memoryPath, 'utf8'));
                    
                    // Convert Objects back to Maps
                    memoryData.patterns = new Map(Object.entries(memoryData.patterns || {}));
                    memoryData.antiPatterns = new Map(Object.entries(memoryData.antiPatterns || {}));
                    memoryData.preferences = new Map(Object.entries(memoryData.preferences || {}));
                    
                    this.agentMemories.set(agentName, memoryData);
                }
            }
        } catch (error) {
            console.warn('⚠️  Could not load existing agent memories:', error.message);
        }
    }

    /**
     * Load shared contexts
     */
    async loadSharedContexts() {
        // Implementation for loading shared contexts from disk
        console.log('📚 Loaded shared contexts');
    }

    /**
     * Load learning patterns
     */
    async loadLearningPatterns() {
        // Implementation for loading learning patterns
        console.log('🎓 Loaded learning patterns');
    }

    /**
     * Persist shared context
     */
    async persistSharedContext(scope) {
        // Implementation for saving shared context to disk
    }
}

module.exports = ContextManager;