import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { useNotification } from '@/components/ui/notification';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Bot, Activity, AlertTriangle, Clock, Users, CheckCircle2, XCircle, PlayCircle, PauseCircle, RotateCcw, Zap, Shield, Search, MessageSquare, Star, TrendingUp, BarChart3 } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface Agent {
  agentId: string;
  config: {
    id: string;
    name: string;
    type: string;
    isActive: boolean;
    priority: string;
    autoApprovalEnabled: boolean;
    autoApprovalThreshold: number;
  };
  queueSize: number;
  status: string;
  lastActive: Date;
}

interface AgentMetrics {
  tasksProcessed: number;
  tasksCompleted: number;
  averageProcessingTime: number;
  accuracyRate: number;
  period: string;
  lastActive: Date;
}

export function AgentsView() {
  const { showNotification } = useNotification();
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [showMetrics, setShowMetrics] = useState(false);

  const { data: agents, isLoading, refetch } = useQuery({
    queryKey: ['/api/admin/agents'],
    queryFn: async () => {
      const response = await fetch('/api/admin/agents');
      if (!response.ok) throw new Error('Failed to fetch agents');
      return response.json();
    },
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  const { data: queueInfo, refetch: refetchQueue } = useQuery({
    queryKey: ['/api/admin/agents/queue/info'],
    queryFn: async () => {
      const response = await fetch('/api/admin/agents/queue/info');
      if (!response.ok) throw new Error('Failed to fetch queue info');
      return response.json();
    },
    refetchInterval: 3000, // Refresh every 3 seconds
  });

  const { data: selectedAgentMetrics } = useQuery({
    queryKey: ['/api/admin/agents', selectedAgent?.agentId, 'metrics'],
    queryFn: async () => {
      const response = await fetch(`/api/admin/agents/${selectedAgent?.agentId}/metrics`);
      if (!response.ok) throw new Error('Failed to fetch metrics');
      return response.json();
    },
    enabled: !!selectedAgent,
    refetchInterval: 10000,
  });

  const toggleAgentMutation = useMutation({
    mutationFn: async ({ agentId, isActive }: { agentId: string; isActive: boolean }) => {
      const response = await fetch(`/api/admin/agents/${agentId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive }),
      });
      if (!response.ok) throw new Error('Failed to update agent status');
      return response.json();
    },
    onSuccess: () => {
      refetch();
      showNotification('Agent status updated successfully', 'success');
    },
    onError: (error: any) => {
      showNotification(error.message || 'Failed to update agent status', 'error');
    },
  });

  const processKycMutation = useMutation({
    mutationFn: async ({ providerId, priority }: { providerId: number; priority: string }) => {
      const response = await fetch('/api/admin/agents/process/kyc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providerId, priority }),
      });
      if (!response.ok) throw new Error('Failed to initiate KYC processing');
      return response.json();
    },
    onSuccess: () => {
      refetchQueue();
      showNotification('KYC processing initiated', 'success');
    },
    onError: (error: any) => {
      showNotification(error.message || 'Failed to initiate KYC processing', 'error');
    },
  });

  const runFraudDetectionMutation = useMutation({
    mutationFn: async ({ providerId }: { providerId: number }) => {
      const response = await fetch('/api/admin/agents/process/fraud', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providerId, priority: 'high' }),
      });
      if (!response.ok) throw new Error('Failed to initiate fraud detection');
      return response.json();
    },
    onSuccess: () => {
      refetchQueue();
      showNotification('Fraud detection initiated', 'success');
    },
    onError: (error: any) => {
      showNotification(error.message || 'Failed to initiate fraud detection', 'error');
    },
  });

  const emergencyStopMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/admin/agents/emergency-stop', { method: 'POST' });
      if (!response.ok) throw new Error('Failed to execute emergency stop');
      return response.json();
    },
    onSuccess: () => {
      refetch();
      showNotification('Emergency stop activated - all agents stopped', 'success');
    },
    onError: (error: any) => {
      showNotification(error.message || 'Failed to execute emergency stop', 'error');
    },
  });

  const restartAllMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/admin/agents/restart', { method: 'POST' });
      if (!response.ok) throw new Error('Failed to restart agents');
      return response.json();
    },
    onSuccess: () => {
      refetch();
      showNotification('All agents restarted successfully', 'success');
    },
    onError: (error: any) => {
      showNotification(error.message || 'Failed to restart agents', 'error');
    },
  });

  const processPendingKYCsMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/admin/agents/process/all-pending-kyc', {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to process pending KYCs');
      return response.json();
    },
    onSuccess: () => {
      showNotification('Processing all pending KYC applications', 'success');
      refetch();
      refetchQueue();
    },
    onError: () => {
      showNotification('Failed to process pending KYCs', 'error');
    },
  });

  const getAgentIcon = (agentType: string) => {
    switch (agentType) {
      case 'kyc_agent':
        return <Shield className="w-5 h-5" />;
      case 'service_agent':
        return <Star className="w-5 h-5" />;
      case 'fraud_detection_agent':
        return <AlertTriangle className="w-5 h-5" />;
      case 'user_support_agent':
        return <MessageSquare className="w-5 h-5" />;
      case 'quality_assurance_agent':
        return <CheckCircle2 className="w-5 h-5" />;
      default:
        return <Bot className="w-5 h-5" />;
    }
  };

  const getAgentColor = (agentType: string) => {
    switch (agentType) {
      case 'kyc_agent':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'service_agent':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'fraud_detection_agent':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'user_support_agent':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'quality_assurance_agent':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string, isActive: boolean) => {
    if (!isActive) return 'bg-gray-100 text-gray-600';
    switch (status) {
      case 'online':
        return 'bg-green-100 text-green-800';
      case 'busy':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Agent Management</h1>
          <p className="text-gray-600">Monitor and control automated agents handling platform operations</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => processPendingKYCsMutation.mutate()}
            variant="outline"
            disabled={processPendingKYCsMutation.isPending}
            className="text-blue-600 border-blue-200 hover:bg-blue-50"
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Process Pending KYCs
          </Button>
          <Button
            onClick={() => emergencyStopMutation.mutate()}
            variant="outline"
            disabled={emergencyStopMutation.isPending}
            className="text-red-600 border-red-200 hover:bg-red-50"
          >
            <PauseCircle className="w-4 h-4 mr-2" />
            Emergency Stop
          </Button>
          <Button
            onClick={() => restartAllMutation.mutate()}
            disabled={restartAllMutation.isPending}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Restart All
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Agents</p>
                <p className="text-2xl font-bold">
                  {agents?.filter((agent: Agent) => agent.config.isActive).length || 0}
                </p>
              </div>
              <Activity className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Queue</p>
                <p className="text-2xl font-bold">
                  {queueInfo ? Object.values(queueInfo).reduce((sum: number, agent: any) => sum + agent.queueSize, 0) : 0}
                </p>
              </div>
              <Clock className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Auto Approval</p>
                <p className="text-2xl font-bold">
                  {agents?.filter((agent: Agent) => agent.config.autoApprovalEnabled).length || 0}
                </p>
              </div>
              <Zap className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">System Health</p>
                <p className="text-2xl font-bold text-green-600">
                  {agents?.every((agent: Agent) => agent.status === 'online' || !agent.config.isActive) ? 'Good' : 'Issues'}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Agents Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {agents?.map((agent: Agent) => (
          <Card key={agent.agentId} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${getAgentColor(agent.config.type)}`}>
                    {getAgentIcon(agent.config.type)}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{agent.config.name}</CardTitle>
                    <CardDescription className="text-sm">
                      {agent.config.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </CardDescription>
                  </div>
                </div>
                <Switch
                  checked={agent.config.isActive}
                  onCheckedChange={(checked) =>
                    toggleAgentMutation.mutate({ agentId: agent.agentId, isActive: checked })
                  }
                  disabled={toggleAgentMutation.isPending}
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Status</span>
                <Badge className={getStatusColor(agent.status, agent.config.isActive)}>
                  {agent.config.isActive ? agent.status : 'Offline'}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Queue Size</span>
                <Badge variant="outline">
                  {queueInfo?.[agent.agentId]?.queueSize || 0} tasks
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Priority</span>
                <Badge variant="outline">
                  {agent.config.priority}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Auto Approval</span>
                <div className="flex items-center gap-2">
                  {agent.config.autoApprovalEnabled ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-green-600">{agent.config.autoApprovalThreshold}%</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-500">Disabled</span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Last Active</span>
                <span className="text-sm text-gray-500">
                  {new Date(agent.lastActive).toLocaleTimeString()}
                </span>
              </div>

              <div className="flex gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedAgent(agent);
                    setShowMetrics(true);
                  }}
                  className="flex-1"
                >
                  <BarChart3 className="w-4 h-4 mr-1" />
                  Metrics
                </Button>

                {agent.config.type === 'kyc_agent' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => processKycMutation.mutate({ providerId: 1, priority: 'high' })}
                    disabled={processKycMutation.isPending || !agent.config.isActive}
                    className="flex-1"
                  >
                    <PlayCircle className="w-4 h-4 mr-1" />
                    Test KYC
                  </Button>
                )}

                {agent.config.type === 'fraud_detection_agent' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => runFraudDetectionMutation.mutate({ providerId: 1 })}
                    disabled={runFraudDetectionMutation.isPending || !agent.config.isActive}
                    className="flex-1"
                  >
                    <Search className="w-4 h-4 mr-1" />
                    Scan
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Agent Metrics Modal */}
      {showMetrics && selectedAgent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{selectedAgent.config.name} - Metrics</CardTitle>
                <Button variant="ghost" onClick={() => setShowMetrics(false)}>
                  ×
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedAgentMetrics ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-sm text-blue-600">Tasks Processed</p>
                      <p className="text-2xl font-bold text-blue-800">
                        {selectedAgentMetrics.tasksProcessed || 0}
                      </p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <p className="text-sm text-green-600">Tasks Completed</p>
                      <p className="text-2xl font-bold text-green-800">
                        {selectedAgentMetrics.tasksCompleted || 0}
                      </p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <p className="text-sm text-purple-600">Avg Processing Time</p>
                      <p className="text-2xl font-bold text-purple-800">
                        {selectedAgentMetrics.averageProcessingTime ? 
                          `${(selectedAgentMetrics.averageProcessingTime / 1000).toFixed(1)}s` : '0s'}
                      </p>
                    </div>
                    <div className="bg-orange-50 p-4 rounded-lg">
                      <p className="text-sm text-orange-600">Accuracy Rate</p>
                      <p className="text-2xl font-bold text-orange-800">
                        {selectedAgentMetrics.accuracyRate ? 
                          `${selectedAgentMetrics.accuracyRate.toFixed(1)}%` : '0%'}
                      </p>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-semibold mb-2">Configuration</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Priority:</span>
                        <Badge variant="outline">{selectedAgent.config.priority}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Auto Approval:</span>
                        <span>{selectedAgent.config.autoApprovalEnabled ? 'Enabled' : 'Disabled'}</span>
                      </div>
                      {selectedAgent.config.autoApprovalEnabled && (
                        <div className="flex justify-between">
                          <span>Approval Threshold:</span>
                          <span>{selectedAgent.config.autoApprovalThreshold}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading metrics...</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Test agent capabilities and monitor system performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              onClick={() => processKycMutation.mutate({ providerId: 1, priority: 'high' })}
              disabled={processKycMutation.isPending}
              className="h-auto p-4 flex flex-col items-center gap-2"
            >
              <Shield className="w-6 h-6" />
              <span>Process KYC</span>
              <span className="text-xs opacity-75">Test KYC automation</span>
            </Button>

            <Button
              onClick={() => runFraudDetectionMutation.mutate({ providerId: 1 })}
              disabled={runFraudDetectionMutation.isPending}
              variant="outline"
              className="h-auto p-4 flex flex-col items-center gap-2"
            >
              <AlertTriangle className="w-6 h-6" />
              <span>Fraud Detection</span>
              <span className="text-xs opacity-75">Run fraud scan</span>
            </Button>

            <Button
              onClick={() => refetch()}
              variant="outline"
              className="h-auto p-4 flex flex-col items-center gap-2"
            >
              <RotateCcw className="w-6 h-6" />
              <span>Refresh Status</span>
              <span className="text-xs opacity-75">Update agent data</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}