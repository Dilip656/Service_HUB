import { Router } from 'express';
import { agentManager } from '../agents/AgentManager';

const router = Router();

// Get all agent statuses
router.get('/agents', (req, res) => {
  try {
    const statuses = agentManager.getAllAgentStatuses();
    res.json(statuses);
  } catch (error) {
    console.error('Error fetching agent statuses:', error);
    res.status(500).json({ message: 'Failed to fetch agent statuses' });
  }
});

// Get specific agent status
router.get('/agents/:agentId', (req, res) => {
  try {
    const { agentId } = req.params;
    const status = agentManager.getAgentStatus(agentId);
    res.json(status);
  } catch (error) {
    console.error(`Error fetching agent ${req.params.agentId}:`, error);
    res.status(404).json({ message: 'Agent not found' });
  }
});

// Get agent metrics
router.get('/agents/:agentId/metrics', (req, res) => {
  try {
    const { agentId } = req.params;
    const { period = '24h' } = req.query;
    const metrics = agentManager.getAgentMetrics(agentId, period as '24h' | '7d' | '30d');
    res.json(metrics);
  } catch (error) {
    console.error(`Error fetching metrics for agent ${req.params.agentId}:`, error);
    res.status(404).json({ message: 'Agent not found' });
  }
});

// Configure agent
router.put('/agents/:agentId/config', (req, res) => {
  try {
    const { agentId } = req.params;
    const newConfig = req.body;
    agentManager.configureAgent(agentId, newConfig);
    res.json({ message: 'Agent configuration updated' });
  } catch (error) {
    console.error(`Error configuring agent ${req.params.agentId}:`, error);
    res.status(400).json({ message: 'Failed to configure agent' });
  }
});

// Enable/disable agent
router.put('/agents/:agentId/status', (req, res) => {
  try {
    const { agentId } = req.params;
    const { isActive } = req.body;
    agentManager.setAgentActive(agentId, isActive);
    res.json({ message: `Agent ${isActive ? 'activated' : 'deactivated'}` });
  } catch (error) {
    console.error(`Error updating agent status ${req.params.agentId}:`, error);
    res.status(400).json({ message: 'Failed to update agent status' });
  }
});

// Get queue information
router.get('/agents/queue/info', (req, res) => {
  try {
    const queueInfo = agentManager.getQueueInfo();
    res.json(queueInfo);
  } catch (error) {
    console.error('Error fetching queue info:', error);
    res.status(500).json({ message: 'Failed to fetch queue information' });
  }
});

// Process KYC for a provider
router.post('/agents/process/kyc', (req, res) => {
  try {
    const { providerId, priority = 'medium' } = req.body;
    agentManager.processKYC(providerId, priority);
    res.json({ message: 'KYC processing initiated' });
  } catch (error) {
    console.error('Error initiating KYC processing:', error);
    res.status(400).json({ message: 'Failed to initiate KYC processing' });
  }
});

// Process service quality check
router.post('/agents/process/service', (req, res) => {
  try {
    const { serviceId, providerId, priority = 'medium' } = req.body;
    agentManager.processService(serviceId, providerId, priority);
    res.json({ message: 'Service quality check initiated' });
  } catch (error) {
    console.error('Error initiating service quality check:', error);
    res.status(400).json({ message: 'Failed to initiate service quality check' });
  }
});

// Run fraud detection
router.post('/agents/process/fraud', (req, res) => {
  try {
    const { providerId, priority = 'high' } = req.body;
    agentManager.runFraudDetection(providerId, priority);
    res.json({ message: 'Fraud detection initiated' });
  } catch (error) {
    console.error('Error initiating fraud detection:', error);
    res.status(400).json({ message: 'Failed to initiate fraud detection' });
  }
});

// Emergency stop all agents
router.post('/agents/emergency-stop', (req, res) => {
  try {
    agentManager.emergencyStop();
    res.json({ message: 'Emergency stop activated - all agents deactivated' });
  } catch (error) {
    console.error('Error during emergency stop:', error);
    res.status(500).json({ message: 'Failed to execute emergency stop' });
  }
});

// Restart all agents
router.post('/agents/restart', (req, res) => {
  try {
    agentManager.restartAllAgents();
    res.json({ message: 'All agents restarted' });
  } catch (error) {
    console.error('Error restarting agents:', error);
    res.status(500).json({ message: 'Failed to restart agents' });
  }
});

// Process all pending KYCs
router.post('/agents/process/all-pending-kyc', (req, res) => {
  try {
    agentManager.processAllPendingKYCs();
    res.json({ message: 'Processing all pending KYC applications' });
  } catch (error) {
    console.error('Error processing pending KYCs:', error);
    res.status(500).json({ message: 'Failed to process pending KYCs' });
  }
});

export default router;