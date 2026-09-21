import type { CvDocument } from './types'

const id = () => crypto.randomUUID()

const header = `<header class="reference-header">
  <div class="identity-block"><h1>YOUR NAME</h1><p>Age · Pronouns</p><p>MBA, Batch 20XX – XX</p></div>
  <div class="institute-lockup"><img src="./iim-mumbai-logo.png" alt="IIM Mumbai"><span><strong>IIM MUMBAI</strong><small>Indian Institute of Management Mumbai</small></span></div>
</header>
<div class="profile-band">Process Analyst | Digital Strategist | Tech Enthusiast | Problem Solver</div>`

const section = (title: string, body: string) => `<section class="dense-section"><h2>${title}</h2>${body}</section>`

// This template mirrors the compact, table-led reference format while keeping
// the user's real personal details out of the public repository.
export const starterDocument = (): CvDocument => ({
  title: 'My CV',
  updatedAt: Date.now(),
  margins: { top: 0.5, right: 0.5, bottom: 0.5, left: 0.5 },
  pages: [
    {
      id: id(),
      html: `${header}
      ${section('Academic Profile', `<table class="academic-table"><thead><tr><th>Degree</th><th>Institute</th><th>% / CGPA</th><th>Year</th></tr></thead><tbody>
        <tr><td>MBA</td><td>Indian Institute of Management Mumbai</td><td>Pursuing</td><td>20XX</td></tr>
        <tr><td>Bachelor's Degree</td><td>University / Institute name</td><td>0.00</td><td>20XX</td></tr>
        <tr><td>Class XII</td><td>School name</td><td>00.00%</td><td>20XX</td></tr>
        <tr><td>Class X</td><td>School name</td><td>00.00%</td><td>20XX</td></tr>
      </tbody></table>`)}
      ${section('Internship', `<div class="entry-head"><strong>Organisation Name</strong><strong>Mon'XX–Mon'XX</strong></div>
        <div class="project-title"><strong>Project Title: Strategic Growth Advisory &amp; Go-to-Market Roadmap</strong></div>
        <table class="detail-table"><tbody>
          <tr><th>Project Details</th><td><ul><li>Diagnosed a high-impact business problem using three years of sales, cost, and operational data</li><li>Identified leakage trends and evaluated market penetration opportunities using a structured framework</li><li>Recommended a focused roadmap supported by ROI, implementation milestones, and measurable KPIs</li><li>Designed standard operating procedures to improve dispute resolution and service delivery</li></ul></td></tr>
          <tr><th>Achievements</th><td><ul><li>Earned a letter of excellence for client-ready work and strong stakeholder management</li><li>Recognised as a top performer for quality delivery under challenging timelines</li></ul></td></tr>
        </tbody></table>
        <div class="entry-head second-entry"><strong>Organisation Name</strong><strong>Mon'XX–Mon'XX</strong></div>
        <div class="project-title"><strong>Project Title: Digital Sales Growth and Campus Outreach</strong></div>
        <table class="detail-table"><tbody>
          <tr><th>Project Details</th><td><ul><li>Accelerated acquisition through CRM-led funnels and targeted outreach across multiple institutes</li><li>Secured institutional partnerships through tailored proposals and high-impact workshops</li><li>Analysed customer queries, defined clear KPIs, and mapped behavioural patterns</li></ul></td></tr>
          <tr><th>Achievements</th><td><ul><li>Exceeded the sales target and received a performance certificate</li></ul></td></tr>
        </tbody></table>`)}
      ${section('Projects', `<div class="entry-head"><strong>Institute / Organisation</strong><span></span></div>
        <div class="entry-head project-title"><strong>Project Title: Data-led Product or Technology Project</strong><strong>8 Weeks</strong></div>
        <table class="detail-table"><tbody>
          <tr><th>Project Details</th><td><ul><li>Built an end-to-end solution through research, prototyping, testing, and stakeholder feedback</li><li>Designed a resilient workflow and validated the concept across real-world scenarios</li><li>Coordinated a five-member team across planning, execution, reviews, and final delivery</li></ul></td></tr>
          <tr><th>Achievements</th><td><ul><li>Improved the primary success metric by 40% and delivered the proof of concept on time</li></ul></td></tr>
        </tbody></table>
        <div class="entry-head second-entry"><strong>Project Title: Business Process Improvement</strong><strong>6 Weeks</strong></div>
        <table class="detail-table"><tbody><tr><th>Project Details</th><td><ul><li>Mapped the existing process, isolated bottlenecks, and proposed a measurable future-state workflow</li><li>Validated recommendations with users and translated findings into an implementation roadmap</li></ul></td></tr></tbody></table>`)}
      ${section('Positions of Responsibility', `<table class="responsibility-table"><tbody>
        <tr><th>Events &amp; Outreach<br>Head</th><td><ul><li>Led content strategy, CRM, and outreach operations, achieving 28% growth in engagement</li><li>Built an audience segmentation framework to improve participation and query resolution</li><li>Negotiated with vendors and optimised resources to deliver measurable cost savings</li></ul></td><td>20XX<br>20XX<br>20XX</td></tr>
        <tr><th>PR Executive</th><td><ul><li>Executed targeted campaigns involving national and international stakeholders</li><li>Managed social channels and increased impressions through analytics-led content</li><li>Improved engagement using search-optimised calls to action</li></ul></td><td>20XX<br>20XX<br>20XX</td></tr>
        <tr><th>Project Head</th><td><ul><li>Mentored multiple student teams and established timelines, milestones, and quality reviews</li><li>Oversaw budgets and assets to meet project goals without cost overruns</li></ul></td><td>20XX<br>20XX</td></tr>
      </tbody></table>`)}
      ${section('Awards and Achievements', `<table class="responsibility-table"><tbody>
        <tr><th>Academics</th><td><ul><li>Secured distinction in core and interdisciplinary electives</li><li>Completed research on a high-impact sustainability or policy problem</li><li>Consistently demonstrated academic excellence across quantitative and managerial subjects</li></ul></td><td>20XX<br>20XX<br>20XX</td></tr>
        <tr><th>Certifications</th><td><ul><li>Completed an industry certification in business intelligence and analytics</li><li>Developed practical proficiency in operations management and process design</li><li>Completed advanced coursework in negotiation and stakeholder management</li></ul></td><td>20XX<br>20XX<br>20XX</td></tr>
        <tr><th>Extra-Curriculars</th><td><ul><li>Ranked among the top teams in a national case competition</li><li>Volunteered for an education initiative and mentored students from underserved communities</li><li>Participated in a leadership programme focused on discipline and team coordination</li></ul></td><td>20XX<br>20XX<br>20XX</td></tr>
      </tbody></table>`)}
      <p class="cv-footer-link"><a href="https://linkedin.com/in/your-profile">linkedin.com/in/your-profile</a></p>`,
    },
  ],
})
