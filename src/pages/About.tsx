import useDocumentMeta from '../hooks/useDocumentMeta'

export default function About() {
  useDocumentMeta({
    title: 'About',
    description: 'About Arrowsmith — who we are and what we write about.',
  })

  return (
    <div className="pt-24 max-w-2xl">
      <h1 className="text-2xl font-medium mb-4">About</h1>
      <p className="text-gray-600">Coming soon...</p>
    </div>
  )
}
