import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer'
import { RESUME_LABELS, type Resume } from '@/lib/resume'
import type { Locale } from '@/lib/i18n/dictionaries'

// sem hifenização automática (quebrava palavras no meio, o Docs não faz isso)
Font.registerHyphenationCallback((word) => [word])

// Réplica do currículo em Google Docs: Arial (Helvetica no PDF), carta, nome centralizado,
// seções em caixa alta com filete embaixo, bullets recuados.
const styles = StyleSheet.create({
  page: { fontFamily: 'Helvetica', fontSize: 9.5, lineHeight: 1.25, paddingTop: 48, paddingBottom: 48, paddingHorizontal: 72, color: '#000' },
  name: { fontFamily: 'Helvetica-Bold', fontSize: 16, textAlign: 'center', textTransform: 'uppercase', marginBottom: 3 },
  headline: { fontSize: 10, textAlign: 'center', marginTop: 1 },
  contact: { fontSize: 7.5, textAlign: 'center', marginTop: 3 },
  heading: { fontFamily: 'Helvetica-Bold', fontSize: 10, textTransform: 'uppercase', borderBottomWidth: 0.75, borderBottomColor: '#000', paddingBottom: 1, marginTop: 11, marginBottom: 4 },
  entry: { marginTop: 5 },
  entryTitle: { fontFamily: 'Helvetica-Bold' },
  date: { fontFamily: 'Helvetica-Oblique', fontSize: 8, marginTop: 1 },
  bullet: { flexDirection: 'row', marginTop: 1.5, paddingLeft: 18 },
  dot: { width: 12, fontSize: 9.5 },
  bulletText: { flex: 1 },
  bold: { fontFamily: 'Helvetica-Bold' },
  skill: { marginTop: 3 },
})

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.bullet} wrap={false}>
      <Text style={styles.dot}>•</Text>
      <Text style={styles.bulletText}>{children}</Text>
    </View>
  )
}

function Heading({ children }: { children: string }) {
  return (
    <Text style={styles.heading} minPresenceAhead={40}>
      {children}
    </Text>
  )
}

export function ResumePdf({ resume, locale }: { resume: Resume; locale: Locale }) {
  const L = RESUME_LABELS[locale]
  return (
    <Document title={`${resume.name} — ${resume.headline}`.trim()} author={resume.name} language={locale}>
      <Page size="LETTER" style={styles.page}>
        <Text style={styles.name}>{resume.name}</Text>
        {resume.headline ? <Text style={styles.headline}>{resume.headline}</Text> : null}
        {resume.contactLines.map((line) => (
          <Text key={line} style={styles.contact}>
            {line}
          </Text>
        ))}

        {resume.summary ? (
          <>
            <Heading>{L.summary}</Heading>
            <Text>{resume.summary}</Text>
          </>
        ) : null}

        {resume.experiences.length > 0 && (
          <>
            <Heading>{L.experience}</Heading>
            {resume.experiences.map((e) => (
              <View key={`${e.title}-${e.range}`} style={styles.entry}>
                <View wrap={false}>
                  <Text>
                    <Text style={styles.entryTitle}>{e.title}</Text>
                    {e.company ? `  –  ${e.company}` : ''}
                  </Text>
                  <Text style={styles.date}>{e.range}</Text>
                </View>
                {e.topics.map((topic) => (
                  <Bullet key={topic}>{topic}</Bullet>
                ))}
              </View>
            ))}
          </>
        )}

        {resume.projects.length > 0 && (
          <>
            <Heading>{L.projects}</Heading>
            {resume.projects.map((p) => (
              <View key={p.title} style={styles.entry}>
                <Text style={styles.entryTitle} minPresenceAhead={50}>
                  {p.title}
                </Text>
                {p.what ? (
                  <Bullet>
                    <Text style={styles.bold}>{L.what}:</Text> {p.what}
                  </Bullet>
                ) : null}
                {p.with ? (
                  <Bullet>
                    <Text style={styles.bold}>{L.with}:</Text> {p.with}
                  </Bullet>
                ) : null}
                {p.solves ? (
                  <Bullet>
                    <Text style={styles.bold}>{L.solves}:</Text> {p.solves}
                  </Bullet>
                ) : null}
              </View>
            ))}
          </>
        )}

        {resume.education.length > 0 && (
          <>
            <Heading>{L.education}</Heading>
            {resume.education.map((e) => (
              <Bullet key={e.degree}>
                <Text style={styles.bold}>{e.degree}</Text>
                {[e.institution, e.year].filter(Boolean).map((part) => ` – ${part}`)}
              </Bullet>
            ))}
          </>
        )}

        {resume.spoken.length > 0 && (
          <>
            <Heading>{L.languages}</Heading>
            <Text>{resume.spoken.map((s) => [s.language, s.level].filter(Boolean).join(' – ')).join('  |  ')}</Text>
          </>
        )}

        {resume.skills.length > 0 && (
          <>
            <Heading>{L.skills}</Heading>
            {resume.skills.map((c) => (
              <Text key={c.category} style={styles.skill}>
                <Text style={styles.bold}>{c.category}: </Text>
                {c.items.join(', ')}
              </Text>
            ))}
          </>
        )}

        {resume.certifications.length > 0 && (
          <>
            <Heading>{L.certifications}</Heading>
            {resume.certifications.map((c) => (
              <Bullet key={c.name}>{[c.name, c.range].filter(Boolean).join(' – ')}</Bullet>
            ))}
          </>
        )}
      </Page>
    </Document>
  )
}
