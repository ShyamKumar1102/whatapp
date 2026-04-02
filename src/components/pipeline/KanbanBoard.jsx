import KanbanColumn from './KanbanColumn';

export default function KanbanBoard({ stages, onMoveContact, onOpenChat }) {
  return (
    <div className="flex gap-4 mt-6 overflow-x-auto pb-4">
      {stages.map((stage) => (
        <KanbanColumn
          key={stage.id}
          stage={stage}
          stages={stages}
          onMoveContact={onMoveContact}
          onOpenChat={onOpenChat}
        />
      ))}
    </div>
  );
}