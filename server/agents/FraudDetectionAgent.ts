import { AgentConfig, AgentTask } from '@shared/agents';
import { storage } from '../storage';

export class FraudDetectionAgent {
  public config: AgentConfig;
  public lastActive: Date;
  private alerts: any[] = [];

  constructor(config: AgentConfig) {
    this.config = config;
    this.lastActive = new Date();
  }

  async processTask(task: AgentTask): Promise<any> {
    this.lastActive = new Date();

    switch (task.taskType) {
      case 'fraud_detection':
        return await this.detectFraud(task);
      case 'risk_assessment':
        return await this.assessRisk(task);
      default:
        throw new Error(`Unknown task type: ${task.taskType}`);
    }
  }

  private async detectFraud(task: AgentTask): Promise<any> {
    const { providerId } = task.payload;
    const provider = await storage.getServiceProviderById(providerId);
    
    if (!provider) throw new Error(`Provider ${providerId} not found`);

    const fraudScore = await this.calculateFraudScore(provider);
    
    if (fraudScore > 80) {
      await this.createAlert('high_fraud_risk', providerId, fraudScore);
      console.log(`FRAUD ALERT: Provider ${providerId} has fraud score ${fraudScore}`);
    }

    return { fraudScore, riskLevel: this.getRiskLevel(fraudScore) };
  }

  private async calculateFraudScore(provider: any): Promise<number> {
    let score = 0;

    // Check for suspicious patterns
    if (provider.hourlyRate < 50 || provider.hourlyRate > 5000) score += 30;
    if (provider.experience > 40) score += 20;
    if (!provider.phoneVerified) score += 15;
    if (!provider.kycVerified) score += 25;

    return Math.min(100, score);
  }

  private getRiskLevel(score: number): string {
    if (score > 80) return 'critical';
    if (score > 60) return 'high';
    if (score > 40) return 'medium';
    return 'low';
  }

  private async createAlert(type: string, targetId: number, score: number): Promise<void> {
    const alert = {
      id: `alert-${Date.now()}`,
      type,
      targetId,
      score,
      timestamp: new Date(),
      agentId: this.config.id,
    };
    
    this.alerts.push(alert);
  }

  private async assessRisk(task: AgentTask): Promise<any> {
    return { riskLevel: 'low', assessment: 'No immediate risks detected' };
  }

  public updateConfig(newConfig: Partial<AgentConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  public getMetrics(period: '24h' | '7d' | '30d') {
    return {
      alertsGenerated: this.alerts.length,
      lastActive: this.lastActive,
      period,
    };
  }
}