import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { 
  Plus, 
  Search, 
  Filter,
  BarChart3,
  MoreVertical,
  Eye,
  Edit,
  Trash2
} from 'lucide-react'
import { campaignApi } from '../services/api'
import { useAuthStore } from '../hooks/useAuthStore'
import { Card, CardContent, CardHeader } from '../components/Card'
import Button from '../components/Button'
import Input from '../components/Input'
import Select from '../components/Select'
import Loading from '../components/Loading'
import EmptyState from '../components/EmptyState'

interface Campaign {
  id: string
  title: string
  description: string | null
  status: string
  visibility: string
  createdAt: string
  creator: {
    id: string
    name: string
    email: string
  }
  _count: {
    respondents: number
    questions: number
  }
}

export default function Campaigns() {
  const { user } = useAuthStore()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['campaigns', { search, status, page }],
    queryFn: () => campaignApi.list({ 
      search: search || undefined,
      status: status || undefined,
      page,
      limit: 10 
    }),
  })

  const campaigns: Campaign[] = data?.data?.data?.data || []
  const pagination = data?.data?.data?.pagination

  const canCreateCampaigns = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role === 'CAMPAIGN_CREATOR'

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'DRAFT', label: 'Draft' },
    { value: 'PUBLISHED', label: 'Published' },
    { value: 'CLOSED', label: 'Closed' },
    { value: 'ARCHIVED', label: 'Archived' },
  ]

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    refetch()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Campaigns</h1>
          <p className="text-gray-500 mt-1">Manage your survey campaigns</p>
        </div>
        {canCreateCampaigns && (
          <Link to="/campaigns/create">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Campaign
            </Button>
          </Link>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent>
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search campaigns..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full md:w-48">
              <Select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value)
                  setPage(1)
                }}
                options={statusOptions}
              />
            </div>
            <Button type="submit" variant="secondary">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Campaign List */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-medium text-gray-900">
            {pagination?.total || 0} Campaigns
          </h2>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6">
              <Loading text="Loading campaigns..." />
            </div>
          ) : campaigns.length === 0 ? (
            <div className="p-6">
              <EmptyState
                title="No campaigns found"
                description={search || status ? "Try adjusting your filters" : "Create your first campaign to get started"}
                action={
                  canCreateCampaigns && !search && !status && (
                    <Link to="/campaigns/create">
                      <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Campaign
                      </Button>
                    </Link>
                  )
                }
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Campaign
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Questions
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Responses
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {campaigns.map((campaign) => (
                    <tr key={campaign.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <BarChart3 className="w-5 h-5 text-gray-600" />
                          </div>
                          <div className="min-w-0">
                            <Link 
                              to={`/campaigns/${campaign.id}`}
                              className="font-medium text-gray-900 hover:text-primary-600 truncate block"
                            >
                              {campaign.title}
                            </Link>
                            <p className="text-sm text-gray-500 truncate">
                              {campaign.description || 'No description'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`
                          px-2.5 py-0.5 rounded-full text-xs font-medium
                          ${campaign.status === 'PUBLISHED' ? 'bg-green-100 text-green-800' : ''}
                          ${campaign.status === 'DRAFT' ? 'bg-yellow-100 text-yellow-800' : ''}
                          ${campaign.status === 'CLOSED' ? 'bg-gray-100 text-gray-800' : ''}
                          ${campaign.status === 'ARCHIVED' ? 'bg-red-100 text-red-800' : ''}
                        `}>
                          {campaign.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {campaign._count?.questions || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {campaign._count?.respondents || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(campaign.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link to={`/campaigns/${campaign.id}`}>
                            <Button variant="ghost" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Link to={`/campaigns/${campaign.id}/edit`}>
                            <Button variant="ghost" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="px-6 py-4 border-t flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
              </p>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={pagination.page === 1}
                  onClick={() => setPage(p => p - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={pagination.page === pagination.totalPages}
                  onClick={() => setPage(p => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
