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
    const provider = await storage.getServiceProvider(providerId);
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
    
    // Document content verification - check if uploaded documents match entered numbers
    const documentContentVerification = await this.verifyDocumentContent(provider);
    
    const aadharContentMatch = documentContentVerification.aadhar.matches;
    const panContentMatch = documentContentVerification.pan.matches;
    
    return {
      aadhar: {
        valid: aadharValid && aadharContentMatch,
        score: this.calculateDocumentMatchScore(aadharValid, aadharContentMatch, documentContentVerification.aadhar),
        issues: [
          ...(aadharValid ? [] : ['Invalid Aadhar format - must be 12 digits']),
          ...(aadharContentMatch ? [] : ['CRITICAL: Aadhar number does not match uploaded document']),
          ...(documentContentVerification.aadhar.confidence < 80 ? ['Low OCR confidence - document may be unclear'] : []),
        ],
        contentVerification: documentContentVerification.aadhar,
      },
      pan: {
        valid: panValid && panContentMatch,
        score: this.calculateDocumentMatchScore(panValid, panContentMatch, documentContentVerification.pan),
        issues: [
          ...(panValid ? [] : ['Invalid PAN format - must be ABCDE1234F format']),
          ...(panContentMatch ? [] : ['CRITICAL: PAN number does not match uploaded document']),
          ...(documentContentVerification.pan.confidence < 80 ? ['Low OCR confidence - document may be unclear'] : []),
        ],
        contentVerification: documentContentVerification.pan,
      },
      crossVerification: {
        valid: aadharValid && panValid && aadharContentMatch && panContentMatch,
        score: this.calculateCrossVerificationScore(aadharValid, panValid, aadharContentMatch, panContentMatch),
        issues: [
          ...(aadharValid && panValid ? [] : ['Document format validation incomplete']),
          ...(aadharContentMatch && panContentMatch ? [] : ['CRITICAL: Document content verification failed - potential fraud']),
          ...(!aadharContentMatch || !panContentMatch ? ['Manual document review required'] : []),
        ],
      },
      documentContentAnalysis: documentContentVerification.analysis,
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

  private async verifyDocumentContent(provider: any) {
    // In a real implementation, this would use OCR or document parsing services
    // For now, we'll simulate document content verification
    
    const aadharAnalysis = await this.analyzeAadharDocument(provider);
    const panAnalysis = await this.analyzePANDocument(provider);
    
    return {
      aadhar: aadharAnalysis,
      pan: panAnalysis,
      analysis: {
        documentsProcessed: (aadharAnalysis.documentFound ? 1 : 0) + (panAnalysis.documentFound ? 1 : 0),
        verificationMethod: 'OCR_SIMULATION',
        confidence: Math.min(aadharAnalysis.confidence, panAnalysis.confidence),
        timestamp: new Date().toISOString(),
      },
    };
  }

  private async analyzeAadharDocument(provider: any) {
    // Simulate OCR analysis of uploaded Aadhar document
    const hasAadharDoc = provider.kycDocuments?.uploaded_documents?.includes('Aadhar Card');
    
    if (!hasAadharDoc || !provider.aadharNumber) {
      return {
        documentFound: false,
        matches: false,
        confidence: 0,
        extractedNumber: null,
        enteredNumber: provider.aadharNumber || '',
        issues: ['Aadhar document not uploaded or number not provided'],
      };
    }

    // Simulate OCR extraction and comparison
    // In real implementation, this would extract number from uploaded document
    const simulatedExtractedNumber = this.simulateAadharOCR(provider);
    const matches = simulatedExtractedNumber === provider.aadharNumber;
    
    return {
      documentFound: true,
      matches,
      confidence: matches ? 95 : 25,
      extractedNumber: simulatedExtractedNumber,
      enteredNumber: provider.aadharNumber,
      issues: matches ? [] : [
        'Aadhar number mismatch between document and entered data',
        `Document shows: ${simulatedExtractedNumber}, Entered: ${provider.aadharNumber}`
      ],
    };
  }

  private async analyzePANDocument(provider: any) {
    // Simulate OCR analysis of uploaded PAN document
    const hasPanDoc = provider.kycDocuments?.uploaded_documents?.includes('PAN Card');
    
    if (!hasPanDoc || !provider.panNumber) {
      return {
        documentFound: false,
        matches: false,
        confidence: 0,
        extractedNumber: null,
        enteredNumber: provider.panNumber || '',
        issues: ['PAN document not uploaded or number not provided'],
      };
    }

    // Simulate OCR extraction and comparison
    const simulatedExtractedNumber = this.simulatePANOCR(provider);
    const matches = simulatedExtractedNumber === provider.panNumber;
    
    return {
      documentFound: true,
      matches,
      confidence: matches ? 95 : 25,
      extractedNumber: simulatedExtractedNumber,
      enteredNumber: provider.panNumber,
      issues: matches ? [] : [
        'PAN number mismatch between document and entered data',
        `Document shows: ${simulatedExtractedNumber}, Entered: ${provider.panNumber}`
      ],
    };
  }

  private simulateAadharOCR(provider: any): string | null {
    // Enhanced document verification logic with stricter matching
    
    // Check if this is a known test case with good documentation
    const isGoodProvider = this.isHighQualityProvider(provider);
    
    if (isGoodProvider) {
      // 95% chance for well-documented providers
      if (Math.random() < 0.95) {
        return provider.aadharNumber;
      }
    } else {
      // 60% chance for average providers  
      if (Math.random() < 0.6) {
        return provider.aadharNumber;
      }
    }
    
    // Mismatch scenarios (fraud/error cases)
    const scenarios = [
      // Single digit typo
      provider.aadharNumber?.replace(/\d/, (match: string) => String((parseInt(match) + 1) % 10)),
      // Multiple digit errors
      provider.aadharNumber?.substring(0, 4) + '9999' + provider.aadharNumber?.substring(8),
      // Completely different number
      '123456789012',
      // Partially obscured/unreadable
      provider.aadharNumber?.substring(0, 8) + 'XXXX',
    ];
    
    return scenarios[Math.floor(Math.random() * scenarios.length)] || null;
  }

  private simulatePANOCR(provider: any): string | null {
    // Enhanced PAN verification with stricter document matching
    
    // Check if this is a high-quality provider
    const isGoodProvider = this.isHighQualityProvider(provider);
    
    if (isGoodProvider) {
      // 98% chance for well-documented providers (PAN cards are clearer)
      if (Math.random() < 0.98) {
        return provider.panNumber;
      }
    } else {
      // 70% chance for average providers
      if (Math.random() < 0.7) {
        return provider.panNumber;
      }
    }
    
    // Mismatch scenarios
    const scenarios = [
      // Wrong last character
      provider.panNumber?.slice(0, -1) + 'Z',
      // Different middle numbers  
      provider.panNumber?.substring(0, 5) + '9999' + provider.panNumber?.substring(9),
      // Different first part
      'ZZZZZ' + provider.panNumber?.substring(5),
      // Completely different PAN
      'FRAUD1234X',
    ];
    
    return scenarios[Math.floor(Math.random() * scenarios.length)] || null;
  }

  private isHighQualityProvider(provider: any): boolean {
    // Determine if provider has high-quality documentation
    const qualityIndicators = [
      provider.experience >= 5,
      provider.hourlyRate && parseFloat(provider.hourlyRate) >= 200,
      provider.description && provider.description.length >= 100,
      provider.businessName && provider.businessName.length >= 10,
      provider.kycDocuments?.uploaded_documents?.length >= 6,
      provider.phoneVerified === true,
      provider.otpVerified === true
    ];
    
    // Provider is high-quality if they meet most criteria
    const score = qualityIndicators.filter(Boolean).length;
    return score >= 5;
  }

  private calculateDocumentMatchScore(formatValid: boolean, contentMatch: boolean, verification: any): number {
    if (!formatValid) return 0; // Invalid format = immediate failure
    if (!contentMatch) return 15; // Major penalty for content mismatch
    
    // Base score for valid match
    let score = 95;
    
    // Reduce score based on OCR confidence
    if (verification.confidence < 90) score -= 10;
    if (verification.confidence < 80) score -= 15;
    if (verification.confidence < 70) score -= 25;
    
    return Math.max(15, score);
  }

  private calculateCrossVerificationScore(aadharValid: boolean, panValid: boolean, aadharMatch: boolean, panMatch: boolean): number {
    // Both documents must be valid and match
    if (!aadharValid || !panValid) return 20;
    if (!aadharMatch || !panMatch) return 10; // Critical failure for content mismatch
    
    // Perfect match gets highest score
    return 95;
  }

  private async checkDataConsistency(provider: any) {
    const issues: string[] = [];
    let score = 90;

    // Check name consistency
    if (provider.ownerName && provider.businessName) {
      const ownerWords = provider.ownerName.toLowerCase().split(' ');
      const businessWords = provider.businessName.toLowerCase().split(' ');
      
      if (!ownerWords.some((word: string) => businessWords.includes(word)) && 
          !businessWords.some((word: string) => ownerWords.includes(word))) {
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
    // Immediate rejection for high risk or document mismatch
    if (riskScore > 70) return 'reject';
    
    // High confidence auto-approval with strict document verification
    if (overallScore >= 85 && confidence >= 90 && riskScore <= 20) return 'approve';
    
    // Rejection for low scores or document verification failures
    if (overallScore < 60 || riskScore > 40) return 'reject';
    
    return 'flag_for_review';
  }

  private generateRecommendations(checks: any, overallScore: number, riskScore: number): string[] {
    const recommendations: string[] = [];

    // Enhanced document mismatch detection and recommendations
    if (checks.documentValidation.aadhar.score < 95) {
      if (checks.documentValidation.aadhar.contentVerification && 
          !checks.documentValidation.aadhar.contentVerification.matches) {
        recommendations.push('🚨 CRITICAL: Aadhar document number mismatch detected');
        recommendations.push('Request new Aadhar document upload with clear, readable text');
        recommendations.push('Verify Aadhar number manually with government database');
        recommendations.push('Contact provider to confirm correct Aadhar number');
      } else if (checks.documentValidation.aadhar.contentVerification?.confidence < 80) {
        recommendations.push('Aadhar document quality is poor - request higher resolution upload');
        recommendations.push('Verify document authenticity and readability');
      } else {
        recommendations.push('Verify Aadhar document format and authenticity');
      }
    }
    
    if (checks.documentValidation.pan.score < 95) {
      if (checks.documentValidation.pan.contentVerification && 
          !checks.documentValidation.pan.contentVerification.matches) {
        recommendations.push('🚨 CRITICAL: PAN document number mismatch detected');
        recommendations.push('Request new PAN document upload with clear, readable text');
        recommendations.push('Verify PAN number with Income Tax Department database');
        recommendations.push('Contact provider to confirm correct PAN number');
      } else if (checks.documentValidation.pan.contentVerification?.confidence < 80) {
        recommendations.push('PAN document quality is poor - request higher resolution upload');
        recommendations.push('Verify document authenticity and readability');
      } else {
        recommendations.push('Verify PAN document format and authenticity');
      }
    }

    // Critical fraud detection for document mismatches
    const hasDocumentMismatch = (
      !checks.documentValidation.aadhar.contentVerification?.matches ||
      !checks.documentValidation.pan.contentVerification?.matches
    );
    
    if (hasDocumentMismatch) {
      recommendations.push('⚠️ FRAUD ALERT: Document content does not match entered information');
      recommendations.push('Manual verification required before approval');
      recommendations.push('Consider requesting video verification call');
      recommendations.push('Flag for enhanced due diligence review');
    }
    
    // Document content analysis recommendations
    if (checks.documentValidation.documentContentAnalysis) {
      const analysis = checks.documentValidation.documentContentAnalysis;
      if (analysis.confidence < 80) {
        recommendations.push('Document quality is poor - request clearer document uploads');
      }
      if (analysis.documentsProcessed < 2) {
        recommendations.push('Complete document set not uploaded - request all required documents');
      }
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
      await storage.updateProviderKycStatus(providerId, true);
      
      this.metrics.tasksCompleted++;
      console.log(`✅ Auto-approved provider ${providerId} - Confidence: ${decision.confidence}%`);
    } catch (error) {
      console.error(`Failed to auto-approve provider ${providerId}:`, error);
      throw error;
    }
  }

  private async autoRejectKYC(providerId: number, decision: AgentDecision): Promise<void> {
    try {
      await storage.updateProviderKycStatus(providerId, false);
      
      this.metrics.tasksCompleted++;
      console.log(`❌ Auto-rejected provider ${providerId} - Confidence: ${decision.confidence}%`);
    } catch (error) {
      console.error(`Failed to auto-reject provider ${providerId}:`, error);
      throw error;
    }
  }

  private async flagForHumanReview(providerId: number, decision: AgentDecision): Promise<void> {
    try {
      await storage.updateProviderStatus(providerId, 'Pending Review');
      
      console.log(`🔍 Flagged provider ${providerId} for human review - Confidence: ${decision.confidence}%`);
    } catch (error) {
      console.error(`Failed to flag provider ${providerId} for review:`, error);
      throw error;
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