import { AgentConfig, AgentTask } from '@shared/agents';

export class UserSupportAgent {
  public config: AgentConfig;
  public lastActive: Date;
  private supportTickets: any[] = [];

  constructor(config: AgentConfig) {
    this.config = config;
    this.lastActive = new Date();
  }

  async processTask(task: AgentTask): Promise<any> {
    this.lastActive = new Date();

    switch (task.taskType) {
      case 'support_ticket':
        return await this.handleSupportTicket(task);
      case 'auto_response':
        return await this.generateAutoResponse(task);
      default:
        throw new Error(`Unknown task type: ${task.taskType}`);
    }
  }

  private async handleSupportTicket(task: AgentTask): Promise<any> {
    const { userId, issue, priority } = task.payload;
    
    const ticket = {
      id: `ticket-${Date.now()}`,
      userId,
      issue,
      priority,
      status: 'processing',
      response: await this.generateResponse(issue),
      createdAt: new Date(),
    };

    this.supportTickets.push(ticket);
    console.log(`User Support Agent: Created ticket ${ticket.id} for user ${userId}`);

    return ticket;
  }

  private async generateResponse(issue: string): Promise<string> {
    const commonResponses: Record<string, string> = {
      'payment': 'We are looking into your payment issue. Please allow 24-48 hours for resolution.',
      'booking': 'Your booking concern has been noted. A customer service representative will contact you shortly.',
      'kyc': 'KYC verification typically takes 1-2 business days. You will be notified once approved.',
      'service': 'Thank you for your feedback about our service. We will address this with the provider.',
    };

    const issueLower = issue.toLowerCase();
    for (const [key, response] of Object.entries(commonResponses)) {
      if (issueLower.includes(key)) {
        return response;
      }
    }

    return 'Thank you for contacting us. Your request has been received and will be processed within 24 hours.';
  }

  private async generateAutoResponse(task: AgentTask): Promise<any> {
    return {
      response: await this.generateResponse(task.payload.message),
      confidence: 85,
    };
  }

  public updateConfig(newConfig: Partial<AgentConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  public getMetrics(period: '24h' | '7d' | '30d') {
    return {
      ticketsHandled: this.supportTickets.length,
      averageResponseTime: 300, // 5 minutes
      lastActive: this.lastActive,
      period,
    };
  }
}