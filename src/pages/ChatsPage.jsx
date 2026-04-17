import { useState, useRef, useEffect } from 'react';
import { Search, Send, Paperclip, Smile, Phone, Video, MoreVertical, MessageSquare, Building2, Mic, MicOff, UserCircle, Ban, Trash2, X, Zap, ChevronDown, Bell, IndianRupee, FileText, Receipt } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useStore } from '@/store/useStore';
import { useNavigate } from 'react-router-dom';
import ChatCard from '@/components/ChatCard';
import MessageBubble from '@/components/MessageBubble';
import InternalNotes from '@/components/conversation/InternalNotes';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { cn } from '@/lib/utils';

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
const getAuthHeaders = () => {
  const token = localStorage.getItem('crm_token');
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
};

export default function ChatsPage() {
  const { chats, messages, selectedChatId, setSelectedChat, addMessage, loadChats, user } = useStore();
  const navigate = useNavigate();

  const handleDeleteForMe = (messageId) => {
    useStore.setState(state => ({ messages: state.messages.map(m => m.id === messageId ? { ...m, deleted_for_me: true } : m) }));
  };

  const handleDeleteForEveryone = async (messageId) => {
    useStore.setState(state => ({ messages: state.messages.map(m => m.id === messageId ? { ...m, deleted_for_everyone: true } : m) }));
    try { await fetch(`${BACKEND}/api/messages/${messageId}`, { method: 'DELETE', headers: getAuthHeaders() }); } catch {}
 };
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [isRecording, setIsRecording] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showCustomerDetails, setShowCustomerDetails] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const [notes, setNotes] = useState([]);
  const [msgSearch, setMsgSearch] = useState('');
  const [showMsgSearch, setShowMsgSearch] = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const [currentLabel, setCurrentLabel] = useState(null);
  const [showReminderForm, setShowReminderForm] = useState(false);
  const [confirmBlock, setConfirmBlock] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [reminderTitle, setReminderTitle] = useState('');
  const [reminderDate, setReminderDate] = useState('');
  const [reminderType, setReminderType] = useState('general');
  const [reminderAmount, setReminderAmount] = useState('');
  const [contactReminders, setContactReminders] = useState([]);

  const QUICK_REPLIES = [
    { id: 1, title: 'Greeting',       text: 'Hello! Thank you for reaching out. How can I help you today? 😊' },
    { id: 2, title: 'Follow Up',      text: 'Just following up on our previous conversation. Do you have any questions?' },
    { id: 3, title: 'Pricing',        text: 'I\'d be happy to share our pricing details. Could you tell me more about your requirements?' },
    { id: 4, title: 'Thank You',      text: 'Thank you for your time! Feel free to reach out if you need anything else. 🙏' },
    { id: 5, title: 'Out of Office',  text: 'I\'m currently unavailable. I\'ll get back to you within 24 hours.' },
    { id: 6, title: 'Meeting Invite', text: 'Would you be available for a quick call? Please share your preferred time slot.' },
  ];

  const CHAT_LABELS = [
    { key: null,               label: 'None' },
    { key: 'meeting_done',     label: 'Meeting Done' },
    { key: 'meeting_fixed',    label: 'Meeting Fixed' },
    { key: 'prospect',         label: 'Prospect' },
    { key: 'closed_won',       label: 'Closed Won' },
    { key: 'closed_lost',      label: 'Closed Lost' },
    { key: 'agreed_to_buy',    label: 'Agreed to Buy' },
    { key: 'junk_load',        label: 'Junk Load' },
    { key: 'callback_followup',label: 'Callback/Follow-up' },
    { key: 'not_contacted',    label: 'Not Contacted' },
  ];

  const selectedChat = chats.find(c => c.id === selectedChatId);
  const chatMessages = messages
    .filter(m => m.chatId === selectedChatId || m.conversation_id === selectedChatId)
    .filter(m => !msgSearch || m.content?.toLowerCase().includes(msgSearch.toLowerCase()));

  const LABEL_FILTERS = [
    { key: 'all',              label: 'All Chats' },
    { key: 'my',               label: 'My Chats' },
    { key: 'pushed',           label: 'Pushed Chats' },
    { key: 'meeting_done',     label: 'Meeting Done' },
    { key: 'meeting_fixed',    label: 'Meeting Fixed' },
    { key: 'prospect',         label: 'Prospect' },
    { key: 'closed_won',       label: 'Closed Won' },
    { key: 'closed_lost',      label: 'Closed Lost' },
    { key: 'agreed_to_buy',    label: 'Agreed to Buy' },
    { key: 'junk_load',        label: 'Junk Load' },
    { key: 'callback_followup',label: 'Callback/Follow-up' },
    { key: 'not_contacted',    label: 'Not Contacted' },
  ];

  const filteredChats = chats.filter(c => {
    const matchesSearch = c.contact.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter =
      activeFilter === 'all'    ? true :
      activeFilter === 'my'     ? c.assignedAgent === user?.id || c.assignedAgent === user?.name :
      activeFilter === 'pushed' ? c.pushed_to_admin === true :
      c.label === activeFilter;
    return matchesSearch && matchesFilter;
  });

  // Sync label from selected chat
  useEffect(() => {
    setCurrentLabel(selectedChat?.label || null);
    setShowMsgSearch(false);
    setMsgSearch('');
    setShowReminderForm(false);
    setContactReminders([]);
    setReminderTitle('');
    setReminderDate('');
    setReminderType('general');
    setReminderAmount('');
  }, [selectedChatId, selectedChat?.label]);

  // Load notes when chat changes
  useEffect(() => {
    if (!selectedChatId) return;
    const token = localStorage.getItem('crm_token');
    const headers = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
    fetch(`${BACKEND}/api/conversations/${selectedChatId}/notes`, { headers })
      .then(r => r.json())
      .then(d => { if (d.success) setNotes(d.data); })
      .catch(() => {});
  }, [selectedChatId]);

  // Load contact reminders when chat changes
  useEffect(() => {
    if (!selectedChatId || !selectedChat?.contact?.id) return;
    fetch(`${BACKEND}/api/reminders`, { headers: getAuthHeaders() })
      .then(r => r.json())
      .then(d => { if (d.success) setContactReminders(d.data.filter(r => r.contact_id === selectedChat.contact.id && r.status !== 'completed')); })
      .catch(() => {});
  }, [selectedChatId]);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleTakeover = async (disable = true) => {
    try {
      await fetch(`${BACKEND}/api/conversations/${selectedChatId}/takeover`, {
        method: 'PATCH', headers: getAuthHeaders(),
        body: JSON.stringify({ disable }),
      });
      useStore.setState(state => ({ chats: state.chats.map(c => c.id === selectedChatId ? { ...c, ai_disabled: disable } : c) }));
      toast.success(disable ? 'You took over — AI stopped for this chat' : 'AI re-enabled for this chat');
    } catch { toast.error('Failed to update AI mode'); }
  };

  const handleSend = () => {
    if (!messageInput.trim() || !selectedChatId) return;
    addMessage({
      id: Date.now().toString(),
      chatId: selectedChatId,
      content: messageInput,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      sender: 'agent',
      status: 'sent',
      type: 'text',
    });
    setMessageInput('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file && selectedChatId) {
      const fileType = file.type.startsWith('image/') ? 'image' : 'file';
      addMessage({
        id: Date.now().toString(),
        chatId: selectedChatId,
        content: `📎 ${file.name}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sender: 'agent',
        status: 'sent',
        type: fileType,
      });
    }
  };

  const handleVoiceRecord = () => {
    setIsRecording(!isRecording);
    if (!isRecording) {
      setTimeout(() => {
        setIsRecording(false);
        if (selectedChatId) {
          addMessage({
            id: Date.now().toString(),
            chatId: selectedChatId,
            content: '🎤 Voice message (0:05)',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            sender: 'agent',
            status: 'sent',
            type: 'voice',
          });
        }
      }, 3000);
    }
  };

  const handleEmojiClick = (emoji) => {
    setMessageInput(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const commonEmojis = ['😀', '😂', '❤️', '👍', '👎', '😢', '😮', '😡', '🙏', '👏'];

  const handleSendCompanyDetails = () => {
    if (!selectedChatId) return;
    
    const companyDetails = `🏢 *CRM Solutions*\n📍 123 Business Street, Mumbai, India\n📞 +91-800-123-4567\n📧 support@crmsolutions.com\n🌐 www.crmsolutions.com\n\n🕰️ Business Hours: 9 AM - 6 PM (Mon-Fri)\n💼 We specialize in customer relationship management solutions.`;
    
    addMessage({
      id: Date.now().toString(),
      chatId: selectedChatId,
      content: companyDetails,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      sender: 'agent',
      status: 'sent',
      type: 'text',
    });
    setMessageInput('');
  };

  const handleLabelChange = async (label) => {
    setCurrentLabel(label);
    try {
      await fetch(`${BACKEND}/api/conversations/${selectedChatId}/label`, {
        method: 'PATCH', headers: getAuthHeaders(), body: JSON.stringify({ label }),
      });
      await loadChats();
      toast.success(label ? `Label set to "${CHAT_LABELS.find(l => l.key === label)?.label}"` : 'Label removed');
    } catch { toast.error('Failed to update label'); }
  };

  const handleAddReminder = async () => {
    if (!reminderTitle.trim()) return;
    try {
      await fetch(`${BACKEND}/api/reminders`, {
        method: 'POST', headers: getAuthHeaders(),
        body: JSON.stringify({ title: reminderTitle, due_date: reminderDate || null, contact_id: selectedChat?.contact?.id || null, type: reminderType, amount: reminderAmount ? parseFloat(reminderAmount) : null }),
      });
    } catch { /* ignore */ }
    setShowReminderForm(false);
    setReminderTitle('');
    setReminderDate('');
    setReminderType('general');
    setReminderAmount('');
    toast.success('Reminder set!');
    // Reload contact reminders
    if (selectedChat?.contact?.id) {
      fetch(`${BACKEND}/api/reminders`, { headers: getAuthHeaders() })
        .then(r => r.json())
        .then(d => { if (d.success) setContactReminders(d.data.filter(r => r.contact_id === selectedChat.contact.id && r.status !== 'completed')); })
        .catch(() => {});
    }
  };

  const handleQuickReply = (text) => {
    setMessageInput(text);
    setShowQuickReplies(false);
  };

  const handleAddNote = async (note) => {
    const newNote = { id: Date.now(), conversation_id: selectedChatId, agent_id: 1, note, created_at: new Date().toISOString() };
    setNotes(prev => [newNote, ...prev]);
    try {
      await fetch(`${BACKEND}/api/conversations/${selectedChatId}/notes`, {
        method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ note }),
      });
    } catch { /* ignore */ }
  };

  const handlePushToAdmin = async () => {
    try {
      await fetch(`${BACKEND}/api/conversations/${selectedChatId}/push-admin`, {
        method: 'POST', headers: getAuthHeaders(),
      });
      useStore.setState(state => ({ chats: state.chats.map(c => c.id === selectedChatId ? { ...c, pushed_to_admin: true } : c) }));
    } catch { /* ignore */ }
    toast.success('Chat pushed to admin queue!');
  };

  const handleCall = () => {
    if (!selectedChat) return;
    window.open(`tel:${selectedChat.contact.phone}`, '_self');
  };

  const handleVideoCall = () => {
    if (!selectedChat) return;
    window.open(`https://wa.me/${selectedChat.contact.phone.replace(/\D/g,'')}`, '_blank');
  };

  const handleBlockContact = () => {
    setShowMoreMenu(false);
    setConfirmBlock(true);
  };

  const handleClearChat = () => {
    setShowMoreMenu(false);
    setConfirmClear(true);
  };

  const handleMarkUnread = () => {
    setShowMoreMenu(false);
  };

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="flex flex-col h-screen">
      <ConfirmDialog open={confirmBlock} title="Block Contact" description={`Block ${selectedChat?.contact.name}? They won't be able to send messages.`} confirmLabel="Block" onConfirm={() => { toast.success(`${selectedChat?.contact.name} blocked.`); }} onCancel={() => setConfirmBlock(false)} />
      <ConfirmDialog open={confirmClear} title="Clear Chat" description="All messages in this chat will be cleared." confirmLabel="Clear" onConfirm={() => { toast.success('Chat cleared.'); }} onCancel={() => setConfirmClear(false)} />
      <div className="px-3 sm:px-6 pt-3 sm:pt-4 pb-0 shrink-0">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-lg sm:text-xl font-semibold text-foreground">Chats</h1>
          <p className="text-xs text-muted-foreground hidden sm:block">Manage your WhatsApp conversations</p>
        </div>
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-thin">
          {LABEL_FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setActiveFilter(f.key)}
              className={cn(
                'shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border',
                activeFilter === f.key
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card text-muted-foreground border-border hover:bg-muted hover:text-foreground'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 p-3 sm:p-4 pt-3 sm:pt-4 min-h-0">
        <div className="flex h-full rounded-xl border bg-card overflow-hidden min-w-0">
          {/* Chat List */}
          <div className={cn(
            'w-full md:w-64 lg:w-72 border-r border-border flex flex-col bg-card shrink-0',
            selectedChatId && 'hidden md:flex'
          )}>
            <div className="p-3 border-b border-border shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search chats..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 bg-muted/50 border-none text-sm"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-thin">
              {filteredChats.map(chat => (
                <ChatCard
                  key={chat.id}
                  chat={chat}
                  isSelected={chat.id === selectedChatId}
                  onClick={() => setSelectedChat(chat.id)}
                />
              ))}
            </div>
          </div>

          {/* Chat Window — hidden on small desktop if no chat selected */}
          {selectedChat ? (
            <div className="flex-1 flex flex-col min-w-0">
              {/* Chat Header */}
              <div className="h-14 bg-card border-b border-border flex items-center justify-between px-4 shrink-0">
                <div className="flex items-center gap-3">
                  <button className="md:hidden mr-1 text-muted-foreground" onClick={() => setSelectedChat(null)}>←</button>
                  <div className="relative">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-xs font-semibold text-primary">
                        {selectedChat.contact.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </span>
                    </div>
                    {selectedChat.contact.isOnline && (
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-online border-2 border-card" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{selectedChat.contact.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {selectedChat.contact.isOnline ? 'Online' : selectedChat.contact.lastSeen || 'Offline'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 relative">
                  <button onClick={handleCall} className="p-2 rounded-lg hover:bg-surface-hover transition-colors" title={`Call ${selectedChat.contact.phone}`}>
                    <Phone className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <button onClick={handleVideoCall} className="p-2 rounded-lg hover:bg-surface-hover transition-colors" title="Open WhatsApp">
                    <Video className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <button onClick={() => { setShowMsgSearch(!showMsgSearch); setMsgSearch(''); }} className={cn('p-2 rounded-lg transition-colors', showMsgSearch ? 'bg-accent' : 'hover:bg-surface-hover')} title="Search messages">
                    <Search className="w-4 h-4 text-muted-foreground" />
                  </button>
                  {/* Three dots menu */}
                  <div className="relative">
                    <button
                      onClick={() => { setShowMoreMenu(!showMoreMenu); }}
                      className="p-2 rounded-lg hover:bg-surface-hover transition-colors"
                    >
                      <MoreVertical className="w-4 h-4 text-muted-foreground" />
                    </button>
                    {showMoreMenu && (
                      <div className="absolute right-0 top-10 w-48 bg-card border border-border rounded-xl shadow-lg z-50 py-1">
                        <button onClick={() => { setShowMoreMenu(false); setShowCustomerDetails(true); }} className="w-full text-left px-4 py-2.5 text-sm text-foreground hover:bg-surface-hover flex items-center gap-2 lg:hidden">
                          <UserCircle className="w-4 h-4" /> Customer Details
                        </button>
                        <button onClick={handleMarkUnread} className="w-full text-left px-4 py-2.5 text-sm text-foreground hover:bg-surface-hover flex items-center gap-2">
                          <Bell className="w-4 h-4" /> Mark as Unread
                        </button>
                        <button onClick={() => { setShowMoreMenu(false); navigate('/contacts'); }} className="w-full text-left px-4 py-2.5 text-sm text-foreground hover:bg-surface-hover flex items-center gap-2">
                          <UserCircle className="w-4 h-4" /> View Contact
                        </button>
                        <button onClick={handleClearChat} className="w-full text-left px-4 py-2.5 text-sm text-foreground hover:bg-surface-hover flex items-center gap-2">
                          <Trash2 className="w-4 h-4" /> Clear Chat
                        </button>
                        <button onClick={handleBlockContact} className="w-full text-left px-4 py-2.5 text-sm text-destructive hover:bg-surface-hover flex items-center gap-2">
                          <Ban className="w-4 h-4" /> Block Contact
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Message Search Bar */}
              {showMsgSearch && (
                <div className="px-4 py-2 border-b border-border bg-muted/30 shrink-0">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <Input autoFocus value={msgSearch} onChange={e => setMsgSearch(e.target.value)} placeholder="Search in conversation..." className="pl-8 h-8 text-xs bg-background" />
                    {msgSearch && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">{chatMessages.length} results</span>}
                  </div>
                </div>
              )}

              {/* Messages */}
              <div className="flex-1 overflow-y-auto bg-background" >
                <div className="p-4 space-y-3">
                  {chatMessages.map(msg => (
                    <MessageBubble key={msg.id} message={msg} onDeleteForMe={handleDeleteForMe} onDeleteForEveryone={handleDeleteForEveryone} />
                  ))}
                  {selectedChat.isTyping && (
                    <div className="flex gap-1 px-3 py-2 bg-chat-incoming rounded-xl w-fit border border-border">
                      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-pulse-dot" />
                      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-pulse-dot [animation-delay:0.2s]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-pulse-dot [animation-delay:0.4s]" />
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Input */}
              <div className="bg-card border-t border-border p-3 shrink-0">
                {/* Quick Replies */}
                {showQuickReplies && (
                  <div className="mb-3 bg-background border border-border rounded-lg overflow-hidden">
                    <div className="px-3 py-2 border-b border-border flex items-center justify-between">
                      <span className="text-xs font-semibold text-foreground">Quick Replies</span>
                      <button onClick={() => setShowQuickReplies(false)}><X className="w-3.5 h-3.5 text-muted-foreground" /></button>
                    </div>
                    {QUICK_REPLIES.map(qr => (
                      <button key={qr.id} onClick={() => handleQuickReply(qr.text)} className="w-full text-left px-3 py-2.5 hover:bg-muted/50 border-b border-border/50 last:border-0 transition-colors">
                        <p className="text-xs font-medium text-foreground">{qr.title}</p>
                        <p className="text-[11px] text-muted-foreground truncate mt-0.5">{qr.text}</p>
                      </button>
                    ))}
                  </div>
                )}

                {/* Company Details + Payment Reminder + AI Takeover Buttons */}
                <div className="flex gap-2 mb-3">
                  <Button
                    variant="outline"
                    className="flex-1 text-sm justify-start"
                    onMouseDown={e => { e.preventDefault(); handleSendCompanyDetails(); }}
                  >
                    <Building2 className="h-4 w-4 mr-2" />
                    Company Details
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 text-sm justify-start text-green-600 border-green-200 hover:bg-green-500/10"
                    onMouseDown={e => {
                      e.preventDefault();
                      if (!selectedChatId) return;
                      const payReminders = contactReminders.filter(r => ['payment','invoice'].includes(r.type));
                      const amountStr = payReminders.length > 0
                        ? ` of ₹${payReminders.reduce((s,r) => s + (Number(r.amount)||0), 0).toLocaleString('en-IN')}`
                        : '';
                      const msg = `Hi ${selectedChat?.contact?.name?.split(' ')[0] || 'there'}, this is a gentle reminder regarding your pending payment${amountStr}. Kindly arrange the payment at your earliest convenience. Thank you! 🙏`;
                      setMessageInput(msg);
                    }}
                  >
                    <IndianRupee className="h-4 w-4 mr-2" />
                    Payment Reminder
                  </Button>
                </div>
                {/* AI Takeover */}
                {selectedChat?.ai_disabled ? (
                  <Button variant="outline" size="sm" className="w-full mb-3 text-xs text-blue-600 border-blue-200 hover:bg-blue-50" onClick={() => handleTakeover(false)}>
                    🤖 Re-enable AI for this chat
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" className="w-full mb-3 text-xs text-orange-600 border-orange-200 hover:bg-orange-50" onClick={() => handleTakeover(true)}>
                    👨 Take Over from AI
                  </Button>
                )}
                
                {/* Emoji Picker */}
                {showEmojiPicker && (
                  <div className="mb-3 p-3 bg-background border border-border rounded-lg">
                    <div className="flex flex-wrap gap-2">
                      {commonEmojis.map((emoji, index) => (
                        <button
                          key={index}
                          onClick={() => handleEmojiClick(emoji)}
                          className="text-lg hover:bg-surface-hover p-1 rounded"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="flex items-center gap-2">
                  <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className={cn('p-2 rounded-lg transition-colors', showEmojiPicker ? 'bg-accent' : 'hover:bg-surface-hover')}>
                    <Smile className="w-5 h-5 text-muted-foreground" />
                  </button>
                  <button onClick={() => { setShowQuickReplies(!showQuickReplies); setShowEmojiPicker(false); }} className={cn('p-2 rounded-lg transition-colors', showQuickReplies ? 'bg-accent' : 'hover:bg-surface-hover')} title="Quick replies">
                    <Zap className="w-5 h-5 text-muted-foreground" />
                  </button>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 rounded-lg hover:bg-surface-hover transition-colors"
                  >
                    <Paperclip className="w-5 h-5 text-muted-foreground" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileUpload}
                    className="hidden"
                    accept="image/*,application/pdf,.doc,.docx"
                  />
                  <Input
                    placeholder={isRecording ? "Recording..." : "Type a message..."}
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={handleKeyPress}
                    disabled={isRecording}
                    className="flex-1 h-10 bg-muted/50 border-none text-sm"
                  />
                  {messageInput.trim() ? (
                    <button
                      onClick={handleSend}
                      className="p-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-whatsapp-dark transition-colors"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={handleVoiceRecord}
                      className={cn(
                        "p-2.5 rounded-lg transition-colors",
                        isRecording 
                          ? "bg-destructive text-destructive-foreground animate-pulse" 
                          : "bg-primary text-primary-foreground hover:bg-whatsapp-dark"
                      )}
                    >
                      {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="hidden md:flex flex-1 flex-col items-center justify-center text-center p-8 bg-background">
              <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center mb-4">
                <MessageSquare className="w-8 h-8 text-accent-foreground" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">Select a conversation</h2>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm">Choose a chat from the list to start messaging</p>
            </div>
          )}

          {/* Customer Details Sidebar */}
          {selectedChat && (
            <>
              {/* Overlay for small screens */}
              {showCustomerDetails && (
                <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setShowCustomerDetails(false)} />
              )}
              <div className={cn(
                'flex flex-col bg-card border-l border-border transition-all duration-300',
                'lg:relative lg:w-72 xl:w-80 lg:flex',
                showCustomerDetails
                  ? 'fixed right-0 top-0 h-full w-80 z-50 flex'
                  : 'hidden lg:flex'
              )}>
              {/* Header */}
              <div className="p-4 border-b border-border shrink-0 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-foreground">Customer Details</h2>
                  <p className="text-xs text-muted-foreground mt-1">Conversation information and actions</p>
                </div>
                <button onClick={() => setShowCustomerDetails(false)} className="lg:hidden p-1 rounded hover:bg-muted transition-colors">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto" >
                {/* Customer Card */}
                <div className="m-4 rounded-xl border bg-background p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="relative">
                      <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-semibold">
                        {getInitials(selectedChat.contact.name)}
                      </div>
                      <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-accent flex items-center justify-center">
                        <span className="text-[10px] font-semibold text-accent-foreground">85</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-foreground">
                        {selectedChat.contact.name}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {selectedChat.contact.phone}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 mb-3">
                    <Badge variant="secondary">Customer</Badge>
                    <Badge variant="outline">Lead</Badge>
                  </div>
                  
                  <Button 
                    variant="default"
                    className="w-full mt-3 bg-orange-500 hover:bg-orange-600 text-white border-0"
                    onClick={handlePushToAdmin}
                  >
                    Push to Admin
                  </Button>
                </div>

                {/* Conversation Metadata */}
                <div className="mx-4 rounded-xl border bg-background p-4 mb-4">
                  <h3 className="text-sm font-semibold text-foreground mb-3">Conversation Info</h3>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-muted-foreground font-medium">Channel</span>
                      <p className="text-foreground font-semibold">whatsapp</p>
                    </div>
                    <div className="col-span-2">
                      <span className="text-muted-foreground font-medium">Label</span>
                      <select value={currentLabel || ''} onChange={e => handleLabelChange(e.target.value || null)} className="mt-1 w-full px-2.5 py-1.5 rounded-lg border border-border bg-muted/30 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring">
                        {CHAT_LABELS.map(l => <option key={l.key ?? 'none'} value={l.key ?? ''}>{l.label}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Reminders */}
                <div className="mx-4 mb-4 rounded-xl border bg-background p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-foreground">Reminders</h3>
                    <button onClick={() => setShowReminderForm(!showReminderForm)} className="text-xs text-primary hover:underline">
                      {showReminderForm ? 'Cancel' : '+ Add'}
                    </button>
                  </div>

                  {/* Existing reminders for this contact */}
                  {contactReminders.length > 0 && (
                    <div className="space-y-2 mb-3">
                      {contactReminders.map(r => {
                        const isOverdue = r.due_date && new Date(r.due_date) < new Date();
                        const typeIconMap = { quotation: FileText, invoice: Receipt, payment: IndianRupee };
                        const typeColorMap = { quotation: 'text-purple-500', invoice: 'text-orange-500', payment: 'text-green-500' };
                        const TypeIcon = typeIconMap[r.type];
                        return (
                          <div key={r.id} className="flex items-start gap-2 p-2 rounded-lg bg-muted/40 border border-border/50">
                            <button
                              onClick={async () => {
                                try { await fetch(`${BACKEND}/api/reminders/${r.id}/complete`, { method: 'PATCH', headers: getAuthHeaders() }); } catch { /* ignore */ }
                                setContactReminders(prev => prev.filter(x => x.id !== r.id));
                                toast.success('Reminder completed!');
                              }}
                              className="mt-0.5 w-3.5 h-3.5 rounded-full border-2 border-primary shrink-0 hover:bg-primary transition-colors"
                              title="Mark complete"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1">
                                {TypeIcon && <TypeIcon className={`w-3 h-3 shrink-0 ${typeColorMap[r.type]}`} />}
                                <p className="text-xs font-medium text-foreground truncate">{r.title}</p>
                              </div>
                              {r.amount && <p className={`text-[10px] font-semibold mt-0.5 ${typeColorMap[r.type] || 'text-foreground'}`}>₹{Number(r.amount).toLocaleString('en-IN')}</p>}
                              {r.due_date && (
                                <p className={`text-[10px] mt-0.5 ${isOverdue ? 'text-destructive' : 'text-muted-foreground'}`}>
                                  {isOverdue ? '⚠️ Overdue · ' : '🕐 '}{new Date(r.due_date).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {contactReminders.length === 0 && !showReminderForm && (
                    <p className="text-xs text-muted-foreground text-center py-2">No reminders for this contact</p>
                  )}

                  {showReminderForm && (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-1.5">
                        {[{k:'general',l:'General'},{k:'quotation',l:'📄 Quotation'},{k:'invoice',l:'🧾 Invoice'},{k:'payment',l:'💰 Payment'}].map(t => (
                          <button key={t.k} type="button" onClick={() => setReminderType(t.k)}
                            className={`px-2 py-1.5 rounded-lg border text-[10px] font-medium transition-all ${
                              reminderType === t.k ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/40 text-muted-foreground border-border hover:bg-muted'
                            }`}>{t.l}</button>
                        ))}
                      </div>
                      <Input placeholder="Reminder title..." value={reminderTitle} onChange={e => setReminderTitle(e.target.value)} className="h-8 text-xs" />
                      {['quotation','invoice','payment'].includes(reminderType) && (
                        <Input type="number" placeholder="Amount (₹)" value={reminderAmount} onChange={e => setReminderAmount(e.target.value)} className="h-8 text-xs" min="0" step="0.01" />
                      )}
                      <Input type="datetime-local" value={reminderDate} onChange={e => setReminderDate(e.target.value)} className="h-8 text-xs" />
                      <div className="flex gap-2">
                        <Button size="sm" className="flex-1 h-7 text-xs" onClick={handleAddReminder} disabled={!reminderTitle.trim()}>Save</Button>
                        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => { setShowReminderForm(false); setReminderTitle(''); setReminderDate(''); setReminderType('general'); setReminderAmount(''); }}>Cancel</Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Internal Notes */}
                {/* Internal Notes */}
                <div className="mt-6">
                  <InternalNotes
                    notes={notes}
                    onAddNote={handleAddNote}
                  />
                </div>
              </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
