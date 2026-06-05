'use client'
import { useState, useMemo } from 'react'
import { State, City } from 'country-state-city'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ChevronDown, MapPin, Check } from 'lucide-react'

/**
 * Reusable searchable combobox built on shadcn Popover + Command (cmdk).
 * items: [{ value, label }]
 */
export const SearchableCombobox = ({ items, value, onSelect, placeholder, disabled, className = '' }) => {
  const [open, setOpen] = useState(false)
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          disabled={disabled}
          className={`w-full justify-between bg-zinc-900 border-zinc-800 text-white hover:bg-zinc-800 hover:text-white font-normal ${className}`}
        >
          <span className={value ? 'text-white truncate' : 'text-zinc-500 truncate'}>{value || placeholder}</span>
          <ChevronDown className="h-4 w-4 opacity-60 ml-2 flex-shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 bg-zinc-950 border-zinc-800 text-white w-[var(--radix-popover-trigger-width)] max-h-80 overflow-hidden" align="start">
        <Command className="bg-zinc-950 text-white" filter={(v, search) => v.toLowerCase().includes(search.toLowerCase()) ? 1 : 0}>
          <CommandInput placeholder="Search..." className="h-9 text-white placeholder:text-zinc-500" />
          <CommandList className="max-h-64">
            <CommandEmpty className="text-zinc-500 text-sm p-3">No matches found.</CommandEmpty>
            <CommandGroup>
              {items.map((it, i) => (
                <CommandItem
                  key={it.value + '-' + i}
                  value={it.label}
                  onSelect={() => { onSelect(it); setOpen(false) }}
                  className="text-white aria-selected:bg-red-900/40 cursor-pointer"
                >
                  <Check className={`mr-2 h-3.5 w-3.5 ${value === it.label ? 'opacity-100 text-red-500' : 'opacity-0'}`} />
                  {it.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

/**
 * IndiaLocationPicker — All India state/city/village picker.
 * value shape: { state, stateCode, district, city, village }
 * level: 'state' | 'district' | 'city' (controls which fields are visible/required)
 *   - state    => only show State combobox
 *   - district => show State + District
 *   - city     => show State + District + Village input
 */
export default function IndiaLocationPicker({ value = {}, onChange, requireVillage = true, level = 'city' }) {
  const states = useMemo(
    () => State.getStatesOfCountry('IN').map(s => ({ value: s.isoCode, label: s.name, isoCode: s.isoCode })),
    []
  )
  const cities = useMemo(
    () => value.stateCode
      ? City.getCitiesOfState('IN', value.stateCode).map(c => ({ value: c.name, label: c.name }))
      : [],
    [value.stateCode]
  )

  const showDistrict = level === 'district' || level === 'city'
  const showVillage = level === 'city'

  return (
    <div className="space-y-2">
      {/* STATE — always shown */}
      <SearchableCombobox
        items={states}
        value={value.state || ''}
        placeholder="Select State / UT *"
        onSelect={it => onChange({ state: it.label, stateCode: it.isoCode, district: '', city: '', village: '' })}
      />

      {/* CITY / DISTRICT — hidden for State Level */}
      {showDistrict && (
        <SearchableCombobox
          items={cities}
          value={value.district || ''}
          placeholder={value.stateCode ? `Select City / District (${cities.length}) *` : 'Choose state first'}
          disabled={!value.stateCode}
          onSelect={it => onChange({ ...value, district: it.label, city: '', village: '' })}
        />
      )}

      {/* VILLAGE / AREA — manual text input, only for City Level */}
      {showVillage && value.district && (
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-2.5 space-y-2">
          <p className="text-[11px] text-zinc-400 flex items-center gap-1">
            <MapPin className="h-3 w-3 text-red-500" /> Village / Locality {requireVillage && <span className="text-red-500">*</span>}
          </p>
          <Input
            placeholder="Enter village / locality name manually"
            value={value.village || value.city || ''}
            onChange={e => onChange({ ...value, village: e.target.value, city: e.target.value })}
            className="bg-zinc-900 border-zinc-800 text-white"
          />
        </div>
      )}
    </div>
  )
}
