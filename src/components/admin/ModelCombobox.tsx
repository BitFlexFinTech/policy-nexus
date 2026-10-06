import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { OPENROUTER_MODEL_SUGGESTIONS } from "@/config/platform";

/**
 * A searchable model picker for the OpenRouter drafting model.
 *
 * It replaces a plain suggestion list, which the browser drew in the wrong place. The list
 * opens ANCHORED to this field, is searchable, and offers every suggested OpenRouter model
 * plus a "use this id" row, so an administrator can pick a suggested model or type ANY id
 * OpenRouter carries. The suggested list is data from `src/config/platform.ts`, not a
 * closed set.
 */
export function ModelCombobox({
  value,
  onChange,
  id,
  "aria-label": ariaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  "aria-label"?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const trimmed = query.trim();
  const canUseTyped = trimmed.length > 0 && !OPENROUTER_MODEL_SUGGESTIONS.includes(trimmed);

  const choose = (model: string) => {
    onChange(model);
    setOpen(false);
    setQuery("");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label={ariaLabel}
          className={cn(
            "h-8 w-full justify-between font-mono text-xs font-normal",
            !value && "text-muted-foreground",
          )}
        >
          <span className="truncate">{value || "Choose a model"}</span>
          <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[var(--radix-popover-trigger-width)] p-0"
        // Match the width of the field it is anchored to, so the list opens directly under
        // the box rather than detached at the screen edge.
      >
        <Command>
          <CommandInput
            placeholder="Search models, or type any id"
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            <CommandEmpty>No suggested model matches — use the id you typed below.</CommandEmpty>
            <CommandGroup heading="Suggested models">
              {OPENROUTER_MODEL_SUGGESTIONS.map((model) => (
                <CommandItem key={model} value={model} onSelect={() => choose(model)}>
                  <Check
                    className={cn(
                      "mr-2 h-3.5 w-3.5",
                      value === model ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <span className="font-mono text-xs">{model}</span>
                </CommandItem>
              ))}
            </CommandGroup>
            {canUseTyped && (
              <CommandGroup heading="Use the id you typed">
                <CommandItem value={trimmed} onSelect={() => choose(trimmed)}>
                  <span className="font-mono text-xs">Use “{trimmed}”</span>
                </CommandItem>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
