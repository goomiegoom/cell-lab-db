'use client'

const SP_C: Record<string, [string, string, string]> = {
  Human:   ['#edeaff','#5248b8','#3a3080'], Mouse:   ['#e6f5e0','#3a7830','#2a5822'],
  Monkey:  ['#d8f5ec','#1e7858','#145840'], Pig:     ['#deeeff','#2860b8','#1a4888'],
  Dog:     ['#d8ecfa','#2070a8','#145080'], Cat:     ['#fde8d8','#a05018','#783810'],
  Hamster: ['#f5e0ff','#7838a8','#582880'], Tiger:   ['#fef0d0','#b07010','#805008'],
  Hedgehog:['#f5f5d0','#787810','#505008'], Fox:    ['#fde0cc','#c04010','#903008'],
  Lion:    ['#fdd8d8','#a82828','#801818'], Cattle: ['#f0d8ee','#703870','#502850'],
  Bat:     ['#e8e8e8','#505050','#303030'], Horse:  ['#d8eaf8','#1e68a8','#104880'],
  Rabbit:  ['#fdd8ec','#a03870','#782850'], Rat:    ['#d8f0d8','#2e6028','#1e4018'],
  Deer:    ['#ede0cc','#705030','#503820'], Meerkat:['#fff0d8','#c08010','#805008'],
  Mosquito:['#d0f0d8','#186828','#104818'], Nutria: ['#f0e8d8','#806040','#604830'],
  Opossum: ['#e8e0f0','#604880','#402860'],
}

const STATUS_C: Record<string, [string, string, string]> = {
  'Include in final plate':                    ['#e6f5e0','#3a7830','#2a5822'],
  'Include in final plate , Re-plate':         ['#e6f5e0','#3a7830','#2a5822'],
  'Include in final plate , need more stock':  ['#fef0d0','#b07010','#805008'],
  'Poor growth':                               ['#fde8d8','#a05018','#783810'],
  'Poor growth in plate':                      ['#fde8d8','#a05018','#783810'],
  'Not yet/Fail to stock':                     ['#fdd8d8','#a82828','#801818'],
  'Virus':                                     ['#edeaff','#5248b8','#3a3080'],
}

const SSTAT_C: Record<string, [string, string, string]> = {
  'FINAL PLATE':      ['#e6f5e0','#3a7830','#2a5822'],
  'Plate OK':         ['#e6f5e0','#3a7830','#2a5822'],
  'Plate checked':    ['#e6f5e0','#3a7830','#2a5822'],
  'VERY GOOD':        ['#e6f5e0','#3a7830','#2a5822'],
  'Need to restock':  ['#fef0d0','#b07010','#805008'],
  'Need to reculture':['#fef0d0','#b07010','#805008'],
  'Plate checking':   ['#fef0d0','#b07010','#805008'],
  'RE-CULTURE':       ['#fde8d8','#a05018','#783810'],
  'Done RE-CULTURED': ['#deeeff','#2860b8','#1a4888'],
  'CONTAMINATION':    ['#fdd8d8','#a82828','#801818'],
  'No Record':        ['#e8e8e8','#505050','#303030'],
  'NOT DIFF':         ['#e8e8e8','#505050','#303030'],
  'LOW TITER':        ['#fde8d8','#a05018','#783810'],
  'Original':         ['#edeaff','#5248b8','#3a3080'],
}

export { SP_C, STATUS_C, SSTAT_C }

export function Pill({ val, colorMap }: { val: string; colorMap?: Record<string, [string,string,string]> }) {
  if (!val) return null
  const c = colorMap?.[val]
  if (!c) return (
    <span className="pill" style={{ background: '#f0ede8', border: '0.5px solid rgba(0,0,0,.1)', color: '#555' }}>{val}</span>
  )
  return (
    <span className="pill" style={{ background: c[0], border: `0.5px solid ${c[1]}` }}>
      <span className="pill-dot" style={{ background: c[1] }} />
      <span style={{ color: c[2] }}>{val}</span>
    </span>
  )
}

export function HostPill({ val }: { val: string }) { return <Pill val={val} colorMap={SP_C} /> }
export function StatusPill({ val }: { val: string }) { return <Pill val={val} colorMap={STATUS_C} /> }
export function SStatusPill({ val }: { val: string }) { return <Pill val={val} colorMap={SSTAT_C} /> }
