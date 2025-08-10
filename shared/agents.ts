import { z } from "zod";

// Agent Types and Schemas
export const agentTypes = {
  KYC_AGENT: 'kyc_agent',
  SERVICE_AGENT: 'service_agent',
  USER_SUPPORT_AGENT: 'user_support_agent',
  FRAUD_DETECTION_AGENT: 'fraud_detection_agent',
  QUALITY_ASSURANCE_AGENT: 'quality_assurance_agent'
} as const;

export type AgentType = typeof agentTypes[keyof typeof agentTypes];

// Agent Configuration Schema
export const agentConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(Object.values(agentTypes) as [AgentType, ...AgentType[]]),
  isActive: z.boolean().default(true),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  autoApprovalEnabled: z.boolean().default(false),
  autoApprovalThreshold: z.number().min(0).max(100).default(85), // Confidence threshold
  settings: z.record(z.any()).default({}),
  createdAt: z.date().default(() => new Date()),
  lastActive: z.date().optional(),
});

export type AgentConfig = z.infer<typeof agentConfigSchema>;

// KYC Agent specific settings
export const kycAgentSettingsSchema = z.object({
  documentValidationRules: z.object({
    aadharValidation: z.boolean().default(true),
    panValidation: z.boolean().default(true),
    addressProofRequired: z.boolean().default(true),
    businessRegistrationRequired: z.boolean().default(false),
  }),
  riskFactors: z.object({
    duplicateDocuments: z.number().default(100), // High risk score
    invalidFormat: z.number().default(90),
    suspiciousPatterns: z.number().default(80),
    incompleteInfo: z.number().default(60),
  }),
  autoApprovalCriteria: z.object({
    minConfidenceScore: z.number().default(85),
    maxRiskScore: z.number().default(30),
    requiredDocuments: z.array(z.string()).default(['aadhar', 'pan']),
  }),
});

// Service Agent specific settings
export const serviceAgentSettingsSchema = z.object({
  qualityChecks: z.object({
    duplicateServiceDetection: z.boolean().default(true),
    categoryValidation: z.boolean().default(true),
    descriptionQuality: z.boolean().default(true),
    pricingReasonableness: z.boolean().default(true),
  }),
  autoModerationRules: z.object({
    flagInappropriateContent: z.boolean().default(true),
    detectSpam: z.boolean().default(true),
    validateBusinessInfo: z.boolean().default(true),
  }),
});

// Agent Decision Schema
export const agentDecisionSchema = z.object({
  agentId: z.string(),
  agentType: z.enum(Object.values(agentTypes) as [AgentType, ...AgentType[]]),
  targetId: z.number(), // ID of the item being processed (provider, service, user)
  targetType: z.enum(['provider', 'service', 'user', 'booking', 'review']),
  decision: z.enum(['approve', 'reject', 'flag_for_review', 'request_more_info']),
  confidence: z.number().min(0).max(100),
  riskScore: z.number().min(0).max(100).default(0),
  reasoning: z.string(),
  evidence: z.array(z.string()).default([]),
  humanReviewRequired: z.boolean().default(false),
  processedAt: z.date().default(() => new Date()),
  metadata: z.record(z.any()).default({}),
});

export type AgentDecision = z.infer<typeof agentDecisionSchema>;

// Agent Task Schema
export const agentTaskSchema = z.object({
  id: z.string(),
  agentId: z.string(),
  taskType: z.string(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  status: z.enum(['pending', 'processing', 'completed', 'failed', 'requires_human']).default('pending'),
  targetId: z.number(),
  targetType: z.enum(['provider', 'service', 'user', 'booking', 'review']),
  payload: z.record(z.any()),
  result: z.record(z.any()).optional(),
  error: z.string().optional(),
  createdAt: z.date().default(() => new Date()),
  processedAt: z.date().optional(),
  completedAt: z.date().optional(),
});

export type AgentTask = z.infer<typeof agentTaskSchema>;

// KYC Analysis Result
export interface KYCAnalysisResult {
  providerId: number;
  overallScore: number;
  riskScore: number;
  confidence: number;
  decision: 'approve' | 'reject' | 'flag_for_review';
  checks: {
    documentValidation: {
      aadhar: { valid: boolean; score: number; issues: string[] };
      pan: { valid: boolean; score: number; issues: string[] };
      crossVerification: { valid: boolean; score: number; issues: string[] };
    };
    riskFactors: {
      duplicateDetection: { found: boolean; score: number; details: string[] };
      fraudPatterns: { detected: boolean; score: number; patterns: string[] };
      dataConsistency: { consistent: boolean; score: number; issues: string[] };
    };
    businessValidation: {
      legitimacy: { score: number; factors: string[] };
      experience: { validated: boolean; score: number };
      location: { verified: boolean; score: number };
    };
  };
  recommendations: string[];
  requiresHumanReview: boolean;
  processingTime: number;
}

// Service Quality Analysis Result
export interface ServiceQualityResult {
  serviceId: number;
  providerId: number;
  qualityScore: number;
  riskScore: number;
  decision: 'approve' | 'reject' | 'flag_for_review' | 'request_improvements';
  checks: {
    contentQuality: {
      description: { score: number; issues: string[] };
      category: { appropriate: boolean; score: number };
      pricing: { reasonable: boolean; score: number; marketRate?: number };
    };
    duplicateDetection: {
      found: boolean;
      similarServices: Array<{ id: number; similarity: number }>;
    };
    complianceCheck: {
      termsCompliant: boolean;
      legalCompliant: boolean;
      issues: string[];
    };
  };
  suggestions: string[];
  autoModerationTriggered: boolean;
}

// Agent Performance Metrics
export interface AgentMetrics {
  agentId: string;
  agentType: AgentType;
  period: '24h' | '7d' | '30d';
  metrics: {
    tasksProcessed: number;
    tasksCompleted: number;
    accuracyRate: number;
    averageProcessingTime: number;
    humanOverrideRate: number;
    falsePositiveRate: number;
    falseNegativeRate: number;
  };
  performance: {
    efficiency: number; // 0-100
    accuracy: number; // 0-100
    reliability: number; // 0-100
    overallScore: number; // 0-100
  };
  lastUpdated: Date;
}

// Default Agent Configurations
export const defaultAgentConfigs: AgentConfig[] = [
  {
    id: 'kyc-agent-primary',
    name: 'Primary KYC Verification Agent',
    type: agentTypes.KYC_AGENT,
    isActive: true,
    priority: 'high',
    autoApprovalEnabled: true,
    autoApprovalThreshold: 85,
    settings: {
      documentValidationRules: {
        aadharValidation: true,
        panValidation: true,
        addressProofRequired: true,
        businessRegistrationRequired: false,
      },
      autoApprovalCriteria: {
        minConfidenceScore: 85,
        maxRiskScore: 30,
        requiredDocuments: ['aadhar', 'pan'],
      },
    },
    createdAt: new Date(),
  },
  {
    id: 'service-agent-primary',
    name: 'Primary Service Quality Agent',
    type: agentTypes.SERVICE_AGENT,
    isActive: true,
    priority: 'medium',
    autoApprovalEnabled: true,
    autoApprovalThreshold: 80,
    settings: {
      qualityChecks: {
        duplicateServiceDetection: true,
        categoryValidation: true,
        descriptionQuality: true,
        pricingReasonableness: true,
      },
    },
    createdAt: new Date(),
  },
  {
    id: 'fraud-detection-agent',
    name: 'Fraud Detection Agent',
    type: agentTypes.FRAUD_DETECTION_AGENT,
    isActive: true,
    priority: 'critical',
    autoApprovalEnabled: false,
    autoApprovalThreshold: 95,
    settings: {
      riskThresholds: {
        high: 80,
        medium: 50,
        low: 20,
      },
      monitoringEnabled: true,
    },
    createdAt: new Date(),
  },
  {
    id: 'user-support-agent',
    name: 'User Support Agent',
    type: agentTypes.USER_SUPPORT_AGENT,
    isActive: true,
    priority: 'medium',
    autoApprovalEnabled: true,
    autoApprovalThreshold: 75,
    settings: {
      responseTime: 300, // 5 minutes
      escalationThreshold: 1800, // 30 minutes
      autoResponse: true,
    },
    createdAt: new Date(),
  },
  {
    id: 'quality-assurance-agent',
    name: 'Quality Assurance Agent',
    type: agentTypes.QUALITY_ASSURANCE_AGENT,
    isActive: true,
    priority: 'medium',
    autoApprovalEnabled: true,
    autoApprovalThreshold: 80,
    settings: {
      reviewCriteria: {
        serviceQuality: true,
        customerSatisfaction: true,
        complianceCheck: true,
      },
    },
    createdAt: new Date(),
  },
];

// Agent Status
export interface AgentStatus {
  agentId: string;
  status: 'online' | 'offline' | 'busy' | 'error';
  currentTask?: string;
  tasksInQueue: number;
  lastHeartbeat: Date;
  performance: {
    cpuUsage: number;
    memoryUsage: number;
    taskCompletionRate: number;
  };
}

export type AgentReport = {
  agentId: string;
  agentName: string;
  agentType: AgentType;
  period: string;
  summary: {
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    averageProcessingTime: string;
    successRate: number;
  };
  recentDecisions: Array<{
    targetId: number;
    targetType: string;
    decision: string;
    confidence: number;
    timestamp: Date;
  }>;
  recommendations: string[];
  alertsGenerated: number;
  humanInterventionsRequired: number;
};