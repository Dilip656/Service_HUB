import { AgentConfig, AgentTask, AgentDecision, KYCAnalysisResult } from '@shared/agents';
import { storage } from '../storage';

export class KYCAgent {
  public config: AgentConfig;
  public lastActive: Date;
  private decisions: AgentDecision[] = [];
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
        case 'kyc_verification':
          return await this.processKYCVerification(task);
        default:
          throw new Error(`Unknown task type: ${task.taskType}`);
      }
    } finally {
      const processingTime = Date.now() - startTime;
      this.updateMetrics(processingTime);
    }
  }

  private async processKYCVerification(task: AgentTask): Promise<KYCAnalysisResult> {
    const { providerId } = task.payload;
    
    console.log(`KYC Agent: Analyzing provider ${providerId}`);

    // Get provider data
    const provider = await storage.getServiceProviderById(providerId);
    if (!provider) {
      throw new Error(`Provider ${providerId} not found`);
    }

    // Perform comprehensive KYC analysis
    const analysisResult = await this.analyzeKYC(provider);

    // Make decision based on analysis
    const decision = this.makeKYCDecision(analysisResult);

    // Store decision
    this.decisions.push(decision);

    // Auto-approve if conditions are met
    if (this.config.autoApprovalEnabled && decision.decision === 'approve' && 
        decision.confidence >= this.config.autoApprovalThreshold) {
      
      await this.autoApproveKYC(providerId, decision);
      console.log(`KYC Agent: Auto-approved provider ${providerId} (confidence: ${decision.confidence}%)`);
    } else if (decision.decision === 'reject' && decision.confidence >= 90) {
      // Auto-reject with high confidence
      await this.autoRejectKYC(providerId, decision);
      console.log(`KYC Agent: Auto-rejected provider ${providerId} (confidence: ${decision.confidence}%)`);
    } else {
      // Flag for human review
      await this.flagForHumanReview(providerId, decision);
      console.log(`KYC Agent: Flagged provider ${providerId} for human review`);
    }

    return analysisResult;
  }

  private async analyzeKYC(provider: any): Promise<KYCAnalysisResult> {
    const checks = {
      documentValidation: await this.validateDocuments(provider),
      riskFactors: await this.analyzeRiskFactors(provider),
      businessValidation: await this.validateBusiness(provider),
    };

    // Calculate scores
    const documentScore = this.calculateDocumentScore(checks.documentValidation);
    const riskScore = this.calculateRiskScore(checks.riskFactors);
    const businessScore = this.calculateBusinessScore(checks.businessValidation);

    const overallScore = (documentScore + businessScore) / 2;
    const confidence = this.calculateConfidence(checks);
    
    const decision = this.determineDecision(overallScore, riskScore, confidence);

    return {
      providerId: provider.id,
      overallScore,
      riskScore,
      confidence,
      decision,
      checks,
      recommendations: this.generateRecommendations(checks, overallScore, riskScore),
      requiresHumanReview: decision === 'flag_for_review' || confidence < 75,
      processingTime: Date.now(),
    };
  }

  private async validateDocuments(provider: any) {
    const aadharValid = provider.aadharNumber && /^\d{12}$/.test(provider.aadharNumber);
    const panValid = provider.panNumber && /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(provider.panNumber);
    
    return {
      aadhar: {
        valid: aadharValid,
        score: aadharValid ? 95 : 0,
        issues: aadharValid ? [] : ['Invalid Aadhar format'],
      },
      pan: {
        valid: panValid,
        score: panValid ? 95 : 0,
        issues: panValid ? [] : ['Invalid PAN format'],
      },
      crossVerification: {
        valid: aadharValid && panValid,
        score: aadharValid && panValid ? 90 : 50,
        issues: aadharValid && panValid ? [] : ['Cross-verification incomplete'],
      },
    };
  }

  private async analyzeRiskFactors(provider: any) {
    // Check for duplicate documents
    const duplicateAadhar = await this.checkDuplicateAadhar(provider.aadharNumber);
    const duplicatePAN = await this.checkDuplicatePAN(provider.panNumber);
    const duplicatePhone = await this.checkDuplicatePhone(provider.phone);

    // Check for suspicious patterns
    const suspiciousPatterns = this.detectSuspiciousPatterns(provider);

    return {
      duplicateDetection: {
        found: duplicateAadhar || duplicatePAN || duplicatePhone,
        score: duplicateAadhar || duplicatePAN || duplicatePhone ? 85 : 5,
        details: [
          ...(duplicateAadhar ? ['Duplicate Aadhar found'] : []),
          ...(duplicatePAN ? ['Duplicate PAN found'] : []),
          ...(duplicatePhone ? ['Duplicate phone found'] : []),
        ],
      },
      fraudPatterns: {
        detected: suspiciousPatterns.length > 0,
        score: suspiciousPatterns.length * 20,
        patterns: suspiciousPatterns,
      },
      dataConsistency: await this.checkDataConsistency(provider),
    };
  }

  private async checkDuplicateAadhar(aadharNumber: string): Promise<boolean> {
    if (!aadharNumber) return false;
    try {
      const providers = await storage.getAllServiceProviders();
      return providers.some(p => p.aadharNumber === aadharNumber);
    } catch {
      return false;
    }
  }

  private async checkDuplicatePAN(panNumber: string): Promise<boolean> {
    if (!panNumber) return false;
    try {
      const providers = await storage.getAllServiceProviders();
      return providers.some(p => p.panNumber === panNumber);
    } catch {
      return false;
    }
  }

  private async checkDuplicatePhone(phone: string): Promise<boolean> {
    if (!phone) return false;
    try {
      const providers = await storage.getAllServiceProviders();
      return providers.filter(p => p.phone === phone).length > 1;
    } catch {
      return false;
    }
  }

  private detectSuspiciousPatterns(provider: any): string[] {
    const patterns: string[] = [];

    // Check for suspicious business names
    if (provider.businessName && provider.businessName.length < 3) {
      patterns.push('Business name too short');
    }

    // Check for suspicious descriptions
    if (provider.description && provider.description.length < 20) {
      patterns.push('Description too brief');
    }

    // Check for unrealistic hourly rates
    const rate = parseFloat(provider.hourlyRate);
    if (rate < 50 || rate > 10000) {
      patterns.push('Unrealistic hourly rate');
    }

    // Check for suspicious experience claims
    if (provider.experience > 50) {
      patterns.push('Excessive experience claim');
    }

    return patterns;
  }

  private async checkDataConsistency(provider: any) {
    const issues: string[] = [];
    let score = 90;

    // Check name consistency
    if (provider.ownerName && provider.businessName) {
      const ownerWords = provider.ownerName.toLowerCase().split(' ');
      const businessWords = provider.businessName.toLowerCase().split(' ');
      
      if (!ownerWords.some(word => businessWords.includes(word)) && 
          !businessWords.some(word => ownerWords.includes(word))) {
        issues.push('Owner name and business name seem unrelated');
        score -= 15;
      }
    }

    // Check location and phone area code consistency
    if (provider.phone && provider.location) {
      // This is a simplified check - in reality, you'd use proper geo-location services
      const phoneCode = provider.phone.substring(0, 6);
      // Add location-phone consistency check logic here
    }

    return {
      consistent: issues.length === 0,
      score,
      issues,
    };
  }

  private async validateBusiness(provider: any) {
    let legitimacyScore = 70; // Base score
    const factors: string[] = [];

    // Business name quality
    if (provider.businessName && provider.businessName.length > 5) {
      legitimacyScore += 10;
      factors.push('Proper business name');
    }

    // Experience validation
    let experienceValidated = true;
    if (provider.experience > 0 && provider.experience <= 30) {
      legitimacyScore += 10;
      factors.push('Reasonable experience claim');
    } else if (provider.experience > 30) {
      experienceValidated = false;
      factors.push('High experience needs verification');
    }

    // Location validation
    let locationVerified = true;
    if (provider.location && provider.location.length > 10) {
      legitimacyScore += 5;
      factors.push('Detailed location provided');
    }

    return {
      legitimacy: { score: legitimacyScore, factors },
      experience: { validated: experienceValidated, score: experienceValidated ? 85 : 60 },
      location: { verified: locationVerified, score: locationVerified ? 85 : 60 },
    };
  }

  private calculateDocumentScore(validation: any): number {
    return (validation.aadhar.score + validation.pan.score + validation.crossVerification.score) / 3;
  }

  private calculateRiskScore(riskFactors: any): number {
    return Math.min(100, 
      riskFactors.duplicateDetection.score + 
      riskFactors.fraudPatterns.score + 
      (100 - riskFactors.dataConsistency.score)
    );
  }

  private calculateBusinessScore(business: any): number {
    return (business.legitimacy.score + business.experience.score + business.location.score) / 3;
  }

  private calculateConfidence(checks: any): number {
    const documentConfidence = this.calculateDocumentScore(checks.documentValidation);
    const businessConfidence = this.calculateBusinessScore(checks.businessValidation);
    const riskPenalty = this.calculateRiskScore(checks.riskFactors) / 2;
    
    return Math.max(0, Math.min(100, (documentConfidence + businessConfidence) / 2 - riskPenalty));
  }

  private determineDecision(overallScore: number, riskScore: number, confidence: number): 'approve' | 'reject' | 'flag_for_review' {
    if (riskScore > 70) return 'reject';
    if (overallScore >= 80 && confidence >= 85 && riskScore <= 30) return 'approve';
    if (overallScore < 50 || riskScore > 50) return 'reject';
    return 'flag_for_review';
  }

  private generateRecommendations(checks: any, overallScore: number, riskScore: number): string[] {
    const recommendations: string[] = [];

    if (checks.documentValidation.aadhar.score < 95) {
      recommendations.push('Verify Aadhar document authenticity');
    }
    if (checks.documentValidation.pan.score < 95) {
      recommendations.push('Verify PAN document authenticity');
    }
    if (riskScore > 50) {
      recommendations.push('Conduct additional background verification');
    }
    if (overallScore < 70) {
      recommendations.push('Request additional documentation');
    }
    if (checks.riskFactors.duplicateDetection.found) {
      recommendations.push('Investigate duplicate document usage');
    }

    return recommendations;
  }

  private makeKYCDecision(analysis: KYCAnalysisResult): AgentDecision {
    return {
      agentId: this.config.id,
      agentType: this.config.type,
      targetId: analysis.providerId,
      targetType: 'provider',
      decision: analysis.decision,
      confidence: analysis.confidence,
      riskScore: analysis.riskScore,
      reasoning: `Overall Score: ${analysis.overallScore.toFixed(1)}, Risk Score: ${analysis.riskScore.toFixed(1)}, Confidence: ${analysis.confidence.toFixed(1)}%`,
      evidence: analysis.recommendations,
      humanReviewRequired: analysis.requiresHumanReview,
      processedAt: new Date(),
      metadata: { analysisResult: analysis },
    };
  }

  private async autoApproveKYC(providerId: number, decision: AgentDecision): Promise<void> {
    try {
      await storage.updateServiceProviderKYC(providerId, {
        kycVerified: true,
        status: 'Active',
        kycDocuments: {
          ...decision.metadata.analysisResult,
          auto_approved: true,
          approved_by: 'KYC_AGENT',
          approved_at: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error(`Failed to auto-approve KYC for provider ${providerId}:`, error);
    }
  }

  private async autoRejectKYC(providerId: number, decision: AgentDecision): Promise<void> {
    try {
      await storage.updateServiceProviderKYC(providerId, {
        kycVerified: false,
        status: 'Rejected',
        kycDocuments: {
          ...decision.metadata.analysisResult,
          auto_rejected: true,
          rejected_by: 'KYC_AGENT',
          rejected_at: new Date().toISOString(),
          rejection_reason: decision.reasoning,
        },
      });
    } catch (error) {
      console.error(`Failed to auto-reject KYC for provider ${providerId}:`, error);
    }
  }

  private async flagForHumanReview(providerId: number, decision: AgentDecision): Promise<void> {
    try {
      await storage.updateServiceProviderKYC(providerId, {
        kycVerified: false,
        status: 'Pending',
        kycDocuments: {
          ...decision.metadata.analysisResult,
          flagged_for_review: true,
          flagged_by: 'KYC_AGENT',
          flagged_at: new Date().toISOString(),
          review_priority: decision.confidence < 50 ? 'high' : 'medium',
        },
      });
    } catch (error) {
      console.error(`Failed to flag KYC for provider ${providerId}:`, error);
    }
  }

  private updateMetrics(processingTime: number): void {
    this.metrics.tasksCompleted++;
    
    // Update average processing time
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
      decisions: this.decisions.slice(-10), // Last 10 decisions
    };
  }
}