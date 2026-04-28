export interface Author {
  id: string
  author_name: string
  life: string | null
  ciris_url: string | null
  tm_id: string | null
  tm_uri: string | null
  creator: string | null
  language: string | null
  created_at: string
}

export interface Work {
  id: string
  work_title: string
  synopsis: string | null
  quoting_information: string | null
  ciris_url: string | null
  tm_id: string | null
  tm_uri: string | null
  creator: string | null
  author_id: string | null
  genre: string | null
  is_fragmentary: boolean
  created_at: string
  authors?: { author_name: string }
}

export interface PartOfWork {
  id: string
  work_title: string
  synopsis: string | null
  quoting_information: string | null
  ciris_url: string | null
  tm_id: string | null
  tm_uri: string | null
  creator: string | null
  work_id: string | null
  created_at: string
}

export interface Period {
  id: number
  corresponding_id: string
  period_type: 'Author Lifespan' | 'Work Composition Period' | 'Work Coverage Period'
  start_year_earliest: number | null
  start_year_latest: number | null
  end_year_earliest: number | null
  end_year_latest: number | null
}

export interface Source {
  id: number
  corresponding_id: string
  source_type: string
  source_information: string | null
  free_internet_resource_url: string | null
}

export interface Stats {
  total_authors: number
  total_works: number
  total_parts: number
  total_sources: number
  total_periods: number
}
