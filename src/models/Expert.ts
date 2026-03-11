export interface ExpertContact {
  id: string
  contact_type: 'phone' | 'website' | 'email' | 'linkedin' | 'twitter' | 'instagram' | 'facebook'
  value: string
}

export interface ExpertTag {
  id: string
  name: string
  slug: string
}

export interface Expert {
  id: string
  name: string
  bio: string | null
  expert_contacts: ExpertContact[]
  tags: ExpertTag[]
}
