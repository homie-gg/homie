import DocsNavItems from '@/app/(guest)/docs/_components/DocsNavItems'

export default function DocsNav() {
  return (
    <DocsNavItems
      categories={[
        {
          path: '/getting_started',
          label: 'Getting Started',
          pages: [
            {
              path: '/setup',
              label: 'Setup',
            },
          ],
        },
        {
          path: '/features',
          label: 'Features',
          pages: [
            {
              path: '/chat_in_slack',
              label: 'Chat in Slack',
            },
            {
              path: '/view_pull_requests',
              label: 'View Pull Requests',
            },
          ],
        },
        {
          path: '/preferences',
          label: 'Preferences',
          pages: [
            {
              path: '/persona',
              label: 'Persona',
            },
          ],
        },
      ]}
    />
  )
}
