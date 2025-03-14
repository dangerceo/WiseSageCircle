import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { sages } from "@/lib/sages";

interface SageSelectorProps {
  selected: string[];
  onChange: (selected: string[]) => void;
}

export default function SageSelector({ selected, onChange }: SageSelectorProps) {
  const toggleSage = (sageId: string) => {
    if (selected.includes(sageId)) {
      onChange(selected.filter(id => id !== sageId));
    } else {
      onChange([...selected, sageId]);
    }
  };

  const selectAll = () => {
    onChange(selected.length === sages.length ? [] : sages.map(sage => sage.id));
  };

  return (
    <div className="space-y-2 w-full">
      <div className="flex justify-between items-center gap-2">
        <h2 className="text-sm sm:text-base font-semibold">Choose Your Guides</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={selectAll}
          className="shrink-0 text-xs sm:text-sm px-2 h-8"
        >
          {selected.length === sages.length ? "Deselect All" : "Council Mode"}
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-2 w-full">
        {sages.map((sage) => (
          <Button
            key={sage.id}
            variant={selected.includes(sage.id) ? "default" : "outline"}
            className="rounded-full text-sm py-1 px-4 h-auto"
            onClick={() => toggleSage(sage.id)}
          >
            {sage.name}
          </Button>
        ))}
      </div>
    </div>
  );
}