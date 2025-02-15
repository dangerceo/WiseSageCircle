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

      <ScrollArea className="w-full">
        <div className="flex w-max gap-2 pb-2">
          {sages.map((sage) => (
            <Button
              key={sage.id}
              variant={selected.includes(sage.id) ? "default" : "outline"}
              className="flex flex-col items-center gap-2 p-2 h-auto w-[70px] sm:w-[90px]"
              onClick={() => toggleSage(sage.id)}
            >
              <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
                <AvatarImage src={sage.image} alt={sage.name} />
                <AvatarFallback>{sage.name[0]}</AvatarFallback>
              </Avatar>
              <div className="text-center">
                <div className="font-medium text-xs sm:text-sm truncate w-full">{sage.name}</div>
              </div>
            </Button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}