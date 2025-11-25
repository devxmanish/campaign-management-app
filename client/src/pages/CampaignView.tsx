import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { 
  ArrowLeft, 
  Edit, 
  BarChart3,
  Users,
  FileText,
  Settings,
  Copy,
  ExternalLink,
  Play,
  Pause,
  Download
} from 'lucide-react'
import { campaignApi, responseApi, exportApi } from '../services/api'
import { useAuthStore } from '../hooks/useAuthStore'
import { Card, CardContent, CardHeader } from '../components/Card'
import Button from '../components/Button'
import Loading from '../components/Loading'
import EmptyState from '../components/EmptyState'

interface Campaign {
  id: string
  title: string
  description: string | null
  status: string
  visibility: string
  shareableLink: string | null
  allowManagerViewRespondentDetails: boolean
  creatorId: string
  createdAt: string
  updatedAt: string
  creator: {
    id: string
    name: string
    email: string
  }
  questions: Array<{
    id: string
    questionText: string
    type: string
    required: boolean
    order: number
  }>
  managers: Array<{
    id: string
    user: {
      id: string
      name: string
      email: string
    }
    permissions: string[]
  }>
  _count: {
    respondents: number
  }
}

interface Response {
  id: string
  respondentToken: string
  submittedAt: string
  responses: Array<{
    questionId: string
    questionText: string
    answer: unknown
  }>
}

export default function CampaignView() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  const { data, isLoading, error } = useQuery({
    queryKey: ['campaign', id],
    queryFn: () => campaignApi.get(id!),
    enabled: !!id,
  })

  const { data: responsesData, isLoading: responsesLoading } = useQuery({
    queryKey: ['campaign-responses', id],
    queryFn: () => responseApi.list(id!, { limit: 10 }),
    enabled: !!id,
  })

  const { data: analyticsData } = useQuery({
    queryKey: ['campaign-analytics', id],
    queryFn: () => campaignApi.analytics(id!),
    enabled: !!id,
  })

  const publishMutation = useMutation({
    mutationFn: () => campaignApi.publish(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign', id] })
      toast.success('Campaign published!')
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { error?: string } } }
      toast.error(err.response?.data?.error || 'Failed to publish')
    },
  })

  const closeMutation = useMutation({
    mutationFn: () => campaignApi.close(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign', id] })
      toast.success('Campaign closed!')
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { error?: string } } }
      toast.error(err.response?.data?.error || 'Failed to close')
    },
  })

  const exportMutation = useMutation({
    mutationFn: () => exportApi.generate(id!, 'csv'),
    onSuccess: (response) => {
      const content = response.data.data.content
      const blob = new Blob([content], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `campaign-${id}-export.csv`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Export downloaded!')
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { error?: string } } }
      toast.error(err.response?.data?.error || 'Failed to export')
    },
  })

  if (isLoading) {
    return <Loading text="Loading campaign..." />
  }

  if (error || !data?.data?.data) {
    return (
      <EmptyState
        title="Campaign not found"
        description="The campaign you're looking for doesn't exist or you don't have access to it."
        action={
          <Link to="/campaigns">
            <Button>Back to Campaigns</Button>
          </Link>
        }
      />
    )
  }

  const campaign: Campaign = data.data.data
  const responses: Response[] = responsesData?.data?.data?.data || []
  const analytics = analyticsData?.data?.data

  const isOwner = campaign.creatorId === user?.id
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN'
  const canEdit = isOwner || isAdmin

  const surveyUrl = campaign.shareableLink 
    ? `${window.location.origin}/survey/${campaign.shareableLink}`
    : null

  const copyShareableLink = () => {
    if (surveyUrl) {
      navigator.clipboard.writeText(surveyUrl)
      toast.success('Link copied to clipboard!')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <button 
            onClick={() => navigate('/campaigns')}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to campaigns
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{campaign.title}</h1>
            <span className={`
              px-2.5 py-0.5 rounded-full text-xs font-medium
              ${campaign.status === 'PUBLISHED' ? 'bg-green-100 text-green-800' : ''}
              ${campaign.status === 'DRAFT' ? 'bg-yellow-100 text-yellow-800' : ''}
              ${campaign.status === 'CLOSED' ? 'bg-gray-100 text-gray-800' : ''}
            `}>
              {campaign.status}
            </span>
          </div>
          {campaign.description && (
            <p className="text-gray-500 mt-1">{campaign.description}</p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {canEdit && campaign.status === 'DRAFT' && (
            <Button onClick={() => publishMutation.mutate()} isLoading={publishMutation.isPending}>
              <Play className="w-4 h-4 mr-2" />
              Publish
            </Button>
          )}
          {canEdit && campaign.status === 'PUBLISHED' && (
            <Button variant="secondary" onClick={() => closeMutation.mutate()} isLoading={closeMutation.isPending}>
              <Pause className="w-4 h-4 mr-2" />
              Close
            </Button>
          )}
          {canEdit && (
            <Link to={`/campaigns/${campaign.id}/edit`}>
              <Button variant="secondary">
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
            </Link>
          )}
          <Button 
            variant="secondary" 
            onClick={() => exportMutation.mutate()}
            isLoading={exportMutation.isPending}
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Share Link */}
      {surveyUrl && (
        <Card>
          <CardContent>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Shareable Link</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={surveyUrl}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
                  />
                  <Button variant="secondary" size="sm" onClick={copyShareableLink}>
                    <Copy className="w-4 h-4" />
                  </Button>
                  <a href={surveyUrl} target="_blank" rel="noopener noreferrer">
                    <Button variant="secondary" size="sm">
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </a>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Questions</p>
              <p className="text-2xl font-bold text-gray-900">{campaign.questions.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Responses</p>
              <p className="text-2xl font-bold text-gray-900">{campaign._count.respondents}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Completion Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                {analytics?.completionRate?.toFixed(0) || 0}%
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Settings className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Managers</p>
              <p className="text-2xl font-bold text-gray-900">{campaign.managers.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Questions */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-medium text-gray-900">Questions</h2>
        </CardHeader>
        <CardContent>
          {campaign.questions.length === 0 ? (
            <EmptyState
              title="No questions yet"
              description="Add questions to your campaign"
              action={
                canEdit && (
                  <Link to={`/campaigns/${campaign.id}/edit`}>
                    <Button>Add Questions</Button>
                  </Link>
                )
              }
            />
          ) : (
            <div className="space-y-3">
              {campaign.questions.map((q, index) => (
                <div key={q.id} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                  <span className="w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                    {index + 1}
                  </span>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{q.questionText}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500 bg-white px-2 py-0.5 rounded">
                        {q.type.replace('_', ' ')}
                      </span>
                      {q.required && (
                        <span className="text-xs text-red-500">Required</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Responses */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">Recent Responses</h2>
            {responses.length > 0 && (
              <span className="text-sm text-gray-500">{campaign._count.respondents} total</span>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {responsesLoading ? (
            <Loading text="Loading responses..." />
          ) : responses.length === 0 ? (
            <EmptyState
              title="No responses yet"
              description={campaign.status === 'PUBLISHED' 
                ? "Share your campaign link to start collecting responses"
                : "Publish your campaign to start collecting responses"
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Respondent
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Submitted
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Answers
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {responses.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {r.respondentToken.substring(0, 8)}...
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {new Date(r.submittedAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {r.responses?.length || 0} answers
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
