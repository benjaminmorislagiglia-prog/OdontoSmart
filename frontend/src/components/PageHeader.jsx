export default function PageHeader({ eyebrow, title, description, children }) {
  return <header className="page-header"><div>{eyebrow && <p className="eyebrow">{eyebrow}</p>}<h1>{title}</h1><p className="page-description">{description}</p></div>{children}</header>;
}
