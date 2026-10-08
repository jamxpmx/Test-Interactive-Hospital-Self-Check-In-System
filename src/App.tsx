import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { Link, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import {
  Accessibility, ArrowLeft, ArrowRight, Check, CheckCircle2, Clock3, Download,
  HeartPulse, HelpCircle, MapPin, RotateCcw, ShieldCheck, Sparkles, X,
} from 'lucide-react'
import { patients, readResearchEntries, RESEARCH_STORAGE_KEY, type Patient, type ResearchEntry } from './data'
import { copy, type Locale, type TranslationKey } from './i18n'

type Mode = 'standard' | 'accessible'
type Method = 'patient' | 'quick'
type Draft = { participantId: string; mode: Mode; startedAt: number; navigationErrors: number; assistanceRequests: number }

export default function App() {
  const [locale, setLocale] = useState<Locale>('en')
  const [mode, setMode] = useState<Mode>('accessible')
  const [method, setMethod] = useState<Method>('patient')
  const [patient, setPatient] = useState<Patient | null>(null)
  const [patientId, setPatientId] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [detailsConfirmed, setDetailsConfirmed] = useState(false)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [entries, setEntries] = useState<ResearchEntry[]>(readResearchEntries)
  const [modal, setModal] = useState<'help' | 'research' | null>(null)
  const navigate = useNavigate()
  const location = useLocation()
  const t = (key: TranslationKey, values: Record<string, string | number> = {}) =>
    Object.entries(values).reduce((text, [name, value]) => text.replace(`{${name}}`, String(value)), copy[locale][key] as string)

  useEffect(() => {
    document.documentElement.lang = locale
    document.title = locale === 'en' ? 'PatientConnect | Research Simulation' : 'PatientConnect | Simulación de investigación'
  }, [locale])

  const changeMode = (nextMode: Mode) => {
    setMode(nextMode)
    setDraft((current) => current ? { ...current, mode: nextMode } : current)
  }

  const ensureDraft = () => {
    if (draft) return draft
    const created: Draft = {
      participantId: `PC-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      mode, startedAt: Date.now(), navigationErrors: 0, assistanceRequests: 0,
    }
    setDraft(created)
    return created
  }

  const saveResult = (completed: boolean) => {
    if (!draft) return
    const result: ResearchEntry = {
      participantId: draft.participantId,
      mode: draft.mode,
      completionSeconds: Math.max(1, Math.round((Date.now() - draft.startedAt) / 1000)),
      navigationErrors: draft.navigationErrors,
      assistanceRequests: draft.assistanceRequests,
      completed,
      recordedAt: new Date().toISOString(),
    }
    const nextEntries = [...readResearchEntries(), result]
    localStorage.setItem(RESEARCH_STORAGE_KEY, JSON.stringify(nextEntries))
    setEntries(nextEntries)
    setDraft(null)
  }

  const requestHelp = () => {
    const current = ensureDraft()
    setDraft({ ...current, assistanceRequests: current.assistanceRequests + 1 })
    setModal('help')
  }

  const selectDemo = (selected: Patient) => {
    setPatientId(selected.id)
    setDateOfBirth(selected.dateOfBirth)
    setCode(selected.appointmentCode)
    setError('')
  }

  const handleLogin = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const current = ensureDraft()
    const found = method === 'patient'
      ? patients.find((item) => item.id.toLowerCase() === patientId.trim().toLowerCase() && item.dateOfBirth === dateOfBirth)
      : patients.find((item) => item.appointmentCode === code)
    if (!found) {
      setDraft({ ...current, navigationErrors: current.navigationErrors + 1 })
      setError('loginError')
      return
    }
    setPatient(found)
    setError('')
    setDetailsConfirmed(false)
    navigate('/welcome')
  }

  const restart = () => {
    saveResult(false)
    setPatient(null)
    setPatientId('')
    setDateOfBirth('')
    setCode('')
    setError('')
    setDetailsConfirmed(false)
    setModal(null)
    navigate('/')
  }

  const finishCheckin = () => {
    saveResult(true)
    navigate('/complete')
  }

  const exportCsv = () => {
    const columns = ['participant_id', 'interface_mode', 'completion_seconds', 'navigation_errors', 'assistance_requests', 'completed', 'recorded_at']
    const quote = (value: string | number | boolean) => `"${String(value).replaceAll('"', '""')}"`
    const rows = entries.map((entry) => [entry.participantId, entry.mode, entry.completionSeconds, entry.navigationErrors, entry.assistanceRequests, entry.completed, entry.recordedAt].map(quote).join(','))
    const blob = new Blob([[columns.map(quote).join(','), ...rows].join('\n')], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'patientconnect-research-data.csv'
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const clearResearch = () => {
    if (!window.confirm(t('clearConfirm'))) return
    localStorage.removeItem(RESEARCH_STORAGE_KEY)
    setEntries([])
  }

  const routes = ['/', '/welcome', '/verify', '/confirm', '/complete']
  const steps = [t('stepWelcome'), t('stepVerify'), t('stepConfirm'), t('stepComplete')]
  const stepIndex = Math.max(0, routes.indexOf(location.pathname) - 1)
  const protectedPage = (children: ReactNode) => patient ? children : <Navigate to="/" replace />

  return (
    <div className={`app-shell ${mode === 'accessible' ? 'access-mode' : ''}`}>
      <header className="topbar">
        <Link className="brand" to="/" onClick={(event) => { event.preventDefault(); restart() }} aria-label={t('home')}>
          <span className="brand-mark"><HeartPulse size={22} strokeWidth={2.5} /></span>
          <span className="brand-name">Patient<span>Connect</span></span>
        </Link>
        <div className="study-label"><span className="live-dot" />{t('researchLabel')}</div>
        <div className="header-controls">
          <label className="language-select"><span className="sr-only">{t('language')}</span><select value={locale} onChange={(event) => setLocale(event.target.value as Locale)}><option value="en">{t('languageEnglish')}</option><option value="es">{t('languageSpanish')}</option></select></label>
          <button className="mode-toggle" onClick={() => changeMode(mode === 'accessible' ? 'standard' : 'accessible')} aria-pressed={mode === 'accessible'} title={mode === 'accessible' ? t('standardMode') : t('accessibleMode')}><Accessibility size={18} /><span>{mode === 'accessible' ? t('accessible') : t('enableAccess')}</span></button>
          <button className="help-button" onClick={requestHelp}><HelpCircle size={19} /><span>{t('help')}</span></button>
        </div>
      </header>

      <main id="main" className="main-layout" aria-label={t('mainContent')}>
        <aside className="welcome-rail">
          <div className="rail-orbit orbit-one" />
          <div className="rail-orbit orbit-two" />
          <div className="rail-content">
            <span className="rail-eyebrow">{t('simulation')}</span>
            <h1>{t('brandLine')}</h1>
            <p>{t('fakeData')}</p>
            <div className="rail-note"><ShieldCheck size={18} /><span>{t('secureNotice')}</span></div>
          </div>
          <div className="rail-footer"><span className="rail-footer-line" />{t('researchLabel')}</div>
        </aside>

        <section className="workspace" aria-live="polite">
          {location.pathname !== '/' && <nav className="workflow-breadcrumbs" aria-label={t('steps')}>
            <ol>
              <li><button className="breadcrumb-link" onClick={restart}>{t('restart')}</button></li>
              {steps.slice(0, stepIndex + 1).map((step, index) => <li key={step}>
                {index < stepIndex
                  ? <Link className="breadcrumb-link" to={routes[index + 1]}>{step}</Link>
                  : <span className="breadcrumb-current" aria-current="page">{step}</span>}
              </li>)}
            </ol>
          </nav>}
          <Routes>
            <Route path="/" element={<LoginPage t={t} method={method} setMethod={(value) => { setMethod(value); setError('') }} onSubmit={handleLogin} patientId={patientId} setPatientId={setPatientId} dateOfBirth={dateOfBirth} setDateOfBirth={setDateOfBirth} code={code} setCode={setCode} error={error} selectDemo={selectDemo} />} />
            <Route path="/welcome" element={protectedPage(<WelcomePage t={t} locale={locale} patient={patient} onContinue={() => navigate('/verify')} />)} />
            <Route path="/verify" element={protectedPage(<VerifyPage t={t} locale={locale} patient={patient} confirmed={detailsConfirmed} setConfirmed={setDetailsConfirmed} error={error} clearError={() => setError('')} onBack={() => navigate('/welcome')} onContinue={() => {
              if (!detailsConfirmed) { setError('detailsRequired'); setDraft((current) => current ? { ...current, navigationErrors: current.navigationErrors + 1 } : current); return }
              setError(''); navigate('/confirm')
            }} />)} />
            <Route path="/confirm" element={protectedPage(<ConfirmPage t={t} locale={locale} patient={patient} onBack={() => navigate('/verify')} onConfirm={finishCheckin} />)} />
            <Route path="/complete" element={protectedPage(<CompletePage t={t} patient={patient} onRestart={restart} onHelp={requestHelp} />)} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </section>
      </main>

      <footer className="page-footer"><span><ShieldCheck size={15} />{t('secureNotice')}</span><button className="research-footer-button" onClick={() => { setEntries(readResearchEntries()); setModal('research') }}><Sparkles size={14} />{t('dashboard')}</button></footer>

      {modal === 'help' && <Modal title={t('helpTitle')} onClose={() => setModal(null)} t={t}>
        <div className="help-content"><div className="help-illustration"><HelpCircle size={30} /></div><p>{t('helpBody')}</p><ol><li>{t('helpStep1')}</li><li>{t('helpStep2')}</li></ol><p className="assist-note">{t('assistRecorded')}</p>
          <button className="primary-button full-button" onClick={() => setModal(null)}>{t('close')}<Check size={17} /></button>
        </div>
      </Modal>}
      {modal === 'research' && <Modal title={t('researchTitle')} onClose={() => setModal(null)} t={t} wide>
        <p className="modal-description">{t('researchDescription')}</p>
        {entries.length === 0 ? <div className="empty-data"><Sparkles size={24} /><p>{t('noResearchData')}</p></div> : <div className="table-wrap"><table><thead><tr>
          <th>{t('participant')}</th><th>{t('interfaceMode')}</th><th>{t('duration')}</th><th>{t('errors')}</th><th>{t('helpRequests')}</th><th>{t('outcome')}</th>
        </tr></thead><tbody>{entries.map((entry) => <tr key={entry.participantId}>
          <td className="participant-cell">{entry.participantId}</td><td>{entry.mode === 'standard' ? t('standardMode') : t('accessibleMode')}</td>
          <td>{formatDuration(entry.completionSeconds, t)}</td><td>{entry.navigationErrors}</td><td>{entry.assistanceRequests}</td>
          <td><span className={`outcome ${entry.completed ? 'success' : 'incomplete'}`}>{entry.completed ? t('completed') : t('notCompleted')}</span></td>
        </tr>)}</tbody></table></div>}
        <div className="modal-actions"><button className="quiet-button" onClick={clearResearch}><RotateCcw size={16} />{t('clearData')}</button><button className="primary-button" onClick={exportCsv}><Download size={17} />{t('exportCsv')}</button></div>
      </Modal>}
    </div>
  )
}

type T = (key: TranslationKey, values?: Record<string, string | number>) => string

function LoginPage({ t, method, setMethod, onSubmit, patientId, setPatientId, dateOfBirth, setDateOfBirth, code, setCode, error, selectDemo }: {
  t: T; method: Method; setMethod: (method: Method) => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void
  patientId: string; setPatientId: (value: string) => void; dateOfBirth: string; setDateOfBirth: (value: string) => void
  code: string; setCode: (value: string) => void; error: string; selectDemo: (patient: Patient) => void
}) {
  return <div className="login-panel page-enter">
    <div className="panel-heading"><span className="overline">{t('welcomeBack')}</span><h2>{t('startText')}</h2><p>{t('chooseMethod')}</p></div>
    <div className="method-tabs" role="group" aria-label={t('chooseMethod')}>
      <button type="button" aria-pressed={method === 'patient'} className={method === 'patient' ? 'active' : ''} onClick={() => setMethod('patient')}>{t('patientLogin')}</button>
      <button type="button" aria-pressed={method === 'quick'} className={method === 'quick' ? 'active' : ''} onClick={() => setMethod('quick')}>{t('quickCheckin')}</button>
    </div>
    <form className="login-form" onSubmit={onSubmit}>
      {method === 'patient' ? <>
        <label className="field-label" htmlFor="patient-id">{t('patientIdLabel')}</label>
        <input className="text-input" id="patient-id" autoComplete="off" value={patientId} onChange={(event) => setPatientId(event.target.value)} placeholder={t('patientIdPlaceholder')} aria-describedby="patient-id-hint" />
        <span className="field-hint" id="patient-id-hint">{t('patientLoginHint')}</span>
        <label className="field-label second-label" htmlFor="date-of-birth">{t('dobLabel')}</label>
        <input className="text-input" id="date-of-birth" type="date" autoComplete="off" value={dateOfBirth} onChange={(event) => setDateOfBirth(event.target.value)} />
      </> : <>
        <label className="field-label" htmlFor="appointment-code">{t('codeLabel')}</label>
        <input className="text-input code-input" id="appointment-code" type="text" inputMode="numeric" autoComplete="off" maxLength={6} value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))} placeholder={t('codePlaceholder')} aria-describedby="code-hint" />
        <span className="field-hint" id="code-hint">{t('codeHint')}</span>
      </>}
      {error && <p className="form-error" role="alert">{t(error as TranslationKey)}</p>}
      <button className="primary-button login-submit" type="submit">{method === 'patient' ? t('continue') : t('verifyCode')}<ArrowRight size={18} /></button>
    </form>
    <div className="demo-credentials">
      <p className="demo-heading"><ShieldCheck size={16} />{t('demoAccounts')}</p>
      <div className="demo-list">
        <button type="button" onClick={() => selectDemo(patients[0])}><span className="demo-avatar">JL</span><span><strong>{t('useJordan')}</strong><small>{t('demoJordan')}</small></span><ArrowRight size={15} /></button>
        <button type="button" onClick={() => selectDemo(patients[1])}><span className="demo-avatar avatar-coral">AM</span><span><strong>{t('useAvery')}</strong><small>{t('demoAvery')}</small></span><ArrowRight size={15} /></button>
      </div>
    </div>
  </div>
}

function WelcomePage({ t, locale, patient, onContinue }: { t: T; locale: Locale; patient: Patient | null; onContinue: () => void }) {
  if (!patient) return null
  return <div className="workflow-page page-enter">
    <div className="panel-heading"><span className="overline">{t('stepWelcome')}</span><h2>{t('welcomePatient', { name: patient.name.split(' ')[0] })}</h2><p>{t('welcomeVisit')}</p></div>
    <AppointmentCard t={t} locale={locale} patient={patient} />
    <div className="page-actions"><span className="time-note"><Clock3 size={16} />{t('time')}: {patient.appointmentTime}</span><button className="primary-button" onClick={onContinue}>{t('continue')}<ArrowRight size={18} /></button></div>
  </div>
}

function VerifyPage({ t, locale, patient, confirmed, setConfirmed, error, clearError, onBack, onContinue }: { t: T; locale: Locale; patient: Patient | null; confirmed: boolean; setConfirmed: (value: boolean) => void; error: string; clearError: () => void; onBack: () => void; onContinue: () => void }) {
  if (!patient) return null
  return <div className="workflow-page page-enter">
    <div className="panel-heading"><span className="overline">{t('stepVerify')}</span><h2>{t('reviewInfo')}</h2><p>{t('reviewPrompt')}</p></div>
    <div className="verify-list"><InfoRow label={t('patientName')} value={patient.name} /><InfoRow label={t('patientId')} value={patient.id} /><InfoRow label={t('birthDate')} value={formatDate(patient.dateOfBirth, locale)} /><InfoRow label={t('appointment')} value={`${patient.department} · ${patient.appointmentTime}`} /></div>
    <label className={`check-row ${confirmed ? 'checked' : ''}`}><input type="checkbox" checked={confirmed} onChange={(event) => { setConfirmed(event.target.checked); if (event.target.checked) clearError() }} /><span className="custom-check"><Check size={14} /></span><span>{t('detailsCorrect')}</span></label>
    {error && <p className="form-error" role="alert">{t(error as TranslationKey)}</p>}
    <div className="page-actions"><button className="back-button" onClick={onBack}><ArrowLeft size={17} />{t('back')}</button><button className="primary-button" onClick={onContinue}>{t('nextAppointment')}<ArrowRight size={18} /></button></div>
  </div>
}

function ConfirmPage({ t, locale, patient, onBack, onConfirm }: { t: T; locale: Locale; patient: Patient | null; onBack: () => void; onConfirm: () => void }) {
  if (!patient) return null
  return <div className="workflow-page page-enter">
    <div className="panel-heading"><span className="overline">{t('stepConfirm')}</span><h2>{t('confirmHeading')}</h2><p>{t('confirmPrompt')}</p></div>
    <AppointmentCard t={t} locale={locale} patient={patient} compact />
    <div className="confirmation-note"><CheckCircle2 size={19} /><span>{t('secureNotice')}</span></div>
    <div className="page-actions"><button className="back-button" onClick={onBack}><ArrowLeft size={17} />{t('back')}</button><button className="primary-button" onClick={onConfirm}>{t('confirmAppointment')}<Check size={18} /></button></div>
  </div>
}

function CompletePage({ t, patient, onRestart, onHelp }: { t: T; patient: Patient | null; onRestart: () => void; onHelp: () => void }) {
  if (!patient) return null
  return <div className="workflow-page completed-page page-enter">
    <div className="success-mark"><Check size={32} /></div>
    <span className="overline">{t('checkInComplete')}</span><h2>{t('checkedIn')}</h2><p className="success-prompt">{t('checkedInPrompt')}</p>
    <div className="directions-block"><div className="directions-heading"><MapPin size={19} /><h3>{t('whereToGo')}</h3></div>
      <div className="route-steps"><div className="route-line" /><div className="route-step"><span className="route-icon"><MapPin size={17} /></span><p>{t('goTo', { building: patient.location, floor: patient.floor })}</p></div>
        <div className="route-step"><span className="route-icon waiting-icon"><HeartPulse size={17} /></span><p>{t('waitingArea', { area: patient.waitingArea })}</p></div></div>
      <p className="directions-note">{t('directionsNote')}</p>
    </div>
    <div className="page-actions completion-actions"><button className="back-button" onClick={onHelp}><HelpCircle size={17} />{t('assistance')}</button><button className="primary-button" onClick={onRestart}><RotateCcw size={17} />{t('restart')}</button></div>
  </div>
}

function AppointmentCard({ t, locale, patient, compact = false }: { t: T; locale: Locale; patient: Patient; compact?: boolean }) {
  return <div className={`appointment-card ${compact ? 'compact' : ''}`}>
    <div className="appointment-top"><div className="appointment-symbol"><HeartPulse size={19} /></div><div><span className="card-label">{t('appointment')}</span><h3>{patient.department}</h3></div><span className="appointment-time"><Clock3 size={15} />{patient.appointmentTime}</span></div>
    <div className="appointment-details"><InfoRow label={t('date')} value={formatDate(patient.appointmentDate, locale)} /><InfoRow label={t('clinician')} value={patient.clinician} /><InfoRow label={t('location')} value={patient.location} /></div>
  </div>
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return <div className="info-row"><span>{label}</span><strong>{value}</strong></div>
}

function Modal({ title, children, onClose, t, wide = false }: { title: string; children: ReactNode; onClose: () => void; t: T; wide?: boolean }) {
  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
    <section className={`modal-dialog ${wide ? 'modal-wide' : ''}`} role="dialog" aria-modal="true" aria-label={title}>
      <div className="modal-heading"><h2>{title}</h2><button className="close-button" onClick={onClose} aria-label={t('close')}><X size={20} /></button></div>{children}
    </section>
  </div>
}

function formatDate(value: string, locale: Locale) {
  const language = locale === 'es' ? 'es-ES' : 'en-US'
  return new Date(`${value}T12:00:00`).toLocaleDateString(language, { year: 'numeric', month: 'long', day: 'numeric' })
}

function formatDuration(totalSeconds: number, t: T) {
  if (totalSeconds < 60) return t('seconds', { count: totalSeconds })
  return t('minutesSeconds', { minutes: Math.floor(totalSeconds / 60), seconds: totalSeconds % 60 })
}