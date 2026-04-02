import { useNavigate } from 'react-router-dom'

export default function AdminPageLayout({ title, subtitle, actions, children, onBack }) {
  const navigate = useNavigate()

  const handleBack = () => {
    if (typeof onBack === 'function') onBack()
    else navigate('/dashboard')
  }

  return (
    <div className="admin-page">
      <header className="admin-page__header">
        <div className="admin-page__header-row">
          <button type="button" className="admin-page__back" onClick={handleBack}>
            <span className="admin-page__back-icon" aria-hidden>
              ←
            </span>
            {onBack ? 'Back' : 'Dashboard'}
          </button>
          {actions ? <div className="admin-page__actions">{actions}</div> : null}
        </div>
        <h1 className="admin-page__title">{title}</h1>
        {subtitle ? <p className="admin-page__subtitle">{subtitle}</p> : null}
      </header>
      <div className="admin-page__body">{children}</div>
    </div>
  )
}
