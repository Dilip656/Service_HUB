import { AgentConfig, AgentTask } from '@shared/agents';
import { storage } from '../storage';

export class QualityAssuranceAgent {
  public config: AgentConfig;
  public lastActive: Date;
  private qualityReports: any[] = [];

  constructor(config: AgentConfig) {
    this.config = config;
    this.lastActive = new Date();
  }

  async processTask(task: AgentTask): Promise<any> {
    this.lastActive = new Date();

    switch (task.taskType) {
      case 'quality_assurance':
        return await this.performQualityCheck(task);
      case 'performance_review':
        return await this.reviewPerformance(task);
      default:
        throw new Error(`Unknown task type: ${task.taskType}`);
    }
  }

  private async performQualityCheck(task: AgentTask): Promise<any> {
    const { targetId, targetType } = task.payload;
    
    let qualityScore = 0;
    let recommendations: string[] = [];

    if (targetType === 'provider') {
      const provider = await storage.getServiceProviderById(targetId);
      if (provider) {
        qualityScore = await this.assessProviderQuality(provider);
        recommendations = this.generateProviderRecommendations(provider, qualityScore);
      }
    }

    const report = {
      id: `qa-${Date.now()}`,
      targetId,
      targetType,
      qualityScore,
      recommendations,
      status: qualityScore >= 80 ? 'passed' : 'needs_improvement',
      createdAt: new Date(),
    };

    this.qualityReports.push(report);
    console.log(`QA Agent: Quality check completed for ${targetType} ${targetId} - Score: ${qualityScore}`);

    return report;
  }

  private async assessProviderQuality(provider: any): Promise<number> {
    let score = 70; // Base score

    // KYC verification
    if (provider.kycVerified) score += 20;
    
    // Phone verification
    if (provider.phoneVerified) score += 10;

    // Service description quality
    if (provider.description && provider.description.length > 50) score += 10;

    // Reasonable pricing
    const rate = parseFloat(provider.hourlyRate);
    if (rate >= 50 && rate <= 2000) score += 10;

    // Experience validation
    if (provider.experience > 0 && provider.experience <= 30) score += 5;

    return Math.min(100, score);
  }

  private generateProviderRecommendations(provider: any, score: number): string[] {
    const recommendations: string[] = [];

    if (!provider.kycVerified) {
      recommendations.push('Complete KYC verification');
    }

    if (!provider.phoneVerified) {
      recommendations.push('Verify phone number');
    }

    if (!provider.description || provider.description.length < 50) {
      recommendations.push('Improve service description');
    }

    if (score < 80) {
      recommendations.push('Address quality issues before activation');
    }

    return recommendations;
  }

  private async reviewPerformance(task: AgentTask): Promise<any> {
    return {
      performance: 'satisfactory',
      areas_for_improvement: [],
    };
  }

  public updateConfig(newConfig: Partial<AgentConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  public getMetrics(period: '24h' | '7d' | '30d') {
    return {
      qualityChecksPerformed: this.qualityReports.length,
      averageQualityScore: this.qualityReports.reduce((sum, report) => sum + report.qualityScore, 0) / this.qualityReports.length || 0,
      lastActive: this.lastActive,
      period,
    };
  }
}