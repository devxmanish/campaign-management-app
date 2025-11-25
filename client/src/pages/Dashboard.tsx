import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { 
  FileText, 
  Users, 
  BarChart3, 
  Plus,
  TrendingUp,
  Clock
} from 'lucide-react'
import { campaignApi } from '../services/api'
import { useAuthStore } from '../hooks/useAuthStore'
import { Card, CardContent, CardHeader } from '../components/Card'
import Button from '../components/Button'
import Loading from '../components/Loading'
import EmptyState from '../components/EmptyState'

interface Campaign {
  id: string
  title: string
  status: string
  visibility: string
  createdAt: string
  _count: {
    respondents: number
    questions: number
  }
}

export default function Dashboard() {
  const { user } = useAuthStore()
  
  const { data, isLoading } = useQuery({
    queryKey: ['campaigns'],
    queryFn: () => campaignApi.list({ limit: 5 }),
  })

  const campaigns: Campaign[] = data?.data?.data?.data || []
  const totalCampaigns = data?.data?.data?.pagination?.total || 0

  const stats = [
    {
      name: 'Total Campaigns',
      value: totalCampaigns,
      icon: FileText,
      color: 'bg-blue-500',
    },
    {
      name: 'Active Campaigns',
      value: campaigns.filter(c => c.status === 'PUBLISHED').length,
      icon: TrendingUp,
      color: 'bg-green-500',
    },
    {
      name: 'Total Responses',
      value: campaigns.reduce((acc, c) => acc + (c._count?.respondents || 0), 0),
      icon: Users,
      color: 'bg-purple-500',
    },
    {
      name: 'Draft Campaigns',
      value: campaigns.filter(c => c.status === 'DRAFT').length,
      icon: Clock,
      color: 'bg-yellow-500',
    },
  ]

  const canCreateCampaigns = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role === 'CAMPAIGN_CREATOR'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Welcome back, {user?.name}</p>
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

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.name}>
            <CardContent className="flex items-center gap-4">
              <div className={`${stat.color} w-12 h-12 rounded-lg flex items-center justify-center`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Campaigns */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">Recent Campaigns</h2>
            <Link to="/campaigns" className="text-sm text-primary-600 hover:text-primary-500">
              View all
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Loading text="Loading campaigns..." />
          ) : campaigns.length === 0 ? (
            <EmptyState
              title="No campaigns yet"
              description="Create your first campaign to start collecting responses"
              action={
                canCreateCampaigns && (
                  <Link to="/campaigns/create">
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Campaign
                    </Button>
                  </Link>
                )
              }
            />
          ) : (
            <div className="divide-y">
              {campaigns.map((campaign) => (
                <Link
                  key={campaign.id}
                  to={`/campaigns/${campaign.id}`}
                  className="block py-4 hover:bg-gray-50 -mx-6 px-6 transition-colors first:pt-0 last:pb-0"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        <BarChart3 className="w-5 h-5 text-gray-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{campaign.title}</h3>
                        <p className="text-sm text-gray-500">
                          {campaign._count?.questions || 0} questions · {campaign._count?.respondents || 0} responses
                        </p>
                      </div>
                    </div>
                    <span className={`
                      px-2.5 py-0.5 rounded-full text-xs font-medium
                      ${campaign.status === 'PUBLISHED' ? 'bg-green-100 text-green-800' : ''}
                      ${campaign.status === 'DRAFT' ? 'bg-yellow-100 text-yellow-800' : ''}
                      ${campaign.status === 'CLOSED' ? 'bg-gray-100 text-gray-800' : ''}
                      ${campaign.status === 'ARCHIVED' ? 'bg-red-100 text-red-800' : ''}
                    `}>
                      {campaign.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
