-- ============================================================
-- SGRWDH SEED DATA
-- Run AFTER schema.sql (and optionally pgvector.sql)
-- ============================================================

-- ── Authors ──────────────────────────────────────────────────

INSERT INTO authors (id, author_name, life, tm_id, tm_uri, language) VALUES
('A1', 'Acusilaus', 'Acusilaus of Argos (fl. early 5th century BCE) was an early Greek logographer and mythographer. He wrote a genealogical work that reinterpreted Hesiod''s <i>Theogony</i> in prose, rationalizing mythological genealogies. Only fragments survive, preserved in later authors such as Apollodorus and the scholia.', '58', 'www.trismegistos.org/author/58', 'Greek'),

('A2', 'Fabius Pictor, Quintus', 'Quintus Fabius Pictor (fl. c. 200 BCE) was the earliest Roman historian, writing in Greek. A member of the prominent <i>gens Fabia</i> and a senator who served in the Second Punic War, he composed a history of Rome from the arrival of Aeneas and the founding of the city to his own time. His work established the annalistic tradition of Roman historiography. Fragments survive in Polybius, Livy, Dionysius of Halicarnassus, and others.', NULL, NULL, 'Latin'),

('A3', 'Hecataeus', 'Hecataeus of Miletus (c. 550–c. 476 BCE) was an early Greek historian and geographer, one of the first prose writers in the Western tradition. His two major works were the <i>Genealogiai</i> (or <i>Historiai</i>), a rationalist treatment of Greek myth that famously began "I write what I consider true, for the tales of the Greeks are many and ridiculous," and the <i>Periegesis</i>, a systematic description of the known world. Both survive only in fragments quoted by later authors.', '96', 'www.trismegistos.org/author/96', 'Greek'),

('A4', 'Thucydides', 'Thucydides (c. 460–c. 400 BCE) was an Athenian historian and general, author of the <i>History of the Peloponnesian War</i>. His rigorous method of evidence-based historical analysis, rejection of mythological causation, and focus on political and military events established a new standard for historiography. He served as <i>strategos</i> in 424 BCE but was exiled after the fall of Amphipolis. His history covers the war from 431 to 411 BCE; it breaks off mid-sentence, apparently left incomplete at his death.', '100', 'www.trismegistos.org/author/100', 'Greek'),

('A5', 'Polybius', 'Polybius of Megalopolis (c. 200–c. 118 BCE) was a Greek historian of the Hellenistic period. Deported to Rome as a political hostage in 167 BCE, he became a close associate of Scipio Aemilianus and witnessed the destruction of Carthage in 146 BCE. His <i>Histories</i> in 40 books covered the period from 264 to 146 BCE, explaining how Rome achieved dominance over the Mediterranean. Books 1–5 survive complete; the rest are fragmentary. Polybius is notable for his analytical approach, theory of the mixed constitution, and concept of <i>anacyclosis</i> (cyclical political change).', '180', 'www.trismegistos.org/author/180', 'Greek');

-- ── Works ────────────────────────────────────────────────────

INSERT INTO works (id, work_title, synopsis, quoting_information, author_id, genre, is_fragmentary) VALUES
('W1', 'Genealogiai', '<i>Genealogiai</i> (Γενεαλογίαι), also called <i>Historiai</i>, by Acusilaus of Argos. A prose rewriting and rationalization of Hesiod''s mythological genealogies, composed in the early 5th century BCE. The work treated the origins of the gods and heroes in a more systematic, genealogical framework. Genre: mythography/genealogy. Entirely fragmentary; approximately 40 fragments survive.', 'Jacoby FGrH 2', 'A1', 'Mythography', TRUE),

('W2', 'Annales', '<i>Annales</i> by Quintus Fabius Pictor, composed c. 200 BCE in Greek. The first Roman historical work, covering Roman history from the arrival of Aeneas and the foundation of Rome through the regal period, early Republic, and down to the Second Punic War. It established the chronological, year-by-year framework (<i>annales</i>) that subsequent Roman historians would follow. Genre: historiography. Fragmentary; preserved in citations by Polybius, Livy, Plutarch, and Dionysius of Halicarnassus.', 'Cornell FRH 1', 'A2', 'Historiography', TRUE),

('W3', 'Periegesis', '<i>Periegesis</i> (Περιήγησις γῆς) by Hecataeus of Miletus, composed c. 500 BCE. A systematic geographic description of the known world organized in two books: Book 1 covered Europe (proceeding from the Pillars of Heracles eastward), and Book 2 covered Asia (including Egypt and Libya). The work was accompanied by one of the earliest known maps of the world. Genre: geography. Fragmentary; over 300 fragments survive.', 'Jacoby FGrH 1', 'A3', 'Geography', TRUE),

('W4', 'History of the Peloponnesian War', 'The <i>History of the Peloponnesian War</i> (Ξυγγραφή) by Thucydides, composed between c. 431 and c. 400 BCE. A detailed account of the war between Athens and Sparta (431–404 BCE), considered a masterpiece of historical prose. The work is divided into 8 books and is notable for its speeches (including Pericles'' Funeral Oration and the Melian Dialogue), its analysis of the plague at Athens, and its unflinching examination of power politics. The narrative breaks off in 411 BCE, apparently incomplete.', NULL, 'A4', 'Historiography', FALSE),

('W5', 'Histories', 'The <i>Histories</i> (Ἱστορίαι) by Polybius, composed between c. 150 and c. 120 BCE. A universal history in 40 books covering the period 264–146 BCE, explaining how and why Rome rose to dominate the entire Mediterranean world in barely 53 years (220–167 BCE). Books 1–5 survive intact; Books 6–40 exist in substantial excerpts and fragments. The work is notable for its analytical methodology, digressions on constitutional theory (Book 6), and the author''s use of autopsy and personal experience.', NULL, 'A5', 'Historiography', FALSE);

-- ── Genealogiai by Hecataeus (the other major work) ──

INSERT INTO works (id, work_title, synopsis, quoting_information, author_id, genre, is_fragmentary) VALUES
('W6', 'Genealogiai (Hecataeus)', '<i>Genealogiai</i> (Γενεαλογίαι) or <i>Historiai</i> by Hecataeus of Miletus, composed c. 500 BCE. A rationalist treatment of Greek mythological genealogies, famous for its opening declaration: "I write what I consider to be true; for the stories of the Greeks are many and, in my opinion, ridiculous." The work systematically examined heroic genealogies, attempting to reconcile mythological traditions with a more rational chronological framework. Entirely fragmentary.', 'Jacoby FGrH 1', 'A3', 'Mythography', TRUE);

-- ── Periods ──────────────────────────────────────────────────

INSERT INTO periods (corresponding_id, period_type, start_year_earliest, start_year_latest, end_year_earliest, end_year_latest) VALUES
-- Author Lifespans
('A1', 'Author Lifespan', -520, -500, -460, -440),
('A2', 'Author Lifespan', -254, -254, -200, -200),
('A3', 'Author Lifespan', -550, -550, -476, -476),
('A4', 'Author Lifespan', -460, -455, -400, -395),
('A5', 'Author Lifespan', -200, -200, -118, -118),

-- Work Composition Periods
('W1', 'Work Composition Period', -500, -490, -480, -470),
('W2', 'Work Composition Period', -210, -200, -200, -190),
('W3', 'Work Composition Period', -510, -500, -490, -480),
('W4', 'Work Composition Period', -431, -431, -400, -395),
('W5', 'Work Composition Period', -150, -145, -125, -120),
('W6', 'Work Composition Period', -510, -500, -490, -480),

-- Work Coverage Periods
('W2', 'Work Coverage Period', -1200, NULL, NULL, -216),
('W4', 'Work Coverage Period', -431, -431, -411, -411),
('W5', 'Work Coverage Period', -264, -264, -146, -146);

-- ── Sources ──────────────────────────────────────────────────

INSERT INTO sources (corresponding_id, source_type, source_information, free_internet_resource_url) VALUES
-- Acusilaus
('A1', 'Edition', 'Jacoby, Felix. <i>Die Fragmente der griechischen Historiker</i>. Nr. 2. Leiden: Brill, 1923.', NULL),
('A1', 'Edition', 'Fowler, Robert L. <i>Early Greek Mythography</i>. Vol. 1: Text and Introduction. Oxford: Oxford University Press, 2000.', NULL),

-- Fabius Pictor
('A2', 'Edition', 'Cornell, Tim J. <i>The Fragments of the Roman Historians</i>. 3 vols. Oxford: Oxford University Press, 2013.', NULL),
('A2', 'Bibliography', 'Frier, Bruce W. <i>Libri Annales Pontificum Maximorum: The Origins of the Annalistic Tradition</i>. Rome: American Academy, 1979.', NULL),
('A2', 'Bibliography', 'Badian, Ernst. "The Early Historians." In T. A. Dorey, ed., <i>Latin Historians</i>, 1–38. London: Routledge, 1966.', NULL),

-- Hecataeus
('A3', 'Edition', 'Jacoby, Felix. <i>Die Fragmente der griechischen Historiker</i>. Nr. 1. Leiden: Brill, 1923.', NULL),
('A3', 'Bibliography', 'Pearson, Lionel. <i>Early Ionian Historians</i>. Oxford: Clarendon Press, 1939.', NULL),

-- Thucydides
('A4', 'Edition', 'Jones, H. S., and J. E. Powell, eds. <i>Thucydidis Historiae</i>. 2 vols. Oxford Classical Texts. Oxford: Clarendon Press, 1942.', NULL),
('A4', 'Translation', 'Lattimore, Steven, trans. <i>The Peloponnesian War</i>. Indianapolis: Hackett, 1998.', NULL),
('A4', 'Original Text + Translation', 'Smith, Charles Forster, trans. <i>Thucydides: History of the Peloponnesian War</i>. 4 vols. Loeb Classical Library. Cambridge, MA: Harvard University Press, 1919–1923.', 'https://www.perseus.tufts.edu/hopper/text?doc=Perseus:text:1999.01.0200'),
('A4', 'Commentary', 'Hornblower, Simon. <i>A Commentary on Thucydides</i>. 3 vols. Oxford: Clarendon Press, 1991–2008.', NULL),
('A4', 'Bibliography', 'Connor, W. Robert. <i>Thucydides</i>. Princeton: Princeton University Press, 1984.', NULL),

-- Polybius
('A5', 'Edition', 'Büttner-Wobst, Theodor, ed. <i>Polybii Historiae</i>. 5 vols. Leipzig: Teubner, 1889–1905.', NULL),
('A5', 'Original Text + Translation', 'Paton, W. R., trans. <i>Polybius: The Histories</i>. 6 vols. Loeb Classical Library. Cambridge, MA: Harvard University Press, 1922–1927. Rev. by F. W. Walbank and C. Habicht, 2010–2012.', NULL),
('A5', 'Commentary', 'Walbank, F. W. <i>A Historical Commentary on Polybius</i>. 3 vols. Oxford: Clarendon Press, 1957–1979.', NULL),
('A5', 'Bibliography', 'Eckstein, Arthur M. <i>Moral Vision in the Histories of Polybius</i>. Berkeley: University of California Press, 1995.', NULL);
