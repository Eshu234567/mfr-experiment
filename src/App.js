import React, { useState, useEffect } from 'react';
import { Play, RotateCcw, Check, AlertCircle, Beaker, Table } from 'lucide-react';
import * as XLSX from 'xlsx';


/* ---------------- STYLES ---------------- */
const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #e0f2fe 0%, #ddd6fe 100%)',
    padding: '2rem',
    fontFamily: 'Segoe UI, sans-serif'
  },
  table: {
  width: '100%',
  borderCollapse: 'collapse',
  marginTop: '1rem'
},
th: {
  border: '1px solid #d1d5db',
  padding: '0.75rem',
  textAlign: 'center',
  fontWeight: '600',
  backgroundColor: '#f9fafb'
},
td: {
  border: '1px solid #d1d5db',
  padding: '0.75rem',
  textAlign: 'center'
},

  maxWidth: { maxWidth: '1200px', margin: '0 auto' },
  card: {
    background: 'white',
    borderRadius: '12px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    padding: '2rem',
    marginBottom: '1.5rem'
  },
  header: { display: 'flex', alignItems: 'center', gap: '1rem' },
  title: { fontSize: '2rem', fontWeight: 'bold', margin: 0 },
  subtitle: { color: '#6b7280', marginBottom: '1.5rem' },
  sectionTitle: { fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '1.5rem' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  label: { fontSize: '0.85rem', fontWeight: '500' },
  input: {
    padding: '0.75rem',
    borderRadius: '8px',
    border: '1px solid #d1d5db'
  },
  button: {
    padding: '0.75rem 1.5rem',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  },
  primary: { background: '#6366f1', color: 'white' },
  success: { background: '#10b981', color: 'white' },
  purple: { background: '#7c3aed', color: 'white' },
  danger: { background: '#fee2e2', color: '#991b1b' },
  errorBox: {
    marginTop: '1rem',
    padding: '1rem',
    background: '#fef2f2',
    borderRadius: '8px',
    display: 'flex',
    gap: '0.5rem'
  },
  resultBox: {
    background: '#f0fdf4',
    border: '1px solid #bbf7d0',
    padding: '1.5rem',
    borderRadius: '8px'
  }
};

/* ---------------- COMPONENT ---------------- */
export default function MFRExperiment() {
  /* ---------- LOGIN STATE ---------- */
const [role, setRole] = useState(null); // 'student' | 'teacher'
const [loginMode, setLoginMode] = useState(null); // null | 'student-login' | 'student-signup' | 'teacher'
const [usn, setUsn] = useState('');
const [studentName, setStudentName] = useState('');
const [studentPassword, setStudentPassword] = useState('');
const [teacherPassword, setTeacherPassword] = useState('');
const [authError, setAuthError] = useState('');

  const TEACHER_PASS = 'admin123';

  /* ---------- EXPERIMENT STATE ---------- */
  const [inputs, setInputs] = useState({ CA01:'', CB01:'', VR:'', va:'', vb:'' });
  const [dataChecked, setDataChecked] = useState(false);
  const [experimentRun, setExperimentRun] = useState(false);
  const [CA, setCA] = useState(null);
  const [userK, setUserK] = useState('');
  const [kRevealed, setKRevealed] = useState(false);
  const [hiddenK, setHiddenK] = useState(null);
  const [error, setError] = useState('');
  const [runs, setRuns] = useState([]);
  const [teacherRuns, setTeacherRuns] = useState([]);

  useEffect(() => {
  if (role === 'student' && usn) {
    fetch(`http://127.0.0.1:5000/api/runs/${usn}`)
      .then(res => res.json())
      .then(data => {
        if (data.runs) {
          setRuns(
            data.runs.map(r => ({
              CA01: r.CA01,
              CB01: r.CB01,
              VR: r.VR,
              va: r.va,
              vb: r.vb,
              CA: r.CA,
              student_k: r.student_k,
              actual_k: r.actual_k,
              created_at: r.created_at
            }))
          );
        }
      })
      .catch(err => {
        console.error('❌ Failed to load previous runs', err);
      });
  }
}, [role, usn]);
useEffect(() => {
  if (role === 'teacher') {
    fetch('http://127.0.0.1:5000/api/all-runs')
      .then(res => res.json())
      .then(data => {
        if (data.runs) {
          setTeacherRuns(data.runs);
        }
      })
      .catch(err => {
        console.error('❌ Failed to load teacher runs', err);
      });
  }
}, [role]);

  const handleStudentSignup = async () => {
  setAuthError('');

  if (!usn || !studentName || !studentPassword) {
    setAuthError('All fields are required');
    return;
  }

  try {
    const res = await fetch('http://127.0.0.1:5000/api/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        usn,
        name: studentName,
        password: studentPassword
      })
    });

    const data = await res.json();

    if (!res.ok) {
      setAuthError(data.error || 'Signup failed');
      return;
    }
    


    // auto-login after signup
    setRole('student');
  } catch (e) {
    setAuthError('Could not connect to backend');
  }
};
const handleStudentLogin = async () => {
  setAuthError('');

  if (!usn || !studentPassword) {
    setAuthError('USN and password required');
    return;
  }

  try {
    const res = await fetch('http://127.0.0.1:5000/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        usn,
        password: studentPassword
      })
    });

    const data = await res.json();

    if (!res.ok) {
      setAuthError(data.error || 'Login failed');
      return;
    }

    // login success
   setStudentName(data.user.name);
   setUsn(data.user.usn);   // keep USN globally
   setRole('student');

  } catch (e) {
    setAuthError('Could not connect to backend');
  }
};

  /* ---------- LOGIN PAGE ---------- */
  if (!role) {
    return (
      <div style={styles.container}>
        <div style={{ ...styles.card, maxWidth: '420px', margin: '5rem auto' }}>
          <h2 style={styles.sectionTitle}>Login</h2>

          {!loginMode && (
            <>
            <button
              style={{...styles.button, ...styles.primary, width:'100%'}}
              onClick={() => setLoginMode('student-login')}>
              Login as Student
           </button>


              <button style={{...styles.button, ...styles.purple, width:'100%', marginTop:'0.75rem'}}
                onClick={() => setLoginMode('teacher')}>
                Login as Teacher
              </button>
            </>
          )}

          {loginMode === 'student-login' && (
  <>
    <input
      style={{ ...styles.input, marginTop: '1rem' }}
      placeholder="Enter USN"
      value={usn}
      onChange={e => setUsn(e.target.value)}
    />

    <input
      type="password"
      style={{ ...styles.input, marginTop: '0.75rem' }}
      placeholder="Enter password"
      value={studentPassword}
      onChange={e => setStudentPassword(e.target.value)}
    />

    {authError && <p style={{ color: 'red', marginTop: '0.5rem' }}>{authError}</p>}

    <button
      style={{ ...styles.button, ...styles.primary, width: '100%', marginTop: '1rem' }}
      onClick={handleStudentLogin}
    >
      Student Login
    </button>

    <button
      style={{ ...styles.button, width: '100%', marginTop: '0.5rem' }}
      onClick={() => setLoginMode('student-signup')}
    >
      New user? Sign up
    </button>

    <button
      style={{ ...styles.button, marginTop: '0.5rem' }}
      onClick={() => setLoginMode(null)}
    >
      ← Back
    </button>
  </>
)}
{loginMode === 'student-signup' && (
  <>
    <input
      style={{ ...styles.input, marginTop: '1rem' }}
      placeholder="Enter USN"
      value={usn}
      onChange={e => setUsn(e.target.value)}
    />

    <input
      style={{ ...styles.input, marginTop: '0.75rem' }}
      placeholder="Enter Name"
      value={studentName}
      onChange={e => setStudentName(e.target.value)}
    />

    <input
      type="password"
      style={{ ...styles.input, marginTop: '0.75rem' }}
      placeholder="Create password"
      value={studentPassword}
      onChange={e => setStudentPassword(e.target.value)}
    />

    {authError && <p style={{ color: 'red', marginTop: '0.5rem' }}>{authError}</p>}

    <button
      style={{ ...styles.button, ...styles.primary, width: '100%', marginTop: '1rem' }}
      onClick={handleStudentSignup}
    >
      Sign Up
    </button>

    <button
      style={{ ...styles.button, marginTop: '0.5rem' }}
      onClick={() => setLoginMode('student-login')}
    >
      ← Back to Login
    </button>
  </>
)}


          {loginMode === 'teacher' && (
            <>
              <input
                type="password"
                style={{...styles.input, marginTop:'1rem'}}
                placeholder="Teacher password"
                value={teacherPassword}
                onChange={e => setTeacherPassword(e.target.value)}
              />
              <button
                style={{...styles.button, ...styles.purple, width:'100%', marginTop:'1rem'}}
                onClick={() => {
                  if (teacherPassword === TEACHER_PASS) setRole('teacher');
                  else alert('Incorrect password');
                }}>
                Teacher Login
              </button>
              <button style={{...styles.button, marginTop:'0.5rem'}}
                onClick={() => setLoginMode(null)}>
                ← Back
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  /* ---------- HELPERS ---------- */
  const validateInputs = () =>
    Object.values(inputs).every(v => v !== '' && !isNaN(v) && parseFloat(v) > 0);

  const handleCheckData = () => {
    if (!validateInputs()) {
      setError('All values must be positive numbers');
      return;
    }
    setError('');
    setDataChecked(true);
  };

const handleRunExperiment = async () => {
  try {
    const res = await fetch('http://127.0.0.1:5000/api/run-experiment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(inputs)
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    const newRun = {
      usn,
      CA01: parseFloat(inputs.CA01),
      CB01: parseFloat(inputs.CB01),
      VR: parseFloat(inputs.VR),
      va: parseFloat(inputs.va),
      vb: parseFloat(inputs.vb),
      CA: data.CA,
      student_k: userK ? parseFloat(userK) : null,
      actual_k: data.actual_k ?? null
    };

    // save to DB
    await fetch('http://127.0.0.1:5000/api/save-run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newRun)
    });

    setCA(data.CA);
    setHiddenK(data.actual_k ?? null);
    setExperimentRun(true);

    // append locally
    setRuns(prev => [...prev, newRun]);

  } catch (err) {
    console.error(err);
    setError('Experiment failed');
  }
};
// ---------- STUDENT EXCEL ----------
const downloadStudentExcel = () => {
  if (runs.length === 0) {
    alert('No runs to download');
    return;
  }

  const data = runs.map((r, i) => ({
    Run: i + 1,
    CA01: r.CA01,
    CB01: r.CB01,
    VR: r.VR,
    va: r.va,
    vb: r.vb,
    CA: r.CA,
    Student_k: r.student_k ?? '',
    Actual_k: r.actual_k ?? '',
    DateTime: r.created_at
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'My Runs');

  XLSX.writeFile(workbook, `${usn}_MFR_Runs.xlsx`);
};


// ---------- TEACHER EXCEL ----------
const downloadTeacherExcel = () => {
  if (teacherRuns.length === 0) {
    alert('No data to download');
    return;
  }

  // group by USN
  const grouped = {};
  teacherRuns.forEach(r => {
    if (!grouped[r.usn]) grouped[r.usn] = [];
    grouped[r.usn].push(r);
  });

  const workbook = XLSX.utils.book_new();

  Object.keys(grouped).forEach(usnKey => {
    const rows = grouped[usnKey];

    const data = rows.map((r, i) => ({
      Run: i + 1,
      Name: r.name,
      CA01: r.CA01,
      CB01: r.CB01,
      VR: r.VR,
      va: r.va,
      vb: r.vb,
      CA: r.CA,
      Student_k: r.student_k ?? '',
      Actual_k: r.actual_k ?? '',
      DateTime: r.created_at
    }));

    const sheet = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(
      workbook,
      sheet,
      usnKey.slice(0, 31)
    );
  });

  XLSX.writeFile(workbook, `All_Students_MFR_Runs.xlsx`);
};




  const handleReset = () => {
    setInputs({ CA01:'', CB01:'', VR:'', va:'', vb:'' });
    setDataChecked(false);
    setExperimentRun(false);
    setCA(null);
    setUserK('');
    setKRevealed(false);
    setError('');
  };

  /* ---------- MAIN UI ---------- */
  /* ---------- MAIN UI ---------- */
if (role === 'teacher') {
  return (
    <div style={styles.container}>
      <div style={styles.maxWidth}>
        <div style={styles.card}>
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
    <div>
      <h2 style={styles.sectionTitle}>Teacher Dashboard</h2>
      <p>All student experiment runs</p>
    </div>

    <button
      style={{ ...styles.button, ...styles.primary }}
      onClick={downloadTeacherExcel}
    >
      Download Excel (All Students)
    </button>
  </div>
</div>


        <div style={styles.card}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>USN</th>
                <th style={styles.th}>Name</th>
                <th style={styles.th}>CA01</th>
                <th style={styles.th}>CB01</th>
                <th style={styles.th}>VR</th>
                <th style={styles.th}>va</th>
                <th style={styles.th}>vb</th>
                <th style={styles.th}>CA</th>
                <th style={styles.th}>Student k</th>
                <th style={styles.th}>Actual k</th>
                <th style={styles.th}>Date/Time</th>
              </tr>
            </thead>

            <tbody>
              {teacherRuns.map((r, idx) => (
                <tr key={idx}>
                  <td style={styles.td}>{r.usn}</td>
                  <td style={styles.td}>{r.name}</td>
                  <td style={styles.td}>{Number(r.CA01).toFixed(3)}</td>
                  <td style={styles.td}>{Number(r.CB01).toFixed(3)}</td>
                  <td style={styles.td}>{Number(r.VR).toFixed(3)}</td>
                  <td style={styles.td}>{Number(r.va).toFixed(3)}</td>
                  <td style={styles.td}>{Number(r.vb).toFixed(3)}</td>
                  <td style={styles.td}>{Number(r.CA).toFixed(4)}</td>
                  <td style={styles.td}>
                    {r.student_k != null ? Number(r.student_k).toFixed(4) : '-'}
                  </td>
                  <td style={styles.td}>
                    {r.actual_k != null ? Number(r.actual_k).toFixed(4) : '-'}
                  </td>
                  <td style={styles.td}>
                    {new Date(r.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

  return (
    <div style={styles.container}>
      <div style={styles.maxWidth}>
        <div style={styles.card}>
          <div style={styles.header}>
            <Beaker size={32} color="#6366f1"/>
            <h1 style={styles.title}>Mixed Flow Reactor</h1>
          </div>
          <p style={styles.subtitle}>Steady State Virtual Experiment</p>
        </div>

        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>Input Parameters</h2>

          <div style={styles.grid}>
            {['CA01','CB01','VR','va','vb'].map(key => (
              <div key={key} style={styles.inputGroup}>
                <label style={styles.label}>{key}</label>
                <input
                  style={styles.input}
                  value={inputs[key]}
                  onChange={e => {
                    setInputs({...inputs,[key]:e.target.value});
                    setDataChecked(false);
                    setExperimentRun(false);
                    setCA(null);
                  }}
                />
              </div>
            ))}
          </div>

          {error && (
            <div style={styles.errorBox}>
              <AlertCircle size={18}/>
              <p>{error}</p>
            </div>
          )}

          <div style={{marginTop:'1rem'}}>
            <button style={{...styles.button, ...styles.primary}}
              onClick={handleCheckData}>
              <Check size={18}/> Check Data
            </button>
          </div>

          {dataChecked && !experimentRun && (
            <div style={{marginTop:'1rem'}}>
              <button style={{...styles.button, ...styles.success}}
                onClick={handleRunExperiment}>
                <Play size={18}/> Run Experiment
              </button>
            </div>
          )}
          {runs.length > 0 && (
  <div style={styles.card}>
   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
  <h2 style={styles.sectionTitle}>Experimental Data</h2>

  <div>
    <button
      style={{ ...styles.button, ...styles.primary, marginRight: '0.5rem' }}
      onClick={downloadStudentExcel}
    >
      Download Excel
    </button>

    <button
      style={{ ...styles.button, ...styles.danger }}
      onClick={async () => {
        if (!usn) return;

        const ok = window.confirm('Are you sure you want to delete all your runs?');
        if (!ok) return;

        try {
          await fetch(`http://127.0.0.1:5000/api/runs/${usn}`, {
            method: 'DELETE'
          });

          setRuns([]);
        } catch (err) {
          alert('Failed to clear table');
        }
      }}
    >
      Clear Table
    </button>
  </div>
</div>


    <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
     <table style={styles.table}>
  <thead>
    <tr>
      <th style={styles.th}>Run</th>
      <th style={styles.th}>CA01</th>
      <th style={styles.th}>CB01</th>
      <th style={styles.th}>VR</th>
      <th style={styles.th}>va</th>
      <th style={styles.th}>vb</th>
      <th style={styles.th}>CA</th>
    </tr>
  </thead>

  <tbody>
    {runs.map((run, idx) => (
      <tr key={idx}>
        <td style={styles.td}>{idx + 1}</td>
        <td style={styles.td}>{parseFloat(run.CA01).toFixed(3)}</td>
        <td style={styles.td}>{parseFloat(run.CB01).toFixed(3)}</td>
        <td style={styles.td}>{parseFloat(run.VR).toFixed(3)}</td>
        <td style={styles.td}>{parseFloat(run.va).toFixed(3)}</td>
        <td style={styles.td}>{parseFloat(run.vb).toFixed(3)}</td>
        <td style={{ ...styles.td, fontWeight: '600' }}>
          {run.CA.toFixed(4)}
        </td>
      </tr>
    ))}
  </tbody>
</table>

    </div>
  </div>
)}

        </div>

        {experimentRun && (
          <div style={styles.card}>
            <h2 style={styles.sectionTitle}>Results</h2>
            <div style={styles.resultBox}>
              <p>CA = <strong>{CA.toFixed(4)}</strong> mol/lt</p>
            </div>

            <input
              style={{...styles.input, marginTop:'1rem'}}
              placeholder="Enter your calculated k"
              value={userK}
              onChange={e => setUserK(e.target.value)}
            />

           {userK && (
  <button
    style={{ ...styles.button, ...styles.primary, marginTop: '1rem' }}
    onClick={async () => {
      try {
        // update last run with student k
        await fetch('http://127.0.0.1:5000/api/update-student-k', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            usn,
            student_k: parseFloat(userK)
          })
        });

        // update local table last row
        setRuns(prev => {
          const copy = [...prev];
          copy[copy.length - 1] = {
            ...copy[copy.length - 1],
            student_k: parseFloat(userK)
          };
          return copy;
        });

        setKRevealed(true);
      } catch (err) {
        alert('Failed to save k value');
      }
    }}
  >
    Submit k value
  </button>
)}


            {kRevealed && role === 'teacher' && (
              <p style={{marginTop:'1rem'}}>
                <strong>Actual k:</strong> {hiddenK}
              </p>
            )}

            <button style={{...styles.button, ...styles.purple, marginTop:'1rem'}}
              onClick={handleReset}>
              <RotateCcw size={18}/> Reset / Change
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
