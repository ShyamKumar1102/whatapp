import { useState, useEffect } from 'react';
import { 
  Plus, MoreVertical, Users, Clock, CheckCircle, 
  AlertCircle, TrendingUp, Filter, Search, RefreshCw, Columns, BarChart3
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import KanbanBoard from '@/components/pipeline/KanbanBoard';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store/useStore';

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

const pipelineStages = [
  { id: 'lead', name: 'New Leads', count: 12, color: 'bg-blue-500' },
  { id: 'qualified', name: 'Qualified', count: 8, color: 'bg-yellow-500' },
  { id: 'proposal', name: 'Proposal', count: 5, color: 'bg-orange-500' },
  { id: 'negotiation', name: 'Negotiation', count: 3, color: 'bg-purple-500' },
  { id: 'closed', name: 'Closed Won', count: 7, color: 'bg-green-500' },
];

const pipelineDeals = [
  {
    id: 1,
    title: 'Enterprise Software License',
    company: 'TechCorp Inc.',
    value: '$45,000',
    stage: 'proposal',
    priority: 'high',
    lastActivity: '2 hours ago',
    contact: 'John Smith',
    probability: 75,
  },
  {
    id: 2,
    title: 'Marketing Automation Setup',
    company: 'StartupXYZ',
    value: '$12,500',
    stage: 'qualified',
    priority: 'medium',
    lastActivity: '1 day ago',
    contact: 'Sarah Johnson',
    probability: 60,
  },
  {
    id: 3,
    title: 'Cloud Migration Project',
    company: 'Global Solutions',
    value: '$78,000',
    stage: 'negotiation',
    priority: 'high',
    lastActivity: '3 hours ago',
    contact: 'Mike Wilson',
    probability: 85,
  },
  {
    id: 4,
    title: 'CRM Integration',
    company: 'Local Business',
    value: '$8,900',
    stage: 'lead',
    priority: 'low',
    lastActivity: '5 hours ago',
    contact: 'Emma Davis',
    probability: 25,
  },
];

const pipelineStats = [
  { label: 'Total Pipeline Value', value: '$144,400', growth: 12.5, icon: TrendingUp },
  { label: 'Active Deals', value: '35', growth: 8.3, icon: Users },
  { label: 'Avg Deal Size', value: '$4,126', growth: -2.1, icon: CheckCircle },
  { label: 'Close Rate', value: '68%', growth: 5.7, icon: AlertCircle },
];

export default function PipelinePage() {
  const navigate = useNavigate();
  const { setSelectedChat, chats } = useStore();
  const [activeView, setActiveView] = useState('kanban');
  const [pipelineData, setPipelineData] = useState({ stages: [], totalContacts: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [addDealOpen, setAddDealOpen] = useState(false);
  const [dealForm, setDealForm] = useState({ title: '', company: '', value: '', contact: '', stage: 'lead', priority: 'medium' });

  // Mock data for kanban view
  useEffect(() => {
    const mockKanbanData = {
      stages: [
        {
          id: 1,
          name: 'New',
          color: 'grey',
          position: 1,
          contacts: [
            {
              id: 1,
              name: 'John Smith',
              phone: '+1234567890',
              email: 'john@example.com',
              status: 'active',
              pipeline_status: 'open',
              stage_id: 1,
              updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
              id: 2,
              name: 'Sarah Johnson',
              phone: '+1234567891',
              email: 'sarah@example.com',
              status: 'active',
              pipeline_status: 'pending',
              stage_id: 1,
              updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
            }
          ]
        },
        {
          id: 2,
          name: 'Qualified',
          color: 'blue',
          position: 2,
          contacts: [
            {
              id: 3,
              name: 'Mike Wilson',
              phone: '+1234567892',
              email: 'mike@example.com',
              status: 'active',
              pipeline_status: 'open',
              stage_id: 2,
              updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
            }
          ]
        },
        {
          id: 3,
          name: 'Proposal',
          color: 'orange',
          position: 3,
          contacts: [
            {
              id: 4,
              name: 'Emma Davis',
              phone: '+1234567893',
              email: 'emma@example.com',
              status: 'active',
              pipeline_status: 'open',
              stage_id: 3,
              updated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
            }
          ]
        },
        {
          id: 4,
          name: 'Won',
          color: 'green',
          position: 4,
          contacts: [
            {
              id: 5,
              name: 'Alex Brown',
              phone: '+1234567894',
              email: 'alex@example.com',
              status: 'active',
              pipeline_status: 'closed',
              stage_id: 4,
              updated_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
            }
          ]
        }
      ],
      totalContacts: 5
    };
    setPipelineData(mockKanbanData);
  }, []);

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('crm_token');
      const res = await fetch(`${BACKEND}/api/pipeline`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setPipelineData(data.data);
    } catch { /* keep existing */ } finally {
      setIsLoading(false);
    }
  };

  const handleAddDeal = () => {
    if (!dealForm.title || !dealForm.company) return;
    const newDeal = { id: Date.now(), ...dealForm, lastActivity: 'Just now', probability: 25 };
    // Add to analytics view deals
    setAddDealOpen(false);
    setDealForm({ title: '', company: '', value: '', contact: '', stage: 'lead', priority: 'medium' });
    alert(`✅ Deal "${newDeal.title}" added to ${newDeal.stage} stage!`);
  };

  const handleOpenChat = (contact) => {
    const existingChat = chats.find(c => c.contact?.phone === contact.phone || c.contact?.name === contact.name);
    if (existingChat) {
      setSelectedChat(existingChat.id);
    }
    navigate('/chats');
  };

  const filteredStages = pipelineData.stages.map(stage => ({
    ...stage,
    contacts: stage.contacts?.filter(c =>
      !searchQuery || c.name?.toLowerCase().includes(searchQuery.toLowerCase())
    ) || []
  }));

  const handleMoveContact = async (contactId, newStageId) => {
    try {
      setPipelineData(prev => {
        const newStages = prev.stages.map(stage => ({
          ...stage,
          contacts: stage.contacts.filter(contact => contact.id !== contactId)
        }));
        
        const targetStageIndex = newStages.findIndex(stage => stage.id === newStageId);
        if (targetStageIndex !== -1) {
          const contactToMove = prev.stages
            .flatMap(stage => stage.contacts)
            .find(contact => contact.id === contactId);
          
          if (contactToMove) {
            newStages[targetStageIndex].contacts.push({
              ...contactToMove,
              stage_id: newStageId,
              updated_at: new Date().toISOString()
            });
          }
        }
        
        return {
          ...prev,
          stages: newStages
        };
      });
    } catch (error) {
      console.error('Error moving contact:', error);
    }
  };

  const getDealsByStage = (stageId) => {
    return pipelineDeals.filter(deal => deal.stage === stageId);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-500 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-500 bg-gray-50';
    }
  };

  const totalContacts = pipelineData.stages.reduce(
    (total, stage) => total + (stage.contacts?.length || 0), 
    0
  );

  return (
    <div className="p-4 lg:p-6 space-y-4 lg:space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Sales Pipeline</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {totalContacts} contacts across {pipelineData.stages.length} stages
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search deals..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 w-full sm:w-auto"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex items-center gap-2 flex-1 sm:flex-none" onClick={() => setSearchQuery('')}>
              <Filter className="w-4 h-4" />
              <span className="sm:inline hidden">{searchQuery ? 'Clear' : 'Filter'}</span>
            </Button>
            <Button 
              variant="outline" 
              onClick={handleRefresh}
              disabled={isLoading}
              className="flex-1 sm:flex-none"
            >
              <RefreshCw className={`h-4 w-4 sm:mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="sm:inline hidden">Refresh</span>
            </Button>
            <Button variant="default" className="flex-1 sm:flex-none" onClick={() => setAddDealOpen(true)}>
              <Plus className="w-4 h-4 sm:mr-2" />
              <span className="sm:inline hidden">Add Deal</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Pipeline Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {pipelineStats.map((stat) => {
          const isPositive = stat.growth > 0;
          return (
            <div key={stat.label} className="rounded-xl border bg-card text-card-foreground shadow-sm p-4 lg:p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{stat.label}</span>
                <div className="w-8 h-8 lg:w-9 lg:h-9 rounded-lg bg-accent flex items-center justify-center">
                  <stat.icon className="w-4 h-4 text-accent-foreground" />
                </div>
              </div>
              <p className="text-xl lg:text-2xl font-bold text-foreground mt-2">{stat.value}</p>
              <div className="flex items-center gap-1 mt-1">
                <TrendingUp className={cn('w-3 h-3', isPositive ? 'text-primary' : 'text-destructive')} />
                <span className={cn('text-xs font-medium', isPositive ? 'text-primary' : 'text-destructive')}>
                  {Math.abs(stat.growth)}%
                </span>
                <span className="text-xs text-muted-foreground">vs last month</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* View Tabs */}
      <Tabs value={activeView} onValueChange={setActiveView}>
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="kanban" className="flex items-center gap-2 flex-1 sm:flex-none">
            <Columns className="w-4 h-4" />
            <span className="hidden sm:inline">Kanban View</span>
            <span className="sm:hidden">Board</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2 flex-1 sm:flex-none">
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">Analytics View</span>
            <span className="sm:hidden">Stats</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="kanban" className="mt-4 lg:mt-6">
          <div className="overflow-x-auto">
            <div className="min-w-[800px] lg:min-w-0">
              <KanbanBoard
                stages={filteredStages}
                onMoveContact={handleMoveContact}
                onOpenChat={handleOpenChat}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="mt-4 lg:mt-6">
          {/* Pipeline Board */}
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-4 lg:p-6">
            <h2 className="text-sm font-semibold text-foreground mb-4">Pipeline Overview</h2>
            <div className="flex gap-4 lg:gap-6 overflow-x-auto pb-4">
              {pipelineStages.map((stage) => {
                const deals = getDealsByStage(stage.id);
                return (
                  <div key={stage.id} className="flex-shrink-0 w-72 lg:w-80">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className={cn('w-3 h-3 rounded-full', stage.color)}></div>
                        <h3 className="text-sm font-medium text-foreground">{stage.name}</h3>
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                          {stage.count}
                        </span>
                      </div>
                      <button className="p-1 hover:bg-surface-hover rounded">
                        <MoreVertical className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </div>
                    
                    <div className="space-y-3 max-h-80 lg:max-h-96 overflow-y-auto">
                      {deals.map((deal) => (
                        <div key={deal.id} className="rounded-lg border bg-background p-3 lg:p-4 hover:shadow-sm transition-shadow cursor-pointer">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="text-sm font-medium text-foreground line-clamp-2 pr-2">{deal.title}</h4>
                            <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium shrink-0', getPriorityColor(deal.priority))}>
                              {deal.priority}
                            </span>
                          </div>
                          
                          <p className="text-xs text-muted-foreground mb-2 truncate">{deal.company}</p>
                          
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-semibold text-foreground">{deal.value}</span>
                            <span className="text-xs text-muted-foreground">{deal.probability}%</span>
                          </div>
                          
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                            <Users className="w-3 h-3 shrink-0" />
                            <span className="truncate">{deal.contact}</span>
                          </div>
                          
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3 shrink-0" />
                            <span>{deal.lastActivity}</span>
                          </div>
                        </div>
                      ))}
                      
                      <button className="w-full p-3 border-2 border-dashed border-border rounded-lg text-sm text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors">
                        + Add Deal
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="mt-4 lg:mt-6 rounded-xl border bg-card text-card-foreground shadow-sm p-4 lg:p-5">
            <h2 className="text-sm font-semibold text-foreground mb-4">Recent Pipeline Activity</h2>
            <div className="space-y-3">
              {[
                { action: 'Deal moved to Negotiation', deal: 'Cloud Migration Project', time: '2 hours ago', user: 'Mike Wilson' },
                { action: 'New deal created', deal: 'Enterprise Software License', time: '4 hours ago', user: 'Sarah Johnson' },
                { action: 'Deal value updated', deal: 'Marketing Automation Setup', time: '1 day ago', user: 'John Smith' },
                { action: 'Deal closed won', deal: 'CRM Integration Phase 1', time: '2 days ago', user: 'Emma Davis' },
              ].map((activity, index) => (
                <div key={index} className="flex items-start gap-3 py-2">
                  <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">
                      <span className="font-medium">{activity.action}</span> - 
                      <span className="break-words">{activity.deal}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">by {activity.user} • {activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Deal Dialog */}
      <Dialog open={addDealOpen} onOpenChange={setAddDealOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add New Deal</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div><Label>Deal Title *</Label><Input value={dealForm.title} onChange={e => setDealForm({...dealForm, title: e.target.value})} placeholder="e.g. Enterprise License" className="mt-1.5" /></div>
            <div><Label>Company *</Label><Input value={dealForm.company} onChange={e => setDealForm({...dealForm, company: e.target.value})} placeholder="Company name" className="mt-1.5" /></div>
            <div><Label>Value</Label><Input value={dealForm.value} onChange={e => setDealForm({...dealForm, value: e.target.value})} placeholder="$10,000" className="mt-1.5" /></div>
            <div><Label>Contact Name</Label><Input value={dealForm.contact} onChange={e => setDealForm({...dealForm, contact: e.target.value})} placeholder="Contact person" className="mt-1.5" /></div>
            <div>
              <Label>Stage</Label>
              <select value={dealForm.stage} onChange={e => setDealForm({...dealForm, stage: e.target.value})} className="mt-1.5 w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
                <option value="lead">New Lead</option>
                <option value="qualified">Qualified</option>
                <option value="proposal">Proposal</option>
                <option value="negotiation">Negotiation</option>
                <option value="closed">Closed Won</option>
              </select>
            </div>
            <div>
              <Label>Priority</Label>
              <select value={dealForm.priority} onChange={e => setDealForm({...dealForm, priority: e.target.value})} className="mt-1.5 w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <Button onClick={handleAddDeal} className="w-full" disabled={!dealForm.title || !dealForm.company}>Add Deal</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}