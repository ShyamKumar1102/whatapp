import { useState, useRef, useEffect } from 'react';
import { Search, Send, Paperclip, Smile, Phone, Video, MoreVertical, MessageSquare, Building2, Image, FileText, Mic, MicOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useStore } from '@/store/useStore';
import ChatCard from '@/components/ChatCard';
import MessageBubble from '@/components/MessageBubble';
import StatusSelector from '@/components/conversation/StatusSelector';
import InternalNotes from '@/components/conversation/InternalNotes';
import { cn } from '@/lib/utils';

export default function ChatsPage() {
  const { chats, messages, selectedChatId, setSelectedChat, addMessage } = useStore();
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentStatus, setCurrentStatus] = useState('open');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const [notes, setNotes] = useState([
    {
      id: 1,
      conversation_id: 1,
      agent_id: 1,
      note: 'Customer seems frustrated about delayed delivery. Need to check shipping status.',
      created_at: new Date('2024-04-01T17:47:00').toISOString()
    }
  ]);

  const selectedChat = chats.find(c => c.id === selectedChatId);
  const chatMessages = messages.filter(m => m.chatId === selectedChatId);
  const filteredChats = chats.filter(c =>
    c.contact.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = () => {
    if (!messageInput.trim() || !selectedChatId) return;
    addMessage({
      id: Date.now().toString(),
      chatId: selectedChatId,
      content: messageInput,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      sender: 'user',
      status: 'sent',
      type: 'text',
    });
    setMessageInput('');
    
    // Simulate message status updates
    setTimeout(() => {
      // Update to delivered
      console.log('Message delivered');
    }, 1000);
    
    setTimeout(() => {
      // Update to read
      console.log('Message read');
    }, 3000);
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
        sender: 'user',
        status: 'sent',
        type: fileType,
      });
    }
  };

  const handleVoiceRecord = () => {
    setIsRecording(!isRecording);
    if (!isRecording) {
      // Start recording
      console.log('Started voice recording');
      setTimeout(() => {
        setIsRecording(false);
        if (selectedChatId) {
          addMessage({
            id: Date.now().toString(),
            chatId: selectedChatId,
            content: '🎤 Voice message (0:05)',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            sender: 'user',
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
      sender: 'user',
      status: 'sent',
      type: 'text',
    });
    setMessageInput('');
    setIsInputFocused(false);
  };

  const handleStatusChange = (newStatus) => {
    setCurrentStatus(newStatus);
    console.log('Status changed to:', newStatus);
  };

  const handleAddNote = (note) => {
    const newNote = {
      id: Date.now(),
      conversation_id: selectedChatId,
      agent_id: 1,
      note,
      created_at: new Date().toISOString()
    };
    setNotes(prev => [newNote, ...prev]);
  };

  const handlePushToAdmin = () => {
    setCurrentStatus('pending');
    alert('✅ Chat successfully pushed to admin queue!');
  };

  const handleCall = () => {
    if (selectedChat) {
      const confirmCall = confirm(`📞 Call ${selectedChat.contact.name}?`);
      if (confirmCall) {
        alert(`📞 Calling ${selectedChat.contact.name}...\n\nConnecting to ${selectedChat.contact.phone}\n\nIn a real implementation, this would integrate with:\n- WhatsApp Business API\n- VoIP services\n- Phone system`);
      }
    }
  };

  const handleVideoCall = () => {
    if (selectedChat) {
      const confirmCall = confirm(`📹 Start video call with ${selectedChat.contact.name}?`);
      if (confirmCall) {
        alert(`📹 Starting video call with ${selectedChat.contact.name}...\n\nIn a real implementation, this would:\n- Use WebRTC\n- Integrate with video calling APIs\n- Connect through WhatsApp Business`);
      }
    }
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="p-6 pb-0 shrink-0">
        <h1 className="text-xl font-semibold text-foreground">Chats</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your WhatsApp conversations
        </p>
      </div>

      <div className="flex-1 p-6 pt-6 min-h-0">
        <div className="flex h-full rounded-xl border bg-card overflow-hidden">
          {/* Chat List */}
          <div className={cn(
            'w-80 border-r border-border flex flex-col bg-card shrink-0',
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

          {/* Chat Window */}
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
                <div className="flex items-center gap-1">
                  <button onClick={handleCall} className="p-2 rounded-lg hover:bg-surface-hover transition-colors">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <button onClick={handleVideoCall} className="p-2 rounded-lg hover:bg-surface-hover transition-colors">
                    <Video className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <button className="p-2 rounded-lg hover:bg-surface-hover transition-colors">
                    <MoreVertical className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto bg-background" style={{ contain: 'layout style paint' }}>
                <div className="p-4 space-y-3">
                  {chatMessages.map(msg => (
                    <MessageBubble key={msg.id} message={msg} />
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
                {/* Company Details Button */}
                {(isInputFocused || messageInput.trim()) && (
                  <Button 
                    variant="outline" 
                    className="w-full mb-3 text-sm justify-start"
                    onClick={handleSendCompanyDetails}
                  >
                    <Building2 className="h-4 w-4 mr-2" />
                    Send Company Details
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
                  <button 
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className={cn(
                      "p-2 rounded-lg transition-colors",
                      showEmojiPicker ? "bg-accent" : "hover:bg-surface-hover"
                    )}
                  >
                    <Smile className="w-5 h-5 text-muted-foreground" />
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
                    onFocus={() => setIsInputFocused(true)}
                    onBlur={() => setIsInputFocused(false)}
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
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-background">
              <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center mb-4">
                <MessageSquare className="w-8 h-8 text-accent-foreground" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">Select a conversation</h2>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm">Choose a chat from the list to start messaging</p>
            </div>
          )}

          {/* Customer Details Sidebar */}
          {selectedChat && (
            <div className="w-80 flex flex-col bg-card border-l border-border">
              {/* Header */}
              <div className="p-4 border-b border-border shrink-0">
                <h2 className="text-sm font-semibold text-foreground">Customer Details</h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Conversation information and actions
                </p>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto" style={{ contain: 'layout style paint' }}>
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
                      <p className="text-xs text-muted-foreground">
                        john@example.com
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
                  <h3 className="text-sm font-semibold text-foreground mb-3">
                    Conversation Info
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-muted-foreground font-medium">Channel</span>
                      <p className="text-foreground font-semibold">whatsapp</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground font-medium">Started</span>
                      <p className="text-foreground font-semibold">Mar 25, 2024</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground font-medium">Agent</span>
                      <p className="text-foreground font-semibold">
                        {selectedChat.assignedAgent || 'Agent 1'}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground font-medium">Updated</span>
                      <p className="text-foreground font-semibold">Apr 1, 2024</p>
                    </div>
                  </div>
                </div>

                {/* Status Selector */}
                <StatusSelector
                  currentStatus={currentStatus}
                  onStatusChange={handleStatusChange}
                />

                {/* Internal Notes */}
                <div className="mt-6">
                  <InternalNotes
                    notes={notes}
                    onAddNote={handleAddNote}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}