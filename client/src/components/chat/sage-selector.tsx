import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { sages } from "@/lib/sages";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

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
    <div className="space-y-2">
      <div className="flex justify-between items-center gap-2 flex-wrap">
        <h2 className="text-lg font-semibold">Choose Your Guides</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={selectAll}
          className="shrink-0"
        >
          {selected.length === sages.length ? "Deselect All" : "Council Mode"}
        </Button>
      </div>

      <ScrollArea className="w-full">
        <div className="flex gap-2 pb-4">
          {sages.map((sage) => (
            <Button
              key={sage.id}
              variant={selected.includes(sage.id) ? "default" : "outline"}
              className="flex flex-col items-center space-y-1 p-2 h-auto min-w-[120px] shrink-0"
              onClick={() => toggleSage(sage.id)}
            >
              <Avatar className="h-12 w-12 md:h-16 md:w-16">
                <AvatarImage src={sage.image} alt={sage.name} />
                <AvatarFallback>{sage.name[0]}</AvatarFallback>
              </Avatar>
              <div className="text-center">
                <div className="font-medium text-sm md:text-base">{sage.name}</div>
                <div className="text-xs text-muted-foreground line-clamp-2">{sage.title}</div>
              </div>
            </Button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}