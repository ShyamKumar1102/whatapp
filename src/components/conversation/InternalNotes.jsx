import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function InternalNotes({ notes, onAddNote }) {
  const [isAdding, setIsAdding] = useState(false);
  const [newNote, setNewNote] = useState('');

  const handleAddNote = () => {
    if (newNote.trim()) {
      onAddNote(newNote.trim());
      setNewNote('');
      setIsAdding(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div>
      <div className="flex justify-between items-center p-4">
        <h3 className="text-sm font-semibold text-foreground">Internal Notes</h3>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => setIsAdding(!isAdding)}
        >
          {isAdding ? 'Cancel' : 'Add Note'}
        </Button>
      </div>
      
      {isAdding && (
        <div className="mx-4 mb-3 space-y-2">
          <Input
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Enter internal note..."
            className="text-xs"
          />
          <Button 
            size="sm" 
            onClick={handleAddNote}
            disabled={!newNote.trim()}
          >
            Save Note
          </Button>
        </div>
      )}
      
      <div className="space-y-3">
        {notes.map((note) => (
          <div 
            key={note.id} 
            className="mx-4 mb-3 rounded-lg border bg-background p-3 text-xs text-foreground"
          >
            <p className="mb-2">{note.note}</p>
            <div className="flex justify-between items-center text-muted-foreground">
              <span>Agent {note.agent_id || 'System'}</span>
              <span>{formatDate(note.created_at)}</span>
            </div>
          </div>
        ))}
        
        {notes.length === 0 && !isAdding && (
          <div className="mx-4 text-center py-8">
            <p className="text-xs text-muted-foreground">No internal notes yet</p>
          </div>
        )}
      </div>
    </div>
  );
}