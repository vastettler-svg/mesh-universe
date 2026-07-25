import "../styles/pagehero.css";

function PageHero({
  eyebrow,
  title,
  description,
  imageSrc,
  imageAlt = "",
  accent = "league",
  stats = [],
  children,
}) {
  return (
    <section className={`page-hero page-hero-${accent}`}>
      <div className="page-hero-glow" aria-hidden="true" />

      <div className="page-hero-content">
        {eyebrow ? (
          <span className="page-hero-eyebrow">{eyebrow}</span>
        ) : null}

        <h1>{title}</h1>

        {description ? (
          <p className="page-hero-description">{description}</p>
        ) : null}

        {stats.length > 0 ? (
          <div className="page-hero-stats">
            {stats.map((stat) => (
              <div
                className="page-hero-stat"
                key={`${stat.label}-${stat.value}`}
              >
                <strong>{stat.value}</strong>
                <span>{stat.label}</span>
              </div>
            ))}
          </div>
        ) : null}

        {children ? (
          <div className="page-hero-extra">{children}</div>
        ) : null}
      </div>

      {imageSrc ? (
        <div className="page-hero-artwork">
          <div className="page-hero-artwork-ring" aria-hidden="true" />

          <img
            src={imageSrc}
            alt={imageAlt}
            className="page-hero-image"
          />
        </div>
      ) : null}
    </section>
  );
}

export default PageHero;