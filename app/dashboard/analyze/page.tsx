import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import RecipeAnalysisForm from '@/components/recipe-analysis-form'

export default async function AnalyzePage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Recipe SEO Analysis</h1>
          <p className="mt-2 text-gray-600">
            Optimize your recipes for search engines and increase your organic traffic.
          </p>
        </div>

        {/* Analysis Form */}
        <RecipeAnalysisForm />
      </div>
    </div>
  )
}
