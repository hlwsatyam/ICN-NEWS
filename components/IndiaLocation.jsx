'use client'
import { useState, useMemo } from 'react'
import { State, City } from 'country-state-city'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ChevronDown, MapPin, Loader2, Check, Search } from 'lucide-react'

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
 * value shape: { state, stateCode, district, city, pincode, village }
 * For backward compat with existing data model (state, district, city):
 *   - state    => CSC state name
 *   - district => CSC city name (acts as district HQ)
 *   - city     => village/area (pincode lookup or free text)
 */
export default function IndiaLocationPicker({ value = {}, onChange, requireVillage = true }) {
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

  const [pincode, setPincode] = useState(value.pincode || '')
  const [pinResults, setPinResults] = useState([])
  const [loadingPin, setLoadingPin] = useState(false)
  const [pinError, setPinError] = useState('')

  const lookupPin = async () => {
    if (!/^\d{6}$/.test(pincode)) { setPinError('Enter a valid 6-digit PIN code'); return }
    setLoadingPin(true); setPinError('')
    try {
      const r = await fetch(`https://api.postalpincode.in/pincode/${pincode}`).then(r => r.json())
      if (Array.isArray(r) && r[0]?.Status === 'Success') {
        setPinResults(r[0].PostOffice || [])
      } else {
        setPinResults([]); setPinError('No areas found for this PIN')
      }
    } catch { setPinError('Lookup failed. Check your internet.') }
    setLoadingPin(false)
  }

  return (
    <div className="space-y-2">
      {/* STATE */}
      <SearchableCombobox
        items={states}
        value={value.state || ''}
        placeholder="Select State / UT *"
        onSelect={it => onChange({ state: it.label, stateCode: it.isoCode, district: '', city: '', village: '', pincode: '' })}
      />

      {/* CITY / DISTRICT */}
      <SearchableCombobox
        items={cities}
        value={value.district || ''}
        placeholder={value.stateCode ? `Select City / District (${cities.length}) *` : 'Choose state first'}
        disabled={!value.stateCode}
        onSelect={it => onChange({ ...value, district: it.label, city: '', village: '' })}
      />

      {/* VILLAGE / AREA via PIN code */}
      {value.district && (
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-2.5 space-y-2">
          <p className="text-[11px] text-zinc-400 flex items-center gap-1">
            <MapPin className="h-3 w-3 text-red-500" /> Village / Locality {requireVillage && <span className="text-red-500">*</span>}
            <span className="text-zinc-600">• Use 6-digit PIN to auto-list nearby villages</span>
          </p>
          <div className="flex gap-1.5">
            <Input
              value={pincode}
              onChange={e => {
                const v = e.target.value.replace(/\D/g, '').slice(0, 6)
                setPincode(v); setPinError('')
                onChange({ ...value, pincode: v })
              }}
              placeholder="6-digit PIN code (e.g. 110001)"
              className="bg-zinc-900 border-zinc-800 text-white font-mono"
              inputMode="numeric"
            />
            <Button type="button" onClick={lookupPin} disabled={pincode.length !== 6 || loadingPin} className="bg-red-600 hover:bg-red-700 px-3">
              {loadingPin ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Search className="h-3.5 w-3.5 mr-1" /> Find</>}
            </Button>
          </div>
          {pinError && <p className="text-[11px] text-red-400">{pinError}</p>}
          {pinResults.length > 0 && (
            <div>
              <p className="text-[11px] text-zinc-500 mb-1">{pinResults.length} villages/areas found for {pincode}:</p>
              <SearchableCombobox
                items={pinResults.map(p => ({ value: `${p.Name}-${p.BranchType || ''}`, label: `${p.Name} • ${p.BranchType || 'Post Office'}` }))}
                value={value.village ? `${value.village} • ${pinResults.find(p => p.Name === value.village)?.BranchType || 'Post Office'}` : ''}
                placeholder="Pick your village / area *"
                onSelect={it => {
                  const name = it.label.split(' • ')[0]
                  onChange({ ...value, village: name, city: name })
                }}
              />
            </div>
          )}
          <Input
            placeholder="Or type village / locality manually *"
            value={value.village || value.city || ''}
            onChange={e => onChange({ ...value, village: e.target.value, city: e.target.value })}
            className="bg-zinc-900 border-zinc-800 text-white"
          />
        </div>
      )}
    </div>
  )
}
