import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import ChatWindow from '@/components/conversation/ChatWindow';
import CustomerSidebar from '@/components/conversation/CustomerSidebar';

export default function Conversation() {
  const { id } = useParams();
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [notes, setNotes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Mock data for now - replace with API calls
  useEffect(() => {
    const mockConversation = {
      id: parseInt(id),
      contact_id: 1,
      contact_name: 'John Smith',
      contact_phone: '+1234567890',
      contact_email: 'john@example.com',
      contact_status: 'active',
      status: 'open',
      assigned_agent_id: 1,
      channel: 'whatsapp',
      created_at: new Date('2024-03-25').toISOString(),
      updated_at: new Date('2024-04-01').toISOString()
    };

    const mockMessages = [
      {
        id: 1,
        conversation_id: parseInt(id),
        sender_type: 'contact',
        content: 'Hi, I need help with my order',
        sent_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        is_read: true
      },
      {
        id: 2,
        conversation_id: parseInt(id),
        sender_type: 'agent',
        content: 'Hello! I\'d be happy to help you with your order. Can you please provide your order number?',
        sent_at: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(),
        is_read: true
      },
      {
        id: 3,
        conversation_id: parseInt(id),
        sender_type: 'contact',
        content: 'Sure, it\'s #ORD-12345',
        sent_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        is_read: true
      }
    ];

    const mockNotes = [
      {
        id: 1,
        conversation_id: parseInt(id),
        agent_id: 1,
        note: 'Customer seems frustrated about delayed delivery. Need to check shipping status.',
        created_at: new Date('2024-04-01T17:47:00').toISOString()
      }
    ];

    setConversation(mockConversation);
    setMessages(mockMessages);
    setNotes(mockNotes);
    setIsLoading(false);
  }, [id]);

  const handleSendMessage = async (content) => {
    try {
      const newMessage = {
        id: Date.now(),
        conversation_id: parseInt(id),
        sender_type: 'agent',
        content,
        sent_at: new Date().toISOString(),
        is_read: false
      };
      
      setMessages(prev => [...prev, newMessage]);
      
      // Mock API call - replace with actual API
      // await api.post(`/conversations/${id}/messages`, { content, sender_type: 'agent' });
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleSendCompanyDetails = async () => {
    const companyDetails = `
Company: WA CRM Solutions
Address: 123 Business St, City, State 12345
Phone: +1-800-123-4567
Email: support@wacrm.com
Website: www.wacrm.com
    `.trim();
    
    await handleSendMessage(companyDetails);
  };

  const handleStatusChange = async (newStatus) => {
    try {
      setConversation(prev => ({
        ...prev,
        status: newStatus,
        updated_at: new Date().toISOString()
      }));
      
      // Mock API call - replace with actual API
      // await api.patch(`/conversations/${id}/status`, { status: newStatus });
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleAddNote = async (note) => {
    try {
      const newNote = {
        id: Date.now(),
        conversation_id: parseInt(id),
        agent_id: 1,
        note,
        created_at: new Date().toISOString()
      };
      
      setNotes(prev => [newNote, ...prev]);
      
      // Mock API call - replace with actual API
      // await api.post(`/conversations/${id}/notes`, { note, agent_id: 1 });
    } catch (error) {
      console.error('Error adding note:', error);
    }
  };

  const handlePushToAdmin = async () => {
    try {
      // Update status to pending
      setConversation(prev => ({
        ...prev,
        status: 'pending',
        updated_at: new Date().toISOString()
      }));
      
      // Add system message
      const systemMessage = {
        id: Date.now(),
        conversation_id: parseInt(id),
        sender_type: 'system',
        content: '🔄 This conversation has been escalated to admin for review.',
        sent_at: new Date().toISOString(),
        is_read: false
      };
      
      setMessages(prev => [...prev, systemMessage]);
      
      // Show success feedback
      alert('✅ Conversation successfully pushed to admin queue!');
      
      // Mock API call - replace with actual API
      // await api.post(`/conversations/${id}/push-admin`);
    } catch (error) {
      console.error('Error pushing to admin:', error);
      alert('❌ Failed to push to admin. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading conversation...</p>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <p className="text-sm text-muted-foreground">Conversation not found</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Conversation</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Chat with {conversation.contact_name}
          </p>
        </div>
      </div>
      
      <div className="flex h-[calc(100vh-12rem)] overflow-hidden rounded-xl border bg-card">
        <ChatWindow
          conversation={conversation}
          messages={messages}
          onSendMessage={handleSendMessage}
          onSendCompanyDetails={handleSendCompanyDetails}
          isWhatsAppConfigured={false}
        />
      </div>
    </div>
  );
}