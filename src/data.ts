import type { CvDocument } from './types'

const id = () => crypto.randomUUID()

export const starterDocument = (): CvDocument => ({
  title: 'My CV',
  updatedAt: Date.now(),
  pages: [
    {
      id: id(),
      html: `<header class="cv-header">
        <h1>YOUR NAME</h1>
        <p class="cv-role">Management professional · Strategy · Operations</p>
        <p><a href="mailto:you@example.com">you@example.com</a> · +91 98765 43210 · Mumbai, India · <a href="https://linkedin.com">LinkedIn</a></p>
      </header>
      <section><h2>Profile</h2><p>Analytical and impact-oriented professional with experience turning ambiguous problems into clear, measurable action.</p></section>
      <section><h2>Experience</h2><div class="cv-row"><h3>Role title · Organisation</h3><span>2024 – Present</span></div><ul><li>Led a cross-functional initiative and improved a meaningful business metric by 20%.</li><li>Built a repeatable process that saved the team 10 hours each week.</li></ul></section>
      <section><h2>Education</h2><div class="cv-row"><h3>Indian Institute of Management Mumbai</h3><span>2024 – 2026</span></div><p>Master of Business Administration</p></section>
      <section><h2>Skills</h2><p><strong>Strategy:</strong> Market research, business modelling, stakeholder management<br><strong>Tools:</strong> Excel, PowerPoint, SQL, Python</p></section>`,
    },
  ],
})
