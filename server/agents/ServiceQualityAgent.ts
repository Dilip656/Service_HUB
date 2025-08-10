import { AgentConfig, AgentTask, ServiceQualityResult } from '@shared/agents';
import { storage } from '../storage';

export class ServiceQualityAgent {
  public config: AgentConfig;
  public lastActive: Date;
  private decisions: any[] = [];
  private metrics = {
    tasksProcessed: 0,
    tasksCompleted: 0,
    averageProcessingTime: 0,
    accuracyRate: 0,
  };

  constructor(config: AgentConfig) {
    this.config = config;
    this.lastActive = new Date();
  }

  async processTask(task: AgentTask): Promise<any> {
    this.lastActive = new Date();
    this.metrics.tasksProcessed++;

    const startTime = Date.now();

    try {
      switch (task.taskType) {
        case 'service_quality_check':
          return await this.processServiceQualityCheck(task);
        case 'duplicate_detection':
          return await this.processDuplicateDetection(task);
        case 'content_moderation':
          return await this.processContentModeration(task);
        default:
          throw new Error(`Unknown task type: ${task.taskType}`);
      }
    } finally {
      const processingTime = Date.now() - startTime;
      this.updateMetrics(processingTime);
    }
  }

  private async processServiceQualityCheck(task: AgentTask): Promise<ServiceQualityResult> {
    const { serviceId, providerId } = task.payload;
    
    console.log(`Service Quality Agent: Analyzing service ${serviceId} from provider ${providerId}`);

    // Get service and provider data
    const provider = await storage.getServiceProviderById(providerId);
    if (!provider) {
      throw new Error(`Provider ${providerId} not found`);
    }

    // Analyze service quality
    const qualityResult = await this.analyzeServiceQuality(provider, serviceId);

    // Make decision and take action
    await this.processQualityDecision(qualityResult);

    return qualityResult;
  }

  private async analyzeServiceQuality(provider: any, serviceId?: number): Promise<ServiceQualityResult> {
    const checks = {
      contentQuality: await this.analyzeContentQuality(provider),
      duplicateDetection: await this.detectDuplicateServices(provider),
      complianceCheck: await this.checkCompliance(provider),
    };

    const qualityScore = this.calculateQualityScore(checks);
    const riskScore = this.calculateServiceRiskScore(checks);
    const decision = this.determineServiceDecision(qualityScore, riskScore);

    return {
      serviceId: serviceId || 0,
      providerId: provider.id,
      qualityScore,
      riskScore,
      decision,
      checks,
      suggestions: this.generateServiceSuggestions(checks, qualityScore),
      autoModerationTriggered: this.shouldTriggerAutoModeration(checks),
    };
  }

  private async analyzeContentQuality(provider: any) {
    const description = provider.description || '';
    const businessName = provider.businessName || '';
    const serviceName = provider.serviceName || '';

    // Description quality analysis
    let descriptionScore = 50;
    const descriptionIssues: string[] = [];

    if (description.length < 20) {
      descriptionIssues.push('Description too short');
      descriptionScore -= 30;
    } else if (description.length > 500) {
      descriptionScore += 20;
    }

    // Check for quality indicators
    if (description.includes('experience') || description.includes('professional')) {
      descriptionScore += 10;
    }

    // Check for spam indicators
    if (description.match(/[!]{3,}/) || description.match(/[A-Z]{10,}/)) {
      descriptionIssues.push('Potential spam content detected');
      descriptionScore -= 20;
    }

    // Category appropriateness
    const categoryAppropriate = this.checkCategoryAppropriateness(serviceName, provider.serviceCategory);
    
    // Pricing analysis
    const hourlyRate = parseFloat(provider.hourlyRate);
    const marketRate = await this.getMarketRate(serviceName, provider.serviceCategory);
    const pricingReasonable = this.isPricingReasonable(hourlyRate, marketRate);

    return {
      description: {
        score: Math.max(0, Math.min(100, descriptionScore)),
        issues: descriptionIssues,
      },
      category: {
        appropriate: categoryAppropriate,
        score: categoryAppropriate ? 90 : 30,
      },
      pricing: {
        reasonable: pricingReasonable,
        score: pricingReasonable ? 85 : 50,
        marketRate,
      },
    };
  }

  private checkCategoryAppropriateness(serviceName: string, category: string): boolean {
    const serviceLower = serviceName.toLowerCase();
    
    const categoryKeywords: Record<string, string[]> = {
      'home': ['cleaning', 'plumbing', 'electrical', 'repair', 'maintenance', 'gardening', 'ac'],
      'personal_care': ['beauty', 'hair', 'massage', 'fitness', 'nail', 'salon'],
      'events': ['wedding', 'party', 'catering', 'photography', 'decoration', 'dj'],
      'business': ['consulting', 'marketing', 'accounting', 'legal', 'development', 'design'],
    };

    const keywords = categoryKeywords[category] || [];
    return keywords.some(keyword => serviceLower.includes(keyword));
  }

  private async getMarketRate(serviceName: string, category: string): Promise<number> {
    // In a real implementation, this would query market data
    // For now, return estimated market rates based on service type
    const marketRates: Record<string, Record<string, number>> = {
      'home': {
        'electrical': 150,
        'plumbing': 120,
        'cleaning': 80,
        'gardening': 100,
        'repair': 130,
      },
      'personal_care': {
        'beauty': 200,
        'hair': 180,
        'massage': 160,
        'fitness': 250,
      },
      'events': {
        'wedding': 500,
        'photography': 300,
        'catering': 200,
        'decoration': 150,
      },
      'business': {
        'consulting': 800,
        'marketing': 400,
        'development': 600,
        'accounting': 300,
      },
    };

    const categoryRates = marketRates[category] || {};
    const serviceLower = serviceName.toLowerCase();
    
    for (const [service, rate] of Object.entries(categoryRates)) {
      if (serviceLower.includes(service)) {
        return rate;
      }
    }

    return 150; // Default rate
  }

  private isPricingReasonable(hourlyRate: number, marketRate: number): boolean {
    const variance = 0.5; // 50% variance allowed
    const minRate = marketRate * (1 - variance);
    const maxRate = marketRate * (1 + variance);
    
    return hourlyRate >= minRate && hourlyRate <= maxRate;
  }

  private async detectDuplicateServices(provider: any) {
    try {
      const allProviders = await storage.getAllServiceProviders();
      const similarServices: Array<{ id: number; similarity: number }> = [];

      for (const otherProvider of allProviders) {
        if (otherProvider.id === provider.id) continue;

        const similarity = this.calculateServiceSimilarity(provider, otherProvider);
        if (similarity > 70) {
          similarServices.push({ id: otherProvider.id, similarity });
        }
      }

      return {
        found: similarServices.length > 0,
        similarServices,
      };
    } catch (error) {
      console.error('Error detecting duplicate services:', error);
      return { found: false, similarServices: [] };
    }
  }

  private calculateServiceSimilarity(provider1: any, provider2: any): number {
    let similarity = 0;

    // Check service name similarity
    const serviceNameSimilarity = this.calculateStringSimilarity(
      provider1.serviceName, provider2.serviceName
    );
    similarity += serviceNameSimilarity * 0.4;

    // Check business name similarity
    const businessNameSimilarity = this.calculateStringSimilarity(
      provider1.businessName, provider2.businessName
    );
    similarity += businessNameSimilarity * 0.3;

    // Check description similarity
    const descriptionSimilarity = this.calculateStringSimilarity(
      provider1.description, provider2.description
    );
    similarity += descriptionSimilarity * 0.2;

    // Check location similarity
    const locationSimilarity = this.calculateStringSimilarity(
      provider1.location, provider2.location
    );
    similarity += locationSimilarity * 0.1;

    return similarity;
  }

  private calculateStringSimilarity(str1: string, str2: string): number {
    if (!str1 || !str2) return 0;
    
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 100;
    
    const distance = this.levenshteinDistance(longer, shorter);
    return ((longer.length - distance) / longer.length) * 100;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  private async checkCompliance(provider: any) {
    const issues: string[] = [];
    let termsCompliant = true;
    let legalCompliant = true;

    // Check for prohibited content
    const prohibitedWords = ['illegal', 'unlicensed', 'cash only', 'no tax'];
    const description = (provider.description || '').toLowerCase();
    
    for (const word of prohibitedWords) {
      if (description.includes(word)) {
        issues.push(`Contains prohibited content: ${word}`);
        termsCompliant = false;
      }
    }

    // Check for required licensing based on service type
    const licensedServices = ['electrical', 'plumbing', 'legal', 'medical'];
    const serviceName = (provider.serviceName || '').toLowerCase();
    
    for (const service of licensedServices) {
      if (serviceName.includes(service)) {
        // In a real implementation, verify licensing
        if (!description.includes('license') && !description.includes('certified')) {
          issues.push(`Service requires licensing verification: ${service}`);
          legalCompliant = false;
        }
      }
    }

    return {
      termsCompliant,
      legalCompliant,
      issues,
    };
  }

  private calculateQualityScore(checks: any): number {
    const contentScore = (
      checks.contentQuality.description.score +
      checks.contentQuality.category.score +
      checks.contentQuality.pricing.score
    ) / 3;

    const complianceScore = (checks.complianceCheck.termsCompliant && 
                            checks.complianceCheck.legalCompliant) ? 100 : 60;

    const duplicatePenalty = checks.duplicateDetection.found ? 30 : 0;

    return Math.max(0, (contentScore + complianceScore) / 2 - duplicatePenalty);
  }

  private calculateServiceRiskScore(checks: any): number {
    let riskScore = 0;

    if (checks.duplicateDetection.found) riskScore += 40;
    if (!checks.complianceCheck.termsCompliant) riskScore += 30;
    if (!checks.complianceCheck.legalCompliant) riskScore += 30;
    if (checks.contentQuality.description.score < 50) riskScore += 20;

    return Math.min(100, riskScore);
  }

  private determineServiceDecision(qualityScore: number, riskScore: number): 'approve' | 'reject' | 'flag_for_review' | 'request_improvements' {
    if (riskScore > 80) return 'reject';
    if (qualityScore >= 80 && riskScore <= 20) return 'approve';
    if (qualityScore < 50 || riskScore > 60) return 'reject';
    if (qualityScore < 70) return 'request_improvements';
    return 'flag_for_review';
  }

  private generateServiceSuggestions(checks: any, qualityScore: number): string[] {
    const suggestions: string[] = [];

    if (checks.contentQuality.description.score < 70) {
      suggestions.push('Improve service description with more details about experience and expertise');
    }

    if (!checks.contentQuality.category.appropriate) {
      suggestions.push('Review service category selection to ensure proper categorization');
    }

    if (!checks.contentQuality.pricing.reasonable) {
      suggestions.push(`Consider adjusting pricing to market standards (suggested: ₹${checks.contentQuality.pricing.marketRate}/hour)`);
    }

    if (checks.duplicateDetection.found) {
      suggestions.push('Differentiate your service from similar providers with unique value propositions');
    }

    if (checks.complianceCheck.issues.length > 0) {
      suggestions.push('Address compliance issues: ' + checks.complianceCheck.issues.join(', '));
    }

    return suggestions;
  }

  private shouldTriggerAutoModeration(checks: any): boolean {
    return !checks.complianceCheck.termsCompliant || 
           !checks.complianceCheck.legalCompliant ||
           checks.duplicateDetection.found;
  }

  private async processQualityDecision(result: ServiceQualityResult): Promise<void> {
    const { decision, providerId, suggestions } = result;

    switch (decision) {
      case 'approve':
        await this.autoApproveService(providerId, result);
        break;
      case 'reject':
        await this.autoRejectService(providerId, result);
        break;
      case 'request_improvements':
        await this.requestImprovements(providerId, result, suggestions);
        break;
      case 'flag_for_review':
        await this.flagServiceForReview(providerId, result);
        break;
    }
  }

  private async autoApproveService(providerId: number, result: ServiceQualityResult): Promise<void> {
    console.log(`Service Quality Agent: Auto-approved service for provider ${providerId}`);
    // In a real implementation, update service status
  }

  private async autoRejectService(providerId: number, result: ServiceQualityResult): Promise<void> {
    console.log(`Service Quality Agent: Auto-rejected service for provider ${providerId}`);
    // In a real implementation, update service status and notify provider
  }

  private async requestImprovements(providerId: number, result: ServiceQualityResult, suggestions: string[]): Promise<void> {
    console.log(`Service Quality Agent: Requested improvements for provider ${providerId}:`, suggestions);
    // In a real implementation, send notification to provider with suggestions
  }

  private async flagServiceForReview(providerId: number, result: ServiceQualityResult): Promise<void> {
    console.log(`Service Quality Agent: Flagged service for human review - provider ${providerId}`);
    // In a real implementation, add to admin review queue
  }

  private async processDuplicateDetection(task: AgentTask): Promise<any> {
    // Implementation for standalone duplicate detection tasks
    return { detected: false, details: [] };
  }

  private async processContentModeration(task: AgentTask): Promise<any> {
    // Implementation for content moderation tasks
    return { approved: true, issues: [] };
  }

  private updateMetrics(processingTime: number): void {
    this.metrics.tasksCompleted++;
    
    const previousAvg = this.metrics.averageProcessingTime;
    this.metrics.averageProcessingTime = 
      (previousAvg * (this.metrics.tasksCompleted - 1) + processingTime) / this.metrics.tasksCompleted;
  }

  public updateConfig(newConfig: Partial<AgentConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  public getMetrics(period: '24h' | '7d' | '30d') {
    return {
      ...this.metrics,
      period,
      lastActive: this.lastActive,
      decisions: this.decisions.slice(-10),
    };
  }
}