"use client"

import * as React from "react"
import * as PopoverPrimitive from "@radix-ui/react-popover"
import { ChevronDown, Check } from "lucide-react"

import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { pakistanCities, searchCities } from "@/data/pakistan-cities"

export interface CitySelectProps {
  value: string
  onChange: (city: string) => void
  placeholder?: string
  className?: string
  error?: boolean
}

export function CitySelect({
  value,
  onChange,
  placeholder = "Select a city...",
  className,
  error,
}: CitySelectProps) {
  const [open, setOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")
  const inputRef = React.useRef<HTMLInputElement>(null)

  const filteredCities = React.useMemo(() => {
    return searchCities(searchQuery)
  }, [searchQuery])

  const handleSelect = (cityName: string) => {
    onChange(cityName)
    setSearchQuery("")
    setOpen(false)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
    if (!open) setOpen(true)
  }

  React.useEffect(() => {
    if (!open) setSearchQuery("")
    else setTimeout(() => inputRef.current?.focus(), 0)
  }, [open])

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <button
          type="button"
          className={cn(
            "flex h-10 w-full items-center justify-between rounded-md border px-3 py-2 text-left text-sm",
            "bg-cream-100 ring-offset-background",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay-500 focus-visible:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error ? "border-destructive" : "border-forest-200 hover:border-forest-300",
            className
          )}
        >
          <span className={cn("truncate", !value && "text-forest-400")}>
            {value || placeholder}
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 text-forest-400" />
        </button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="start"
          sideOffset={4}
          className="z-50 w-[var(--radix-popover-trigger-width)]"
        >
          <div className="max-h-[300px] overflow-hidden rounded-md border border-forest-200 bg-cream-100 shadow-lg">
            <div className="border-b border-forest-200 p-2">
              <Input
                ref={inputRef}
                placeholder="Search cities..."
                value={searchQuery}
                onChange={handleInputChange}
                className="h-8 border-forest-200"
              />
            </div>
            <div className="max-h-[250px] overflow-y-auto scrollbar-hide">
              {filteredCities.length === 0 ? (
                <div className="py-6 text-center text-forest-400 text-sm">
                  No cities found
                </div>
              ) : (
                <div className="py-1">
                  {filteredCities.map((city) => (
                    <button
                      key={city.name}
                      type="button"
                      onClick={() => handleSelect(city.name)}
                      className={cn(
                        "flex w-full items-center justify-between px-3 py-2 text-left text-sm",
                        "hover:bg-forest-50 focus:bg-forest-50 focus:outline-none",
                        value === city.name && "bg-forest-50"
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <span className={cn(
                          "w-4 h-4 border rounded flex items-center justify-center",
                          value === city.name ? "bg-clay-500 border-clay-500" : "border-forest-300"
                        )}>
                          {value === city.name && <Check className="h-3 w-3 text-white" />}
                        </span>
                        <span>{city.name}</span>
                      </span>
                      <span className="text-xs text-forest-400">{city.province}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  )
}
