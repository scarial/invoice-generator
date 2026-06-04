import { useLocalStorage } from './useStorage'
import type { UserInfo } from '../types'

const DEFAULT_USER_INFO: UserInfo = {
  nom: '',
  entreprise: '',
  adresse: '',
  codePostal: '',
  ville: '',
  email: '',
  telephone: '',
  siret: '',
  numeroME: '',
}

export function useUserInfo() {
  const [userInfo, setUserInfo] = useLocalStorage<UserInfo>('userInfo', DEFAULT_USER_INFO)

  const updateUserInfo = (partial: Partial<UserInfo>) => {
    setUserInfo(prev => ({ ...prev, ...partial }))
  }

  return { userInfo, updateUserInfo }
}
