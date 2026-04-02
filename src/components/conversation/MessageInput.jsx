import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Building2, Send } from 'lucide-react';

export default function MessageInput({ onSendMessage, onSendCompanyDetails }) {
  const [message, setMessage] = useState('');
  const [showCompanyButton, setShowCompanyButton] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim()) {
      onSendMessage(message.trim());
      setMessage('');
      setShowCompanyButton(false);
    }
  };

  const handleInputFocus = () => {
    setShowCompanyButton(true);
  };

  const handleInputBlur = () => {
    // Delay hiding to allow button click
    setTimeout(() => {
      if (!document.activeElement?.closest('.company-details-btn')) {
        setShowCompanyButton(false);
      }
    }, 150);
  };

  const handleSendCompanyDetails = () => {
    onSendCompanyDetails();
    setShowCompanyButton(false);
  };

  return (
    <div className="p-4 border-t border-border bg-card">
      {showCompanyButton && (
        <Button 
          variant="outline" 
          className="w-full mb-3 text-sm justify-start company-details-btn"
          onClick={handleSendCompanyDetails}
        >
          <Building2 className="h-4 w-4 mr-2" />
          Send Company Details
        </Button>
      )}
      
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          placeholder="Type a message..."
          className="flex-1"
        />
        <Button 
          type="submit" 
          variant="default" 
          size="icon"
          disabled={!message.trim()}
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}