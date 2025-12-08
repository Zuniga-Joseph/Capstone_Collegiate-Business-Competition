import { createFileRoute, redirect } from "@tanstack/react-router"
import { useState } from 'react';
import { isLoggedIn } from "@/hooks/useAuth"

export const Route = createFileRoute("/recruiter-dashboard")({
  component: RecruiterDashboard,
  beforeLoad: async () => {
    if (isLoggedIn()) {
      throw redirect({
        to: "/",
      })
    }
  },
})

interface Student {
  id: number;
  name: string;
  rank: number;
  score: number;
  university: string;
  email: string;
  skills: string[];
  projects: number;
  experience: string;
}

const STUDENTS_PER_PAGE = 10;

const universities = ['MIT', 'Stanford', 'Harvard', 'UC Berkeley', 'CMU', 'Yale', 'Princeton', 'Columbia'];
const skills = ['Python', 'JavaScript', 'React', 'Machine Learning', 'SQL', 'Java', 'C++', 'Leadership', 'Communication'];

const fakeStudents: Student[] = Array.from({ length: 47 }, (_, i) => {
  const score = Math.floor(Math.random() * 40) + 60;
  const firstName = ['Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Sam', 'Charlie', 'Jamie', 'Quinn'][i % 10];
  const lastName = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'][Math.floor(i / 10) % 10];
  const name = `${firstName} ${lastName}`;
  
  return {
    id: i + 1,
    name,
    rank: i + 1,
    score,
    university: universities[Math.floor(Math.random() * universities.length)],
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@university.edu`,
    skills: skills.sort(() => 0.5 - Math.random()).slice(0, 3 + Math.floor(Math.random() * 3)),
    projects: Math.floor(Math.random() * 10) + 3,
    experience: ['Internship at Tech Corp', 'Research Assistant', 'Freelance Developer', 'Startup Founder'][Math.floor(Math.random() * 4)]
  };
}).sort((a, b) => b.score - a.score).map((s, i) => ({ ...s, rank: i + 1 }));

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '40px 20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
  },
  content: {
    maxWidth: '1200px',
    margin: '0 auto'
  },
  header: {
    marginBottom: '40px',
    color: 'white'
  },
  title: {
    fontSize: '42px',
    fontWeight: 'bold',
    marginBottom: '10px',
    margin: 0
  },
  subtitle: {
    fontSize: '18px',
    opacity: 0.9,
    margin: 0
  },
  card: {
    background: 'white',
    borderRadius: '16px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
    overflow: 'hidden'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const
  },
  thead: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white'
  },
  th: {
    padding: '20px',
    textAlign: 'left' as const,
    fontWeight: '600',
    fontSize: '16px'
  },
  tr: {
    borderBottom: '1px solid #e5e7eb',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  },
  td: {
    padding: '20px',
    fontSize: '15px'
  },
  rankCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontWeight: '600'
  },
  scoreCell: {
    display: 'inline-block',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    padding: '6px 16px',
    borderRadius: '20px',
    fontWeight: '600'
  },
  pagination: {
    background: '#f9fafb',
    padding: '20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTop: '1px solid #e5e7eb'
  },
  button: {
    padding: '10px 20px',
    background: 'white',
    border: '2px solid #667eea',
    borderRadius: '8px',
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: '14px',
    color: '#667eea',
    transition: 'all 0.2s'
  },
  buttonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed'
  },
  backButton: {
    padding: '10px 20px',
    background: 'white',
    border: 'none',
    borderRadius: '8px',
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: '14px',
    color: '#667eea',
    marginBottom: '20px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px'
  },
  detailCard: {
    background: 'white',
    borderRadius: '16px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
    padding: '40px'
  },
  detailHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'start',
    marginBottom: '30px',
    paddingBottom: '30px',
    borderBottom: '2px solid #e5e7eb'
  },
  studentName: {
    fontSize: '36px',
    fontWeight: 'bold',
    margin: '0 0 10px 0',
    color: '#1f2937'
  },
  rankBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    color: '#6b7280',
    fontSize: '18px',
    fontWeight: '600'
  },
  scoreDisplay: {
    fontSize: '48px',
    fontWeight: 'bold',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    margin: 0
  },
  scoreLabel: {
    fontSize: '14px',
    color: '#6b7280',
    marginTop: '5px'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '30px',
    marginBottom: '30px'
  },
  infoItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  infoLabel: {
    fontSize: '14px',
    color: '#6b7280',
    margin: 0
  },
  infoValue: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1f2937',
    margin: 0
  },
  section: {
    marginBottom: '30px',
    paddingTop: '30px',
    borderTop: '2px solid #e5e7eb'
  },
  sectionTitle: {
    fontSize: '24px',
    fontWeight: '600',
    marginBottom: '20px',
    color: '#1f2937'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '20px'
  },
  statBox: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    borderRadius: '12px',
    padding: '24px',
    textAlign: 'center' as const,
    color: 'white'
  },
  statValue: {
    fontSize: '32px',
    fontWeight: 'bold',
    marginBottom: '8px'
  },
  statLabel: {
    fontSize: '14px',
    opacity: 0.9
  },
  skillsContainer: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '10px'
  },
  skillTag: {
    background: '#e0e7ff',
    color: '#4338ca',
    padding: '8px 16px',
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: '600'
  },
  input: {
    width: '100%',
    padding: '12px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '14px',
    marginBottom: '15px',
    boxSizing: 'border-box' as const
  },
  imagePlaceholder: {
    background: '#f3f4f6',
    borderRadius: '12px',
    padding: '60px',
    textAlign: 'center' as const,
    color: '#6b7280',
    fontSize: '16px'
  },
  image: {
    width: '100%',
    borderRadius: '12px',
    border: '2px solid #e5e7eb'
  }
};

function StudentDetailPage({ student, onBack }: { student: Student; onBack: () => void }) {
  const [imageUrl, setImageUrl] = useState('');

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <button style={styles.backButton} onClick={onBack}>
          ← Back to Leaderboard
        </button>

        <div style={styles.detailCard}>
          <div style={styles.detailHeader}>
            <div>
              <h1 style={styles.studentName}>{student.name}</h1>
              <div style={styles.rankBadge}>
                {student.rank <= 3 && <span style={{ fontSize: '24px' }}>🏆</span>}
                <span>Rank #{student.rank}</span>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={styles.scoreDisplay}>{student.score}</div>
              <div style={styles.scoreLabel}>Total Score</div>
            </div>
          </div>

          <div style={styles.grid}>
            <div style={styles.infoItem}>
              <span style={{ fontSize: '24px' }}>📧</span>
              <div>
                <p style={styles.infoLabel}>Email</p>
                <p style={styles.infoValue}>{student.email}</p>
              </div>
            </div>

            <div style={styles.infoItem}>
              <span style={{ fontSize: '24px' }}>🏛️</span>
              <div>
                <p style={styles.infoLabel}>University</p>
                <p style={styles.infoValue}>{student.university}</p>
              </div>
            </div>
          </div>

          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Statistics</h2>
            <div style={styles.statsGrid}>
              <div style={styles.statBox}>
                <div style={styles.statValue}>{student.projects}</div>
                <div style={styles.statLabel}>Projects</div>
              </div>
              <div style={styles.statBox}>
                <div style={styles.statValue}>{student.skills.length}</div>
                <div style={styles.statLabel}>Skills</div>
              </div>
              <div style={styles.statBox}>
                <div style={styles.statValue}>{student.score}</div>
                <div style={styles.statLabel}>Score</div>
              </div>
            </div>
          </div>

          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Skills</h2>
            <div style={styles.skillsContainer}>
              {student.skills.map((skill, idx) => (
                <span key={idx} style={styles.skillTag}>
                  {skill}
                </span>
              ))}
            </div>
          </div>

          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Experience</h2>
            <p style={{ color: '#4b5563', fontSize: '16px', lineHeight: '1.6' }}>
              {student.experience}
            </p>
          </div>

          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Performance Graph</h2>
            <input
              type="text"
              placeholder="Paste image URL here (e.g., https://example.com/graph.png)"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              style={styles.input}
            />
            {imageUrl ? (
              <img 
                src={imageUrl} 
                alt="Performance Graph" 
                style={styles.image}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <div style={styles.imagePlaceholder}>
                Enter an image URL above to display graphs or charts
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function LeaderboardPage({ onStudentClick }: { onStudentClick: (student: Student) => void }) {
  const [currentPage, setCurrentPage] = useState(0);

  const startIdx = currentPage * STUDENTS_PER_PAGE;
  const paginatedStudents = fakeStudents.slice(startIdx, startIdx + STUDENTS_PER_PAGE);
  const totalPages = Math.ceil(fakeStudents.length / STUDENTS_PER_PAGE);

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.header}>
          <h1 style={styles.title}>Recruiter Hub</h1>
          <p style={styles.subtitle}>Click on any student to view their detailed profile</p>
        </div>

        <div style={styles.card}>
          <table style={styles.table}>
            <thead style={styles.thead}>
              <tr>
                <th style={styles.th}>Rank</th>
                <th style={styles.th}>Name</th>
                <th style={styles.th}>Score</th>
                <th style={styles.th}>University</th>
              </tr>
            </thead>
            <tbody>
              {paginatedStudents.map((student) => (
                <tr
                  key={student.id}
                  style={styles.tr}
                  onClick={() => onStudentClick(student)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f3f4f6';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <td style={styles.td}>
                    <div style={styles.rankCell}>
                      {student.rank <= 3 && (
                        <span style={{ fontSize: '20px' }}>
                          {student.rank === 1 ? '🥇' : student.rank === 2 ? '🥈' : '🥉'}
                        </span>
                      )}
                      <span>#{student.rank}</span>
                    </div>
                  </td>
                  <td style={{ ...styles.td, fontWeight: '600' }}>{student.name}</td>
                  <td style={styles.td}>
                    <span style={styles.scoreCell}>{student.score}</span>
                  </td>
                  <td style={styles.td}>{student.university}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={styles.pagination}>
            <button
              style={{
                ...styles.button,
                ...(currentPage === 0 ? styles.buttonDisabled : {})
              }}
              onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
              disabled={currentPage === 0}
              onMouseEnter={(e) => {
                if (currentPage !== 0) {
                  e.currentTarget.style.background = '#667eea';
                  e.currentTarget.style.color = 'white';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'white';
                e.currentTarget.style.color = '#667eea';
              }}
            >
              ← Previous
            </button>

            <span style={{ fontWeight: '600', color: '#4b5563' }}>
              Page {currentPage + 1} of {totalPages}
            </span>

            <button
              style={{
                ...styles.button,
                ...(currentPage === totalPages - 1 ? styles.buttonDisabled : {})
              }}
              onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={currentPage === totalPages - 1}
              onMouseEnter={(e) => {
                if (currentPage !== totalPages - 1) {
                  e.currentTarget.style.background = '#667eea';
                  e.currentTarget.style.color = 'white';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'white';
                e.currentTarget.style.color = '#667eea';
              }}
            >
              Next →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RecruiterDashboard() {
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  if (selectedStudent) {
    return (
      <StudentDetailPage 
        student={selectedStudent} 
        onBack={() => setSelectedStudent(null)} 
      />
    );
  }

  return <LeaderboardPage onStudentClick={setSelectedStudent} />;
}