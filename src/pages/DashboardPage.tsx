import { TrendingUp, TrendingDown, MessageSquare, MessagesSquare, Megaphone, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { dashboardStats, chartData, chats, agentPerformance } from '@/lib/mock-data';
import { cn } from '@/lib/utils';

const statCards = [
  { label: 'Total Messages', value: dashboardStats.totalMessages.toLocaleString(), growth: dashboardStats.messagesGrowth, icon: MessageSquare },
  { label: 'Active Chats', value: dashboardStats.activeChats.toString(), growth: dashboardStats.chatsGrowth, icon: MessagesSquare },
  { label: 'Campaigns', value: dashboardStats.campaigns.toString(), growth: dashboardStats.campaignsGrowth, icon: Megaphone },
  { label: 'Avg Response', value: dashboardStats.responseTime, growth: dashboardStats.responseTimeGrowth, icon: Clock },
];

export default function DashboardPage() {
  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Overview of your WhatsApp Business account</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => {
          const isPositive = stat.growth > 0;
          const isNegativeGood = stat.label === 'Avg Response' && stat.growth < 0;
          const good = isPositive || isNegativeGood;
          return (
            <div key={stat.label} className="bg-card rounded-xl border border-border p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{stat.label}</span>
                <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center">
                  <stat.icon className="w-4 h-4 text-accent-foreground" />
                </div>
              </div>
              <p className="text-2xl font-bold text-foreground mt-2">{stat.value}</p>
              <div className="flex items-center gap-1 mt-1">
                {good ? <TrendingUp className="w-3 h-3 text-primary" /> : <TrendingDown className="w-3 h-3 text-destructive" />}
                <span className={cn('text-xs font-medium', good ? 'text-primary' : 'text-destructive')}>
                  {Math.abs(stat.growth)}%
                </span>
                <span className="text-xs text-muted-foreground">vs last week</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-2 bg-card rounded-xl border border-border p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">Messages This Week</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="sent" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="received" fill="hsl(var(--primary) / 0.4)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Chats */}
        <div className="bg-card rounded-xl border border-border p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">Recent Conversations</h2>
          <div className="space-y-3">
            {chats.slice(0, 5).map((chat) => {
              const initials = chat.contact.name.split(' ').map(n => n[0]).join('').slice(0, 2);
              return (
                <div key={chat.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-[10px] font-semibold text-primary">{initials}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{chat.contact.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{chat.lastMessage}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0">{chat.lastMessageTime}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Agent Performance */}
      <div className="bg-card rounded-xl border border-border p-5">
        <h2 className="text-sm font-semibold text-foreground mb-4">Agent Performance</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 text-muted-foreground font-medium">Agent</th>
                <th className="text-left py-2 text-muted-foreground font-medium">Chats Handled</th>
                <th className="text-left py-2 text-muted-foreground font-medium">Avg Response</th>
                <th className="text-left py-2 text-muted-foreground font-medium">Satisfaction</th>
              </tr>
            </thead>
            <tbody>
              {agentPerformance.map((agent) => (
                <tr key={agent.name} className="border-b border-border/50 last:border-0">
                  <td className="py-3 font-medium text-foreground">{agent.name}</td>
                  <td className="py-3 text-muted-foreground">{agent.chats}</td>
                  <td className="py-3 text-muted-foreground">{agent.avgResponse}</td>
                  <td className="py-3">
                    <span className={cn(
                      'text-xs font-medium px-2 py-0.5 rounded-full',
                      agent.satisfaction >= 90 ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground'
                    )}>
                      {agent.satisfaction}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
