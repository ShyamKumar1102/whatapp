import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function MoveDropdown({ currentStageId, stages, onMove }) {
  const availableStages = stages.filter(stage => stage.id !== currentStageId);

  if (availableStages.length === 0) {
    return null;
  }

  return (
    <Select onValueChange={(stageId) => onMove(parseInt(stageId))}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Move to..." />
      </SelectTrigger>
      <SelectContent>
        {availableStages.map((stage) => (
          <SelectItem key={stage.id} value={stage.id.toString()}>
            {stage.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}