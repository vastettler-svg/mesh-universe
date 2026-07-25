import "../styles/pageHeader.css";

function PageHeader({
  eyebrow,
  title,
  description,
  imageSrc,
  imageAlt = "",
  accent = "default",
  size = "compact",
}) {
  return (
    <section
      className={`page-header page-header-${accent} page-header-${size}`}
    >
      <div className="page-header-glow" aria-hidden="true" />

      <div className="page-header-content">
        {eyebrow ? (
          <span className="page-header-eyebrow">{eyebrow}</span>
        ) : null}

        <h1>{title}</h1>

        {description ? (
          <p className="page-header-description">{description}</p>
        ) : null}
      </div>

      {imageSrc ? (
        <div className="page-header-artwork">
          <div className="page-header-artwork-ring" aria-hidden="true" />

          <img
            src={imageSrc}
            alt={imageAlt}
            className="page-header-image"
          />
        </div>
      ) : null}
    </section>
  );
}

export default PageHeader;