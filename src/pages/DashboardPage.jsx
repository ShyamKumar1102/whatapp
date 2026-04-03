import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, MessageSquare, MessagesSquare, Megaphone, Clock, RefreshCw, Download, Sun, AlertCircle, UserPlus, PhoneCall } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { cn } from '@/lib/utils';
import { exportAnalyticsPDF } from '@/lib/exportPDF';

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
const TAG_COLORS = ['hsl(142, 64%, 38%)', 'hsl(217, 91%, 60%)', 'hsl(38, 92%, 50%)', 'hsl(280, 65%, 55%)', 'hsl(0, 72%, 55%)'];

export default function DashboardPage() {
  const navigate = useNavigate();
  const { chats, setSelectedChat } = useStore();
  const [stats, setStats]         = useState(null);
  const [loading, setLoading]     = useState(true);
  const [chartData, setChartData] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [pipeline, setPipeline]   = useState([]);
  const [activity, setActivity]   = useState([]);
  const [agents, setAgents]       = useState([]);
  const [contacts, setContacts]   = useState([]);
  const [convs, setConvs]         = useState([]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('crm_token');
      const h = { Authorization: `Bearer ${token}` };

      const [statsRes, chartRes, remindersRes, pipelineRes, convsRes, contactsRes, agentsRes] = await Promise.all([
        fetch(`${BACKEND}/api/dashboard/stats`, { headers: h }),
        fetch(`${BACKEND}/api/messages/chart`,  { headers: h }),
        fetch(`${BACKEND}/api/reminders`,        { headers: h }),
        fetch(`${BACKEND}/api/pipeline`,         { headers: h }),
        fetch(`${BACKEND}/api/conversations`,    { headers: h }),
        fetch(`${BACKEND}/api/contacts`,         { headers: h }),
        fetch(`${BACKEND}/api/agents`,           { headers: h }),
      ]);

      const [statsData, chartD, remindersData, pipelineData, convsData, contactsData, agentsData] = await Promise.all([
        statsRes.json(), chartRes.json(), remindersRes.json(), pipelineRes.json(), convsRes.json(), contactsRes.json(), agentsRes.json(),
      ]);

      if (statsData.success)    setStats(statsData.data);
      if (chartD.success && chartD.data?.length) setChartData(chartD.data);
      if (remindersData.success) setReminders(remindersData.data || []);
      if (pipelineData.success)  setPipeline(pipelineData.data?.stages || []);
      if (contactsData.success)  setContacts(contactsData.data || []);
      if (convsData.success)       setConvs(convsData.data || []);

      if (convsData.success && convsData.data?.length && agentsData.success) {
        agentsData.data.forEach(a => { agentMap[a.id] = { name: a.name, chats: 0 }; });
        convsData.data.forEach(conv => {
          const aid = conv.assigned_agent;
          if (aid && agentMap[aid]) agentMap[aid].chats++;
        });
        setAgents(Object.values(agentMap).filter(a => a.chats > 0).slice(0, 5));
      }

      // Build recent activity from conversations
      if (convsData.success && convsData.data?.length) {
        const sorted = [...convsData.data]
          .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
          .slice(0, 6)
          .map(c => ({
            id: c.id,
            name: c.contact?.name || 'Unknown',
            message: c.lastMessage || 'New conversation',
            time: c.updated_at ? new Date(c.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
            status: c.status,
            initials: (c.contact?.name || '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase(),
          }));
        setActivity(sorted);
      }
    } catch { /* keep empty */ } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  // Today's summary
  const todayStr = new Date().toDateString();
  const todaySent     = convs.filter(c => new Date(c.updated_at).toDateString() === todayStr && c.lastMessage).length;
  const todayContacts = contacts.filter(c => new Date(c.created_at).toDateString() === todayStr).length;
  const activeChats   = convs.filter(c => c.status === 'open').length;
  const unreadChats   = convs.filter(c => (c.unreadCount || 0) > 0).length;

  // Follow-up needed — contacts with due/overdue reminders
  const followUps = reminders
    .filter(r => r.status === 'pending' && r.due_date && new Date(r.due_date) <= new Date())
    .map(r => {
      const contact = contacts.find(c => c.id === r.contact_id);
      const chat = convs.find(c => c.contact_id === r.contact_id);
      return { ...r, contactName: contact?.name || 'Unknown', contactPhone: contact?.phone || '', chatId: chat?.id || null };
    })
    .slice(0, 5);

  // Reminders breakdown
  const now = new Date();
  const reminderStats = {
    pending:   reminders.filter(r => r.status === 'pending' && (!r.due_date || new Date(r.due_date) > now)).length,
    overdue:   reminders.filter(r => r.status === 'pending' && r.due_date && new Date(r.due_date) <= now).length,
    completed: reminders.filter(r => r.status === 'completed').length,
  };

  const statCards = stats ? [
    { label: 'Total Messages', value: stats.totalMessages?.toLocaleString() || '0', growth: stats.messagesGrowth || 0, icon: MessageSquare },
    { label: 'Active Chats',   value: stats.activeChats?.toString() || '0',         growth: stats.chatsGrowth || 0,    icon: MessagesSquare },
    { label: 'Campaigns',      value: stats.campaigns?.toString() || '0',            growth: stats.campaignsGrowth || 0, icon: Megaphone },
    { label: 'Avg Response',   value: stats.responseTime || '—',                     growth: stats.responseTimeGrowth || 0, icon: Clock },
  ] : [];

  const statusColor = { open: 'bg-green-500', pending: 'bg-yellow-500', closed: 'bg-gray-400' };
  const maxChats = Math.max(...agents.map(a => a.chats), 1);
  const tagData = (() => {
    const map = {};
    contacts.forEach(c => (c.tags || []).forEach(t => { map[t] = (map[t] || 0) + 1; }));
    return Object.entries(map).map(([name, value]) => ({ name, value })).slice(0, 5);
  })();

  const handleExportCSV = () => {
    const rows = [['Day','Sent','Received'], ...chartData.map(d => [d.name, d.sent, d.received])];
    const blob = new Blob([rows.map(r => r.join(',')).join('\n')], { type: 'text/csv' });
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `dashboard_${new Date().toISOString().split('T')[0]}.csv` });
    document.body.appendChild(a); a.click(); a.remove();
  };

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Overview of your WhatsApp Business account</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExportCSV} className="p-2 rounded-lg hover:bg-surface-hover transition-colors" title="Export CSV">
            <Download className={cn('w-4 h-4 text-muted-foreground')} />
          </button>
          <button onClick={() => exportAnalyticsPDF(stats, chartData, agents, contacts)} className="p-2 rounded-lg hover:bg-surface-hover transition-colors" title="Export PDF">
            <span className="text-[10px] font-bold text-muted-foreground">PDF</span>
          </button>
          <button onClick={fetchAll} className="p-2 rounded-lg hover:bg-surface-hover transition-colors">
            <RefreshCw className={cn('w-4 h-4 text-muted-foreground', loading && 'animate-spin')} />
          </button>
        </div>
      </div>

      {/* Today's Summary */}
      <div className="bg-card rounded-xl border border-border p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-4">
          <Sun className="w-4 h-4 text-yellow-500" />
          <h2 className="text-sm font-semibold text-foreground">Today's Summary</h2>
          <span className="text-xs text-muted-foreground ml-auto">{new Date().toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Active Chats',    value: activeChats,   color: 'text-green-500',  bg: 'bg-green-500/10',  icon: MessagesSquare },
            { label: 'Unread Messages', value: unreadChats,   color: 'text-blue-500',   bg: 'bg-blue-500/10',   icon: MessageSquare },
            { label: 'New Contacts',    value: todayContacts, color: 'text-purple-500', bg: 'bg-purple-500/10', icon: UserPlus },
            { label: 'Chats Updated',   value: todaySent,     color: 'text-orange-500', bg: 'bg-orange-500/10', icon: Clock },
          ].map(item => (
            <div key={item.label} className={`rounded-xl p-3 ${item.bg} flex items-center gap-3`}>
              <item.icon className={`w-5 h-5 shrink-0 ${item.color}`} />
              <div>
                <p className={`text-xl font-bold ${item.color}`}>{item.value}</p>
                <p className="text-[10px] text-muted-foreground leading-tight">{item.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Follow-up Needed */}
      {followUps.length > 0 && (
        <div className="bg-card rounded-xl border border-destructive/30 p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-destructive" />
              <h2 className="text-sm font-semibold text-foreground">Follow-up Needed</h2>
              <span className="text-[10px] bg-destructive text-destructive-foreground px-1.5 py-0.5 rounded-full font-semibold">{followUps.length}</span>
            </div>
            <button onClick={() => navigate('/reminders')} className="text-xs text-primary hover:underline">View all</button>
          </div>
          <div className="space-y-2">
            {followUps.map(f => (
              <div key={f.id} className="flex items-center gap-3 p-3 rounded-lg bg-destructive/5 border border-destructive/20 hover:bg-destructive/10 cursor-pointer transition-colors"
                onClick={() => { if (f.chatId) { setSelectedChat(f.chatId); navigate('/chats'); } else navigate('/reminders'); }}>
                <div className="w-8 h-8 rounded-full bg-destructive/20 flex items-center justify-center shrink-0">
                  <span className="text-[10px] font-semibold text-destructive">{f.contactName.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{f.contactName}</p>
                  <p className="text-xs text-muted-foreground truncate">📌 {f.title}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[10px] text-destructive font-medium">⚠️ Overdue</p>
                  <p className="text-[10px] text-muted-foreground">{f.due_date ? new Date(f.due_date).toLocaleDateString([], { month: 'short', day: 'numeric' }) : ''}</p>
                </div>
                <PhoneCall className="w-4 h-4 text-muted-foreground shrink-0" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {loading ? Array(4).fill(0).map((_, i) => (
          <div key={i} className="bg-card rounded-xl border border-border p-5 animate-pulse">
            <div className="h-4 bg-muted rounded w-3/4 mb-3" />
            <div className="h-8 bg-muted rounded w-1/2" />
          </div>
        )) : statCards.map(stat => {
          const good = stat.growth > 0 || (stat.label === 'Avg Response' && stat.growth < 0);
          return (
            <div key={stat.label} className="bg-card rounded-xl border border-border p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm text-muted-foreground">{stat.label}</span>
                <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center shrink-0">
                  <stat.icon className="w-4 h-4 text-accent-foreground" />
                </div>
              </div>
              <p className="text-xl sm:text-2xl font-bold text-foreground mt-2">{stat.value}</p>
              <div className="flex items-center gap-1 mt-1">
                {good ? <TrendingUp className="w-3 h-3 text-primary" /> : <TrendingDown className="w-3 h-3 text-destructive" />}
                <span className={cn('text-xs font-medium', good ? 'text-primary' : 'text-destructive')}>{Math.abs(stat.growth)}%</span>
                <span className="text-xs text-muted-foreground hidden sm:inline">vs last week</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Row 2 — Chart + Reminders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Messages chart */}
        <div className="lg:col-span-2 bg-card rounded-xl border border-border p-4 sm:p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">Messages This Week</h2>
          <div className="h-48 sm:h-56">
            {chartData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} width={35} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="sent"     name="Sent"     fill="hsl(var(--primary))"       radius={[4,4,0,0]} />
                  <Bar dataKey="received" name="Received" fill="hsl(var(--primary) / 0.4)" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">No message data yet</div>
            )}
          </div>
        </div>

        {/* Reminders Overview */}
        <div className="bg-card rounded-xl border border-border p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-foreground">Reminders</h2>
            <button onClick={() => navigate('/reminders')} className="text-xs text-primary hover:underline">View all</button>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Pending',   count: reminderStats.pending,   color: 'bg-blue-500',   text: 'text-blue-500' },
              { label: 'Overdue',   count: reminderStats.overdue,   color: 'bg-destructive', text: 'text-destructive' },
              { label: 'Completed', count: reminderStats.completed, color: 'bg-green-500',  text: 'text-green-500' },
            ].map(r => {
              const total = reminders.length || 1;
              return (
                <div key={r.label} className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${r.color}`} />
                  <span className="text-sm text-foreground flex-1">{r.label}</span>
                  <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${r.color}`} style={{ width: `${(r.count / total) * 100}%` }} />
                  </div>
                  <span className={`text-sm font-semibold w-5 text-right ${r.text}`}>{r.count}</span>
                </div>
              );
            })}
            {reminders.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">No reminders yet</p>}
          </div>
          {reminderStats.overdue > 0 && (
            <div className="mt-4 p-2.5 rounded-lg bg-destructive/10 border border-destructive/20">
              <p className="text-xs text-destructive font-medium">⚠️ {reminderStats.overdue} overdue reminder{reminderStats.overdue > 1 ? 's' : ''}</p>
            </div>
          )}
        </div>
      </div>

      {/* Row 3 — Pipeline + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Pipeline Stage Breakdown */}
        <div className="bg-card rounded-xl border border-border p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-foreground">Pipeline Stages</h2>
            <button onClick={() => navigate('/pipeline')} className="text-xs text-primary hover:underline">View all</button>
          </div>
          <div className="space-y-3">
            {pipeline.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">No pipeline data yet</p>
            ) : (() => {
              const total = pipeline.reduce((s, st) => s + (st.contacts?.length || 0), 0) || 1;
              const colors = ['bg-blue-500', 'bg-yellow-500', 'bg-orange-500', 'bg-green-500', 'bg-purple-500'];
              return pipeline.map((stage, i) => {
                const count = stage.contacts?.length || 0;
                return (
                  <div key={stage.id} className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${colors[i % colors.length]}`} />
                    <span className="text-sm text-foreground flex-1 truncate">{stage.name}</span>
                    <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${colors[i % colors.length]}`} style={{ width: `${(count / total) * 100}%` }} />
                    </div>
                    <span className="text-sm font-semibold text-foreground w-5 text-right">{count}</span>
                  </div>
                );
              });
            })()}
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div className="bg-card rounded-xl border border-border p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-foreground">Recent Activity</h2>
            <button onClick={() => navigate('/chats')} className="text-xs text-primary hover:underline">View all</button>
          </div>
          <div className="space-y-1">
            {activity.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">No recent activity</p>
            ) : activity.map(item => (
              <div key={item.id} onClick={() => { setSelectedChat(item.id); navigate('/chats'); }}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-hover cursor-pointer transition-colors">
                <div className="relative shrink-0">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-[10px] font-semibold text-primary">{item.initials}</span>
                  </div>
                  <span className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-card ${statusColor[item.status] || 'bg-gray-400'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{item.message}</p>
                </div>
                <span className="text-[10px] text-muted-foreground shrink-0">{item.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Row 4 — Agent Performance + Contact Tags */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-card rounded-xl border border-border p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-foreground">Agent Performance</h2>
            <button onClick={() => navigate('/agents')} className="text-xs text-primary hover:underline">View all</button>
          </div>
          <div className="space-y-3">
            {agents.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">No agent data yet</p>
            ) : agents.map(agent => (
              <div key={agent.name} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-[10px] font-semibold text-primary">{agent.name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()}</span>
                </div>
                <span className="text-sm text-foreground flex-1 truncate">{agent.name}</span>
                <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${(agent.chats / maxChats) * 100}%` }} />
                </div>
                <span className="text-xs font-semibold text-foreground w-5 text-right">{agent.chats}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-4 sm:p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">Contact Tags</h2>
          <div className="h-48">
            {tagData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={tagData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={4} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                    {tagData.map((_, i) => <Cell key={i} fill={TAG_COLORS[i % TAG_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">No tag data yet</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
