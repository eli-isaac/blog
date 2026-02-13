import useDocumentMeta from '../hooks/useDocumentMeta'

export default function About() {
  useDocumentMeta({
    title: 'About',
    description: 'About Arrowsmith — who we are and what we write about.',
  })

  return (
    <div className="pt-24 max-w-2xl mx-auto text-center">
      <h1 className="text-2xl font-medium mb-4">About</h1>
      <p className="text-gray-600 leading-relaxed">
        Arrowsmith is a blog by Eli Plutchok and Isaac Trenk. We write explanatory articles, 
        novel ideas, and work on machine learning, optimization, and philosophy.
      </p>
    </div>
  )
}
