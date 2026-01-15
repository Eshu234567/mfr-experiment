import React, { useState } from 'react';
import { Play, RotateCcw, Check, AlertCircle, Beaker, Table } from 'lucide-react';

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #e0f2fe 0%, #ddd6fe 100%)',
    padding: '2rem',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  maxWidth: {
    maxWidth: '1200px',
    margin: '0 auto'
  },
  card: {
    background: 'white',
    borderRadius: '12px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    padding: '2rem',
    marginBottom: '1.5rem'
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    marginBottom: '0.5rem'
  },
  title: {
    fontSize: '2rem',
    fontWeight: 'bold',
    color: '#1f2937',
    margin: 0
  },
  subtitle: {
    color: '#6b7280',
    margin: 0
  },
  sectionTitle: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '1.5rem'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '1.5rem'
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem'
  },
  label: {
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#374151'
  },
  input: {
    width: '100%',
    padding: '0.75rem 1rem',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '1rem',
    transition: 'all 0.2s',
    boxSizing: 'border-box'
  },
  inputFocus: {
    outline: 'none',
    borderColor: '#6366f1',
    boxShadow: '0 0 0 3px rgba(99, 102, 241, 0.1)'
  },
  button: {
    padding: '0.75rem 1.5rem',
    borderRadius: '8px',
    fontWeight: '500',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    transition: 'all 0.2s',
    fontSize: '1rem'
  },
  buttonPrimary: {
    background: '#6366f1',
    color: 'white'
  },
  buttonSuccess: {
    background: '#10b981',
    color: 'white'
  },
  buttonPurple: {
    background: '#7c3aed',
    color: 'white'
  },
  buttonDanger: {
    background: '#fee2e2',
    color: '#991b1b'
  },
  errorBox: {
    marginTop: '1rem',
    padding: '1rem',
    background: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.5rem'
  },
  errorText: {
    color: '#991b1b',
    margin: 0
  },
  resultBox: {
    background: '#f0fdf4',
    border: '1px solid #bbf7d0',
    borderRadius: '8px',
    padding: '1.5rem',
    marginBottom: '1.5rem'
  },
  resultLabel: {
    fontSize: '0.875rem',
    color: '#6b7280',
    marginBottom: '0.5rem'
  },
  resultValue: {
    fontSize: '2rem',
    fontWeight: 'bold',
    color: '#15803d',
    margin: 0
  },
  kCompareBox: {
    background: '#eff6ff',
    border: '1px solid #bfdbfe',
    borderRadius: '8px',
    padding: '1.5rem'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse'
  },
  th: {
    padding: '0.75rem 1rem',
    textAlign: 'left',
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#374151',
    background: '#f9fafb',
    borderBottom: '2px solid #e5e7eb'
  },
  td: {
    padding: '0.75rem 1rem',
    fontSize: '0.875rem',
    color: '#1f2937',
    borderBottom: '1px solid #e5e7eb'
  },
  trHover: {
    background: '#f9fafb'
  },
  flexBetween: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem'
  },
  flexAlign: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  }
};

export default function MFRExperiment() {
  const [inputs, setInputs] = useState({
    CA01: '',
    CB01: '',
    VR: '',
    va: '',
    vb: ''
  });
  
  const [dataChecked, setDataChecked] = useState(false);
  const [experimentRun, setExperimentRun] = useState(false);
  const [hiddenK, setHiddenK] = useState(null);
  const [CA, setCA] = useState(null);
  const [userK, setUserK] = useState('');
  const [kRevealed, setKRevealed] = useState(false);
  const [error, setError] = useState('');
  const [runs, setRuns] = useState([]);
  const [hoveredRow, setHoveredRow] = useState(null);

  const validateInputs = () => {
    const vals = Object.values(inputs);
    return vals.every(v => v !== '' && !isNaN(v) && parseFloat(v) > 0);
  };

  const handleCheckData = () => {
    setError('');
    
    if (!validateInputs()) {
      setError('All values must be positive numbers');
      return;
    }

    const CA0_prime = parseFloat(inputs.CA01);
    const CB0_prime = parseFloat(inputs.CB01);
    const va = parseFloat(inputs.va);
    const vb = parseFloat(inputs.vb);

    const CA0 = (CA0_prime * va) / (va + vb);
    const CB0 = (CB0_prime * vb) / (va + vb);

    const ratio = CB0 / CA0;

    if (ratio < 1) {
      setError('Inconsistent data, A is not a limiting reactant');
      setDataChecked(false);
      return;
    }

    setDataChecked(true);
    setError('');
  };

  const solveForXA = (k, CA0, m, T) => {
    let XA = 0.5;
    const tolerance = 1e-6;
    const maxIterations = 100;

    for (let i = 0; i < maxIterations; i++) {
      const f = k * CA0 * T - XA / ((1 - XA) * (m - XA));
      const df = -1 / ((1 - XA) * (m - XA)) - XA * (-(m - XA) - (1 - XA) * (-1)) / Math.pow((1 - XA) * (m - XA), 2);
      
      const XA_new = XA - f / df;
      
      if (Math.abs(XA_new - XA) < tolerance) {
        return XA_new;
      }
      
      XA = XA_new;
      
      if (XA < 0) XA = 0.01;
      if (XA > 0.99) XA = 0.99;
    }
    
    return XA;
  };

  const handleRunExperiment = () => {
    const k = Math.random() * (0.5 - 0.25) + 0.25;
    setHiddenK(k);

    const CA0_prime = parseFloat(inputs.CA01);
    const CB0_prime = parseFloat(inputs.CB01);
    const VR = parseFloat(inputs.VR);
    const va = parseFloat(inputs.va);
    const vb = parseFloat(inputs.vb);

    const vT = va + vb;
    const CA0 = (CA0_prime * va) / vT;
    const CB0 = (CB0_prime * vb) / vT;
    const m = CB0 / CA0;
    const T = VR / vT;

    const XA = solveForXA(k, CA0, m, T);
    const calculatedCA = CA0 * (1 - XA);

    setCA(calculatedCA);
    setExperimentRun(true);

    setRuns([...runs, {
      runNo: runs.length + 1,
      CA01: CA0_prime,
      CB01: CB0_prime,
      VR: VR,
      va: va,
      vb: vb,
      CA: calculatedCA
    }]);
  };

  const handleCheckK = () => {
    setKRevealed(true);
  };

  const handleReset = () => {
    setInputs({
      CA01: '',
      CB01: '',
      VR: '',
      va: '',
      vb: ''
    });
    setDataChecked(false);
    setExperimentRun(false);
    setHiddenK(null);
    setCA(null);
    setUserK('');
    setKRevealed(false);
    setError('');
  };

  const handleClearTable = () => {
    setRuns([]);
  };

  return (
    <div style={styles.container}>
      <div style={styles.maxWidth}>
        <div style={styles.card}>
          <div style={styles.header}>
            <Beaker size={32} color="#6366f1" />
            <h1 style={styles.title}>Mixed Flow Reactor</h1>
          </div>
          <p style={styles.subtitle}>Steady State Virtual Experiment</p>
        </div>

        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>Input Parameters</h2>
          
          <div style={styles.grid}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>CA01 (mol/lt)</label>
              <input
                type="number"
                step="any"
                value={inputs.CA01}
                onChange={(e) => setInputs({...inputs, CA01: e.target.value})}
                style={styles.input}
                placeholder="Concentration of A in feed"
                disabled={experimentRun}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>CB01 (mol/lt)</label>
              <input
                type="number"
                step="any"
                value={inputs.CB01}
                onChange={(e) => setInputs({...inputs, CB01: e.target.value})}
                style={styles.input}
                placeholder="Concentration of B in feed"
                disabled={experimentRun}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>VR (m³)</label>
              <input
                type="number"
                step="any"
                value={inputs.VR}
                onChange={(e) => setInputs({...inputs, VR: e.target.value})}
                style={styles.input}
                placeholder="Volume of reactor"
                disabled={experimentRun}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>va (lt/min)</label>
              <input
                type="number"
                step="any"
                value={inputs.va}
                onChange={(e) => setInputs({...inputs, va: e.target.value})}
                style={styles.input}
                placeholder="Volumetric flow rate of A"
                disabled={experimentRun}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>vb (lt/min)</label>
              <input
                type="number"
                step="any"
                value={inputs.vb}
                onChange={(e) => setInputs({...inputs, vb: e.target.value})}
                style={styles.input}
                placeholder="Volumetric flow rate of B"
                disabled={experimentRun}
              />
            </div>
          </div>

          {error && (
            <div style={styles.errorBox}>
              <AlertCircle size={20} color="#991b1b" />
              <p style={styles.errorText}>{error}</p>
            </div>
          )}

          <div style={{marginTop: '1.5rem'}}>
            <button
              onClick={handleCheckData}
              disabled={experimentRun}
              style={{
                ...styles.button,
                ...styles.buttonPrimary,
                opacity: experimentRun ? 0.5 : 1,
                cursor: experimentRun ? 'not-allowed' : 'pointer'
              }}
              onMouseOver={(e) => !experimentRun && (e.currentTarget.style.background = '#4f46e5')}
              onMouseOut={(e) => !experimentRun && (e.currentTarget.style.background = '#6366f1')}
            >
              <Check size={20} />
              Check Data
            </button>
          </div>

          {dataChecked && !experimentRun && (
            <div style={{marginTop: '1rem'}}>
              <button
                onClick={handleRunExperiment}
                style={{...styles.button, ...styles.buttonSuccess}}
                onMouseOver={(e) => e.currentTarget.style.background = '#059669'}
                onMouseOut={(e) => e.currentTarget.style.background = '#10b981'}
              >
                <Play size={20} />
                Run the Experiment
              </button>
            </div>
          )}
        </div>

        {experimentRun && (
          <div style={styles.card}>
            <h2 style={styles.sectionTitle}>Results</h2>
            
            <div style={styles.resultBox}>
              <p style={styles.resultLabel}>Concentration of A at exit:</p>
              <p style={styles.resultValue}>CA = {CA?.toFixed(4)} mol/lt</p>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Enter your calculated k value (lt/mol·min)</label>
              <input
                type="number"
                step="any"
                value={userK}
                onChange={(e) => setUserK(e.target.value)}
                style={styles.input}
                placeholder="Your calculated k value"
                disabled={kRevealed}
              />
            </div>

            {!kRevealed && userK && (
              <button
                onClick={handleCheckK}
                style={{...styles.button, ...styles.buttonPrimary, marginTop: '1rem'}}
                onMouseOver={(e) => e.currentTarget.style.background = '#4f46e5'}
                onMouseOut={(e) => e.currentTarget.style.background = '#6366f1'}
              >
                <Check size={20} />
                Check k Value
              </button>
            )}

            {kRevealed && (
              <div style={{...styles.kCompareBox, marginTop: '1rem'}}>
                <p style={styles.resultLabel}>Actual k value:</p>
                <p style={{fontSize: '1.5rem', fontWeight: 'bold', color: '#1e40af', margin: '0.5rem 0'}}>
                  k = {hiddenK?.toFixed(4)} lt/mol·min
                </p>
                <p style={{...styles.resultLabel, marginTop: '1rem'}}>Your k value:</p>
                <p style={{fontSize: '1.25rem', fontWeight: '600', color: '#1f2937', margin: '0.5rem 0'}}>
                  k = {parseFloat(userK).toFixed(4)} lt/mol·min
                </p>
                {Math.abs(parseFloat(userK) - hiddenK) < 0.01 ? (
                  <p style={{color: '#15803d', fontWeight: '500', marginTop: '1rem'}}>
                    ✓ Excellent! Your calculation is accurate.
                  </p>
                ) : (
                  <p style={{color: '#ea580c', fontWeight: '500', marginTop: '1rem'}}>
                    Error: {Math.abs(((parseFloat(userK) - hiddenK) / hiddenK * 100)).toFixed(2)}%
                  </p>
                )}
              </div>
            )}

            {kRevealed && (
              <div style={{marginTop: '1.5rem'}}>
                <button
                  onClick={handleReset}
                  style={{...styles.button, ...styles.buttonPurple}}
                  onMouseOver={(e) => e.currentTarget.style.background = '#6d28d9'}
                  onMouseOut={(e) => e.currentTarget.style.background = '#7c3aed'}
                >
                  <RotateCcw size={20} />
                  Reset / Change
                </button>
              </div>
            )}
          </div>
        )}

        {runs.length > 0 && (
          <div style={styles.card}>
            <div style={styles.flexBetween}>
              <div style={styles.flexAlign}>
                <Table size={24} color="#6366f1" />
                <h2 style={{...styles.sectionTitle, marginBottom: 0}}>Experimental Data</h2>
              </div>
              <button
                onClick={handleClearTable}
                style={{...styles.button, ...styles.buttonDanger}}
                onMouseOver={(e) => e.currentTarget.style.background = '#fecaca'}
                onMouseOut={(e) => e.currentTarget.style.background = '#fee2e2'}
              >
                Clear Table
              </button>
            </div>
            
            <div style={{overflowX: 'auto', marginTop: '1rem'}}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Run No.</th>
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
                    <tr 
                      key={idx}
                      style={hoveredRow === idx ? styles.trHover : {}}
                      onMouseEnter={() => setHoveredRow(idx)}
                      onMouseLeave={() => setHoveredRow(null)}
                    >
                      <td style={styles.td}>{run.runNo}</td>
                      <td style={styles.td}>{run.CA01.toFixed(3)}</td>
                      <td style={styles.td}>{run.CB01.toFixed(3)}</td>
                      <td style={styles.td}>{run.VR.toFixed(3)}</td>
                      <td style={styles.td}>{run.va.toFixed(3)}</td>
                      <td style={styles.td}>{run.vb.toFixed(3)}</td>
                      <td style={{...styles.td, fontWeight: '600'}}>{run.CA.toFixed(4)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}