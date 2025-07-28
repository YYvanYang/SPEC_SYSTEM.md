/**
 * Metrics Collector - Automated metrics collection and analysis
 */

const fs = require('fs').promises;
const path = require('path');

class MetricsCollector {
    constructor(config = {}) {
        this.config = {
            metricsDir: 'analytics',
            collectionInterval: config.collectionInterval || 3600000, // 1 hour
            realTimeMetrics: config.realTimeMetrics || true,
            dashboardRefresh: config.dashboardRefresh || 300000, // 5 minutes
            ...config
        };
        
        this.collectors = new Map();
        this.realTimeData = new Map();
        this.isCollecting = false;
    }

    /**
     * Initialize metrics collection system
     */
    async initialize() {
        await this.setupCollectors();
        await this.createMetricsDirectories();
        
        if (this.config.realTimeMetrics) {
            this.startRealTimeCollection();
        }
        
        console.log('📊 Metrics Collector initialized');
    }

    /**
     * Set up all metric collectors
     */
    async setupCollectors() {
        // Delivery Metrics
        this.collectors.set('delivery', {
            frequency: 'real-time',
            agent: 'metrics-analyst',
            collect: this.collectDeliveryMetrics.bind(this)
        });

        // Quality Indicators
        this.collectors.set('quality', {
            frequency: 'on-event',
            agent: 'quality-guardian',
            collect: this.collectQualityMetrics.bind(this)
        });

        // Team Performance
        this.collectors.set('team', {
            frequency: 'daily',
            agent: 'steering-architect',
            collect: this.collectTeamMetrics.bind(this)
        });

        // Business Impact
        this.collectors.set('business', {
            frequency: 'weekly',
            agent: 'metrics-analyst',
            collect: this.collectBusinessMetrics.bind(this)
        });
    }

    /**
     * Collect delivery metrics
     */
    async collectDeliveryMetrics() {
        const metrics = {
            timestamp: new Date().toISOString(),
            featureCycleTime: await this.calculateFeatureCycleTime(),
            throughput: await this.calculateThroughput(),
            leadTime: await this.calculateLeadTime(),
            deploymentFrequency: await this.calculateDeploymentFrequency(),
            firstPassSuccessRate: await this.calculateFirstPassSuccessRate()
        };

        await this.storeMetrics('delivery-metrics', metrics);
        this.updateRealTimeData('delivery', metrics);
        
        return metrics;
    }

    /**
     * Collect quality metrics
     */
    async collectQualityMetrics() {
        const metrics = {
            timestamp: new Date().toISOString(),
            defectDensity: await this.calculateDefectDensity(),
            testCoverage: await this.calculateTestCoverage(),
            securityVulnerabilities: await this.countSecurityVulnerabilities(),
            codeMaintainability: await this.assessCodeMaintainability(),
            requirementsClarity: await this.assessRequirementsClarity()
        };

        await this.storeMetrics('quality-metrics', metrics);
        this.updateRealTimeData('quality', metrics);
        
        return metrics;
    }

    /**
     * Collect team performance metrics
     */
    async collectTeamMetrics() {
        const metrics = {
            timestamp: new Date().toISOString(),
            agentCollaborationEfficiency: await this.assessAgentCollaboration(),
            contextSwitchingFrequency: await this.calculateContextSwitching(),
            knowledgeTransferEffectiveness: await this.assessKnowledgeTransfer(),
            decisionReversalRate: await this.calculateDecisionReversals()
        };

        await this.storeMetrics('team-metrics', metrics);
        this.updateRealTimeData('team', metrics);
        
        return metrics;
    }

    /**
     * Collect business impact metrics
     */
    async collectBusinessMetrics() {
        const metrics = {
            timestamp: new Date().toISOString(),
            featureAdoption: await this.measureFeatureAdoption(),
            userSatisfaction: await this.measureUserSatisfaction(),
            businessValueDelivered: await this.calculateBusinessValue(),
            customerSuccessImpact: await this.assessCustomerSuccess()
        };

        await this.storeMetrics('business-metrics', metrics);
        this.updateRealTimeData('business', metrics);
        
        return metrics;
    }

    /**
     * Calculate feature cycle time (spec to production)
     */
    async calculateFeatureCycleTime() {
        try {
            const features = await this.getCompletedFeatures();
            const cycleTimes = features.map(feature => {
                const start = new Date(feature.specCreated);
                const end = new Date(feature.productionDeployment);
                return (end - start) / (1000 * 60 * 60 * 24); // days
            });

            return {
                average: cycleTimes.reduce((a, b) => a + b, 0) / cycleTimes.length,
                p50: this.percentile(cycleTimes, 50),
                p90: this.percentile(cycleTimes, 90),
                p99: this.percentile(cycleTimes, 99),
                trend: this.calculateTrend(cycleTimes)
            };
        } catch (error) {
            console.warn('⚠️  Could not calculate cycle time:', error.message);
            return { average: 0, p50: 0, p90: 0, p99: 0, trend: 'unknown' };
        }
    }

    /**
     * Calculate throughput (features per time period)
     */
    async calculateThroughput() {
        try {
            const now = new Date();
            const periods = [7, 30, 90]; // days
            
            const throughput = {};
            
            for (const days of periods) {
                const since = new Date(now - days * 24 * 60 * 60 * 1000);
                const features = await this.getFeaturesCompletedSince(since);
                throughput[`${days}days`] = features.length;
            }
            
            return throughput;
        } catch (error) {
            console.warn('⚠️  Could not calculate throughput:', error.message);
            return { '7days': 0, '30days': 0, '90days': 0 };
        }
    }

    /**
     * Calculate first-pass success rate
     */
    async calculateFirstPassSuccessRate() {
        try {
            const features = await this.getRecentFeatures(30); // last 30 days
            const successful = features.filter(f => !f.requiredRework);
            
            return {
                rate: successful.length / features.length,
                total: features.length,
                successful: successful.length,
                trend: this.calculateSuccessTrend(features)
            };
        } catch (error) {
            console.warn('⚠️  Could not calculate first-pass success rate:', error.message);
            return { rate: 0, total: 0, successful: 0, trend: 'unknown' };
        }
    }

    /**
     * Calculate defect density
     */
    async calculateDefectDensity() {
        try {
            const bugs = await this.getRecentBugs(30);
            const features = await this.getRecentFeatures(30);
            
            return {
                bugsPerFeature: bugs.length / features.length,
                totalBugs: bugs.length,
                totalFeatures: features.length,
                severity: this.groupBugsBySeverity(bugs)
            };
        } catch (error) {
            console.warn('⚠️  Could not calculate defect density:', error.message);
            return { bugsPerFeature: 0, totalBugs: 0, totalFeatures: 0 };
        }
    }

    /**
     * Assess agent collaboration efficiency
     */
    async assessAgentCollaboration() {
        try {
            const handoffs = await this.getAgentHandoffs(7); // last 7 days
            const successful = handoffs.filter(h => h.status === 'success');
            
            const efficiency = successful.length / handoffs.length;
            const bottlenecks = this.identifyBottlenecks(handoffs);
            
            return {
                efficiency,
                totalHandoffs: handoffs.length,
                successfulHandoffs: successful.length,
                bottlenecks
            };
        } catch (error) {
            console.warn('⚠️  Could not assess agent collaboration:', error.message);
            return { efficiency: 0, totalHandoffs: 0, successfulHandoffs: 0, bottlenecks: [] };
        }
    }

    /**
     * Generate analytics dashboard
     */
    async generateDashboard() {
        const dashboard = {
            generatedAt: new Date().toISOString(),
            delivery: this.realTimeData.get('delivery') || {},
            quality: this.realTimeData.get('quality') || {},
            team: this.realTimeData.get('team') || {},
            business: this.realTimeData.get('business') || {},
            alerts: await this.generateAlerts(),
            trends: await this.calculateTrends(),
            recommendations: await this.generateRecommendations()
        };

        await this.storeDashboard(dashboard);
        return dashboard;
    }

    /**
     * Generate alerts based on thresholds
     */
    async generateAlerts() {
        const alerts = [];
        const delivery = this.realTimeData.get('delivery') || {};
        const quality = this.realTimeData.get('quality') || {};

        // Performance degradation alert
        if (delivery.featureCycleTime?.average > this.getHistoricalAverage('cycleTime') * 2) {
            alerts.push({
                type: 'performance_degradation',
                severity: 'high',
                message: 'Cycle time is 2x higher than historical average',
                recipients: ['team-lead', 'steering-architect']
            });
        }

        // Quality threshold breach
        if (quality.defectDensity?.bugsPerFeature > 0.5 || quality.testCoverage?.percentage < 80) {
            alerts.push({
                type: 'quality_threshold_breach',
                severity: 'medium',
                message: 'Quality metrics below acceptable thresholds',
                recipients: ['quality-guardian', 'team']
            });
        }

        return alerts;
    }

    /**
     * Store metrics to file system
     */
    async storeMetrics(type, metrics) {
        try {
            const filePath = path.join(this.config.metricsDir, `${type}.json`);
            
            // Load existing data
            let existingData = [];
            try {
                const existing = await fs.readFile(filePath, 'utf8');
                existingData = JSON.parse(existing);
            } catch (error) {
                // File doesn't exist, start with empty array
            }
            
            // Add new metrics
            existingData.push(metrics);
            
            // Keep only last 1000 entries to prevent unlimited growth
            if (existingData.length > 1000) {
                existingData = existingData.slice(-1000);
            }
            
            await fs.writeFile(filePath, JSON.stringify(existingData, null, 2));
        } catch (error) {
            console.error(`❌ Failed to store ${type} metrics:`, error);
        }
    }

    /**
     * Create metrics directories
     */
    async createMetricsDirectories() {
        const dirs = [
            this.config.metricsDir,
            path.join(this.config.metricsDir, 'dashboards'),
            path.join(this.config.metricsDir, 'alerts'),
            path.join(this.config.metricsDir, 'trends')
        ];

        for (const dir of dirs) {
            await fs.mkdir(dir, { recursive: true });
        }
    }

    /**
     * Start real-time collection
     */
    startRealTimeCollection() {
        if (this.isCollecting) return;
        
        this.isCollecting = true;
        console.log('🔄 Starting real-time metrics collection');
        
        // Collect delivery metrics every minute
        setInterval(() => this.collectDeliveryMetrics(), 60000);
        
        // Generate dashboard every 5 minutes
        setInterval(() => this.generateDashboard(), this.config.dashboardRefresh);
    }

    /**
     * Helper methods for calculations
     */
    percentile(arr, p) {
        const sorted = arr.sort((a, b) => a - b);
        const index = Math.ceil((p / 100) * sorted.length) - 1;
        return sorted[index] || 0;
    }

    calculateTrend(values) {
        if (values.length < 2) return 'insufficient_data';
        const recent = values.slice(-10);
        const older = values.slice(-20, -10);
        const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
        const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
        
        if (recentAvg > olderAvg * 1.1) return 'worsening';
        if (recentAvg < olderAvg * 0.9) return 'improving';
        return 'stable';
    }

    updateRealTimeData(type, data) {
        this.realTimeData.set(type, data);
    }

    // Mock data methods - in real implementation these would query actual data sources
    async getCompletedFeatures() { return []; }
    async getFeaturesCompletedSince(date) { return []; }
    async getRecentFeatures(days) { return []; }
    async getRecentBugs(days) { return []; }
    async getAgentHandoffs(days) { return []; }
    
    groupBugsBySeverity(bugs) {
        return { critical: 0, high: 0, medium: 0, low: 0 };
    }
    
    identifyBottlenecks(handoffs) { return []; }
    getHistoricalAverage(metric) { return 5; }
    
    async calculateTrends() { return {}; }
    async generateRecommendations() { return []; }
    
    async storeDashboard(dashboard) {
        const dashboardPath = path.join(this.config.metricsDir, 'dashboards', 'current.json');
        await fs.writeFile(dashboardPath, JSON.stringify(dashboard, null, 2));
    }
}

module.exports = MetricsCollector;