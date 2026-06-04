import { useState } from 'react'
import { ChevronDown, ChevronUp, User } from 'lucide-react'
import { Input } from '../../ui/input'
import { Label } from '../../ui/label'
import type { UserInfo } from '../../../types'
import { validateSiret } from '../../../utils/invoice'

interface Props {
  userInfo: UserInfo
  onChange: (partial: Partial<UserInfo>) => void
}

export function UserInfoSection({ userInfo, onChange }: Props) {
  const [open, setOpen] = useState(true)
  const siretValid = userInfo.siret.length === 0 || validateSiret(userInfo.siret)

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors"
      >
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <User size={15} />
          Mes informations
        </div>
        {open ? <ChevronUp size={15} className="text-slate-400" /> : <ChevronDown size={15} className="text-slate-400" />}
      </button>

      {open && (
        <div className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Nom complet">
              <Input value={userInfo.nom} onChange={e => onChange({ nom: e.target.value })} placeholder="Jean Dupont" />
            </Field>
            <Field label="Nom de l'entreprise">
              <Input value={userInfo.entreprise} onChange={e => onChange({ entreprise: e.target.value })} placeholder="Mon Entreprise" />
            </Field>
          </div>
          <Field label="Adresse">
            <Input value={userInfo.adresse} onChange={e => onChange({ adresse: e.target.value })} placeholder="12 rue de la Paix" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Code postal">
              <Input value={userInfo.codePostal} onChange={e => onChange({ codePostal: e.target.value })} placeholder="75001" />
            </Field>
            <Field label="Ville">
              <Input value={userInfo.ville} onChange={e => onChange({ ville: e.target.value })} placeholder="Paris" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Email">
              <Input type="email" value={userInfo.email} onChange={e => onChange({ email: e.target.value })} placeholder="jean@exemple.fr" />
            </Field>
            <Field label="Téléphone">
              <Input value={userInfo.telephone} onChange={e => onChange({ telephone: e.target.value })} placeholder="06 12 34 56 78" />
            </Field>
          </div>
          <Field label="Numéro SIRET" error={!siretValid ? 'SIRET invalide (14 chiffres)' : undefined}>
            <Input
              value={userInfo.siret}
              onChange={e => onChange({ siret: e.target.value.replace(/\D/g, '').slice(0, 14) })}
              placeholder="12345678901234"
              className={!siretValid ? 'border-red-400' : ''}
            />
          </Field>
          <Field label="N° micro-entrepreneur (optionnel)">
            <Input value={userInfo.numeroME ?? ''} onChange={e => onChange({ numeroME: e.target.value })} placeholder="Si différent du SIRET" />
          </Field>
        </div>
      )}
    </div>
  )
}

function Field({ label, children, error }: { label: string; children: React.ReactNode; error?: string }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-slate-600">{label}</Label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
