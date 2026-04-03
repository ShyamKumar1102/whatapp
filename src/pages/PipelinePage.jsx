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
import { useRole } from '@/hooks/useRole';

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
const getHeaders = () => {
  const token = localStorage.getItem('crm_token');
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
};

export default function PipelinePage() {
  const navigate = useNavigate();
  const { setSelectedChat, chats } = useStore();
  const [activeView, setActiveView]   = useState('kanban');
  const [pipelineData, setPipelineData] = useState({ stages: [], totalContacts: 0 });
  const [isLoading, setIsLoading]     = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [addDealOpen, setAddDealOpen] = useState(false);
  const [dealForm, setDealForm]       = useState({ title: '', company: '', value: '', contact: '', stage: 'lead', priority: 'medium' });
  const [deals, setDeals]             = useState([]);
  const [pipelineStats, setPipelineStats] = useState([
    { label: 'Total Pipeline Value', value: '—', growth: 0,   icon: TrendingUp },
    { label: 'Active Deals',         value: '—', growth: 0,   icon: Users },
    { label: 'Avg Deal Size',        value: '—', growth: 0,   icon: CheckCircle },
    { label: 'Close Rate',           value: '—', growth: 0,   icon: AlertCircle },
  ]);

  const { isAdmin } = useRole();

  const fetchPipeline = async () => {
    setIsLoading(true);
    try {
      const res  = await fetch(`${BACKEND}/api/pipeline`, { headers: getHeaders() });
      const data = await res.json();
      if (data.success) {
        setPipelineData(data.data);
        // compute stats from real data
        const allContacts = data.data.stages.flatMap(s => s.contacts || []);
        const closed = data.data.stages.find(s => s.name?.toLowerCase().includes('closed') || s.name?.toLowerCase().includes('won'));
        const closeRate = allContacts.length > 0 ? Math.round(((closed?.contacts?.length || 0) / allContacts.length) * 100) : 0;
        setPipelineStats([
          { label: 'Total Contacts',  value: allContacts.length.toString(), growth: 0, icon: TrendingUp },
          { label: 'Active Deals',    value: allContacts.filter(c => c.pipeline_status !== 'closed').length.toString(), growth: 0, icon: Users },
          { label: 'Total Stages',    value: data.data.stages.length.toString(), growth: 0, icon: CheckCircle },
          { label: 'Close Rate',      value: `${closeRate}%`, growth: 0, icon: AlertCircle },
        ]);
      }
    } catch { /* keep existing */ } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchPipeline(); }, []);

  const handleAddDeal = async () => {
    if (!dealForm.title || !dealForm.company) return;
    const newDeal = { id: Date.now(), ...dealForm, lastActivity: 'Just now', probability: 25, created_at: new Date().toISOString() };
    setDeals(prev => [...prev, newDeal]);
    setAddDealOpen(false);
    setDealForm({ title: '', company: '', value: '', contact: '', stage: 'lead', priority: 'medium' });
  };

  const handleOpenChat = (contact) => {
    const existingChat = chats.find(c => c.contact?.phone === contact.phone || c.contact?.name === contact.name);
    if (existingChat) setSelectedChat(existingChat.id);
    navigate('/chats');
  };

  const handleMoveContact = async (contactId, newStageId) => {
    // Optimistic UI update
    setPipelineData(prev => {
      const contact = prev.stages.flatMap(s => s.contacts).find(c => c.id === contactId);
      if (!contact) return prev;
      return {
        ...prev,
        stages: prev.stages.map(stage => ({
          ...stage,
          contacts: stage.id === newStageId
            ? [...stage.contacts.filter(c => c.id !== contactId), { ...contact, stage_id: newStageId, updated_at: new Date().toISOString() }]
            : stage.contacts.filter(c => c.id !== contactId),
        })),
      };
    });
    // Persist to backend
    try {
      await fetch(`${BACKEND}/api/pipeline/contacts/${contactId}/stage`, {
        method: 'PATCH', headers: getHeaders(), body: JSON.stringify({ stage_id: newStageId }),
      });
    } catch { /* optimistic already applied */ }
  };

  const filteredStages = pipelineData.stages.map(stage => ({
    ...stage,
    contacts: (stage.contacts || []).filter(c =>
      !searchQuery || c.name?.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  }));

  const getDealsByStage = (stageId) => deals.filter(d => d.stage === stageId);

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':   return 'text-red-500 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low':    return 'text-green-600 bg-green-50';
      default:       return 'text-gray-500 bg-gray-50';
    }
  };

  const totalContacts = pipelineData.stages.reduce((t, s) => t + (s.contacts?.length || 0), 0);

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
              onClick={fetchPipeline}
              disabled={isLoading}
              className="flex-1 sm:flex-none"
            >
              <RefreshCw className={`h-4 w-4 sm:mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="sm:inline hidden">Refresh</span>
            </Button>
            {isAdmin && (
            <Button variant="default" className="flex-1 sm:flex-none" onClick={() => setAddDealOpen(true)}>
              <Plus className="w-4 h-4 sm:mr-2" />
              <span className="sm:inline hidden">Add Deal</span>
            </Button>
            )}
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
              {filteredStages.map((stage) => {
                const stageDeals = getDealsByStage(stage.id);
                const stageColors = ['bg-blue-500','bg-yellow-500','bg-orange-500','bg-purple-500','bg-green-500'];
                const stageColor = stageColors[filteredStages.indexOf(stage) % stageColors.length];
                return (
                  <div key={stage.id} className="flex-shrink-0 w-72 lg:w-80">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className={cn('w-3 h-3 rounded-full', stageColor)}></div>
                        <h3 className="text-sm font-medium text-foreground">{stage.name}</h3>
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                          {getDealsByStage(stage.id).length}
                        </span>
                      </div>
                      <button className="p-1 hover:bg-surface-hover rounded">
                        <MoreVertical className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </div>
                    
                    <div className="space-y-3 max-h-80 lg:max-h-96 overflow-y-auto">
                      {stageDeals.map((deal) => (
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
                      
                      <button
                        onClick={() => setAddDealOpen(true)}
                        className="w-full p-3 border-2 border-dashed border-border rounded-lg text-sm text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors">
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