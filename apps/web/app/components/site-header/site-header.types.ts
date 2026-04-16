export interface SiteHeaderProps {
  /** When provided, renders a back-arrow link to this href. Omit on root pages. */
  backHref?: string;
  /** Optional action buttons rendered on the right side of the header. */
  actions?: React.ReactNode;
}
