/**
 * Static lookup for the most common scholarly abbreviations of
 * classical authors and their works (the form used in our database's
 * `quoting_information` field, e.g. "Plut. Brut.", "Pliny Nat.").
 *
 * Conventions follow the Oxford Classical Dictionary 4th ed. + LSJ +
 * Brill's New Pauly. Coverage is intentionally pragmatic — only the
 * abbreviations that appear in our data plus close neighbours.
 *
 * To resolve a string we tokenise on whitespace, strip trailing '.',
 * and walk the prefix: first match the author abbreviation, then
 * (optionally) the work abbreviation registered under that author.
 */

interface AuthorEntry {
  author: string
  works?: Record<string, string>
}

/**
 * Keys are the abbreviation as it appears in citations, lowercased and
 * stripped of trailing dots. So "Plut." → "plut", "App." → "app".
 */
const AUTHOR_TABLE: Record<string, AuthorEntry> = {
  app: {
    author: 'Appian',
    works: {
      'b. civ': 'Bella Civilia (Civil Wars)',
      bc: 'Bella Civilia (Civil Wars)',
      ill: 'Illyrica',
      mith: 'Mithridatica',
      pun: 'Punica',
      hisp: 'Iberica',
      hann: 'Hannibalica',
    },
  },
  amm: { author: 'Ammianus Marcellinus', works: { marc: 'Res Gestae' } },
  'amm. marc': { author: 'Ammianus Marcellinus', works: { 'res gestae': 'Res Gestae' } },
  apul: { author: 'Apuleius', works: { met: 'Metamorphoses (Golden Ass)' } },
  arist: { author: 'Aristotle' },
  'aug. civ': { author: 'Augustine', works: { dei: 'De Civitate Dei' } },
  ausonius: { author: 'Ausonius' },
  caes: { author: 'Caesar', works: { gal: 'De Bello Gallico', civ: 'De Bello Civili' } },
  cato: {
    author: 'Cato the Elder',
    works: { agr: 'De Agri Cultura', orig: 'Origines' },
  },
  cens: { author: 'Censorinus', works: { dn: 'De Die Natali' } },
  censorinus: { author: 'Censorinus', works: { dn: 'De Die Natali' } },
  charisius: { author: 'Charisius', works: { gramm: 'Ars Grammatica' } },
  charis: { author: 'Charisius', works: { gramm: 'Ars Grammatica' } },
  cic: {
    author: 'Cicero',
    works: {
      att: 'Epistulae ad Atticum',
      fam: 'Epistulae ad Familiares',
      'de or': 'De Oratore',
      brut: 'Brutus',
      orat: 'Orator',
      'rep': 'De Re Publica',
      leg: 'De Legibus',
      'tusc': 'Tusculanae Disputationes',
      'nat': 'De Natura Deorum',
      div: 'De Divinatione',
      off: 'De Officiis',
    },
  },
  cicero: { author: 'Cicero' },
  columella: { author: 'Columella', works: { rust: 'De Re Rustica' } },
  diomedes: { author: 'Diomedes Grammaticus', works: { gl: 'Ars Grammatica (Grammatici Latini)' } },
  dion: { author: 'Dionysius of Halicarnassus' },
  'dion. hal': { author: 'Dionysius of Halicarnassus', works: { 'ant. rom': 'Antiquitates Romanae' } },
  eutr: { author: 'Eutropius', works: { breviarium: 'Breviarium Historiae Romanae' } },
  fest: { author: 'Festus', works: { 'verb. signif': 'De Verborum Significatione' } },
  flor: { author: 'Florus', works: { epit: 'Epitome of Roman History' } },
  fronto: { author: 'Marcus Cornelius Fronto' },
  frontinus: { author: 'Frontinus', works: { aq: 'De Aquaeductu', strat: 'Strategemata' } },
  gell: { author: 'Aulus Gellius', works: { na: 'Noctes Atticae' } },
  'gellius': { author: 'Aulus Gellius', works: { na: 'Noctes Atticae' } },
  hdt: { author: 'Herodotus' },
  hor: { author: 'Horace', works: { carm: 'Carmina (Odes)', epist: 'Epistulae', sat: 'Saturae' } },
  hyg: { author: 'Hyginus', works: { fab: 'Fabulae' } },
  juv: { author: 'Juvenal', works: { sat: 'Satires' } },
  lactant: {
    author: 'Lactantius',
    works: {
      'de mort. pers': 'De Mortibus Persecutorum',
      'div. inst': 'Divinae Institutiones',
    },
  },
  livy: { author: 'Livy' },
  liv: { author: 'Livy', works: { 'ab urbe condita': 'Ab Urbe Condita' } },
  lucan: { author: 'Lucan', works: { 'b. civ': 'Bellum Civile (Pharsalia)' } },
  lucr: { author: 'Lucretius', works: { rer: 'De Rerum Natura' } },
  macrob: { author: 'Macrobius', works: { sat: 'Saturnalia' } },
  martial: { author: 'Martial', works: { epigrammata: 'Epigrammata' } },
  mart: { author: 'Martial' },
  nepos: { author: 'Cornelius Nepos', works: { 'de viris illustribus': 'De Viris Illustribus' } },
  'non': { author: 'Nonius Marcellus', works: { 'de comp. doctr': 'De Compendiosa Doctrina' } },
  ov: { author: 'Ovid', works: { fast: 'Fasti', met: 'Metamorphoses', am: 'Amores', 'a. a': 'Ars Amatoria', tr: 'Tristia' } },
  ovid: { author: 'Ovid' },
  philo: { author: 'Philo of Alexandria' },
  pliny: { author: 'Pliny the Elder', works: { nat: 'Naturalis Historia' } },
  plin: {
    author: 'Pliny',
    works: {
      nat: 'Naturalis Historia (Pliny the Elder)',
      ep: 'Epistulae (Pliny the Younger)',
      pan: 'Panegyricus (Pliny the Younger)',
    },
  },
  plut: {
    author: 'Plutarch',
    works: {
      brut: 'Life of Brutus',
      ant: 'Life of Antony',
      caes: 'Life of Caesar',
      cic: 'Life of Cicero',
      cat: 'Life of Cato (Maior or Minor)',
      'comp. dem. cic': 'Comparison of Demosthenes and Cicero',
      crass: 'Life of Crassus',
      pomp: 'Life of Pompey',
      'sull': 'Life of Sulla',
      mar: 'Life of Marius',
      mor: 'Moralia',
    },
  },
  plutarch: { author: 'Plutarch' },
  pomponius: { author: 'Pomponius Mela', works: { chorographia: 'De Chorographia' } },
  posidon: { author: 'Posidonius of Apamea' },
  prisc: { author: 'Priscian', works: { gramm: 'Institutiones Grammaticae' } },
  quint: { author: 'Quintilian', works: { inst: 'Institutio Oratoria' } },
  sall: { author: 'Sallust', works: { hist: 'Historiae', cat: 'Bellum Catilinae', jug: 'Bellum Iugurthinum' } },
  sallust: { author: 'Sallust' },
  sen: {
    author: 'Seneca',
    works: { ep: 'Epistulae Morales', 'q. nat': 'Naturales Quaestiones', clem: 'De Clementia' },
  },
  serv: {
    author: 'Servius',
    works: {
      'on aen': 'Commentary on Vergil\'s Aeneid',
      'on ecl': 'Commentary on Vergil\'s Eclogues',
      'on g': 'Commentary on Vergil\'s Georgics',
      aen: 'Commentary on Vergil\'s Aeneid',
      ecl: 'Commentary on Vergil\'s Eclogues',
    },
  },
  servius: { author: 'Servius' },
  stat: { author: 'Statius', works: { theb: 'Thebaid', silv: 'Silvae' } },
  strab: { author: 'Strabo', works: { geog: 'Geographica' } },
  suet: {
    author: 'Suetonius',
    works: {
      aug: 'Life of Augustus (Divus Augustus)',
      caes: 'Life of Julius Caesar (Divus Iulius)',
      tib: 'Life of Tiberius',
      claud: 'Life of Claudius',
      ner: 'Life of Nero',
      vesp: 'Life of Vespasian',
      tit: 'Life of Titus',
      dom: 'Life of Domitian',
      cal: 'Life of Caligula',
      gramm: 'De Grammaticis et Rhetoribus',
    },
  },
  tac: { author: 'Tacitus', works: { ann: 'Annales', hist: 'Historiae', agr: 'Agricola', germ: 'Germania', dial: 'Dialogus de Oratoribus' } },
  ter: { author: 'Terence' },
  tert: { author: 'Tertullian', works: { 'de anim': 'De Anima', apol: 'Apologeticus' } },
  thuc: { author: 'Thucydides' },
  ulpian: { author: 'Ulpian (Domitius Ulpianus)', works: { dig: 'Digesta (Justinian)' } },
  'val. max': { author: 'Valerius Maximus', works: { '': 'Facta et Dicta Memorabilia' } },
  varro: { author: 'Varro', works: { ling: 'De Lingua Latina', 'r. r': 'Res Rusticae', 'antiquitates rerum divinarum': 'Antiquitates Rerum Divinarum' } },
  vell: { author: 'Velleius Paterculus', works: { pat: 'Historiae Romanae', 'historiae romanae': 'Historiae Romanae' } },
  'vell. pat': { author: 'Velleius Paterculus', works: { 'historiae romanae': 'Historiae Romanae' } },
  verg: { author: 'Vergil', works: { aen: 'Aeneid', ecl: 'Eclogues', g: 'Georgics' } },
  virgil: { author: 'Vergil' },
  vitr: { author: 'Vitruvius', works: { architectura: 'De Architectura' } },
  vitruvius: { author: 'Vitruvius', works: { architectura: 'De Architectura' } },
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/[<][^>]+[>]/g, '').replace(/\s+/g, ' ').trim()
}

/**
 * Parse a citation string and return an expansion plus a normalized
 * author / work pair where possible. Returns null when nothing in the
 * table matches.
 */
export function expandCitation(raw: string): {
  author: string
  work?: string
  display: string
} | null {
  const cleaned = normalize(raw)
  if (!cleaned) return null

  // Strip a trailing book/section reference like "1.5", "12, 4" etc.
  const noNum = cleaned.replace(/[\s,]+\d.*$/, '').trim()
  const dotless = noNum.replace(/\./g, '').replace(/\s+/g, ' ').trim()

  // Try progressively shorter author prefixes.
  const tokens = dotless.split(' ')
  for (let take = Math.min(3, tokens.length); take >= 1; take--) {
    const authorKeyDotted = tokens.slice(0, take).join(' ').replace(/\s+/g, ' ')
    const authorKey = authorKeyDotted
    const entry = AUTHOR_TABLE[authorKey] || AUTHOR_TABLE[authorKey.replace(/\s/g, '. ')]
    if (!entry) continue
    const rest = tokens.slice(take).join(' ').trim()
    if (rest && entry.works) {
      // Try to match work on remaining tokens
      const wkKey = rest
      const direct = entry.works[wkKey]
      if (direct) {
        return { author: entry.author, work: direct, display: `${entry.author}, ${direct}` }
      }
      // Try shorter prefixes of rest
      const restTokens = rest.split(' ')
      for (let t = Math.min(restTokens.length, 4); t >= 1; t--) {
        const candidate = restTokens.slice(0, t).join(' ')
        const w = entry.works[candidate]
        if (w) {
          return { author: entry.author, work: w, display: `${entry.author}, ${w}` }
        }
      }
      return { author: entry.author, display: `${entry.author} (${raw.trim()})` }
    }
    return { author: entry.author, display: entry.author }
  }
  return null
}
