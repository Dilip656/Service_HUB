import { AgentConfig, AgentType, AgentTask, AgentDecision, agentTypes, defaultAgentConfigs } from '@shared/agents';
import { KYCAgent } from './KYCAgent';
import { ServiceQualityAgent } from './ServiceQualityAgent';
import { FraudDetectionAgent } from './FraudDetectionAgent';
import { UserSupportAgent } from './UserSupportAgent';
import { QualityAssuranceAgent } from './QualityAssuranceAgent';

export class AgentManager {
  private agents: Map<string, any> = new Map();
  private taskQueue: Map<string, AgentTask[]> = new Map();
  private isProcessing = false;

  constructor() {
    this.initializeAgents();
    this.startTaskProcessor();
  }

  private initializeAgents() {
    // Initialize default agents
    defaultAgentConfigs.forEach(config => {
      this.createAgent(config);
    });

    console.log(`AgentManager: Initialized ${this.agents.size} agents`);
  }

  private createAgent(config: AgentConfig) {
    let agent;

    switch (config.type) {
      case agentTypes.KYC_AGENT:
        agent = new KYCAgent(config);
        break;
      case agentTypes.SERVICE_AGENT:
        agent = new ServiceQualityAgent(config);
        break;
      case agentTypes.FRAUD_DETECTION_AGENT:
        agent = new FraudDetectionAgent(config);
        break;
      case agentTypes.USER_SUPPORT_AGENT:
        agent = new UserSupportAgent(config);
        break;
      case agentTypes.QUALITY_ASSURANCE_AGENT:
        agent = new QualityAssuranceAgent(config);
        break;
      default:
        throw new Error(`Unknown agent type: ${config.type}`);
    }

    this.agents.set(config.id, agent);
    this.taskQueue.set(config.id, []);
    
    console.log(`Agent created: ${config.name} (${config.id})`);
  }

  // Add task to agent queue
  public addTask(agentId: string, task: AgentTask): void {
    const queue = this.taskQueue.get(agentId);
    if (!queue) {
      throw new Error(`Agent ${agentId} not found`);
    }

    // Insert task based on priority
    const priorityOrder = { 'critical': 0, 'high': 1, 'medium': 2, 'low': 3 };
    const taskPriority = priorityOrder[task.priority];
    
    let insertIndex = queue.length;
    for (let i = 0; i < queue.length; i++) {
      if (priorityOrder[queue[i].priority] > taskPriority) {
        insertIndex = i;
        break;
      }
    }

    queue.splice(insertIndex, 0, task);
    console.log(`Task added to ${agentId} queue. Queue size: ${queue.length}`);
  }

  // Add task by agent type (auto-assigns to best available agent)
  public addTaskByType(agentType: AgentType, task: AgentTask): void {
    const availableAgents = Array.from(this.agents.entries())
      .filter(([_, agent]) => agent.config.type === agentType && agent.config.isActive)
      .sort((a, b) => {
        const queueA = this.taskQueue.get(a[0])?.length || 0;
        const queueB = this.taskQueue.get(b[0])?.length || 0;
        return queueA - queueB; // Assign to agent with smallest queue
      });

    if (availableAgents.length === 0) {
      throw new Error(`No active agents available for type: ${agentType}`);
    }

    const selectedAgentId = availableAgents[0][0];
    task.agentId = selectedAgentId;
    this.addTask(selectedAgentId, task);
  }

  // Process KYC for a provider
  public async processKYC(providerId: number, priority: 'low' | 'medium' | 'high' | 'critical' = 'medium'): Promise<void> {
    const task: AgentTask = {
      id: `kyc-${providerId}-${Date.now()}`,
      agentId: '', // Will be set by addTaskByType
      taskType: 'kyc_verification',
      priority,
      status: 'pending',
      targetId: providerId,
      targetType: 'provider',
      payload: { providerId },
      createdAt: new Date(),
    };

    this.addTaskByType(agentTypes.KYC_AGENT, task);
  }

  // Process service quality check
  public async processService(serviceId: number, providerId: number, priority: 'low' | 'medium' | 'high' | 'critical' = 'medium'): Promise<void> {
    const task: AgentTask = {
      id: `service-${serviceId}-${Date.now()}`,
      agentId: '',
      taskType: 'service_quality_check',
      priority,
      status: 'pending',
      targetId: serviceId,
      targetType: 'service',
      payload: { serviceId, providerId },
      createdAt: new Date(),
    };

    this.addTaskByType(agentTypes.SERVICE_AGENT, task);
  }

  // Process user support request
  public async processUserSupport(userId: number, requestType: string, data: any, priority: 'low' | 'medium' | 'high' | 'critical' = 'medium'): Promise<void> {
    const task: AgentTask = {
      id: `support-${userId}-${Date.now()}`,
      agentId: '',
      taskType: requestType,
      priority,
      status: 'pending',
      targetId: userId,
      targetType: 'user',
      payload: { userId, requestType, data },
      createdAt: new Date(),
    };

    this.addTaskByType(agentTypes.USER_SUPPORT_AGENT, task);
  }

  // Run fraud detection on a provider
  public async runFraudDetection(providerId: number, priority: 'high' | 'critical' = 'high'): Promise<void> {
    const task: AgentTask = {
      id: `fraud-${providerId}-${Date.now()}`,
      agentId: '',
      taskType: 'fraud_detection',
      priority,
      status: 'pending',
      targetId: providerId,
      targetType: 'provider',
      payload: { providerId },
      createdAt: new Date(),
    };

    this.addTaskByType(agentTypes.FRAUD_DETECTION_AGENT, task);
  }

  // Quality assurance check
  public async runQualityAssurance(targetId: number, targetType: 'provider' | 'service', priority: 'low' | 'medium' | 'high' = 'medium'): Promise<void> {
    const task: AgentTask = {
      id: `qa-${targetType}-${targetId}-${Date.now()}`,
      agentId: '',
      taskType: 'quality_assurance',
      priority,
      status: 'pending',
      targetId,
      targetType,
      payload: { targetId, targetType },
      createdAt: new Date(),
    };

    this.addTaskByType(agentTypes.QUALITY_ASSURANCE_AGENT, task);
  }

  // Start the task processor
  private startTaskProcessor() {
    setInterval(async () => {
      if (this.isProcessing) return;
      this.isProcessing = true;

      try {
        await this.processAllQueues();
      } catch (error) {
        console.error('Error processing agent queues:', error);
      } finally {
        this.isProcessing = false;
      }
    }, 1000); // Process every second
  }

  private async processAllQueues() {
    for (const [agentId, agent] of this.agents.entries()) {
      if (!agent.config.isActive) continue;

      const queue = this.taskQueue.get(agentId);
      if (!queue || queue.length === 0) continue;

      // Process one task per agent per cycle
      const task = queue.shift();
      if (task) {
        task.status = 'processing';
        task.processedAt = new Date();

        try {
          const result = await agent.processTask(task);
          task.status = 'completed';
          task.result = result;
          task.completedAt = new Date();
          
          console.log(`Task ${task.id} completed by agent ${agentId}`);
        } catch (error) {
          task.status = 'failed';
          task.error = error instanceof Error ? error.message : 'Unknown error';
          console.error(`Task ${task.id} failed in agent ${agentId}:`, error);
        }
      }
    }
  }

  // Get agent status
  public getAgentStatus(agentId: string) {
    const agent = this.agents.get(agentId);
    const queue = this.taskQueue.get(agentId);
    
    if (!agent || !queue) {
      throw new Error(`Agent ${agentId} not found`);
    }

    return {
      agentId,
      config: agent.config,
      queueSize: queue.length,
      status: agent.config.isActive ? 'online' : 'offline',
      lastActive: agent.lastActive || new Date(),
    };
  }

  // Get all agent statuses
  public getAllAgentStatuses() {
    return Array.from(this.agents.keys()).map(agentId => this.getAgentStatus(agentId));
  }

  // Get agent performance metrics
  public getAgentMetrics(agentId: string, period: '24h' | '7d' | '30d' = '24h') {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    return agent.getMetrics(period);
  }

  // Configure agent
  public configureAgent(agentId: string, newConfig: Partial<AgentConfig>) {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    agent.updateConfig(newConfig);
    console.log(`Agent ${agentId} configuration updated`);
  }

  // Enable/disable agent
  public setAgentActive(agentId: string, isActive: boolean) {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    agent.config.isActive = isActive;
    console.log(`Agent ${agentId} ${isActive ? 'activated' : 'deactivated'}`);
  }

  // Get queue information
  public getQueueInfo() {
    const queueInfo: Record<string, any> = {};
    
    for (const [agentId, queue] of this.taskQueue.entries()) {
      const agent = this.agents.get(agentId);
      queueInfo[agentId] = {
        agentName: agent?.config.name || 'Unknown',
        agentType: agent?.config.type || 'Unknown',
        queueSize: queue.length,
        pendingTasks: queue.filter(task => task.status === 'pending').length,
        processingTasks: queue.filter(task => task.status === 'processing').length,
        isActive: agent?.config.isActive || false,
      };
    }

    return queueInfo;
  }

  // Emergency stop all agents
  public emergencyStop() {
    for (const [agentId, agent] of this.agents.entries()) {
      agent.config.isActive = false;
      console.log(`Emergency stop: Agent ${agentId} deactivated`);
    }
  }

  // Restart all agents
  public restartAllAgents() {
    for (const [agentId, agent] of this.agents.entries()) {
      agent.config.isActive = true;
      console.log(`Agent ${agentId} reactivated`);
    }
  }

  // Process all pending KYC applications
  public async processAllPendingKYCs(): Promise<void> {
    try {
      const { storage } = await import('../storage');
      const providers = await storage.getAllServiceProviders();
      
      // Find providers with pending KYC status
      const pendingProviders = providers.filter(provider => 
        provider.status === 'Pending KYC Review' || 
        (provider.kycVerified === false && provider.kycDocuments)
      );

      console.log(`Found ${pendingProviders.length} pending KYC applications`);

      // Process each pending provider
      for (const provider of pendingProviders) {
        console.log(`Processing KYC for provider ${provider.id}: ${provider.businessName}`);
        await this.processKYC(provider.id, 'high');
      }

      if (pendingProviders.length === 0) {
        console.log('No pending KYC applications found');
      }
    } catch (error) {
      console.error('Error processing pending KYCs:', error);
      throw error;
    }
  }
}

// Singleton instance
export const agentManager = new AgentManager();