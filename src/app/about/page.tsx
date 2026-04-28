import { Mail, ExternalLink, Github } from 'lucide-react'

const GITHUB_URL = 'https://github.com/YatingPan/sgrwdh-web'

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl sm:text-4xl font-bold text-primary mb-8 font-serif">
        About SGRWDH
      </h1>

      {/* Project Introduction */}
      <section className="mb-12">
        <div className="prose max-w-none">
          <p className="text-foreground leading-relaxed text-lg mb-4">
            <strong>SGRWDH</strong> (Sources of the Greco-Roman World and Digital Humanities) is a
            collaborative research project dedicated to building a comprehensive, structured,
            machine-readable database of classical Greek and Roman authors, their literary works,
            and the scholarly sources that document them.
          </p>
          <p className="text-foreground leading-relaxed mb-4">
            The project aims to provide scholars, students, and the broader public with a powerful
            tool for exploring the literary heritage of the ancient Mediterranean world. By
            combining traditional philological scholarship with modern digital humanities
            methodologies, SGRWDH offers unprecedented access to information about classical
            authors and their works — from well-known figures to obscure fragmentary authors
            preserved only in later quotations.
          </p>
          <p className="text-foreground leading-relaxed">
            Each entry in the database includes biographical information, chronological data with
            uncertainty ranges, bibliographic sources, and links to external reference systems
            such as Trismegistos and CIRIS. The platform features interactive timeline
            visualizations and AI-powered search capabilities to facilitate research and discovery.
          </p>
        </div>
      </section>

      {/* Team */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-primary font-serif mb-6">Contributors</h2>
        <div className="grid sm:grid-cols-3 gap-6">
          <TeamCard
            name="Hendrikus van Wijlick"
            href="https://www.history.pku.edu.cn/jszy/HendrikusAntoniusvanWijlick/498a3de738b9411aaa8f26e2940948fa.htm"
          />
          <TeamCard
            name="Wenyi Shang"
            href="https://cehd.missouri.edu/person/wenyi-shang/"
          />
          <TeamCard
            name="Yating Pan"
            href="https://pkudh.org/member/yating.html"
          />
        </div>
      </section>

      {/* Methodology */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-primary font-serif mb-4">Methodology</h2>
        <div className="bg-card rounded-lg border border-border p-6">
          <p className="text-foreground leading-relaxed mb-4">
            SGRWDH employs an innovative <strong>agent-assisted data curation</strong> approach.
            AI agents, guided by specialized skill frameworks, assist human researchers in:
          </p>
          <ul className="space-y-2 text-foreground">
            <li className="flex gap-2">
              <span className="text-accent font-bold">1.</span>
              Extracting structured data from reference works (FGrH, FRH, RE, etc.)
            </li>
            <li className="flex gap-2">
              <span className="text-accent font-bold">2.</span>
              Cross-referencing entries with Trismegistos and other authority databases
            </li>
            <li className="flex gap-2">
              <span className="text-accent font-bold">3.</span>
              Generating standardized biographical summaries and chronological estimates
            </li>
            <li className="flex gap-2">
              <span className="text-accent font-bold">4.</span>
              Quality verification through multi-agent review pipelines
            </li>
          </ul>
          <p className="text-muted text-sm mt-4 italic">
            This database was constructed with the assistance of AI agents using the SGRWDH
            Agent Skills framework.
          </p>
        </div>
      </section>

      {/* Data Sources */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-primary font-serif mb-4">
          Data Sources & Acknowledgments
        </h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <AckCard
            title="Trismegistos"
            href="https://www.trismegistos.org"
            desc="An interdisciplinary portal of the ancient world, providing persistent author and text identifiers."
          />
          <AckCard
            title="CIRIS"
            href="https://ciris.bbaw.de"
            desc="Census of Interests and Resources in the Study of the Ancient World."
          />
          <AckCard
            title="FGrH (Jacoby)"
            desc="Die Fragmente der griechischen Historiker — the foundational collection of Greek historical fragments."
          />
          <AckCard
            title="FRH (Cornell)"
            desc="The Fragments of the Roman Historians — comprehensive collection of Roman historical fragments."
          />
        </div>
      </section>

      {/* Citation */}
      <section className="mb-12" id="citation">
        <h2 className="text-2xl font-bold text-primary font-serif mb-4">How to Cite</h2>
        <div className="bg-card rounded-lg border border-border p-6">
          <p className="text-foreground leading-relaxed mb-4">
            When citing the SGRWDH database as a whole, please use:
          </p>
          <blockquote className="bg-background border-l-4 border-primary rounded p-4 text-sm font-serif leading-relaxed text-foreground">
            van Wijlick, Hendrikus, Wenyi Shang, and Yating Pan. SGRWDH: Sources of the Greco-Roman World and Digital Humanities Database. 2026. https://sgrwdh-web.vercel.app.
          </blockquote>
          <p className="text-foreground leading-relaxed mt-4 mb-4">
            When citing an individual entry, please use the format:
          </p>
          <blockquote className="bg-background border-l-4 border-accent rounded p-4 text-sm font-serif leading-relaxed text-foreground">
            SGRWDH Database. &ldquo;[Entry Name].&rdquo; Accessed [Date]. https://sgrwdh-web.vercel.app/[type]/[id].
          </blockquote>
          <p className="text-muted text-sm mt-4">
            Each author and work detail page has a &ldquo;Cite this entry&rdquo; button that generates a ready-to-copy citation.
          </p>
        </div>
      </section>

      {/* Source code */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-primary font-serif mb-4">Source Code</h2>
        <div className="bg-card rounded-lg border border-border p-6">
          <p className="text-foreground leading-relaxed mb-3">
            The web application is open source. Issues and pull requests are welcome.
          </p>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-accent hover:text-primary underline underline-offset-2 break-all"
          >
            <Github size={16} />
            {GITHUB_URL}
            <ExternalLink size={12} />
          </a>
        </div>
      </section>

      {/* Contact */}
      <section>
        <h2 className="text-2xl font-bold text-primary font-serif mb-4">Contact</h2>
        <div className="bg-card rounded-lg border border-border p-6">
          <div className="flex items-center gap-2 text-foreground">
            <Mail size={18} className="text-muted" />
            <span>For inquiries about the project, please contact any of the contributors listed above.</span>
          </div>
        </div>
      </section>
    </div>
  )
}

function TeamCard({ name, href }: { name: string; href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-card rounded-lg border border-border p-5 shadow-sm hover:shadow-md hover:border-primary/30 transition-all"
    >
      <h3 className="font-serif font-bold text-primary text-lg">{name}</h3>
      <p className="text-xs text-muted mt-2 inline-flex items-center gap-1">
        Profile
        <ExternalLink size={12} />
      </p>
    </a>
  )
}

function AckCard({
  title,
  href,
  desc,
}: {
  title: string
  href?: string
  desc: string
}) {
  return (
    <div className="bg-card rounded-lg border border-border p-4">
      <div className="flex items-center gap-2">
        <h3 className="font-semibold text-foreground">{title}</h3>
        {href && (
          <a href={href} target="_blank" rel="noopener noreferrer" className="text-muted hover:text-accent">
            <ExternalLink size={14} />
          </a>
        )}
      </div>
      <p className="text-sm text-muted mt-1 leading-relaxed">{desc}</p>
    </div>
  )
}
