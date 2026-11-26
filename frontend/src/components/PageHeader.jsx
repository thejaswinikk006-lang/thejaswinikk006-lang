export default function PageHeader({ icon: Icon, title, subtitle, badge }) {
  return (
    <section className="page-header">
      <div className="container page-header-inner">
        <div className="page-header-title-wrap">
          {Icon && (
            <div className="page-header-icon">
              <Icon size={26} />
            </div>
          )}
          <div>
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>
        </div>
        {badge && <div>{badge}</div>}
      </div>
    </section>
  );
}
