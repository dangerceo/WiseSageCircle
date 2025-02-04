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
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Choose Your Guides</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={selectAll}
        >
          {selected.length === sages.length ? "Deselect All" : "Council Mode"}
        </Button>
      </div>

      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex space-x-4 p-1">
          {sages.map((sage) => (
            <Button
              key={sage.id}
              variant={selected.includes(sage.id) ? "default" : "outline"}
              className="flex flex-col items-center space-y-2 p-2 h-auto"
              onClick={() => toggleSage(sage.id)}
            >
              <Avatar className="h-16 w-16">
                <AvatarImage src={sage.image} alt={sage.name} />
                <AvatarFallback>{sage.name[0]}</AvatarFallback>
              </Avatar>
              <div className="text-center">
                <div className="font-medium">{sage.name}</div>
                <div className="text-xs text-muted-foreground">{sage.title}</div>
              </div>
            </Button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
